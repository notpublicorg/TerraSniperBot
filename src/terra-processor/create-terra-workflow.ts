import { Coin, LCDClient, MnemonicKey, StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { concatMap, filter, map, mergeMap, Observable, of, repeat, take, tap } from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import { TasksProcessorUpdater } from '../core/tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import { newTransactionWorkflow, TxInfoGetter } from './new-transaction-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { createMempoolSource } from './transactions-sources/mempool-source';
import { NewTransactionInfo } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';
import { decodeTransaction } from './utils/decoders';
import { TransactionMetaJournal } from './utils/transaction-meta-journal';

export type TerraWorflowFactoryDeps = {
  getFiltersSource: () => Observable<TransactionFilter>;
  getTasks: () => SniperTask[];
  updateTask: TasksProcessorUpdater;
};

export function createTerraWorkflow(
  {
    lcdUrl,
    lcdChainId,
    walletMnemonic,
    tendermintApiUrl,
    mempool,
    validBlockHeightOffset,
    closeTaskAfterPurchase,
  }: TerraTasksProcessorConfig,
  deps: TerraWorflowFactoryDeps,
) {
  const terra = new LCDClient({
    URL: lcdUrl,
    chainID: lcdChainId,
  });
  const walletMnemonicKey = new MnemonicKey({
    mnemonic: walletMnemonic,
  });
  const tendermintApi = new APIRequester(tendermintApiUrl);

  const getTx: TxInfoGetter = (txHash) => terra.tx.txInfo(txHash);
  const sendTransaction = swapTransactionCreator(
    {
      walletMnemonic: walletMnemonicKey,
      fee: new StdFee(mempool.defaultGas, [new Coin(mempool.defaultFeeDenom, mempool.defaultFee)]),
      validBlockHeightOffset,
    },
    { terra, tendermintApi },
  );

  // NOTE: we also have had websocket integration for pulling block transactions
  // you can find it's removal commit here
  // https://github.com/notpublicorg/TerraSniperBot/commit/b5fc4ba0bad032f3f98aa90aa88bf8cd067415b3

  const $mempoolSource = createMempoolSource({
    tendermintApi,
  }).pipe(
    concatMap(({ tx, metaJournal }) =>
      of(tx)
        .pipe(
          tap(metaJournal.onStartHandling),
          map((tx) => decodeTransaction(tx)),
          tap(metaJournal.onDecodingDone),
          filter(Boolean),
          map((tx) => tx.toData().value),
          createLiquidityFilterWorkflow(deps.getFiltersSource),
          tap(metaJournal.onFiltrationDone),
        )
        .pipe(
          map(
            ({
              taskId,
              satisfiedBuyCondition,
              liquidity,
            }): { info: NewTransactionInfo; metaJournal: TransactionMetaJournal } => ({
              info: {
                taskId,
                isTaskActive: deps.getTasks().find((t) => t.id === taskId)?.status === 'active',
                buyDenom: satisfiedBuyCondition.denom,
                buyAmount: satisfiedBuyCondition.buy,
                pairContract: liquidity.pairContract,
              },
              metaJournal,
            }),
          ),
          filter(({ info: { isTaskActive } }) => isTaskActive),
          tap(({ info: { taskId } }) => deps.updateTask({ taskId, newStatus: 'blocked' })),
          tap(metaJournal.onNewTransactionPrepared),
        ),
    ),
    take(1),
    mergeMap(({ info, metaJournal }) =>
      of(info).pipe(
        newTransactionWorkflow(sendTransaction(metaJournal), getTx, deps.updateTask),
        tap(({ taskId, success }) =>
          deps.updateTask({
            taskId,
            newStatus: success && closeTaskAfterPurchase ? 'closed' : 'active',
          }),
        ),
        map((result) => ({ result, metaJournal: metaJournal.build() })),
      ),
    ),
    repeat(),
  );

  return $mempoolSource;
}

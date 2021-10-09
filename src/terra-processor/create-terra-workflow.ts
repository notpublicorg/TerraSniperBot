import { Coin, StdFee } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import {
  catchError,
  concatMap,
  filter,
  map,
  mergeMap,
  Observable,
  of,
  repeat,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import { TasksProcessorUpdater } from '../core/tasks-processor';
import { createMempoolSource } from './data-sources/mempool-source';
import { createNewBlockSource } from './data-sources/new-block-source';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import { createTransactionSenderSource } from './new-transaction-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionWithScript } from './transaction-creators/swap-transaction-with-script';
import { NewTransactionInfo } from './types/new-transaction-info';
import { TerraFlowErrorResult, TerraFlowSuccessResult } from './types/terra-flow';
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
    // lcdUrl,
    lcdChainId,
    // walletMnemonic,
    walletAlias,
    walletPassword,
    tendermintApiUrl,
    tendermintWebsocketUrl,
    mempool,
    validBlockHeightOffset,
    closeTaskAfterPurchase,
  }: TerraTasksProcessorConfig,
  deps: TerraWorflowFactoryDeps,
) {
  // const terra = new LCDClient({
  //   URL: lcdUrl,
  //   chainID: lcdChainId,
  // });
  // const walletMnemonicKey = new MnemonicKey({
  //   mnemonic: walletMnemonic,
  // });
  const tendermintApi = new APIRequester(tendermintApiUrl);

  // const getTx: TxInfoGetter = (txHash) => terra.tx.txInfo(txHash);
  // const sendTransaction = swapTransactionCreator(
  //   {
  //     walletMnemonic: walletMnemonicKey,
  //     fee: new StdFee(mempool.defaultGas, [new Coin(mempool.defaultFeeDenom, mempool.defaultFee)]),
  //     validBlockHeightOffset,
  //   },
  //   { terra, tendermintApi },
  // );
  const sendTransaction = swapTransactionWithScript({
    fee: new StdFee(mempool.defaultGas, [new Coin(mempool.defaultFeeDenom, mempool.defaultFee)]),
    validBlockHeightOffset,
    chainId: lcdChainId,
    walletAlias,
    walletPassword,
  });

  const $newBlockSource = createNewBlockSource(tendermintWebsocketUrl, tendermintApi);

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
        withLatestFrom($newBlockSource),
        mergeMap(createTransactionSenderSource(sendTransaction)),
        tap((v) => console.log('Send transaction result', v)),
        // mergeMap(createTransactionCheckerSource(getTx)),
        // tap(({ taskId, success }) =>
        //   deps.updateTask({
        //     taskId,
        //     newStatus: success && closeTaskAfterPurchase ? 'closed' : 'active',
        //   }),
        // ),
        tap(({ taskId }) =>
          deps.updateTask({
            taskId,
            newStatus: closeTaskAfterPurchase ? 'closed' : 'active',
          }),
        ),
        map(
          (result): TerraFlowSuccessResult => ({
            stdout: result.stdout,
            metaJournal: metaJournal.build(),
          }),
        ),
        catchError((error): Observable<TerraFlowErrorResult> => {
          deps.updateTask({ taskId: info.taskId, newStatus: 'active' });
          return of({ error, metaJournal: metaJournal.build() });
        }),
      ),
    ),
    repeat(),
  );

  return {
    $newBlockSource,
    $mempoolSource,
  };
}

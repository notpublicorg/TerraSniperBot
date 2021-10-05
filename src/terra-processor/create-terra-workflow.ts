import { Coin, LCDClient, MnemonicKey } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { concatMap, filter, map, Observable, of, repeat, take, tap } from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import { TasksProcessorUpdater } from '../core/tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import {
  createNewTransactionPreparationFlow,
  newTransactionWorkflow,
  TxInfoGetter,
} from './new-transaction-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { createMempoolSource } from './transactions-sources/mempool-source';
import { TransactionFilter } from './types/transaction-filter';
import { decodeTransaction } from './utils/decoders';

export type TerraWorflowFactoryDeps = {
  getFiltersSource: () => Observable<TransactionFilter>;
  getTasks: () => SniperTask[];
  updateTask: TasksProcessorUpdater;
};

export function createTerraWorkflow(
  config: TerraTasksProcessorConfig,
  deps: TerraWorflowFactoryDeps,
) {
  const terra = new LCDClient({
    URL: config.lcdUrl,
    chainID: config.lcdChainId,
  });
  const walletMnemonicKey = new MnemonicKey({
    mnemonic: config.walletMnemonic,
  });
  const tendermintApi = new APIRequester(config.tendermintApiUrl);

  const getTx: TxInfoGetter = (txHash) => terra.tx.txInfo(txHash);

  // NOTE: we also have had websocket integration for pulling block transactions
  // you can find it's removal commit here
  // https://github.com/notpublicorg/TerraSniperBot/commit/b5fc4ba0bad032f3f98aa90aa88bf8cd067415b3

  const $mempoolSource = createMempoolSource({
    tendermintApi,
  }).pipe(
    concatMap(({ tx, metaJournal }) =>
      of(tx).pipe(
        map((tx) => decodeTransaction(tx)),
        filter(Boolean),
        map((tx) => tx.toData().value),
        createLiquidityFilterWorkflow(deps.getFiltersSource),
        tap(metaJournal.onFiltrationDone.bind(metaJournal)),
        createNewTransactionPreparationFlow(deps.getTasks, deps.updateTask),
        tap(metaJournal.onStartTransactionSending.bind(metaJournal)),
        newTransactionWorkflow(
          swapTransactionCreator(
            {
              walletMnemonic: walletMnemonicKey,
              gasAdjustment: config.gasAdjustment,
            },
            {
              terra,
              // there is a createGasPriceCalculator in utils/calculate-gas-prices
              // gasPricesGetter: () => calculateGasPrices(txValue.fee),
              gasPricesGetter: () => [
                new Coin(config.mempool.defaultGasPriceDenom, config.mempool.defaultGasPrice),
              ],
              tendermintApi,
            },
          ),
          getTx,
          deps.updateTask,
        ),
        map((result) => ({ result, metaJournal })),
      ),
    ),
    take(1),
    repeat(),
  );

  return $mempoolSource;
}

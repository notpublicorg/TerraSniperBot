import { LCDClient, MnemonicKey } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { map, mergeMap, Observable, of, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessorUpdater } from '../tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import {
  createNewTransactionPreparationFlow,
  newTransactionWorkflow,
  TxInfoGetter,
} from './new-transaction-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { createTransactionsSource } from './transactions-sources/block-mempool-source';
import { TransactionFilter } from './types/transaction-filter';
import { createGasPriceCalculator } from './utils/calculate-gas-prices';

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
  const lcdApi = new APIRequester(config.lcdUrl);
  // const tendermintApi = new APIRequester(config.tendermintApiUrl);
  const calculateGasPrices = createGasPriceCalculator({
    defaultDenom: config.mempool.defaultGasPriceDenom,
    defaultPrice: config.mempool.defaultGasPrice,
    minUusdPrice: config.mempool.minUusdPrice,
    minLunaPrice: config.mempool.minLunaPrice,
  });

  const getTx: TxInfoGetter = (txHash) => terra.tx.txInfo(txHash);

  const $mempoolSource = createTransactionsSource(lcdApi, {
    websocketUrl: config.tendermintWebsocketUrl,
  }).pipe(
    mergeMap(({ txValue, metaJournal }) =>
      of(txValue).pipe(
        createLiquidityFilterWorkflow(deps.getFiltersSource),
        tap(metaJournal.onFiltrationDone.bind(metaJournal)),
        createNewTransactionPreparationFlow(deps.getTasks, deps.updateTask),
        tap(metaJournal.onStartTransactionSending.bind(metaJournal)),
        newTransactionWorkflow(
          swapTransactionCreator(
            terra,
            {
              walletMnemonic: walletMnemonicKey,
              gasAdjustment: config.gasAdjustment,
            },
            () => calculateGasPrices(txValue.fee),
          ),
          getTx,
          deps.updateTask,
        ),
        map((result) => ({ result, metaJournal })),
      ),
    ),
  );

  // const $mempoolSource = createMempoolSource({
  //   tendermintApi,
  //   lcdApi,
  // }).pipe(
  //   mergeMap(({ txValue, metaJournal }) =>
  //     of(txValue).pipe(
  //       createLiquidityFilterWorkflow(deps.getFiltersSource),
  //       tap(metaJournal.onFiltrationDone.bind(metaJournal)),
  //       createNewTransactionPreparationFlow(deps.getTasks, deps.updateTask),
  //       tap(metaJournal.onStartTransactionSending.bind(metaJournal)),
  //       newTransactionWorkflow(
  //         swapTransactionCreator(
  //           terra,
  //           {
  //             walletMnemonic: walletMnemonicKey,
  //             gasAdjustment: config.gasAdjustment,
  //           },
  //           () => calculateGasPrices(txValue.fee),
  //         ),
  //         getTx,
  //         deps.updateTask,
  //       ),
  //       map((result) => ({ result, metaJournal })),
  //     ),
  //   ),
  // );

  // const $blockSource = createBlockSource(terra, {
  //   websocketUrl: config.tendermintWebsocketUrl,
  // }).pipe(
  //   mergeMap(({ txValue, metaJournal }) =>
  //     of(txValue).pipe(
  //       createLiquidityFilterWorkflow(deps.getFiltersSource),
  //       tap(metaJournal.onFiltrationDone.bind(metaJournal)),
  //       createNewTransactionPreparationFlow(deps.getTasks, deps.updateTask),
  //       tap(metaJournal.onStartTransactionSending.bind(metaJournal)),
  //       newTransactionWorkflow(
  //         swapTransactionCreator(
  //           terra,
  //           {
  //             walletMnemonic: walletMnemonicKey,
  //             gasAdjustment: config.gasAdjustment,
  //           },
  //           () => [new Coin(config.block.defaultGasPriceDenom, config.block.defaultGasPrice)],
  //         ),
  //         getTx,
  //         deps.updateTask,
  //       ),
  //       map((result) => ({ result, metaJournal })),
  //     ),
  //   ),
  // );

  return $mempoolSource;

  // return $blockSource.pipe(mergeWith($mempoolSource));
}

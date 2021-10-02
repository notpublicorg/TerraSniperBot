import { Coin, LCDClient, MnemonicKey } from '@terra-money/terra.js';
import { APIRequester } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import {
  filter,
  from,
  map,
  mergeMap,
  mergeWith,
  Observable,
  of,
  pipe,
  Subscription,
  tap,
} from 'rxjs';

import { SniperTask } from '../sniper-task';
import {
  TasksProcessor,
  TasksProcessorUpdateParams,
  TasksProcessorUpdater,
} from '../tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import {
  createNewTransactionPreparationFlow,
  newTransactionWorkflow,
  TransactionSender,
  TxInfoGetter,
} from './new-transaction-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { createBlockSource } from './transactions-sources/block-source';
import { createMempoolSource } from './transactions-sources/mempool-source';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';
import { createGasPriceCalculator } from './utils/calculate-gas-prices';
import { CurrencyDenomMap } from './utils/denom';
import { terraAmountConverter } from './utils/terra-types-converter';
import { TransactionMetaJournal } from './utils/transaction-meta-journal';

const coreSmartContractWorkflow = (
  metaJournal: TransactionMetaJournal,
  getFilters: () => Observable<TransactionFilter>,
  getTasks: () => SniperTask[],
  updateTask: TasksProcessorUpdater,
  sendTransaction: TransactionSender,
  getTx: TxInfoGetter,
) =>
  pipe(
    createLiquidityFilterWorkflow(getFilters),
    tap(metaJournal.onFiltrationDone.bind(metaJournal)),
    createNewTransactionPreparationFlow(getTasks, updateTask),
    tap(metaJournal.onStartTransactionSending.bind(metaJournal)),
    newTransactionWorkflow(sendTransaction, getTx, updateTask),
    map((result) => ({ result, metaJournal })),
  );

export class TerraTasksProcessor implements TasksProcessor {
  private tasks: SniperTask[] = [];
  private processorUpdater: TasksProcessorUpdater | null = null;

  private smartContractWorkflow: Observable<{
    result: NewTransactionResult;
    metaJournal: TransactionMetaJournal;
  }>;
  private subscription: Subscription | null = null;

  constructor(config: TerraTasksProcessorConfig) {
    const terra = new LCDClient({
      URL: config.lcdUrl,
      chainID: config.lcdChainId,
    });
    const walletMnemonicKey = new MnemonicKey({
      mnemonic: config.walletMnemonic,
    });
    const lcdApi = new APIRequester(config.lcdUrl);
    const tendermintApi = new APIRequester(config.tendermintApiUrl);
    const calculateGasPrices = createGasPriceCalculator({
      defaultDenom: config.mempool.defaultGasPriceDenom,
      defaultPrice: config.mempool.defaultGasPrice,
      minUusdPrice: config.mempool.minUusdPrice,
      minLunaPrice: config.mempool.minLunaPrice,
    });

    const $mempoolSource = createMempoolSource({
      tendermintApi,
      lcdApi,
    }).pipe(
      mergeMap(({ txValue, metaJournal }) =>
        of(txValue).pipe(
          coreSmartContractWorkflow(
            metaJournal,
            () => this.getFilters(),
            () => this.tasks,
            (params) => this.updateTask(params),
            swapTransactionCreator(
              terra,
              {
                walletMnemonic: walletMnemonicKey,
                gasAdjustment: config.gasAdjustment,
              },
              () => calculateGasPrices(txValue.fee),
            ),
            (txHash) => terra.tx.txInfo(txHash),
          ),
        ),
      ),
    );

    const $blockSource = createBlockSource(terra, {
      websocketUrl: config.tendermintWebsocketUrl,
    }).pipe(
      mergeMap(({ txValue, metaJournal }) =>
        of(txValue).pipe(
          coreSmartContractWorkflow(
            metaJournal,
            () => this.getFilters(),
            () => this.tasks,
            (params) => this.updateTask(params),
            swapTransactionCreator(
              terra,
              {
                walletMnemonic: walletMnemonicKey,
                gasAdjustment: config.gasAdjustment,
              },
              () => [new Coin(config.block.defaultGasPriceDenom, config.block.defaultGasPrice)],
            ),
            (txHash) => terra.tx.txInfo(txHash),
          ),
        ),
      ),
    );

    this.smartContractWorkflow = $blockSource.pipe(mergeWith($mempoolSource));
  }

  subscribe: TasksProcessor['subscribe'] = (tasks, handler) => {
    this.updateTasks(tasks);
    this.processorUpdater = handler;

    return {
      unsubscribe: () => {
        this.updateTasks([]);
        this.processorUpdater = null;
      },
    };
  };

  updateTasks: TasksProcessor['updateTasks'] = (tasks) => {
    this.tasks = tasks;
    if (this.tasks.length) {
      this.subscription = this.subscription || this.smartContractWorkflow.subscribe(console.log);
    } else {
      this.subscription?.unsubscribe();
      this.subscription = null;
    }
  };

  private getFilters() {
    return from(this.tasks).pipe(
      filter((t) => t.status === 'active'),
      map(
        (t): TransactionFilter => ({
          taskId: t.id,
          contractToSpy: t.contract,
          maxTokenPrice: t.maxTokenPrice ? +t.maxTokenPrice : undefined,
          conditions: t.conditions.map((c) => ({
            denom: CurrencyDenomMap[c.currency],
            greaterOrEqual: terraAmountConverter.toTerraFormat(+c.greaterOrEqual),
            buy: terraAmountConverter.toTerraFormat(+c.buy),
          })),
        }),
      ),
    );
  }

  private updateTask(params: TasksProcessorUpdateParams) {
    this.processorUpdater?.(params);
  }
}

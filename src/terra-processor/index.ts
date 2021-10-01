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
import { swapTransactionCreator } from './transaction-creators/swap-transaction-creator';
import { createBlockSource } from './transactions-sources/block-source';
import { createMempoolSource } from './transactions-sources/mempool-source';
import { TerraProcessorCoin } from './types/coin';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';
import { terraAmountConverter } from './utils/terra-amount-converter';
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
    tap(metaJournal.onFiltrationDone),
    createNewTransactionPreparationFlow(getTasks, updateTask),
    tap(metaJournal.onStartTransactionSending),
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

  constructor(config: {
    tendermintWebsocketUrl: string;
    tendermintApiUrl: string;
    lcdUrl: string;
    lcdChainId: string;
    walletMnemonic: string;
    gasAdjustment: string;
    defaultGasPrice: TerraProcessorCoin;
  }) {
    const terra = new LCDClient({
      URL: config.lcdUrl,
      chainID: config.lcdChainId,
    });
    const walletMnemonicKey = new MnemonicKey({
      mnemonic: config.walletMnemonic,
    });
    const defaultTerraCoin: Coin.Data = {
      denom: config.defaultGasPrice.denom,
      amount: terraAmountConverter.toTerraFormat(config.defaultGasPrice.amount),
    };
    const lcdApi = new APIRequester(config.lcdUrl);
    const tendermintApi = new APIRequester(config.tendermintApiUrl);

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
            swapTransactionCreator(terra, {
              walletMnemonic: walletMnemonicKey,
              gasAdjustment: config.gasAdjustment,
              gasPrices: [defaultTerraCoin],
            }),
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
            swapTransactionCreator(terra, {
              walletMnemonic: walletMnemonicKey,
              gasAdjustment: config.gasAdjustment,
              gasPrices: [defaultTerraCoin],
            }),
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
    console.log(tasks);
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
            denom: c.denom,
            greaterOrEqual: +c.greaterOrEqual,
            buy: +c.buy,
          })),
        }),
      ),
    );
  }

  private updateTask(params: TasksProcessorUpdateParams) {
    this.processorUpdater?.(params);
  }
}

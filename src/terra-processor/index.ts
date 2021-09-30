import { LCDClient, MnemonicKey } from '@terra-money/terra.js';
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
  repeat,
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
import { createNewTransactionPreparationFlow, sendTransaction } from './new-transaction-workflow';
import { TransactionMetaJournal } from './transaction-meta-journal';
import { createBlockSource, createTxFromHashFlow } from './transactions-sources/block-source';
import { createMempoolSource, createTxFromEncoded } from './transactions-sources/mempool-source';
import { NewTransactionInfo, NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';

const coreSmartContractWorkflow = (
  metaJournal: TransactionMetaJournal,
  getFilters: () => Observable<TransactionFilter>,
  getTasks: () => SniperTask[],
  updateTask: (params: TasksProcessorUpdateParams) => void,
  sendTransaction: (info: NewTransactionInfo) => Promise<NewTransactionResult>,
) =>
  pipe(
    createLiquidityFilterWorkflow(getFilters),
    tap(metaJournal.onFiltrationDone),
    createNewTransactionPreparationFlow(getTasks, updateTask),
    tap(metaJournal.onStartTransactionSending),
    mergeMap(sendTransaction),
    tap(({ taskId, success }) => updateTask({ taskId, newStatus: success ? 'closed' : 'active' })),
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
  }) {
    const terra = new LCDClient({
      URL: config.lcdUrl,
      chainID: config.lcdChainId,
    });
    const walletMnemonicKey = new MnemonicKey({
      mnemonic: config.walletMnemonic,
    });
    const lcdApi = new APIRequester(config.lcdUrl);
    const tendermintApi = new APIRequester(config.tendermintApiUrl);

    const $mempoolSource = createMempoolSource(tendermintApi).pipe(
      mergeMap((encodedTx) => {
        const metaJournal = new TransactionMetaJournal('mempool');

        return of(encodedTx).pipe(
          createTxFromEncoded(lcdApi),
          repeat(),
          map((txDecodeResponse) => txDecodeResponse.result),
          coreSmartContractWorkflow(
            metaJournal,
            () => this.getFilters(),
            () => this.tasks,
            (params) => this.updateTask(params),
            sendTransaction(terra, walletMnemonicKey),
          ),
        );
      }),
    );

    const $blockSource = createBlockSource({
      websocketUrl: config.tendermintWebsocketUrl,
    }).pipe(
      mergeMap((txHash) => {
        const metaJournal = new TransactionMetaJournal('block');

        return of(txHash).pipe(
          createTxFromHashFlow(terra),
          coreSmartContractWorkflow(
            metaJournal,
            () => this.getFilters(),
            () => this.tasks,
            (params) => this.updateTask(params),
            sendTransaction(terra, walletMnemonicKey),
          ),
        );
      }),
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

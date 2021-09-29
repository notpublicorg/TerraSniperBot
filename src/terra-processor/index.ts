import { filter, from, map, mergeMap, mergeWith, Observable, Subscription, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import {
  TasksProcessor,
  TasksProcessorUpdateParams,
  TasksProcessorUpdater,
} from '../tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import { sendTransaction } from './new-transaction-workflow';
import { createBlockSource } from './transactions-sources/block-source';
import { createMempoolSource } from './transactions-sources/mempool-source';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';

const { terra, transactionsBlockSource } = createBlockSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-12',
  },
  { error: console.log, info: console.info },
);
const transactionsMempoolSource = createMempoolSource({
  tendermintApiUrl: 'http://162.55.245.183:26657',
  lcdApiUrl: 'https://bombay-lcd.terra.dev',
});

export class TerraTasksProcessor implements TasksProcessor {
  private tasks: SniperTask[] = [];
  private processorUpdater: TasksProcessorUpdater | null = null;

  private smartContractWorkflow: Observable<NewTransactionResult>;
  private subscription: Subscription | null = null;

  constructor() {
    this.smartContractWorkflow = transactionsBlockSource.pipe(
      mergeWith(transactionsMempoolSource),
      createLiquidityFilterWorkflow(this.getFilters.bind(this)),
      map(({ taskId, satisfiedBuyCondition, liquidity }) => ({
        taskId,
        isTaskActive: this.tasks.find((t) => t.id === taskId)?.status === 'active',
        buyDenom: satisfiedBuyCondition.denom,
        buyAmount: satisfiedBuyCondition.buy,
        pairContract: liquidity.pairContract,
      })),
      tap((f) => console.log(f)),
      filter(({ isTaskActive }) => isTaskActive),
      tap(({ taskId }) => this.updateTask({ taskId, newStatus: 'blocked' })),
      mergeMap(sendTransaction(terra)),
      tap(({ taskId, success }) =>
        this.updateTask({ taskId, newStatus: success ? 'closed' : 'active' }),
      ),
    );
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

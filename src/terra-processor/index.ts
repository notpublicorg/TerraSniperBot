import { filter, from, map, mergeMap, Observable, Subscription, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessor } from '../tasks-processor';
import { createLiquidityFilterWorkflow } from './liquidity-filter-workflow';
import { sendTransaction } from './new-transaction-workflow';
import { createTerraTransactionsSource } from './terra-transactions-source';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';

const { terra, transactionsSource } = createTerraTransactionsSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-12',
  },
  { error: console.log, info: console.info },
);

export class TerraTasksProcessor implements TasksProcessor {
  // TODO: use Map for better props getting
  // TODO: special type for processors { isBlocked, with nums and filtered by active&blocked }
  private tasks: SniperTask[] = [];
  private smartContractWorkflow: Observable<NewTransactionResult>;
  private subscription: Subscription | null = null;

  constructor() {
    this.smartContractWorkflow = transactionsSource.pipe(
      createLiquidityFilterWorkflow(this.getFilters.bind(this)),
      tap((f) => console.log(f)),
      map(({ taskId, satisfiedBuyCondition, liquidity }) => ({
        taskId,
        isTaskActive: this.tasks.find((t) => t.id === taskId)?.status === 'active',
        buyDenom: satisfiedBuyCondition.denom,
        buyAmount: satisfiedBuyCondition.buy,
        pairContract: liquidity.pairContract,
      })),
      filter(({ isTaskActive }) => isTaskActive),
      tap(({ taskId }) => this.blockTask(taskId)),
      mergeMap(sendTransaction(terra)),
    );
  }

  init: TasksProcessor['init'] = (tasks) => {
    this.tasks = tasks;
    this.subscription = this.smartContractWorkflow.subscribe(console.log);
  };

  updateTasks: TasksProcessor['updateTasks'] = (tasks) => {
    this.tasks = tasks;
  };

  stop: TasksProcessor['stop'] = () => this.subscription?.unsubscribe();

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

  private blockTask(id: string) {
    console.log(id);
    // TODO: send update request to processor subscriber
    // subscriber.next(action: { type: activate, block, close; taskId }
  }
}

import { mergeMap, Observable, Subscription, tap } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessor } from '../tasks-processor';
import { sendTransaction } from './new-transaction-workflow';
import { createSmartContractWorkflow } from './smart-contract-workflow';
import { createTerraTransactionsSource } from './terra-transactions-source';
import { NewTransactionResult, TransactionFilter } from './types/transaction-filter';

const { terra, transactionsSource } = createTerraTransactionsSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-11',
  },
  { error: (e) => console.log(e.stack), info: console.info },
);

export class TerraTasksProcessor implements TasksProcessor {
  private tasks: SniperTask[] = [];
  private smartContractWorkflow: Observable<NewTransactionResult>;
  private subscription: Subscription | null = null;

  constructor() {
    this.smartContractWorkflow = transactionsSource.pipe(
      createSmartContractWorkflow(this.getFilters.bind(this)),
      tap((f) => console.log(f)),
      mergeMap(sendTransaction(terra)),
    );
  }

  init: TasksProcessor['init'] = (tasks) => {
    this.tasks = tasks;
    this.subscription = this.smartContractWorkflow.subscribe(console.log);
  };

  reinit: TasksProcessor['reinit'] = (tasks) => {
    this.subscription?.unsubscribe();
    this.init(tasks);
  };

  stop: TasksProcessor['stop'] = () => this.subscription?.unsubscribe();

  private getFilters(): TransactionFilter[] {
    return this.tasks.map((t) => ({
      taskId: t.id,
      contractToSpy: t.contract,
      maxTokenPrice: +t.maxTokenPrice,
      conditions: t.conditions.map((c) => ({
        denom: c.denom,
        greaterOrEqual: +c.greaterOrEqual,
        buy: +c.buy,
      })),
    }));
  }
}

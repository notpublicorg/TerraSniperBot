import { Subscription } from 'rxjs';

import { SniperTask } from '../sniper-task';
import { TasksProcessor } from '../tasks-processor';
import { createSmartContractWorkflow } from './smart-contract-workflow';
import { createTerraTransactionsSource } from './terra-transactions-source';
import { TransactionFilter } from './types/transaction-filter';

const transactionsSource = createTerraTransactionsSource(
  {
    websocketUrl: 'ws://162.55.245.183:26657/websocket',
    lcdUrl: 'https://bombay-lcd.terra.dev',
    lcdChainId: 'bombay-11',
  },
  { error: console.log, info: console.info },
);

export class TerraTasksProcessor implements TasksProcessor {
  private tasks: SniperTask[] = [];
  private smartContractWorkflow: ReturnType<typeof createSmartContractWorkflow>;
  private subscription: Subscription | null = null;

  constructor() {
    this.smartContractWorkflow = createSmartContractWorkflow(
      this.getFilters.bind(this),
      transactionsSource,
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

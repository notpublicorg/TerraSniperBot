import { filter, from, map, Observable, Subscription } from 'rxjs';

import { SniperTask } from '../sniper-task';
import {
  TasksProcessor,
  TasksProcessorUpdateParams,
  TasksProcessorUpdater,
} from '../tasks-processor';
import { createTerraWorkflow } from './create-terra-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';
import { CurrencyDenomMap } from './utils/denom';
import { terraAmountConverter } from './utils/terra-types-converter';
import { TransactionMetaJournal } from './utils/transaction-meta-journal';

export class TerraTasksProcessor implements TasksProcessor {
  private tasks: SniperTask[] = [];
  private processorUpdater: TasksProcessorUpdater | null = null;

  private terraWorkflow: Observable<{
    result: NewTransactionResult;
    metaJournal: TransactionMetaJournal;
  }>;
  private subscription: Subscription | null = null;

  constructor(config: TerraTasksProcessorConfig) {
    this.terraWorkflow = createTerraWorkflow(config, {
      getFiltersSource: () => this.getFilters(),
      getTasks: () => this.tasks,
      updateTask: (params) => this.updateTask(params),
    });
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
      this.subscription = this.subscription || this.terraWorkflow.subscribe(console.log);
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

import { filter, from, map, Observable, Subscription } from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import {
  TasksProcessor,
  TasksProcessorUpdateParams,
  TasksProcessorUpdater,
} from '../core/tasks-processor';
import { createTerraWorkflow } from './create-terra-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { NewTransactionResult } from './types/new-transaction-info';
import { TransactionFilter } from './types/transaction-filter';
import { CurrencyDenomMap } from './utils/denom';
import { terraAmountConverter } from './utils/terra-types-converter';
import { MetaJournalData } from './utils/transaction-meta-journal';

export class TerraTasksProcessor implements TasksProcessor {
  private processorUpdater: TasksProcessorUpdater | null = null;
  private tasksGetter: (() => SniperTask[]) | null = null;

  private terraWorkflow: Observable<{
    result: NewTransactionResult;
    metaJournal: MetaJournalData;
  }>;
  private subscription: Subscription | null = null;

  constructor(config: TerraTasksProcessorConfig) {
    this.terraWorkflow = createTerraWorkflow(config, {
      getFiltersSource: () => this.getFilters(),
      getTasks: () => this.tasksGetter?.() || [],
      updateTask: (params) => this.updateTask(params),
    });
  }

  subscribe: TasksProcessor['subscribe'] = (tasksGetter, updater) => {
    console.log('Terra Tasks Processor: START');
    this.tasksGetter = tasksGetter;
    this.processorUpdater = updater;
    this.subscription = this.terraWorkflow.subscribe(console.log);

    return {
      unsubscribe: () => {
        console.log('Terra Tasks Processor: STOP');
        this.tasksGetter = null;
        this.processorUpdater = null;
        this.subscription?.unsubscribe();
        this.subscription = null;
      },
    };
  };

  private getFilters() {
    return from(this.tasksGetter?.() || []).pipe(
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

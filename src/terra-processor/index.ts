import { Connectable, filter, from, map, Observable, Subscription } from 'rxjs';

import { SniperTask } from '../core/sniper-task';
import {
  TasksProcessor,
  TasksProcessorUpdateParams,
  TasksProcessorUpdater,
} from '../core/tasks-processor';
import { createTerraWorkflow } from './create-terra-workflow';
import { TerraTasksProcessorConfig } from './processor-config';
import { NewBlockInfo, TerraFlowResult } from './types/terra-flow';
import { TransactionFilter } from './types/transaction-filter';
import { CurrencyDenomMap } from './utils/denom';
import { terraAmountConverter } from './utils/terra-types-converter';

export class TerraTasksProcessor implements TasksProcessor {
  private processorUpdater: TasksProcessorUpdater | null = null;
  private tasksGetter: (() => SniperTask[]) | null = null;

  private transactionsFlow: Observable<TerraFlowResult>;
  private transactionsFlowSubscription: Subscription | null = null;

  private newBlockFlow: Connectable<NewBlockInfo>;
  private newBlockFlowSubscription: Subscription | null = null;

  constructor(config: TerraTasksProcessorConfig) {
    const { $mempoolSource, $newBlockSource } = createTerraWorkflow(config, {
      getFiltersSource: () => this.getFilters(),
      getTasks: () => this.tasksGetter?.() || [],
      updateTask: (params) => this.updateTask(params),
    });
    this.transactionsFlow = $mempoolSource;
    this.newBlockFlow = $newBlockSource;
  }

  subscribe: TasksProcessor['subscribe'] = (tasksGetter, updater) => {
    console.log('Terra Tasks Processor: START');
    this.tasksGetter = tasksGetter;
    this.processorUpdater = updater;
    this.newBlockFlowSubscription = this.newBlockFlow.connect();
    this.transactionsFlowSubscription = this.transactionsFlow.subscribe(console.log);

    return {
      unsubscribe: () => {
        console.log('Terra Tasks Processor: STOP');
        this.tasksGetter = null;
        this.processorUpdater = null;
        this.newBlockFlowSubscription?.unsubscribe();
        this.newBlockFlowSubscription = null;
        this.transactionsFlowSubscription?.unsubscribe();
        this.transactionsFlowSubscription = null;
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

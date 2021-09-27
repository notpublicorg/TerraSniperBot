import { Denom } from '@terra-money/terra.js';

import { generateIdFromDate } from './id-generator-date';
import { InMemoryTasksGateway } from './in-memory-tasks-gateway';
import { SniperTask } from './sniper-task';
import { tasksWatcherFactory } from './tasks-watcher';
import { TerraTasksProcessor } from './terra-processor';

const TASK_MOCK: SniperTask = {
  id: 'taskId',
  status: 'active',
  contract: 'terra1m7v70xk2ljhmvqy0psp5p9w3f6uztj3mftncdz',
  conditions: [
    {
      denom: Denom.USD,
      greaterOrEqual: '20',
      buy: '20',
    },
    {
      denom: Denom.USD,
      greaterOrEqual: '10',
      buy: '10',
    },
  ],
  maxTokenPrice: '1.5',
};

const gateway = new InMemoryTasksGateway(generateIdFromDate);
gateway.addTask(TASK_MOCK);

const tasksWatcher = tasksWatcherFactory(gateway, new TerraTasksProcessor());

tasksWatcher.start();

process.stdin.on('data', () => {
  console.log('shutting down connection');
  tasksWatcher.stop();
  process.exit(0);
});

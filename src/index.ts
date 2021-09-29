import { Denom } from '@terra-money/terra.js';

import { generateIdFromDate } from './id-generator-date';
import { InMemoryTasksGateway } from './in-memory-tasks-gateway';
import { SniperTaskNew } from './sniper-task';
import { tasksWatcherFactory } from './tasks-watcher';
import { TerraTasksProcessor } from './terra-processor';

const TASK_MOCK: SniperTaskNew = {
  contract: 'terra1n4cy7vxwafjsr0553e0k0q7k92slztlurm08j4',
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
  maxTokenPrice: '100',
};
const TASK_MOCK_2: SniperTaskNew = {
  contract: 'terra13y43fyl8t3sr24glvqn7ct0mu80rqcc6t2dla8',
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
  maxTokenPrice: '100',
};

async function start() {
  const gateway = new InMemoryTasksGateway(generateIdFromDate);
  await gateway.addTask(TASK_MOCK);
  await gateway.addTask(TASK_MOCK_2);

  const tasksWatcher = tasksWatcherFactory(gateway, new TerraTasksProcessor());

  tasksWatcher.start();

  process.stdin.on('data', () => {
    console.log('shutting down connection');
    tasksWatcher.stop();
    process.exit(0);
  });
}

start();

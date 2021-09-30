import { Denom } from '@terra-money/terra.js';

import { generateIdFromDate } from './id-generator-date';
import { SniperTaskNew } from './sniper-task';
import { TasksCacheGateway } from './tasks-cache-gateway';
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

const gateway = new TasksCacheGateway(generateIdFromDate);
gateway.addTask(TASK_MOCK);
gateway.addTask(TASK_MOCK_2);

const terraProcessor = new TerraTasksProcessor({
  tendermintApiUrl: 'http://162.55.245.183:26657',
  tendermintWebsocketUrl: 'ws://162.55.245.183:26657/websocket',
  lcdUrl: 'https://bombay-lcd.terra.dev',
  lcdChainId: 'bombay-12',
  walletMnemonic:
    'clown lawsuit shoe hurt feed daring ugly already smile art reveal rail impact alter home fresh gadget prevent code guitar unusual tape dizzy this',
});

const tasksWatcher = tasksWatcherFactory(gateway, terraProcessor);

tasksWatcher.start();

// TODO: catch all errors and SIGTERM signals for graceful stop
process.stdin.on('data', () => {
  console.log('shutting down connection');
  tasksWatcher.stop();
  process.exit(0);
});

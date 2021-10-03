import config from 'config';

import tasks from '../tasks.json';
import { generateIdFromDate } from './id-generator-date';
import { TasksCacheGateway } from './tasks-cache-gateway';
import { tasksWatcherFactory } from './tasks-watcher';
import { TerraTasksProcessor } from './terra-processor';

const gateway = new TasksCacheGateway(generateIdFromDate);
gateway.addNewTasks(tasks.tasks);

const terraProcessor = new TerraTasksProcessor({
  tendermintApiUrl: config.get('tendermintApiUrl'),
  tendermintWebsocketUrl: config.get('tendermintWebsocketUrl'),
  lcdUrl: config.get('lcdUrl'),
  lcdChainId: config.get('lcdChainId'),
  walletMnemonic: config.get('walletMnemonic'),
  gasAdjustment: config.get('gasAdjustment'),
  block: config.get('block'),
  mempool: config.get('mempool'),
});

const tasksWatcher = tasksWatcherFactory(gateway, terraProcessor);

tasksWatcher.start();

function stop() {
  tasksWatcher.start();
  process.exit(0);
}

// Enable graceful stop
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

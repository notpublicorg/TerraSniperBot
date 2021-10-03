import config from 'config';

import tasks from '../tasks.json';
import { TasksCacheGateway } from './cache/tasks-cache-gateway';
import { tasksWatcherFactory } from './core/tasks-watcher';
import { generateIdFromDate } from './id-generator-date';
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
  tasksWatcher.stop();
  process.exit(0);
}

// Enable graceful stop
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

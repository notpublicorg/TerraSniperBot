import config from '../../config.json';
import { TasksCacheGateway } from './cache/tasks-cache-gateway';
import { tasksWatcherFactory } from './core/tasks-watcher';
import { generateIdFromDate } from './id-generator-date';
import { TerraTasksProcessor } from './terra-processor';

const gateway = new TasksCacheGateway(generateIdFromDate);
gateway.addNewTasks(config.tasks);

const terraProcessor = new TerraTasksProcessor(config.defaults);

const tasksWatcher = tasksWatcherFactory(gateway, terraProcessor);

tasksWatcher.start();

function stop() {
  tasksWatcher.stop();
  process.exit(0);
}

// Enable graceful stop
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

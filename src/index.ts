import config from '../config.json';
import tasks from '../tasks.json';
import { TasksCacheGateway } from './cache/tasks-cache-gateway';
import { tasksWatcherFactory } from './core/tasks-watcher';
import { generateIdFromDate } from './id-generator-date';
import { TerraTasksProcessor } from './terra-processor';

const gateway = new TasksCacheGateway(generateIdFromDate);
gateway.addNewTasks(tasks.tasks);

const terraProcessor = new TerraTasksProcessor(config);

const tasksWatcher = tasksWatcherFactory(gateway, terraProcessor);

tasksWatcher.start();

function stop() {
  tasksWatcher.stop();
  process.exit(0);
}

// Enable graceful stop
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

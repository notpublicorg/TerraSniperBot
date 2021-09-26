import { TasksGateway } from './tasks-gateway';
import { TasksProcessor } from './tasks-processor';

export const tasksWatcherFactory = (gateway: TasksGateway, processor: TasksProcessor) => ({
  async start() {
    const tasks = await gateway.getAll();

    processor.init(tasks);
  },
  stop() {
    processor.stop();
  },
});

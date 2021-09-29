import { TasksGateway } from './tasks-gateway';
import { TasksProcessor, TasksProcessorSubscription } from './tasks-processor';

export const tasksWatcherFactory = (gateway: TasksGateway, processor: TasksProcessor) => {
  let processorSubscription: TasksProcessorSubscription | null = null;

  return {
    async start() {
      const tasks = await gateway.getAll();

      processorSubscription = processor.start(tasks, ({ taskId, newStatus }) => {
        gateway.updateTaskStatus(taskId, newStatus);
      });
    },
    stop() {
      processorSubscription?.stop();
    },
  };
};

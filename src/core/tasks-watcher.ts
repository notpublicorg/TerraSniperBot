import { TasksGateway } from './tasks-gateway';
import { TasksProcessor, TasksProcessorSubscription } from './tasks-processor';

export const tasksWatcherFactory = (gateway: TasksGateway, processor: TasksProcessor) => {
  let processorSubscription: TasksProcessorSubscription | null = null;

  return {
    start() {
      processorSubscription = processor.subscribe(
        () => gateway.getAll().filter((t) => t.status === 'active' || t.status === 'blocked'),
        ({ taskId, newStatus }) => {
          gateway.updateTaskStatus(taskId, newStatus);
        },
      );
    },
    stop() {
      processorSubscription?.unsubscribe();
    },
  };
};

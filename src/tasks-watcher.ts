import { TasksGateway, TasksGatewaySubscription } from './tasks-gateway';
import { TasksProcessor, TasksProcessorSubscription } from './tasks-processor';

export const tasksWatcherFactory = (gateway: TasksGateway, processor: TasksProcessor) => {
  let processorSubscription: TasksProcessorSubscription | null = null;
  let gatewaySubscription: TasksGatewaySubscription | null = null;

  return {
    start() {
      gatewaySubscription = gateway.subscribeToUpdates((tasks) => {
        processor.updateTasks(tasks);
      });

      const tasks = gateway.getAll();

      processorSubscription = processor.subscribe(
        tasks?.filter((t) => t.status === 'active' || t.status === 'blocked') || [],
        ({ taskId, newStatus }) => {
          gateway.updateTaskStatus(taskId, newStatus);
        },
      );
    },
    stop() {
      processorSubscription?.unsubscribe();
      gatewaySubscription?.unsubscribe();
    },
  };
};

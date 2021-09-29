import { SniperTask } from './sniper-task';

export type TasksProcessorUpdateParams = {
  newStatus: SniperTask['status'];
  taskId: string;
};
export type TasksProcessorUpdater = (params: TasksProcessorUpdateParams) => void;

export type TasksProcessorSubscription = {
  unsubscribe: () => void;
};

export type TasksProcessor = {
  subscribe: (
    initialTasks: SniperTask[],
    updater: TasksProcessorUpdater,
  ) => TasksProcessorSubscription;
  updateTasks: (tasks: SniperTask[]) => void;
};

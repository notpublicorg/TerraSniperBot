import { SniperTask } from './sniper-task';

export type TasksProcessorUpdateParams = {
  newStatus: SniperTask['status'];
  taskId: string;
};
export type TasksProcessorUpdater = (params: TasksProcessorUpdateParams) => void;

export type TasksProcessorSubscription = {
  stop: () => void;
};

export type TasksProcessor = {
  start: (initialTasks: SniperTask[], updater: TasksProcessorUpdater) => TasksProcessorSubscription;
  updateTasks: (tasks: SniperTask[]) => void;
};

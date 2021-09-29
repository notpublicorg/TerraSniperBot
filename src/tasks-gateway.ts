import { SniperTask, SniperTaskNew } from './sniper-task';

export type TasksGatewayUpdater = (tasks: SniperTask[]) => void;
export type TasksGatewaySubscription = { unsubscribe: () => void };

export type TasksGateway = {
  addTask: (task: SniperTaskNew) => Promise<void>;
  getAll: () => Promise<SniperTask[]>;
  updateTaskStatus: (taskId: string, newStatus: SniperTask['status']) => Promise<void>;
  subscribeToUpdates: (updater: TasksGatewayUpdater) => TasksGatewaySubscription;
};

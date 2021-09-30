import { SniperTask, SniperTaskNew } from './sniper-task';

export type TasksGatewayUpdater = (tasks: SniperTask[]) => void;
export type TasksGatewaySubscription = { unsubscribe: () => void };

export type TasksGateway = {
  addTask: (task: SniperTaskNew) => void;
  getAll: () => SniperTask[];
  updateTaskStatus: (taskId: string, newStatus: SniperTask['status']) => void;
  subscribeToUpdates: (updater: TasksGatewayUpdater) => TasksGatewaySubscription;
};

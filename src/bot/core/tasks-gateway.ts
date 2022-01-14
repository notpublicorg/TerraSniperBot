import { SniperTask, SniperTaskNew } from './sniper-task';

export type TasksGateway = {
  addNewTasks: (tasks: SniperTaskNew[]) => void;
  getAll: () => SniperTask[];
  updateTaskStatus: (taskId: string, newStatus: SniperTask['status']) => void;
};

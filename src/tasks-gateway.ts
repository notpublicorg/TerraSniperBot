import { SniperTask, SniperTaskNew } from './sniper-task';

export type TasksGateway = {
  addTask: (task: SniperTaskNew) => Promise<void>;
  getAll: () => Promise<SniperTask[]>;
};

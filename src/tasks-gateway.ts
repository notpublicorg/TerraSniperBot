import { SniperTask } from './sniper-task';

export type TasksGateway = {
  createTask: (task: SniperTask) => Promise<void>;
};

import { SniperTaskNew } from './sniper-task';

export type TasksGateway = {
  createTask: (task: SniperTaskNew) => Promise<void>;
};

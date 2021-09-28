import { SniperTask } from './sniper-task';

export type TasksProcessor = {
  init: (tasks: SniperTask[]) => void;
  updateTasks: (tasks: SniperTask[]) => void;
  stop: () => void;
};

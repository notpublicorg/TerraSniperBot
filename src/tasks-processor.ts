import { SniperTask } from './sniper-task';

export type TasksProcessor = {
  init: (tasks: SniperTask[]) => void;
  reinit: (tasks: SniperTask[]) => void;
  stop: () => void;
};

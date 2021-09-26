import { SniperTask } from './sniper-task';
import { TasksGateway } from './tasks-gateway';

export function taskCreatorFactory(tasksGateway: TasksGateway) {
  return async (task: SniperTask) => tasksGateway.createTask(task);
}

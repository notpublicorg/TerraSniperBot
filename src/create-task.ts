import { SniperTaskNew } from './sniper-task';
import { TasksGateway } from './tasks-gateway';

export function taskCreatorFactory(tasksGateway: TasksGateway) {
  return async (task: SniperTaskNew) => tasksGateway.createTask(task);
}

import { SniperTask } from '../core/sniper-task';
import { TasksGateway } from '../core/tasks-gateway';
import { IdGenerator } from './id-generator';

export class TasksCacheGateway implements TasksGateway {
  private tasks = new Map<string, SniperTask>();

  constructor(private idGenerator: IdGenerator) {}

  getAll: TasksGateway['getAll'] = () => Array.from(this.tasks.values());

  addNewTasks: TasksGateway['addNewTasks'] = (tasks) => {
    tasks.forEach((task) => {
      const newTaskId = this.idGenerator();
      this.tasks.set(newTaskId, {
        ...task,
        id: newTaskId,
        status: 'active',
      });
    });
  };

  updateTaskStatus: TasksGateway['updateTaskStatus'] = (taskId, newStatus) => {
    const taskToUpdate = this.tasks.get(taskId);

    if (!taskToUpdate) return;

    this.tasks.set(taskId, {
      ...taskToUpdate,
      status: newStatus,
    });

    console.log({ ...taskToUpdate, status: newStatus });
  };
}

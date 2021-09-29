import { IdGenerator } from './id-generator';
import { SniperTask } from './sniper-task';
import { TasksGateway } from './tasks-gateway';

export class InMemoryTasksGateway implements TasksGateway {
  tasks = new Map<string, SniperTask>();

  constructor(private idGenerator: IdGenerator) {}

  addTask: TasksGateway['addTask'] = async (task) => {
    const newTaskId = this.idGenerator();
    this.tasks.set(newTaskId, {
      ...task,
      id: this.idGenerator(),
      status: 'active',
    });
  };

  getAll: TasksGateway['getAll'] = async () => Array.from(this.tasks.values());

  updateTaskStatus: TasksGateway['updateTaskStatus'] = async (taskId, newStatus) => {
    const taskToUpdate = this.tasks.get(taskId);

    if (!taskToUpdate) return;

    this.tasks.set(taskId, {
      ...taskToUpdate,
      status: newStatus,
    });
  };
}

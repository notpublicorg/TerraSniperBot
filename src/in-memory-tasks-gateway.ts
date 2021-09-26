import { IdGenerator } from './id-generator';
import { SniperTask } from './sniper-task';
import { TasksGateway } from './tasks-gateway';

export class InMemoryTasksGateway implements TasksGateway {
  tasks: SniperTask[] = [];

  constructor(private idGenerator: IdGenerator) {}

  addTask: TasksGateway['addTask'] = async (task) => {
    this.tasks.push({
      ...task,
      id: this.idGenerator(),
      status: 'active',
    });
  };

  getAll: TasksGateway['getAll'] = async () => this.tasks;
}

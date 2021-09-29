import { IdGenerator } from './id-generator';
import { SniperTask } from './sniper-task';
import { TasksGateway, TasksGatewayUpdater } from './tasks-gateway';

export class InMemoryTasksGateway implements TasksGateway {
  private tasks = new Map<string, SniperTask>();
  private updater: TasksGatewayUpdater | null = null;

  constructor(private idGenerator: IdGenerator) {}

  getAll: TasksGateway['getAll'] = async () => Array.from(this.tasks.values());

  addTask: TasksGateway['addTask'] = async (task) => {
    const newTaskId = this.idGenerator();
    this.tasks.set(newTaskId, {
      ...task,
      id: this.idGenerator(),
      status: 'active',
    });

    this.notifySubscribers();
  };

  updateTaskStatus: TasksGateway['updateTaskStatus'] = async (taskId, newStatus) => {
    const taskToUpdate = this.tasks.get(taskId);

    if (!taskToUpdate) return;

    this.tasks.set(taskId, {
      ...taskToUpdate,
      status: newStatus,
    });

    this.notifySubscribers();
  };

  subscribeToUpdates: TasksGateway['subscribeToUpdates'] = (updater) => {
    this.updater = updater;
    return {
      unsubscribe: () => {
        this.updater = null;
      },
    };
  };

  private async notifySubscribers() {
    if (this.updater) {
      const tasks = await this.getAll();
      this.updater(tasks);
    }
  }
}

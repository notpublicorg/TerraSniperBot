import { TasksGateway } from '../core/tasks-gateway';

type MockedTasksGateway = jest.Mocked<TasksGateway>;

class TasksGatewayMockBuilder {
  private gateway: MockedTasksGateway = {
    addNewTasks: jest.fn(),
    getAll: jest.fn(),
    updateTaskStatus: jest.fn(),
  };

  with<Prop extends keyof MockedTasksGateway>(prop: Prop, value: MockedTasksGateway[Prop]) {
    this.gateway[prop] = value;
    return this;
  }

  build(): MockedTasksGateway {
    return this.gateway;
  }
}

export const aTasksGatewayMock = () => new TasksGatewayMockBuilder();

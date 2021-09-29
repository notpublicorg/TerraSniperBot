import { TasksGateway } from '../tasks-gateway';

type MockedTasksGateway = jest.Mocked<TasksGateway>;

class TasksGatewayMockBuilder {
  private gateway: MockedTasksGateway = {
    addTask: jest.fn(),
    getAll: jest.fn(),
    updateTaskStatus: jest.fn(),
    subscribeToUpdates: jest.fn(),
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

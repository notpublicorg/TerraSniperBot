import { TasksProcessor } from '../core/tasks-processor';

type MockedTasksProcessor = jest.Mocked<TasksProcessor>;

class TasksProcessorMockBuilder {
  private gateway: MockedTasksProcessor = {
    subscribe: jest.fn(),
  };

  with<Prop extends keyof MockedTasksProcessor>(prop: Prop, value: MockedTasksProcessor[Prop]) {
    this.gateway[prop] = value;
    return this;
  }

  build(): MockedTasksProcessor {
    return this.gateway;
  }
}

export const aTaskProcessorMock = () => new TasksProcessorMockBuilder();

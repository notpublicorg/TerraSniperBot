import { SniperTask } from './sniper-task';
import { TasksGateway } from './tasks-gateway';
import { TasksProcessor } from './tasks-processor';
import { tasksWatcherFactory } from './tasks-watcher';

const TASK: SniperTask = {
  contract: 'token contract',
  conditions: [{ denom: 'uluna', greaterOrEqual: '100', buy: '10' }],
  maxTokenPrice: '25',
  id: 'id',
  status: 'active',
};

it('should get tasks and initialize processor', async () => {
  const processor: TasksProcessor = {
    init: jest.fn(),
    reinit: jest.fn(),
    stop: jest.fn(),
  };

  const gateway: TasksGateway = {
    addTask: jest.fn(),
    getAll: jest.fn(() => Promise.resolve([TASK])),
  };

  const taskWatcher = tasksWatcherFactory(gateway, processor);

  await taskWatcher.start();

  expect(processor.init).toHaveBeenCalledWith([TASK]);
});

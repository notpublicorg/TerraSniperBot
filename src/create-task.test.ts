import { taskCreatorFactory } from './create-task';
import { SniperTask } from './sniper-task';
import { TasksGateway } from './tasks-gateway';

it('should create task', async () => {
  const TASK: SniperTask = {
    contract: 'token contract',
    conditions: [{ denom: 'uluna', greaterOrEqual: '100', buy: '10' }],
    maxTokenPrice: '25',
  };

  const tasksGateway: TasksGateway = {
    createTask: jest.fn(),
  };

  const createTask = taskCreatorFactory(tasksGateway);

  await createTask(TASK);

  expect(tasksGateway.createTask).toHaveBeenCalledWith(TASK);
});

import { InMemoryTasksGateway } from './in-memory-tasks-gateway';
import { SniperTask, SniperTaskNew } from './sniper-task';

const NEW_TASK: SniperTaskNew = {
  contract: 'token contract',
  conditions: [{ denom: 'uluna', greaterOrEqual: '100', buy: '10' }],
  maxTokenPrice: '25',
};
const TASK: SniperTask = {
  ...NEW_TASK,
  id: 'id',
  status: 'active',
};

it('should add task', async () => {
  const idGenerator = jest.fn(() => 'id');

  const gateway = new InMemoryTasksGateway(idGenerator);

  await gateway.addTask(NEW_TASK);

  const tasks = await gateway.getAll();

  expect(tasks).toEqual([TASK]);
});

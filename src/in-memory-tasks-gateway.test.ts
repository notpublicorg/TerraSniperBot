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

let gateway: InMemoryTasksGateway;

beforeEach(() => {
  const idGenerator = jest.fn(() => 'id');
  gateway = new InMemoryTasksGateway(idGenerator);
});

it('should add task', async () => {
  await gateway.addTask(NEW_TASK);
  const tasks = await gateway.getAll();

  expect(tasks).toEqual([TASK]);
});

it('should update task status', async () => {
  await gateway.addTask(NEW_TASK);
  await gateway.updateTaskStatus(TASK.id, 'closed');

  const tasks = await gateway.getAll();

  expect(tasks).toEqual([{ ...TASK, status: 'closed' }]);
});

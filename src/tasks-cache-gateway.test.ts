import { SniperTask, SniperTaskNew } from './sniper-task';
import { TasksCacheGateway } from './tasks-cache-gateway';

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

let gateway: TasksCacheGateway;

beforeEach(() => {
  const idGenerator = jest.fn(() => 'id');
  gateway = new TasksCacheGateway(idGenerator);
});

it('should add task', () => {
  gateway.addTask(NEW_TASK);
  const tasks = gateway.getAll();

  expect(tasks).toEqual([TASK]);
});

it('should update task status', () => {
  gateway.addTask(NEW_TASK);
  gateway.updateTaskStatus(TASK.id, 'closed');

  const tasks = gateway.getAll();

  expect(tasks).toEqual([{ ...TASK, status: 'closed' }]);
});

it('should notify subscribers when new task added', () => {
  const gatewayClientFn = jest.fn();

  gateway.subscribeToUpdates(gatewayClientFn);
  gateway.addTask(NEW_TASK);

  expect(gatewayClientFn).toHaveBeenCalledWith([TASK]);
});

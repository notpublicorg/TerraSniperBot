import { SniperTaskNew } from '../core/sniper-task';
import { TasksCacheGateway } from './tasks-cache-gateway';

const NEW_TASK: SniperTaskNew = {
  tokenContract: 'token contract',
  conditions: [{ currency: 'uluna', greaterOrEqual: '100', buy: '10' }],
  maxTokenPrice: '25',
  maxSpread: '1',
};

let gateway: TasksCacheGateway;

beforeEach(() => {
  const idGenerator = jest.fn(() => Math.random().toString());
  gateway = new TasksCacheGateway(idGenerator);
});

it('should update task status', () => {
  gateway.addNewTasks([NEW_TASK]);

  const existingTasks = gateway.getAll();

  gateway.updateTaskStatus(existingTasks[0].id, 'closed');

  expect(gateway.getAll()).toEqual([expect.objectContaining({ ...NEW_TASK, status: 'closed' })]);
});

it('should add multiple tasks and notify once', () => {
  gateway.addNewTasks([
    { ...NEW_TASK, tokenContract: 'first' },
    { ...NEW_TASK, tokenContract: 'second' },
  ]);

  expect(gateway.getAll()).toEqual([
    expect.objectContaining({ ...NEW_TASK, tokenContract: 'first', status: 'active' }),
    expect.objectContaining({ ...NEW_TASK, tokenContract: 'second', status: 'active' }),
  ]);
});

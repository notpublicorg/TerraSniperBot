import { aTasksGatewayMock } from '../doubles/tasks-gateway-mock';
import { aTaskProcessorMock as aTasksProcessorMock } from '../doubles/tasks-processor-mock';
import { SniperTask } from './sniper-task';
import { aSniperTask } from './sniper-task-builder';
import { TasksProcessorUpdater } from './tasks-processor';
import { tasksWatcherFactory } from './tasks-watcher';

it('should pass all active & blocked tasks to processor on demand', async () => {
  const ACTIVE_TASK = aSniperTask().with('status', 'active').build();
  const CLOSED_TASK = aSniperTask().with('status', 'closed').build();
  const BLOCKED_TASK = aSniperTask().with('status', 'blocked').build();

  const gateway = aTasksGatewayMock()
    .with(
      'getAll',
      jest.fn(() => [ACTIVE_TASK, CLOSED_TASK, BLOCKED_TASK]),
    )
    .build();

  const getProcessorTasksGetter = new Promise<() => SniperTask[]>((resolve) => {
    const processor = aTasksProcessorMock()
      .with(
        'subscribe',
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        jest.fn((tasksGetter, _updater) => {
          resolve(tasksGetter);
          return { unsubscribe: jest.fn() };
        }),
      )
      .build();

    const taskWatcher = tasksWatcherFactory(gateway, processor);

    taskWatcher.start();
  });

  const getTasksFromGateway = await getProcessorTasksGetter;

  expect(getTasksFromGateway()).toEqual([ACTIVE_TASK, BLOCKED_TASK]);
});

it('should update task status in gateway', async () => {
  const TASK = aSniperTask().build();

  const gateway = aTasksGatewayMock().build();

  const getProcessorUpdater = new Promise<TasksProcessorUpdater>((resolve) => {
    const processor = aTasksProcessorMock()
      .with(
        'subscribe',
        jest.fn((_, updater) => {
          resolve(updater);
          return { unsubscribe: jest.fn() };
        }),
      )
      .build();

    const taskWatcher = tasksWatcherFactory(gateway, processor);

    taskWatcher.start();
  });

  const updater = await getProcessorUpdater;
  updater({ taskId: TASK.id, newStatus: 'closed' });

  expect(gateway.updateTaskStatus).toHaveBeenCalledWith(TASK.id, 'closed');
});

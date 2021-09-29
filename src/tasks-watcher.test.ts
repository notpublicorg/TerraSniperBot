import { aTasksGatewayMock } from './doubles/tasks-gateway-mock';
import { aTaskProcessorMock as aTasksProcessorMock } from './doubles/tasks-processor-mock';
import { aSniperTask } from './sniper-task-builder';
import { TasksGatewayUpdater } from './tasks-gateway';
import { TasksProcessorUpdater } from './tasks-processor';
import { tasksWatcherFactory } from './tasks-watcher';

it('should pass all active & blocked tasks to processor on start', async () => {
  const ACTIVE_TASK = aSniperTask().with('status', 'active').build();
  const CLOSED_TASK = aSniperTask().with('status', 'closed').build();
  const BLOCKED_TASK = aSniperTask().with('status', 'blocked').build();

  const processor = aTasksProcessorMock().build();

  const gateway = aTasksGatewayMock()
    .with(
      'getAll',
      jest.fn(() => Promise.resolve([ACTIVE_TASK, CLOSED_TASK, BLOCKED_TASK])),
    )
    .build();

  const taskWatcher = tasksWatcherFactory(gateway, processor);

  await taskWatcher.start();

  expect(processor.subscribe.mock.calls[0][0]).toEqual([ACTIVE_TASK, BLOCKED_TASK]);
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

it('should pass new tasks to processor when gateway notifies', async () => {
  const TASK = aSniperTask().build();

  const processor = aTasksProcessorMock().build();

  const getGatewayUpdater = new Promise<TasksGatewayUpdater>((resolve) => {
    const gateway = aTasksGatewayMock()
      .with(
        'subscribeToUpdates',
        jest.fn((updater) => {
          resolve(updater);
          return { unsubscribe: jest.fn() };
        }),
      )
      .build();

    const taskWatcher = tasksWatcherFactory(gateway, processor);

    taskWatcher.start();
  });

  const updater = await getGatewayUpdater;
  updater([TASK]);

  expect(processor.updateTasks).toHaveBeenCalledWith([TASK]);
});

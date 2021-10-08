import {
  BehaviorSubject,
  connectable,
  firstValueFrom,
  interval,
  mergeMap,
  of,
  repeat,
  take,
  toArray,
  withLatestFrom,
} from 'rxjs';

jest.setTimeout(10000);

it('should not stop second observable', async () => {
  const source = interval(200);
  const secondSource = interval(500);

  const connected = connectable(secondSource, { connector: () => new BehaviorSubject(-1) });
  const connnectedSubscription = connected.connect();

  const example = source.pipe(
    take(2),
    mergeMap((v) => of(v).pipe(withLatestFrom(connected))),
    repeat(3),
  );

  const result = await firstValueFrom(example.pipe(toArray()));

  expect(result).toEqual([
    [0, -1],
    [1, -1],
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ]);

  connnectedSubscription.unsubscribe();
});

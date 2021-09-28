import { delay, firstValueFrom, Observable, repeat, tap, toArray } from 'rxjs';

test('repeat', async () => {
  let count = 0;

  const source = new Observable((subscriber) => {
    Array.from({ length: 3 }).forEach(() => subscriber.next(count++));
    subscriber.complete();
  });

  const result: string[] = [];

  await firstValueFrom(
    source.pipe(
      tap((v) => result.push(`source ${v}`)),
      delay(2000),
      tap((v) => result.push(`after delay ${v}`)),
      repeat(2),
      toArray(),
    ),
  );

  expect(result).toEqual([
    'source 0',
    'source 1',
    'source 2',
    'after delay 0',
    'after delay 1',
    'after delay 2',
    'source 3',
    'source 4',
    'source 5',
    'after delay 3',
    'after delay 4',
    'after delay 5',
  ]);
});

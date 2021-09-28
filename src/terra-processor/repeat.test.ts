import { firstValueFrom, Observable, repeat, toArray } from 'rxjs';

test('repeat', async () => {
  let count = 0;

  const source = new Observable((subscriber) => {
    Array.from({ length: 3 }).forEach(() => subscriber.next(count++));
    subscriber.complete();
  });

  const result = await firstValueFrom(source.pipe(repeat(2), toArray()));

  expect(result).toEqual([0, 1, 2, 3, 4, 5]);
});

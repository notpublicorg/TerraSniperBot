import { catchError, delay, firstValueFrom, mergeMap, of, tap, toArray } from 'rxjs';

test('delay - handling one at a time', async () => {
  const log: string[] = [];

  const result = await firstValueFrom(
    of([1, 2, 3]).pipe(
      mergeMap((values) =>
        values
          .map((i) =>
            of(i).pipe(
              tap((v) => log.push(`start handling ${v}`)),
              mergeMap((v) =>
                of(v).pipe(
                  mergeMap((v) => (v === 1 ? Promise.reject() : Promise.resolve(v))),
                  delay(3000 - v * 1000),
                ),
              ),
              tap((v) => log.push(`end handling ${v}`)),
            ),
          )
          .reduceRight(($acc, $v) => ($acc ? $v.pipe(catchError(() => $acc)) : $v)),
      ),
      toArray(),
    ),
  );

  expect(log).toEqual(['start handling 1', 'start handling 2', 'end handling 2']);
  expect(result).toEqual([2]);
});

import { catchError, EMPTY, firstValueFrom, map, mergeMap, of, retry, toArray } from 'rxjs';

test('retry only inner observable', async () => {
  const notifyAboutError = jest.fn();

  await expect(
    firstValueFrom(
      of(1, 2, 3, 4).pipe(
        mergeMap((timesToThrowError: number) => {
          let count = 0;

          return of(timesToThrowError).pipe(
            map(() => {
              if (count < timesToThrowError) {
                count++;
                throw new Error();
              }

              return `${timesToThrowError}-${count}`;
            }),
            retry(2),
            catchError(() => {
              notifyAboutError();
              return EMPTY;
            }),
          );
        }),
        toArray(),
      ),
    ),
  ).resolves.toEqual(['1-1', '2-2']);

  expect(notifyAboutError).toHaveBeenCalledTimes(2);
});

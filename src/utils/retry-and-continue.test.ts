import { firstValueFrom, map, mergeMap, of, toArray } from 'rxjs';

import { retryAndContinue } from './retry-and-continue';

test('retry only inner observable / with delay', async () => {
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
            retryAndContinue({
              retryCount: 2,
              onError: notifyAboutError,
              // delay: 1000,
            }),
          );
        }),
        toArray(),
      ),
    ),
  ).resolves.toEqual(['1-1', '2-2']);

  expect(notifyAboutError).toHaveBeenCalledTimes(2);
});

import { catchError, firstValueFrom, map, mergeMap, of, toArray } from 'rxjs';

import { retryAndContinue } from './retry-and-continue';

test('retry only inner observable / with delay', async () => {
  const RETRY_ERROR = new Error('retry attempts exceeded');
  await expect(
    firstValueFrom(
      of(1, 2, 3, 4).pipe(
        mergeMap((timesToThrowError: number) => {
          let count = 0;

          return of(timesToThrowError).pipe(
            map(() => {
              if (count < timesToThrowError) {
                count++;
                throw RETRY_ERROR;
              }

              return `${timesToThrowError}-${count}`;
            }),
            retryAndContinue({
              retryCount: 2,
              // delay: 1000,
            }),
            catchError((error) => {
              return of(error);
            }),
          );
        }),
        toArray(),
      ),
    ),
  ).resolves.toEqual(['1-1', '2-2', RETRY_ERROR, RETRY_ERROR]);
});

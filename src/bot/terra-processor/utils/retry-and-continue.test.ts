import { catchError, firstValueFrom, map, mergeMap, of, toArray } from 'rxjs';

import { retryAction, retryAndContinue } from './retry-and-continue';

test('retry only inner observable / with delay', async () => {
  const RETRY_ERROR = new Error('retry error');
  const ATTEMPTS_EXCEEDED_ERROR = new Error('Retry attempts exceeded!');
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
  ).resolves.toEqual(['1-1', '2-2', ATTEMPTS_EXCEEDED_ERROR, ATTEMPTS_EXCEEDED_ERROR]);
});

test('retryable action', async () => {
  const ERROR = new Error('error');
  const createAction = () => {
    let count = 0;

    return async () => {
      if (count >= 1) return 'success';
      count++;
      throw ERROR;
    };
  };
  const errorLogger = jest.fn();

  const result = await retryAction(createAction(), { retryCount: 2, errorLogger });

  expect(result).toEqual('success');
  expect(errorLogger).toHaveBeenCalledWith(ERROR);
  expect(errorLogger).toHaveBeenCalledTimes(1);
});

import {
  catchError,
  concatWith,
  delay,
  EMPTY,
  MonoTypeOperatorFunction,
  pipe,
  retry,
  retryWhen,
  take,
  throwError,
} from 'rxjs';

export const retryAndContinue = <T>(options: {
  retryCount: number;
  onError: (e: Error) => void;
  delay?: number;
}): MonoTypeOperatorFunction<T> =>
  pipe(
    options.delay
      ? retryWhen((errors) =>
          errors.pipe(
            delay(options.delay || 0),
            take(options.retryCount),
            concatWith(throwError(() => new Error('Retry attempts exceeded!'))),
          ),
        )
      : retry(options.retryCount),
    catchError((error) => {
      options.onError(error);
      return EMPTY;
    }),
  );

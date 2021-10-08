import {
  concatWith,
  delay,
  MonoTypeOperatorFunction,
  pipe,
  retry,
  retryWhen,
  take,
  throwError,
} from 'rxjs';

export const retryAndContinue = <T>(options: {
  retryCount: number;
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
  );

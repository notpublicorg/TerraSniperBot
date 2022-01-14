import {
  concatWith,
  delay,
  firstValueFrom,
  mergeMap,
  MonoTypeOperatorFunction,
  of,
  pipe,
  retryWhen,
  take,
  tap,
  throwError,
} from 'rxjs';

export const retryAndContinue = <T>(options: {
  retryCount: number;
  delay?: number;
  errorLogger?: (e: unknown) => void;
}): MonoTypeOperatorFunction<T> =>
  pipe(
    retryWhen((errors) =>
      errors.pipe(
        tap((e) => options.errorLogger?.(e)),
        delay(options.delay || 0),
        take(options.retryCount),
        concatWith(throwError(() => new Error('Retry attempts exceeded!'))),
      ),
    ),
  );

export async function retryAction<Result>(
  fn: () => Promise<Result>,
  options: {
    retryCount: number;
    errorLogger?: (e: unknown) => void;
  },
): Promise<Result> {
  return firstValueFrom(
    of(1).pipe(
      mergeMap(fn),
      retryAndContinue({
        retryCount: options.retryCount,
        errorLogger: options.errorLogger,
      }),
    ),
  );
}

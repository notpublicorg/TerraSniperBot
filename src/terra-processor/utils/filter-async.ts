import { filter, from, map, mergeMap, MonoTypeOperatorFunction, pipe } from 'rxjs';

export const filterAsync = <T>(
  predicate: (value: T) => Promise<boolean>,
): MonoTypeOperatorFunction<T> =>
  pipe(
    mergeMap((data: T) => {
      return from(predicate(data)).pipe(map((isValid) => ({ filterResult: isValid, entry: data })));
    }),
    filter((data) => data.filterResult === true),
    map((data) => data.entry),
  );

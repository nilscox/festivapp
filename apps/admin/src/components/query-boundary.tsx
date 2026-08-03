import { get } from '@festivapp/utils';
import type { UseQueryResult } from '@tanstack/react-query';

import { Spinner } from './spinner.tsx';

type Queries = UseQueryResult | readonly UseQueryResult[];

type Data<T extends Queries> = T extends readonly unknown[]
  ? { -readonly [K in keyof T]: T[K] extends UseQueryResult<infer D> ? D : never }
  : T extends UseQueryResult<infer D>
    ? [D]
    : never;

export function QueryBoundary<const T extends Queries>({
  query,
  children,
}: {
  query: T;
  children: (...data: Data<T>) => React.ReactNode;
}) {
  const queries = (Array.isArray(query) ? query : [query]) as readonly UseQueryResult[];

  const error = queries.find((query) => query.isError)?.error;
  const fetching = queries.some((query) => query.isFetching);

  if (error && !fetching) {
    throw error;
  }

  if (queries.some((query) => query.data === undefined)) {
    return <Spinner className="mx-auto my-8 size-6" />;
  }

  return children(...(queries.map(get('data')) as Data<T>));
}

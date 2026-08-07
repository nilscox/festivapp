import {
  useNavigate,
  useSearch,
  type NavigateOptions,
  type RegisteredRouter,
  type RouteById,
  type RouteIds,
  type ValidateFromPath,
} from '@tanstack/react-router';
import { useCallback } from 'react';

type RouteFrom = Extract<RouteIds<RegisteredRouter['routeTree']>, ValidateFromPath<RegisteredRouter, never>>;

type SearchSchema<TFrom extends RouteFrom> = RouteById<
  RegisteredRouter['routeTree'],
  TFrom
>['types']['fullSearchSchema'];

export function useSearchParam<TFrom extends RouteFrom, TName extends keyof SearchSchema<TFrom>>({
  from,
  name,
}: {
  from: TFrom;
  name: TName;
}) {
  const search = useSearch({ from });
  const navigate = useNavigate({ from });

  const setParam = useCallback(
    (value: SearchSchema<TFrom>[TName] | undefined, options?: NavigateOptions) => {
      navigate({
        search: ((prev: SearchSchema<TFrom>) => ({ ...prev, [name]: value || undefined })) as never,
        replace: true,
        ...options,
      });
    },
    [navigate, name],
  );

  return [search[name], setParam] as const;
}

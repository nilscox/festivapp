import type { Location, LocationInput } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api.ts';

const basePath = (tenantId: string) => `/admin/tenants/${tenantId}/locations`;
const listKey = (tenantId: string) => ['locations', tenantId] as const;

export function useLocations(tenantId: string) {
  return useQuery({
    queryKey: listKey(tenantId),
    queryFn: () => api.get<Location[]>(basePath(tenantId)),
  });
}

export function useCreateLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LocationInput) => api.post<Location>(basePath(tenantId), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(tenantId) }),
  });
}

export function useUpdateLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LocationInput }) =>
      api.patch<Location>(`${basePath(tenantId)}/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(tenantId) }),
  });
}

export function useDeleteLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.del<void>(`${basePath(tenantId)}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey(tenantId) }),
  });
}

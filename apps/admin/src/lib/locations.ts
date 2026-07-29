import type { Location, LocationInput, LocationUpdate } from '@festivapp/contracts';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api.ts';

export function listLocationsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['locations', tenantId],
    queryFn: () => api.get<Location[]>(`/admin/tenants/${tenantId}/locations`),
  });
}

export function useLocations(tenantId: string) {
  return useQuery(listLocationsOptions(tenantId));
}

export function useCreateLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LocationInput) => api.post<Location>(`/admin/tenants/${tenantId}/locations`, input),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenantId)),
  });
}

export function useUpdateLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & LocationUpdate) =>
      api.patch<Location>(`${`/admin/tenants/${tenantId}/locations`}/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenantId)),
  });
}

export function useDeleteLocation(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`${`/admin/tenants/${tenantId}/locations`}/${id}`),
    onSuccess: () => queryClient.invalidateQueries(listLocationsOptions(tenantId)),
  });
}

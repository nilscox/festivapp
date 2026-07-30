import type { Location, LocationInput, LocationUpdate } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function listLocationsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['locations', tenantId],
    queryFn: () => api.get<Location[]>(`/admin/tenants/${tenantId}/locations`),
  });
}

export function createLocationOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (input: LocationInput) => api.post<Location>(`/admin/tenants/${tenantId}/locations`, input),
  });
}

export function updateLocationOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: ([id, input]: [id: string, input: LocationUpdate]) =>
      api.patch<Location>(`/admin/tenants/${tenantId}/locations/${id}`, input),
  });
}

export function deleteLocationOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenantId}/locations/${id}`),
  });
}

import type { Session, SessionInput } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function listSessionsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['sessions', tenantId],
    queryFn: () => api.get<Session[]>(`/admin/tenants/${tenantId}/sessions`),
  });
}

export function createSessionOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (input: SessionInput) => api.post<Session>(`/admin/tenants/${tenantId}/sessions`, input),
  });
}

export function updateSessionOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: ([id, input]: [id: string, input: SessionInput]) =>
      api.put<Session>(`/admin/tenants/${tenantId}/sessions/${id}`, input),
  });
}

export function deleteSessionOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenantId}/sessions/${id}`),
  });
}

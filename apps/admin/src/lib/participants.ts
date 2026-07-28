import type { Participant, ParticipantInput } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function listParticipantsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['participants', tenantId],
    queryFn: () => api.get<Participant[]>(`/admin/tenants/${tenantId}/participants`),
  });
}

export function createParticipantOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (input: ParticipantInput) => api.post<Participant>(`/admin/tenants/${tenantId}/participants`, input),
  });
}

export function updateParticipantOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: ({ id, ...input }: { id: string } & ParticipantInput) =>
      api.patch<Participant>(`/admin/tenants/${tenantId}/participants/${id}`, input),
  });
}

export function deleteParticipantOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenantId}/participants/${id}`),
  });
}

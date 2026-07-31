import type { Message, MessageInput, MessageUpdate } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function listMessagesOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['messages', tenantId],
    queryFn: () => api.get<Message[]>(`/admin/tenants/${tenantId}/messages`),
  });
}

export function createMessageOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (input: MessageInput) => api.post<Message>(`/admin/tenants/${tenantId}/messages`, input),
  });
}

export function updateMessageOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: ([id, input]: [id: string, input: MessageUpdate]) =>
      api.patch<Message>(`/admin/tenants/${tenantId}/messages/${id}`, input),
  });
}

export function deleteMessageOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenantId}/messages/${id}`),
  });
}

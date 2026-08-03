import type {
  Location,
  MeResponse,
  Message,
  Participant,
  Session,
  Tenant,
  TenantTheme,
  UploadedFile,
} from '@festivapp/contracts';
import { queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function getMeOptions() {
  return queryOptions({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/admin/auth/me'),
  });
}

export function getTenantOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['tenant', tenantId],
    queryFn: () => api.get<Tenant>(`/admin/tenants/${tenantId}`),
  });
}

export function getThemeOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['theme', tenantId],
    queryFn: () => api.get<TenantTheme>(`/admin/tenants/${tenantId}/theme`),
  });
}

export function listLocationsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['locations', tenantId],
    queryFn: () => api.get<Location[]>(`/admin/tenants/${tenantId}/locations`),
  });
}

export function listParticipantsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['participants', tenantId],
    queryFn: () => api.get<Participant[]>(`/admin/tenants/${tenantId}/participants`),
  });
}

export function listSessionsOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['sessions', tenantId],
    queryFn: () => api.get<Session[]>(`/admin/tenants/${tenantId}/sessions`),
  });
}

export function listMessagesOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['messages', tenantId],
    queryFn: () => api.get<Message[]>(`/admin/tenants/${tenantId}/messages`),
  });
}

export function listFilesOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['files', tenantId],
    queryFn: () => api.get<UploadedFile[]>(`/admin/tenants/${tenantId}/files`),
  });
}

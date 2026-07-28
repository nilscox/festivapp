import type { TenantTheme } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function getThemeOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['theme', tenantId],
    queryFn: () => api.get<TenantTheme>(`/admin/tenants/${tenantId}/theme`),
  });
}

export function updateThemeOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (theme: TenantTheme) => api.put<TenantTheme>(`/admin/tenants/${tenantId}/theme`, theme),
  });
}

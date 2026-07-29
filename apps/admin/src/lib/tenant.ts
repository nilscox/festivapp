import type { Tenant, TenantInput } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function getTenantOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['tenant', tenantId],
    queryFn: () => api.get<Tenant>(`/admin/tenants/${tenantId}`),
  });
}

export function updateTenantOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (input: TenantInput) => api.put<Tenant>(`/admin/tenants/${tenantId}`, input),
  });
}

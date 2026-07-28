import type { UploadedFile } from '@festivapp/contracts';
import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { api } from './api.ts';

export function listFilesOptions(tenantId: string) {
  return queryOptions({
    queryKey: ['files', tenantId],
    queryFn: () => api.get<UploadedFile[]>(`/admin/tenants/${tenantId}/files`),
  });
}

export function uploadFilesOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (files: File[]) => {
      const upload = (file: File) => {
        const search = new URLSearchParams({ name: file.name });
        const url = `/admin/tenants/${tenantId}/files?${search}`;

        return api.post<UploadedFile>(url, file);
      };

      return Promise.allSettled(files.map(upload));
    },
  });
}

export function deleteFileOptions(tenantId: string) {
  return mutationOptions({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenantId}/files/${id}`),
  });
}

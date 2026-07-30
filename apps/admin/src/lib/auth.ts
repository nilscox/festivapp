import type { LoginRequest, MeResponse } from '@festivapp/contracts';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { api } from './api.ts';

export function getMeOptions() {
  return queryOptions({
    queryKey: ['me'],
    queryFn: () => {
      return api.get<MeResponse>('/admin/auth/me');
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: LoginRequest) => api.post<MeResponse>('/admin/auth/login', body),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      void router.invalidate();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<void>('/admin/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

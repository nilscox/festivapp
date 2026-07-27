import type { LoginRequest, MeResponse } from '@festivapp/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from './api.ts';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/admin/auth/me'),
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginRequest) => api.post<MeResponse>('/admin/auth/login', body),
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
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

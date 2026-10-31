import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';
import type { Me } from './types';

/** The signed-in account, or null without a session. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api<{ user: Me }>('/api/auth/me')).user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchInterval: (query) => (query.state.status === 'error' ? 10_000 : false), // a server coming back fires no event
  });
}

/**
 * Forgets the account and everything cached for it. "me" is set to null in
 * place, so the mounted gate re-renders to the sign-in page.
 */
export function signOutLocally(qc: QueryClient) {
  qc.setQueryData(['me'], null);
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: { email: string; password: string }) =>
      api<{ user: Me }>('/api/auth/login', { method: 'POST', body: JSON.stringify(c) }),
    onSuccess: ({ user }) => {
      signOutLocally(qc);
      qc.setQueryData(['me'], user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/logout', { method: 'POST' }),
    onSettled: () => signOutLocally(qc),
  });
}

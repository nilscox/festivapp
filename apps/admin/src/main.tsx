import { defined } from '@festivapp/utils';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { toast, Toaster } from 'react-hot-toast';

import { RouteError } from './components/route-error.tsx';
import { ApiError } from './lib/api.ts';
import { getMeOptions } from './lib/auth.ts';
import { routeTree } from './routes/route-tree.tsx';
import './styles.css';

function retry(failureCount: number, err: unknown) {
  if (ApiError.is(err) && Math.floor(err.status / 100) === 4) {
    return false;
  }

  return failureCount < 3;
}

function logoutOn401(error: Error) {
  const me = queryClient.getQueryData(getMeOptions().queryKey);

  if (ApiError.is(error, 401) && me) {
    queryClient.clear();
    void router.invalidate();
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: logoutOn401,
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _result, { options }) => {
      logoutOn401(error);

      if (!ApiError.is(error, 400) && !options.onError) {
        toast.error(error.message);
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry,
    },
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultErrorComponent: RouteError,
  context: { queryClient },
});

const root = defined(document.getElementById('root'));

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

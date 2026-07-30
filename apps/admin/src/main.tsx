import { defined } from '@festivapp/utils';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { toast, Toaster } from 'react-hot-toast';

import { ApiError } from './lib/api.ts';
import { routeTree } from './routes/index.tsx';
import './styles.css';

function retry(failureCount: number, err: unknown) {
  if (ApiError.is(err) && Math.floor(err.status / 100) === 4) {
    return false;
  }

  return failureCount < 3;
}

function showInternalError(err: unknown) {
  if (ApiError.is(err) && Math.floor(err.status / 100) === 5) {
    console.error(err);
    toast.error(err.message);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry,
    },
    mutations: {
      onError: showInternalError,
    },
  },
  queryCache: new QueryCache({
    onError: showInternalError,
  }),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
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

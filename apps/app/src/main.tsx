import { defined } from '@festivapp/utils';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { del, get, set } from 'idb-keyval';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import { AnalyticsProvider, initAnalytics } from './components/analytics.tsx';
import { routeTree } from './routes/route-tree.ts';
import './styles.css';

registerSW({ immediate: true });
initAnalytics();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const router = createRouter({
  routeTree,
  InnerWrap: ({ children }) => <AnalyticsProvider>{children}</AnalyticsProvider>,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: import.meta.env.PROD ? 60_000 : 0,
      gcTime: Number.POSITIVE_INFINITY,
      retry: 1,
    },
  },
});

const persister = createAsyncStoragePersister({
  key: 'festivapp:query',
  storage: {
    getItem: async (key) => (await get<string>(key)) ?? null,
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
});

const container = defined(document.getElementById('root'));

createRoot(container).render(
  <StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  </StrictMode>,
);

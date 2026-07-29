import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { del, get, set } from 'idb-keyval';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';

import { InfoPage } from './routes/info.tsx';
import { MapPage } from './routes/map.tsx';
import { Now } from './routes/now.tsx';
import { RootLayout } from './routes/root.tsx';
import { SessionDetail } from './routes/session.tsx';
import { Timetable } from './routes/timetable.tsx';
import './styles.css';

registerSW({ immediate: true });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootRoute = createRootRoute({ component: RootLayout });

const routeTree = rootRoute.addChildren([
  createRoute({ getParentRoute: () => rootRoute, path: '/', component: Now }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/timetable',
    component: Timetable,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/session/$sessionId',
    component: SessionDetail,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/map',
    component: MapPage,
    validateSearch: (search: Record<string, unknown>) => ({
      location: typeof search.location === 'string' ? search.location : undefined,
    }),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/info',
    component: InfoPage,
  }),
]);

const router = createRouter({ routeTree });

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

const container = document.getElementById('root')!;

function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

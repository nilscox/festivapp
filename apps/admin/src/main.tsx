import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, createRoute, createRouter, redirect, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { FestivalRoot } from './routes/festival-root.tsx';
import { IndexRedirect } from './routes/index-redirect.tsx';
import { Locations } from './routes/locations.tsx';
import { Login } from './routes/login.tsx';
import './styles.css';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootRoute = createRootRoute();

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: IndexRedirect });

const festivalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/festivals/$tenantId',
  component: FestivalRoot,
});

const festivalIndexRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/festivals/$tenantId/locations', params, replace: true });
  },
});

const locationsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'locations',
  component: Locations,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  festivalRoute.addChildren([festivalIndexRoute, locationsRoute]),
]);

const router = createRouter({ routeTree });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

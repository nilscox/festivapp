import { createRootRoute, createRoute } from '@tanstack/react-router';

import { InfoPage } from './info/info.tsx';
import { RootLayout } from './layout.tsx';
import { MapPage } from './map/map.tsx';
import { Now } from './now/now.tsx';
import { SessionDetail } from './session/session.tsx';
import { Timetable } from './timetable/timetable.tsx';

const rootRoute = createRootRoute({
  component: RootLayout,
  validateSearch: (search): { date?: string } => ({
    date: typeof search.date === 'string' ? search.date : undefined,
  }),
});

export const routeTree = rootRoute.addChildren([
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
    validateSearch: (search): { location?: string } => ({
      location: typeof search.location === 'string' ? search.location : undefined,
    }),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/info',
    component: InfoPage,
  }),
]);

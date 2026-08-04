import { assert, has } from '@festivapp/utils';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, createRoute, lazyRouteComponent, redirect } from '@tanstack/react-router';
import * as z from 'zod/mini';

import { RouteError } from '../components/route-error.tsx';
import { Spinner } from '../components/spinner.tsx';
import { ApiError } from '../lib/api.ts';
import {
  getMeOptions,
  getTenantOptions,
  getThemeOptions,
  listFilesOptions,
  listLocationsOptions,
  listMessagesOptions,
  listParticipantsOptions,
  listSessionsOptions,
} from '../lib/queries.ts';

const Files = lazyRouteComponent(() => import('./files.tsx'), 'Files');
const Layout = lazyRouteComponent(() => import('./layout.tsx'), 'Layout');
const FestivalMap = lazyRouteComponent(() => import('./map.tsx'), 'FestivalMap');
const Locations = lazyRouteComponent(() => import('./locations.tsx'), 'Locations');
const Messages = lazyRouteComponent(() => import('./messages.tsx'), 'Messages');
const Login = lazyRouteComponent(() => import('./login.tsx'), 'Login');
const People = lazyRouteComponent(() => import('./people.tsx'), 'People');
const Schedule = lazyRouteComponent(() => import('./schedule/schedule.tsx'), 'Schedule');
const Settings = lazyRouteComponent(() => import('./settings.tsx'), 'Settings');
const Theme = lazyRouteComponent(() => import('./theme.tsx'), 'Theme');

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  pendingMs: 200,
  pendingComponent: PendingComponent,
  errorComponent: RouteError,
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(getMeOptions()).catch((err) => {
      if (ApiError.is(err, 401)) {
        return null;
      } else {
        throw err;
      }
    });

    return {
      me,
    };
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
  beforeLoad: ({ context: { me } }) => {
    if (me) {
      throw redirect({ to: '/', replace: true });
    }
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null,
  beforeLoad: ({ context: { me } }) => {
    if (!me) {
      throw redirect({ to: '/login', replace: true });
    }

    const firstTenant = me.tenants[0];

    assert(firstTenant, new Error('No tenant'));

    throw redirect({
      to: '/festivals/$tenantId',
      params: { tenantId: firstTenant.id },
      replace: true,
    });
  },
});

const festivalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/festivals/$tenantId',
  component: Layout,
  beforeLoad: ({ params, context: { me } }) => {
    if (!me) {
      throw redirect({ to: '/login', replace: true });
    }

    const tenant = me.tenants.find(has('id', params.tenantId));

    if (!tenant) {
      throw redirect({ to: '/' });
    }

    return {
      me,
      tenant,
    };
  },
});

const festivalIndexRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/festivals/$tenantId/people', params, replace: true });
  },
});

const peopleRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'people',
  validateSearch: z.object({
    search: z.optional(z.string()),
    create: z.optional(z.literal(true)),
    edit: z.optional(z.string()),
  }),
  component: People,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(listParticipantsOptions(tenant.id));
    void queryClient.prefetchQuery(listFilesOptions(tenant.id));
    void queryClient.prefetchQuery(getThemeOptions(tenant.id));
  },
});

const scheduleRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'schedule',
  validateSearch: z.object({
    search: z.optional(z.string()),
    create: z.optional(z.literal(true)),
    edit: z.optional(z.string()),
  }),
  component: Schedule,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(getTenantOptions(tenant.id));
    void queryClient.prefetchQuery(listSessionsOptions(tenant.id));
    void queryClient.prefetchQuery(listLocationsOptions(tenant.id));
    void queryClient.prefetchQuery(listParticipantsOptions(tenant.id));
  },
});

const locationsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'locations',
  validateSearch: z.object({ create: z.optional(z.literal(true)), edit: z.optional(z.string()) }),
  component: Locations,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(listLocationsOptions(tenant.id));
  },
});

const mapRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'map',
  component: FestivalMap,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(getTenantOptions(tenant.id));
    void queryClient.prefetchQuery(listLocationsOptions(tenant.id));
    void queryClient.prefetchQuery(listFilesOptions(tenant.id));
    void queryClient.prefetchQuery(getThemeOptions(tenant.id));
  },
});

const messagesRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'messages',
  validateSearch: z.object({ create: z.optional(z.literal(true)), edit: z.optional(z.string()) }),
  component: Messages,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(getTenantOptions(tenant.id));
    void queryClient.prefetchQuery(listMessagesOptions(tenant.id));
  },
});

const filesRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'files',
  validateSearch: z.object({ search: z.optional(z.string()) }),
  component: Files,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(listFilesOptions(tenant.id));
    void queryClient.prefetchQuery(getThemeOptions(tenant.id));
  },
});

const themeRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'theme',
  component: Theme,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(getThemeOptions(tenant.id));
    void queryClient.prefetchQuery(listFilesOptions(tenant.id));
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'settings',
  component: Settings,
  loader: ({ context: { queryClient, tenant } }) => {
    void queryClient.prefetchQuery(getTenantOptions(tenant.id));
  },
});

export const routeTree = rootRoute.addChildren([
  loginRoute,
  indexRoute,
  festivalRoute.addChildren([
    festivalIndexRoute,
    peopleRoute,
    scheduleRoute,
    locationsRoute,
    mapRoute,
    messagesRoute,
    filesRoute,
    themeRoute,
    settingsRoute,
  ]),
]);

function PendingComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Spinner className="size-6" />
    </div>
  );
}

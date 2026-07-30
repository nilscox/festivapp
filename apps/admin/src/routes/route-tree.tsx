import { assert, has } from '@festivapp/utils';
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  type ErrorComponentProps,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router';
import * as z from 'zod/mini';

import { Spinner } from '../components/spinner.tsx';
import { ApiError } from '../lib/api.ts';
import { getMeOptions } from '../lib/auth.ts';
import { listFilesOptions } from '../lib/files.ts';
import { listLocationsOptions } from '../lib/locations.ts';
import { listParticipantsOptions } from '../lib/participants.ts';
import { getTenantOptions } from '../lib/tenant.ts';
import { getThemeOptions } from '../lib/theme.ts';

const Files = lazyRouteComponent(() => import('./files.tsx'), 'Files');
const Layout = lazyRouteComponent(() => import('./layout.tsx'), 'Layout');
const FestivalMap = lazyRouteComponent(() => import('./map.tsx'), 'FestivalMap');
const Locations = lazyRouteComponent(() => import('./locations.tsx'), 'Locations');
const Login = lazyRouteComponent(() => import('./login.tsx'), 'Login');
const People = lazyRouteComponent(() => import('./people.tsx'), 'People');
const Settings = lazyRouteComponent(() => import('./settings.tsx'), 'Settings');
const Theme = lazyRouteComponent(() => import('./theme.tsx'), 'Theme');

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  pendingMs: 200,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
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
    assert(tenant, new Error(`Can't find tenant "${params.tenantId}"`));

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
  loader: async ({ context: { queryClient, tenant } }) => {
    await Promise.all([
      queryClient.ensureQueryData(listParticipantsOptions(tenant.id)),
      queryClient.ensureQueryData(listFilesOptions(tenant.id)),
      queryClient.ensureQueryData(getThemeOptions(tenant.id)),
    ]);
  },
});

const scheduleRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'schedule',
  component: () => null,
});

const locationsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'locations',
  validateSearch: z.object({ create: z.optional(z.literal(true)), edit: z.optional(z.string()) }),
  component: Locations,
  loader: async ({ context: { queryClient, tenant } }) => {
    await queryClient.ensureQueryData(listLocationsOptions(tenant.id));
  },
});

const mapRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'map',
  component: FestivalMap,
  loader: async ({ context: { queryClient, tenant } }) => {
    await Promise.all([
      queryClient.ensureQueryData(getTenantOptions(tenant.id)),
      queryClient.ensureQueryData(listLocationsOptions(tenant.id)),
      queryClient.ensureQueryData(listFilesOptions(tenant.id)),
      queryClient.ensureQueryData(getThemeOptions(tenant.id)),
    ]);
  },
});

const filesRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'files',
  validateSearch: z.object({ search: z.optional(z.string()) }),
  component: Files,
  loader: async ({ context: { queryClient, tenant } }) => {
    await Promise.all([
      queryClient.ensureQueryData(listFilesOptions(tenant.id)),
      queryClient.ensureQueryData(getThemeOptions(tenant.id)),
    ]);
  },
});

const themeRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'theme',
  component: Theme,
  loader: async ({ context: { queryClient, tenant } }) => {
    await Promise.all([
      queryClient.ensureQueryData(getThemeOptions(tenant.id)),
      queryClient.ensureQueryData(listFilesOptions(tenant.id)),
    ]);
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'settings',
  component: Settings,
  loader: async ({ context: { queryClient, tenant } }) => {
    await queryClient.ensureQueryData(getTenantOptions(tenant.id));
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

function ErrorComponent({ error, info }: ErrorComponentProps) {
  return (
    <div className="p-4">
      <div className="text-danger-ink text-lg font-medium">{error.message}</div>
      <details>
        <summary className="text-muted w-fit cursor-pointer rounded-md">Details</summary>
        <pre className="bg-faint/10 rounded-md p-2 font-mono text-xs">{error.stack}</pre>
        {info && <pre className="bg-faint/10 rounded-md p-2 font-mono text-xs">{info.componentStack}</pre>}
      </details>
    </div>
  );
}

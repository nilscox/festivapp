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
import { listLocationsOptions } from '../lib/locations.ts';
import { assert } from '../utils.ts';

const Layout = lazyRouteComponent(() => import('./layout.tsx'), 'Layout');
const Locations = lazyRouteComponent(() => import('./locations.tsx'), 'Locations');
const Login = lazyRouteComponent(() => import('./login.tsx'), 'Login');

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
      to: '/festivals/$tenantId/locations',
      params: { tenantId: firstTenant.id },
      replace: true,
    });
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

const festivalRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/festivals/$tenantId',
  component: Layout,
  beforeLoad: ({ params, context: { me } }) => {
    assert(me);

    const tenant = me.tenants.find((tenant) => tenant.id === params.tenantId);
    assert(tenant, new Error(`Can't find tenant "${params.tenantId}"`));

    return {
      me: me,
      tenant,
    };
  },
});

const festivalIndexRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: '/',
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/festivals/$tenantId/locations', params, replace: true });
  },
});

const peopleRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'people',
  component: () => null,
});

const scheduleRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'schedule',
  component: () => null,
});

const locationsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'locations',
  validateSearch: z.object({ create: z.optional(z.literal(true)), edit: z.optional(z.uuid()) }),
  component: Locations,
  loader: async ({ context: { queryClient, tenant } }) => {
    await queryClient.ensureQueryData(listLocationsOptions(tenant.id));
  },
});

const mapRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'map',
  component: () => null,
});

const themeRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'theme',
  component: () => null,
});

const settingsRoute = createRoute({
  getParentRoute: () => festivalRoute,
  path: 'settings',
  component: () => null,
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

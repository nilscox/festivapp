import { Select } from '@base-ui/react/select';
import type { Organizer, TenantSummary } from '@festivapp/contracts';
import { Link, Outlet, useNavigate, useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { CalendarDays, ChevronDown, LogOut, Map, MapPin, Palette, Settings, Users } from 'lucide-react';

import { Button } from '../components/button.tsx';
import { Eyebrow } from '../components/eyebrow.tsx';
import { useLogout } from '../lib/auth.ts';

const navigation: Array<{
  label: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  href: '/people' | '/schedule' | '/locations' | '/map' | '/theme' | '/settings';
}> = [
  { label: 'People', icon: Users, href: '/people' },
  { label: 'Schedule', icon: CalendarDays, href: '/schedule' },
  { label: 'Locations', icon: MapPin, href: '/locations' },
  { label: 'Map', icon: Map, href: '/map' },
  { label: 'Theme', icon: Palette, href: '/theme' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Layout() {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="bg-surface col flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function Sidebar() {
  const { me, tenant } = useRouteContext({ from: '/festivals/$tenantId' });
  const { organizer, tenants } = me;

  return (
    <aside className="bg-subtle col w-64 gap-4 overflow-hidden border-r py-4">
      <section className="px-3">
        <Eyebrow>Festival</Eyebrow>
        <FestivalSwitcher tenants={tenants} active={tenant} />
      </section>

      <section className="flex-1 overflow-y-auto px-3">
        <Eyebrow>Manage</Eyebrow>
        <Navigation tenantId={tenant.id} />
      </section>

      <section className="border-t px-3">
        <Organizer organizer={organizer} />
      </section>
    </aside>
  );
}

function FestivalSwitcher({ tenants, active }: { tenants: TenantSummary[]; active: TenantSummary }) {
  const navigate = useNavigate();

  return (
    <Select.Root
      value={active.id}
      onValueChange={(id) => {
        if (id !== null) {
          void navigate({ to: '/festivals/$tenantId', params: { tenantId: id } });
        }
      }}
    >
      <Select.Trigger className="bg-surface hover:border-line-strong row w-full cursor-pointer items-center gap-2.5 rounded-lg border p-2 text-start">
        <FestivalItem festival={active} />
        <Select.Icon className="text-faint shrink-0 data-popup-open:-scale-y-100">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false}>
          <Select.Popup className="base-ui-fade bg-surface max-h-80 w-(--anchor-width) scrollbar-thin overflow-y-auto rounded-lg border p-1 shadow-xl">
            {tenants.map((tenant) => (
              <Select.Item
                key={tenant.id}
                value={tenant.id}
                className="data-highlighted:bg-subtle row cursor-pointer items-center gap-2 rounded-md p-2 outline-none"
              >
                <FestivalItem festival={tenant} />
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function FestivalItem({ festival }: { festival: TenantSummary }) {
  return (
    <>
      <FestivalMark name={festival.name} />

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 truncate text-sm font-semibold tracking-tight">{festival.name}</div>
        <div className="text-faint text-xxs truncate font-mono">{festival.domain}</div>
      </div>
    </>
  );
}

function FestivalMark({ name }: { name: string }) {
  return (
    <span className="bg-accent/10 text-accent flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Navigation({ tenantId }: { tenantId: string }) {
  return (
    <nav>
      {navigation.map((item) => (
        <Link
          key={item.label}
          to={`/festivals/$tenantId${item.href}`}
          params={{ tenantId }}
          activeOptions={{ includeSearch: false }}
          activeProps={{ 'aria-current': 'page', className: clsx('bg-accent/10 text-accent') }}
          inactiveProps={{ className: clsx('text-faint hover:bg-faint/5') }}
          className="my-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-75"
        >
          <item.icon className="size-5" />
          <span className="flex-1">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Organizer({ organizer }: { organizer: Organizer }) {
  return (
    <>
      <div className="row items-center gap-2.5 py-3">
        <div className="bg-accent/10 text-accent flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {initials(organizer)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 truncate text-sm font-semibold">{organizer.name ?? organizer.email}</div>
          <div className="text-faint text-xxs truncate font-mono">{organizer.email}</div>
        </div>
      </div>

      <LogoutButton />
    </>
  );
}

function LogoutButton() {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <Button
      variant="secondary"
      onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/login' }) })}
      className="w-full"
    >
      <LogOut className="size-4" />
      Log out
    </Button>
  );
}

function initials(organizer: Organizer): string {
  const source = organizer.name ?? organizer.email;

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

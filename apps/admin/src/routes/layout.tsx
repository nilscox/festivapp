import { Dialog } from '@base-ui/react/dialog';
import { Select } from '@base-ui/react/select';
import type { Organizer, TenantSummary } from '@festivapp/contracts';
import { Link, Outlet, useNavigate, useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { CalendarDays, ChevronDown, Image, LogOut, Map, MapPin, Palette, Settings, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../components/button.tsx';
import { ConfirmDialogProvider } from '../components/confirm-dialog.tsx';
import { Eyebrow } from '../components/eyebrow.tsx';
import { OpenDrawerProvider } from '../components/page.tsx';
import { useMediaQuery } from '../hooks/use-media-query.ts';
import { useLogout } from '../lib/auth.ts';

const navigation: Array<{
  label: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  href: '/people' | '/schedule' | '/locations' | '/map' | '/theme' | '/files' | '/settings';
}> = [
  { label: 'People', icon: Users, href: '/people' },
  { label: 'Schedule', icon: CalendarDays, href: '/schedule' },
  { label: 'Locations', icon: MapPin, href: '/locations' },
  { label: 'Map', icon: Map, href: '/map' },
  { label: 'Theme', icon: Palette, href: '/theme' },
  { label: 'Files', icon: Image, href: '/files' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <OpenDrawerProvider open={() => setDrawerOpen(true)}>
      <ConfirmDialogProvider>
        <div className="h-dvh md:pl-64">
          <Sidebar open={drawerOpen} onOpenChange={setDrawerOpen} />

          <main className="bg-surface col h-full overflow-hidden">
            <Outlet />
          </main>
        </div>
      </ConfirmDialogProvider>
    </OpenDrawerProvider>
  );
}

function Sidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const isDesktop = useMediaQuery('(width >= 48rem)');
  const { me, tenant } = useRouteContext({ from: '/festivals/$tenantId' });
  const { organizer, tenants } = me;

  const close = () => onOpenChange(false);

  return (
    <Dialog.Root
      open={isDesktop || open}
      onOpenChange={onOpenChange}
      modal={!isDesktop}
      disablePointerDismissal={isDesktop}
    >
      <Dialog.Portal>
        {!isDesktop && <Dialog.Backdrop className="base-ui-fade bg-ink/40 fixed inset-0" />}

        <Dialog.Popup
          aria-label="Navigation"
          render={<aside />}
          initialFocus={!isDesktop}
          finalFocus={!isDesktop}
          className={clsx(
            'bg-subtle col fixed inset-y-0 left-0 w-72 gap-4 overflow-hidden border-r py-4 md:w-64',
            !isDesktop &&
              'base-ui-fade shadow-2xl transition-all duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full',
          )}
        >
          <section className="px-3">
            <Eyebrow>Festival</Eyebrow>
            <FestivalSwitcher tenants={tenants} active={tenant} onNavigate={close} />
          </section>

          <section className="flex-1 overflow-y-auto px-3">
            <Eyebrow>Manage</Eyebrow>
            <Navigation tenantId={tenant.id} onNavigate={close} />
          </section>

          <section className="border-t px-3">
            <OrganizerInfo organizer={organizer} />
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FestivalSwitcher({
  tenants,
  active,
  onNavigate,
}: {
  tenants: TenantSummary[];
  active: TenantSummary;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Select.Root
      value={active.id}
      onValueChange={(id) => {
        if (id !== null) {
          void navigate({ to: '/festivals/$tenantId', params: { tenantId: id } });
          onNavigate();
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

function Navigation({ tenantId, onNavigate }: { tenantId: string; onNavigate: () => void }) {
  return (
    <nav>
      {navigation.map((item) => (
        <Link
          key={item.label}
          to={`/festivals/$tenantId${item.href}`}
          params={{ tenantId }}
          onClick={onNavigate}
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

function OrganizerInfo({ organizer }: { organizer: Organizer }) {
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
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

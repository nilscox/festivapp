import { Select } from '@base-ui-components/react/select';
import type { Organizer, TenantSummary } from '@festivapp/contracts';
import { Outlet, useNavigate, useParams } from '@tanstack/react-router';
import { CalendarDays, ChevronsUpDown, LogOut, Map, MapPin, Settings, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect } from 'react';

import { Eyebrow } from '../components/eyebrow.tsx';
import { FullPage, Spinner } from '../components/full-page.tsx';
import { useLogout, useMe } from '../lib/auth.ts';

const COMING_SOON: { label: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Artists', icon: Users },
  { label: 'Schedule', icon: CalendarDays },
  { label: 'Map', icon: Map },
  { label: 'Settings', icon: Settings },
];

export function FestivalRoot() {
  const me = useMe();
  const navigate = useNavigate();
  const { tenantId } = useParams({ strict: false });

  const active = me.data?.tenants.find((tenant) => tenant.id === tenantId);
  const missing = me.isSuccess && !active;

  useEffect(() => {
    if (me.isError) {
      void navigate({ to: '/login', replace: true });
    } else if (missing) {
      void navigate({ to: '/', replace: true });
    }
  }, [me.isError, missing, navigate]);

  if (!me.data || !active) {
    return (
      <FullPage>
        <Spinner />
      </FullPage>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="border-line bg-subtle flex w-62 flex-col border-r">
        <div className="border-line border-b p-3.5">
          <div className="px-1 pb-2">
            <Eyebrow>Festival</Eyebrow>
          </div>
          <FestivalSwitcher tenants={me.data.tenants} active={active} />
        </div>

        <nav aria-label="Sections" className="flex-1 overflow-y-auto p-3">
          <div className="px-2.5 pt-1 pb-2.5">
            <Eyebrow>Manage</Eyebrow>
          </div>
          <span
            aria-current="page"
            className="bg-accent-soft text-accent mb-1 flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-semibold"
          >
            <MapPin className="size-4.5" />
            Locations
          </span>
          {COMING_SOON.map((item) => (
            <button
              key={item.label}
              disabled
              className="text-faint mb-1 flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-medium"
            >
              <item.icon className="size-4.5" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="border-line text-xxs text-faint-strong rounded border px-1.5 py-0.5 font-mono tracking-widest">
                SOON
              </span>
            </button>
          ))}
        </nav>

        <div className="border-line border-t p-3">
          <div className="flex items-center gap-2.5 px-1.5 pt-1.5 pb-3">
            <div className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold">
              {initials(me.data.organizer)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">
                {me.data.organizer.name ?? me.data.organizer.email}
              </div>
              <div className="text-faint truncate font-mono text-[11px]">{me.data.organizer.email}</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="bg-surface flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}

function FestivalSwitcher({ tenants, active }: { tenants: TenantSummary[]; active: TenantSummary }) {
  const navigate = useNavigate();

  return (
    <Select.Root
      value={active.id}
      onValueChange={(id) => {
        if (id !== null) {
          void navigate({ to: '/festivals/$tenantId/locations', params: { tenantId: id } });
        }
      }}
    >
      <Select.Trigger className="border-line bg-surface hover:border-line-strong flex w-full cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-left outline-none">
        <FestivalMark name={active.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-tight">{active.name}</span>
          <span className="text-faint block truncate font-mono text-[11px]">{active.domain}</span>
        </span>
        <Select.Icon className="text-faint shrink-0">
          <ChevronsUpDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50">
          <Select.Popup className="border-line bg-surface max-h-80 w-(--anchor-width) overflow-y-auto rounded-xl border p-1 shadow-xl">
            {tenants.map((tenant) => (
              <Select.Item
                key={tenant.id}
                value={tenant.id}
                className="data-[highlighted]:bg-well flex cursor-pointer items-center gap-2.5 rounded-lg p-2 outline-none"
              >
                <FestivalMark name={tenant.name} />
                <span className="min-w-0 flex-1">
                  <Select.ItemText className="block truncate text-sm font-semibold">{tenant.name}</Select.ItemText>
                  <span className="text-faint block truncate font-mono text-[11px]">{tenant.domain}</span>
                </span>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function FestivalMark({ name }: { name: string }) {
  return (
    <span className="bg-accent-soft text-accent flex size-9 shrink-0 items-center justify-center rounded-[9px] text-[13px] font-bold">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function LogoutButton() {
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <button
      onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/login' }) })}
      className="border-line bg-surface text-muted-strong hover:border-line-strong flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border py-2.5 text-[13px] font-semibold"
    >
      <LogOut className="size-4" />
      Log out
    </button>
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

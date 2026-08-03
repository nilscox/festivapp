import type { Location, Participant, Session, SessionType, Tenant, TenantSummary } from '@festivapp/contracts';
import { get } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouteContext } from '@tanstack/react-router';
import clsx from 'clsx';
import { CalendarDays, MapPin, Trash2, TriangleAlert } from 'lucide-react';

import { IconButton, LinkButton } from '../components/button.tsx';
import { Chip } from '../components/chip.tsx';
import { useConfirmDialog } from '../components/confirm-dialog.tsx';
import { EmptyState } from '../components/empty-state.tsx';
import { Page, PageHeader } from '../components/page.tsx';
import { QueryBoundary } from '../components/query-boundary.tsx';
import { NoMatch, SearchInput, SearchSummary } from '../components/search.tsx';
import { Table, TableHeader, TableHeaderCell } from '../components/table.tsx';
import { useSearchParam } from '../hooks/use-search-param.ts';
import { api } from '../lib/api.ts';
import { formatTime } from '../lib/datetime.ts';
import {
  getTenantOptions,
  listLocationsOptions,
  listParticipantsOptions,
  listSessionsOptions,
} from '../lib/queries.ts';
import { getScheduleSessions, groupByDay, type ScheduleSession } from '../lib/schedule.ts';

const from = '/festivals/$tenantId/schedule';

// prettier-ignore
const sessionTypes: Record<SessionType, { label: string; badge: string; dot: string }> = {
  live:     { label: 'LIVE',      badge:  'text-[#36b30c] bg-[#36b30c]/10', dot: 'bg-[#36b30c]' },
  dj_set:   { label: 'DJ SET',    badge:  'text-[#2563eb] bg-[#2563eb]/10', dot: 'bg-[#2563eb]' },
  talk:     { label: 'TALK',      badge:  'text-[#b208af] bg-[#b208af]/10', dot: 'bg-[#b208af]' },
  workshop: { label: 'WORKSHOP',  badge:  'text-[#d97706] bg-[#d97706]/10', dot: 'bg-[#d97706]' },
  other:    { label: 'OTHER',     badge:  'text-[#424242] bg-[#424242]/10', dot: 'bg-[#424242]' },
};

export function Schedule() {
  const { tenant } = useRouteContext({ from });

  const tenantQuery = useQuery(getTenantOptions(tenant.id));
  const sessionsQuery = useQuery(listSessionsOptions(tenant.id));
  const locationsQuery = useQuery(listLocationsOptions(tenant.id));
  const participantsQuery = useQuery(listParticipantsOptions(tenant.id));

  return (
    <Page header={<PageHeader eyebrow={tenant.name} title="Schedule" />}>
      <QueryBoundary query={[tenantQuery, sessionsQuery, locationsQuery, participantsQuery]}>
        {(festival, sessions, locations, participants) => {
          if (locations.length === 0) {
            return <NoLocations tenant={tenant} />;
          }

          if (sessions.length === 0) {
            return <NoSessions />;
          }

          return (
            <SessionsList
              tenant={tenant}
              festival={festival}
              sessions={sessions}
              locations={locations}
              participants={participants}
            />
          );
        }}
      </QueryBoundary>
    </Page>
  );
}

function NoLocations({ tenant }: { tenant: TenantSummary }) {
  return (
    <EmptyState
      icon={MapPin}
      title="Add a location first"
      description={`Every session happens at a location — a stage, tent or room. You can't schedule anything until ${tenant.name} has at least one.`}
      cta={
        <LinkButton to="/festivals/$tenantId/locations" params={{ tenantId: tenant.id }}>
          <MapPin className="size-4" />
          Go to locations
        </LinkButton>
      }
    />
  );
}

function NoSessions() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="No sessions scheduled yet"
      description="This is where the festival timetable takes shape. Sessions you add show up here, grouped by day."
    />
  );
}

function SessionsList({
  tenant,
  festival,
  sessions: sessionsProp,
  locations,
  participants,
}: {
  tenant: TenantSummary;
  festival: Tenant;
  sessions: Session[];
  locations: Location[];
  participants: Participant[];
}) {
  const sessions = getScheduleSessions(sessionsProp, locations, participants);
  const overlapping = sessions.filter((session) => session.overlaps.length > 0);

  const [search, setSearch] = useSearchParam(from);
  const matching = sessions.filter((session) => session.matches(search));

  const days = groupByDay(matching, festival.timezone);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/admin/tenants/${tenant.id}/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries(listSessionsOptions(tenant.id)),
  });

  const confirm = useConfirmDialog();

  const onDelete = (session: ScheduleSession) => {
    confirm({
      title: 'Delete this session?',
      description: `"${session.displayName}" will be removed from the timetable and won't appear in the attendee app. This can't be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => deleteMutation.mutateAsync(session.id),
    });
  };

  return (
    <div className="col gap-4">
      <div className="row flex-wrap items-center justify-between gap-4">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Search title, artist or stage"
          className="min-w-64 flex-1 md:max-w-96"
        />

        {overlapping.length > 0 && (
          <Chip size="lg" className="bg-warning/5 text-warning-ink">
            <TriangleAlert className="size-4" />
            {overlapping.length} session{overlapping.length === 1 ? '' : 's'} overlap
          </Chip>
        )}
      </div>

      <div className="row flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <SearchSummary search={search} items={sessions} matching={matching}>
          {sessions.length} session{sessions.length === 1 ? '' : 's'} &bull; {days.length} day
          {days.length === 1 ? '' : 's'} &bull; {locations.length} location{locations.length === 1 ? '' : 's'}
        </SearchSummary>

        <div className="row flex-wrap items-center gap-3">
          {Object.values(sessionTypes).map(({ label, dot }) => (
            <span key={label} className="text-xxs text-muted row items-center gap-1.5 font-mono tracking-widest">
              <span className={clsx('size-2 rounded-xs', dot)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {matching.length === 0 && (
        <NoMatch
          title={`No sessions match "${search}"`}
          description="Nothing in the timetable matches this search. Try a different title, artist or stage."
          onClear={() => setSearch('')}
        />
      )}

      {days.map((day) => (
        <section key={day.key} className="col gap-3">
          <div className="row mt-4 items-center gap-4">
            <span className="text-accent font-mono font-semibold tracking-widest">{day.label}</span>
            <hr className="bg-line h-px flex-1" />
            <span className="text-faint font-mono text-sm">
              {day.sessions.length} session{day.sessions.length === 1 ? '' : 's'}
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableHeaderCell className="w-28 shrink-0">Time</TableHeaderCell>
              <TableHeaderCell className="flex-[1.4]">Session</TableHeaderCell>
              <TableHeaderCell className="flex-1 max-md:hidden">Location</TableHeaderCell>
              <TableHeaderCell className="flex-[1.3] max-lg:hidden">Participants</TableHeaderCell>
              <TableHeaderCell className="w-16 shrink-0 text-right">Actions</TableHeaderCell>
            </TableHeader>

            {day.sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                timezone={festival.timezone}
                onDelete={() => onDelete(session)}
              />
            ))}
          </Table>
        </section>
      ))}
    </div>
  );
}

function SessionRow({
  session,
  timezone,
  onDelete,
}: {
  session: ScheduleSession;
  timezone: string;
  onDelete: () => void;
}) {
  const type = sessionTypes[session.type];

  const overlapTitle = (session: ScheduleSession) => {
    return `${session.displayName} (${formatTime(session.startsAt, timezone)}-${formatTime(session.endsAt, timezone)})`;
  };

  return (
    <div className="hover:bg-subtle row items-center gap-3 p-3 md:gap-4 md:px-4">
      <div className="w-28 font-mono text-sm font-semibold">
        {formatTime(session.startsAt, timezone)} &ndash; {formatTime(session.endsAt, timezone)}
      </div>

      <div className="col min-w-0 flex-[1.4] gap-1">
        <div className="row items-center gap-2">
          <Chip size="sm" variant="custom" className={type.badge}>
            {type.label}
          </Chip>

          {session.overlaps.length > 0 && (
            <Chip
              size="sm"
              title={`Overlaps ${session.overlaps.map(overlapTitle).join(', ')}`}
              className="bg-warning/5 text-warning-ink"
            >
              <TriangleAlert className="size-2.5" />
              OVERLAP
            </Chip>
          )}
        </div>

        <span className="truncate font-medium">{session.displayName}</span>
        <span className="text-faint truncate text-xs md:hidden">{session.location.name}</span>
      </div>

      <div className="row min-w-0 flex-1 max-md:hidden">
        <Chip size="lg">
          <MapPin className="text-faint size-3 shrink-0" />
          <span className="truncate">{session.location.name}</span>
        </Chip>
      </div>

      <span className="text-muted min-w-0 flex-[1.3] truncate text-sm max-lg:hidden">
        {session.participants.map(get('name')).join(' · ') || '—'}
      </span>

      <div className="row w-16 shrink-0 justify-end">
        <IconButton
          icon={Trash2}
          variant="ghost"
          aria-label={`Delete ${session.displayName}`}
          onClick={onDelete}
          className="hover:text-danger"
        />
      </div>
    </div>
  );
}

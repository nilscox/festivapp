import type { Location, Participant, Tenant, TenantSummary } from '@festivapp/contracts';
import { get, has } from '@festivapp/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRouteContext, useSearch } from '@tanstack/react-router';
import clsx from 'clsx';
import { CalendarDays, MapPin, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';

import { IconButton, LinkButton } from '../../components/button.tsx';
import { Chip } from '../../components/chip.tsx';
import { useConfirmDialog } from '../../components/confirm-dialog.tsx';
import { Drawer, useDrawer } from '../../components/drawer.tsx';
import { EmptyState } from '../../components/empty-state.tsx';
import { Page, PageHeader } from '../../components/page.tsx';
import { QueryBoundary } from '../../components/query-boundary.tsx';
import { NoMatch, SearchInput, SearchSummary } from '../../components/search.tsx';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '../../components/table.tsx';
import { useSearchParam } from '../../hooks/use-search-param.ts';
import { api } from '../../lib/api.ts';
import { formatTime } from '../../lib/datetime.ts';
import {
  getTenantOptions,
  listLocationsOptions,
  listParticipantsOptions,
  listSessionsOptions,
} from '../../lib/queries.ts';
import { getScheduleSessions, groupByDay, type ScheduleSession } from '../../lib/schedule.ts';
import { SessionForm } from './session-form.tsx';
import { sessionTypes } from './session-types.ts';

const from = '/festivals/$tenantId/schedule';

export function Schedule() {
  const { tenant } = useRouteContext({ from });

  const tenantQuery = useQuery(getTenantOptions(tenant.id));
  const sessionsQuery = useQuery(listSessionsOptions(tenant.id));
  const locationsQuery = useQuery(listLocationsOptions(tenant.id));
  const participantsQuery = useQuery(listParticipantsOptions(tenant.id));

  const showCreate = Boolean(locationsQuery.data?.length && sessionsQuery.data?.length);

  return (
    <Page header={<Header tenant={tenant} showCreate={showCreate} />}>
      <QueryBoundary query={[tenantQuery, sessionsQuery, locationsQuery, participantsQuery]}>
        {(festival, sessions, locations, participants) => {
          if (locations.length === 0) {
            return <NoLocations tenant={tenant} />;
          }

          const scheduleSessions = getScheduleSessions(sessions, locations, participants);

          return (
            <>
              {sessions.length === 0 ? (
                <NoSessions />
              ) : (
                <SessionsList tenant={tenant} festival={festival} sessions={scheduleSessions} locations={locations} />
              )}

              <SessionDrawer
                festival={festival}
                sessions={scheduleSessions}
                locations={locations}
                participants={participants}
              />
            </>
          );
        }}
      </QueryBoundary>
    </Page>
  );
}

function Header({ tenant, showCreate }: { tenant: TenantSummary; showCreate: boolean }) {
  return (
    <PageHeader
      eyebrow={tenant.name}
      title="Schedule"
      end={
        showCreate && (
          <LinkButton from={from} search={(prev) => ({ ...prev, create: true })} className="mt-auto">
            <Plus className="size-4" />
            <span className="max-md:hidden">Add session</span>
          </LinkButton>
        )
      }
    />
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
      cta={
        <LinkButton from={from} search={{ create: true }}>
          <Plus className="size-4" />
          Add session
        </LinkButton>
      }
    />
  );
}

function SessionDrawer({
  festival,
  sessions,
  locations,
  participants,
}: {
  festival: Tenant;
  sessions: ScheduleSession[];
  locations: Location[];
  participants: Participant[];
}) {
  const { create, edit: editId } = useSearch({ from });
  const drawer = useDrawer(create !== undefined || editId !== undefined);

  const navigate = useNavigate({ from });
  const onClosed = () => navigate({ search: ({ create, edit, ...prev }) => prev, replace: true });

  return (
    <Drawer {...drawer} onClosed={onClosed} title={create ? 'New session' : 'Edit session'}>
      <SessionForm
        session={editId ? sessions.find(has('id', editId)) : undefined}
        tenantId={festival.id}
        locations={locations}
        participants={participants}
        timezone={festival.timezone}
        onClose={drawer.onClose}
      />
    </Drawer>
  );
}

function SessionsList({
  tenant,
  festival,
  sessions,
  locations,
}: {
  tenant: TenantSummary;
  festival: Tenant;
  sessions: ScheduleSession[];
  locations: Location[];
}) {
  const overlapping = sessions.filter((session) => session.overlaps.length > 0);

  const [search = '', setSearch] = useSearchParam({ from, name: 'search' });
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
            <span
              key={label}
              className="text-xxs text-muted row items-center gap-1.5 font-mono tracking-widest uppercase"
            >
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
              <TableHeaderCell className="w-36">Time</TableHeaderCell>
              <TableHeaderCell className="md:w-1/3">Session</TableHeaderCell>
              <TableHeaderCell className="max-md:hidden">Location</TableHeaderCell>
              <TableHeaderCell className="max-lg:hidden">Participants</TableHeaderCell>
              <TableHeaderCell className="w-32 text-end!">Actions</TableHeaderCell>
            </TableHeader>

            <TableBody>
              {day.sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  timezone={festival.timezone}
                  onDelete={() => onDelete(session)}
                />
              ))}
            </TableBody>
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
    <TableRow>
      <TableCell className="font-mono text-sm font-semibold whitespace-nowrap">
        {formatTime(session.startsAt, timezone)} &ndash; {formatTime(session.endsAt, timezone)}
      </TableCell>

      <TableCell>
        <div className="col gap-1">
          <div className="row items-center gap-2">
            <Chip size="sm" variant="custom" className={clsx('uppercase', type.badge)}>
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
      </TableCell>

      <TableCell className="max-md:hidden">
        <Chip size="lg">
          <MapPin className="text-faint size-3 shrink-0" />
          <span className="truncate">{session.location.name}</span>
        </Chip>
      </TableCell>

      <TableCell className="max-lg:hidden">
        <div className="text-muted truncate text-sm">{session.participants.map(get('name')).join(' · ') || '—'}</div>
      </TableCell>

      <TableCell>
        <div className="row items-center justify-end gap-1">
          <LinkButton
            variant="secondary"
            size="sm"
            from={from}
            search={(prev) => ({ ...prev, edit: session.id })}
            aria-label={`Edit ${session.displayName}`}
          >
            <Pencil className="size-3" />
            Edit
          </LinkButton>
          <IconButton
            icon={Trash2}
            variant="ghost"
            aria-label={`Delete ${session.displayName}`}
            onClick={onDelete}
            className="hover:text-danger"
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

import type { Location, Session, TenantConfig } from '@festivapp/contracts';
import { Link } from '@tanstack/react-router';
import { isAfter, isWithinInterval } from 'date-fns';

import { PageHeader } from '../components/page-header.tsx';
import { SessionCard } from '../components/session-card.tsx';
import { countdownLabel, formatNowHeading, formatTime } from '../lib/datetime.ts';
import { sessionTitle } from '../lib/session.ts';
import { useBootstrap, useSessionParticipants, useTenant } from '../use-bootstrap.ts';
import { useClock } from '../use-clock.ts';

export function Now() {
  const data = useBootstrap();
  const now = useClock();

  const { tenant, locations, sessions } = data;
  const tz = tenant.timezone;

  const rows = locations.map((location) => ({
    location,
    ...findLocationNow(location.id, sessions, now),
  }));

  return (
    <div className="col min-h-0 flex-1">
      <Header tenant={tenant} />

      <div className="reveal min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="row items-baseline justify-start gap-2 p-4">
          <span className="font-mono text-sm font-semibold tracking-wider uppercase">Right now</span>
          <span className="text-muted text-sm">&bull;</span>
          <span className="text-muted text-sm">{formatNowHeading(now, tz)}</span>
        </div>

        {rows.map((row) => (
          <LocationNow key={row.location.id} location={row.location} live={row.live} next={row.next} now={now} />
        ))}
      </div>
    </div>
  );
}

function findLocationNow(locationId: string, sessions: Session[], now: Date) {
  const locationSessions = sessions.filter((session) => session.locationId === locationId);

  const live = locationSessions.find((session) =>
    isWithinInterval(now, { start: session.startsAt, end: session.endsAt }),
  );

  const next = locationSessions.find((session) => isAfter(session.startsAt, now));

  return {
    live: live ?? null,
    next: next ?? null,
  };
}

function Header({ tenant }: { tenant: TenantConfig }) {
  const { wordmarkUrl } = tenant.theme.logo;

  return (
    <PageHeader
      title={
        wordmarkUrl !== null ? (
          <img src={wordmarkUrl} alt={tenant.name} className="h-8 max-w-full self-start object-contain object-left" />
        ) : (
          tenant.name
        )
      }
      subtitle={
        <div className="row text-faint items-center gap-2 font-mono text-xs uppercase">
          <span className="bg-accent size-1.5 rounded-full" />
          Works offline &bull; Saved on device
        </div>
      }
    />
  );
}

function LocationNow({
  location,
  live,
  next,
  now,
}: {
  location: Location;
  live: Session | null;
  next: Session | null;
  now: Date;
}) {
  return (
    <section className="border-line border-t p-4">
      <Link to="/map" search={{ location: location.id }} className="row mb-2 items-center gap-2.5">
        {live && <Live />}
        <h2 className="font-display text-accent text-lg font-bold tracking-tight">{location.name}</h2>
      </Link>

      <div className="col gap-3">
        {live ? <SessionCard session={live} now={now} showLiveIcon={false} /> : <Break />}
        {next && <Next session={next} now={now} />}
      </div>
    </section>
  );
}

function Live() {
  return (
    <span className="bg-accent relative inline-block size-2 shrink-0 rounded-full">
      <span className="ping bg-accent absolute inset-0 rounded-full" />
    </span>
  );
}

function Break() {
  return <span className="text-muted font-semibold uppercase">Break</span>;
}

function Next({ session, now }: { session: Session; now: Date }) {
  const { timezone } = useTenant()!;
  const participants = useSessionParticipants(session.id);

  return (
    <Link to="/session/$sessionId" params={{ sessionId: session.id }} className="row items-baseline gap-2">
      <span className="text-muted text-sm">Next:</span>
      <span className="text-sm font-medium">{sessionTitle(session, participants)}</span>
      <span className="text-muted font-mono text-xs">
        at {formatTime(session.startsAt, timezone)} ({countdownLabel(now, session.startsAt)})
      </span>
    </Link>
  );
}

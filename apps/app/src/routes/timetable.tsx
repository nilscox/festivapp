import { formatInTimeZone } from 'date-fns-tz';

import { PageHeader } from '../components/page-header.tsx';
import { SessionCard } from '../components/session-card.tsx';
import { useClock } from '../hooks/use-clock.ts';
import { useBootstrap, type ResolvedSession } from '../lib/bootstrap.ts';
import { formatDayLabel } from '../lib/datetime.ts';

type Day = {
  date: string;
  sessions: ResolvedSession[];
};

export function Timetable() {
  const { tenant, sessions } = useBootstrap();
  const timezone = tenant.timezone;

  const now = useClock();
  const days = groupByDay(sessions, timezone);

  return (
    <div className="col min-h-0 flex-1">
      <PageHeader
        title="Timetable"
        subtitle={<div className="text-faint font-mono text-xs uppercase">Showing all {sessions.length} events</div>}
      />

      <div className="reveal col min-h-0 flex-1 gap-8 overflow-y-auto pb-8">
        {days.length === 0 && <p className="text-muted px-4 py-8 text-center text-sm">No results.</p>}

        {days.map((day) => (
          <section key={day.date} className="px-4">
            <h2 className="font-display text-accent from-app via-app/75 sticky top-0 z-10 bg-linear-to-b via-75% to-transparent py-2 font-semibold">
              {formatDayLabel(day.date, timezone)}
            </h2>

            {day.sessions.map((session) => (
              <SessionCard key={session.id} session={session} now={now} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function groupByDay(sessions: ResolvedSession[], timeZone: string): Day[] {
  const map = new Map<string, Day>();

  for (const session of sessions) {
    const date = formatInTimeZone(session.startsAt, timeZone, 'yyyy-MM-dd');
    const day = map.get(date);

    if (day) {
      day.sessions.push(session);
    } else {
      map.set(date, { date, sessions: [session] });
    }
  }

  return Array.from(map.values()).toSorted((a, b) => a.date.localeCompare(b.date));
}

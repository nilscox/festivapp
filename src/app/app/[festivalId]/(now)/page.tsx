import { add, isAfter, isBefore, isEqual, sub } from 'date-fns';
import { RadioIcon } from 'lucide-react';
import { db } from 'src/database/db';
import { eventToView, EventView } from 'src/database/model';
import { getFestival, getNow } from 'src/server-utils';

import { EventsSection } from './events-section';

export default async function Home() {
  const now = await getNow();
  const festival = await getFestival();
  const events = await getEvents();

  return (
    <div>
      <h1 className="text-center">{festival.name}</h1>

      <EventsSection
        title={
          <div className="row items-center gap-2">
            <RadioIcon className="size-5 text-red-500" />
            Live now
          </div>
        }
        events={events.filter((event) => event.isLive)}
      />

      <EventsSection title={<>Coming up</>} events={events.filter((event) => !event.isLive)} />

      {isBefore(now, sub(festival.start, { days: 1 })) && (
        <div className="min-h-32 rounded-lg bg-light p-4 text-dark shadow-sm">{festival.beforeStartInfo}</div>
      )}

      {isAfter(now, festival.end) && (
        <div className="min-h-32 rounded-lg bg-light p-4 text-dark shadow-sm">{festival.afterEndInfo}</div>
      )}
    </div>
  );
}

async function getEvents(): Promise<EventView[]> {
  const festival = await getFestival();
  const now = await getNow();

  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festival.id } },
  });

  const events = await db.query.events.findMany({
    with: { location: true, artists: true },
    where: { end: { AND: [{ gt: now }, { lt: add(now, { hours: 3 }) }] } },
    orderBy: { start: 'asc' },
    limit: locations.length * 4,
  });

  events.sort((a, b) => {
    if (!isEqual(a.start, b.start) || a.location.sortOrder === null || b.location.sortOrder === null) {
      return 0;
    }

    return a.location.sortOrder - b.location.sortOrder;
  });

  return events.map((event) => eventToView(now, event));
}

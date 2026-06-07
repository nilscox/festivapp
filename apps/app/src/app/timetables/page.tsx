import { db, eventToView, EventView } from '@festivapp/persistence';
import { assert, defined } from '@festivapp/utils';
import { isEqual, isSameDay, startOfDay } from 'date-fns';
import { uniqueWith } from 'remeda';

import { getFestival, getNow } from '@/server-utils';

import { EventBreak } from './event-break';
import { LocationFilter } from './location-filter';
import { TimetableDay } from './timetable-day';

export default async function ({ searchParams }: PageProps<'/timetables'>) {
  const search = await searchParams;

  const festival = await getFestival();
  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festival.id } },
    orderBy: { sortOrder: 'asc' },
  });

  const activeLocation = locations.find((location) => location.id === search.location) ?? defined(locations.at(0));

  const events = await getEvents(activeLocation.id);

  const days = uniqueWith(
    events.map((event) => startOfDay(event.start)),
    isEqual,
  );

  return (
    <div>
      <header>
        <h1>Timetables</h1>
        <LocationFilter locations={locations} active={activeLocation} />
      </header>

      {days.map((day) => (
        <TimetableDay key={day.getTime()} day={day} events={events.filter((event) => isSameDay(event.start, day))} />
      ))}
    </div>
  );
}

async function getEvents(locationId: string) {
  const now = await getNow();

  const events = await db.query.events.findMany({
    with: { location: true, artists: true },
    where: { locationId },
    orderBy: { start: 'asc' },
  });

  return addEventsBreaks(events.map((event) => eventToView(now, event)));
}

export function addEventsBreaks(events: EventView[]): Array<EventView | EventBreak> {
  const result: ReturnType<typeof addEventsBreaks> = [];

  for (let i = 0; i < events.length; ++i) {
    const event = events.at(i);
    const next = events.at(i + 1);

    assert(event);

    result.push(event);

    if (next && !isEqual(event.end, next.start)) {
      result.push({ type: 'break', start: event.end, end: next.start });
    }
  }

  return result;
}

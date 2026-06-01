import { isEqual, isSameDay, startOfDay } from 'date-fns';
import { uniqueWith } from 'remeda';
import { db } from 'src/database/db';
import { addEventsBreaks, eventToView } from 'src/database/model';
import { getNow } from 'src/server-utils';
import { defined } from 'src/utils';

import { LocationFilter } from './location-filter';
import { TimetableDay } from './timetable-day';

export default async function ({ searchParams }: PageProps<'/timetables'>) {
  const search = await searchParams;
  const locations = await db.query.locations.findMany({ orderBy: { sortOrder: 'asc' } });
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

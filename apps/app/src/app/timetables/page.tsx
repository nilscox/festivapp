import { db, eventToView, EventView } from '@festivapp/persistence';
import { assert, defined } from '@festivapp/utils';
import { Trans } from '@lingui/react/macro';
import { isEqual, isSameDay, startOfDay } from 'date-fns';
import { uniqueWith } from 'remeda';

import { SavedEventsFilter } from '@/app/timetables/saved-events-filter';
import { configureI18n } from '@/i18n/i18n';
import { getFestival, getNow, getSavedEventIds } from '@/server-utils';

import { EventBreak } from './event-break';
import { LocationFilter } from './location-filter';
import { TimetableDay } from './timetable-day';

export default async function ({ searchParams }: PageProps<'/timetables'>) {
  await configureI18n();

  const search: { savedOnly?: string; location?: string } = await searchParams;

  const festival = await getFestival();
  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festival.id } },
    orderBy: { sortOrder: 'asc' },
  });

  const activeLocation = locations.find((location) => location.id === search.location) ?? defined(locations.at(0));

  const savedOnly = search.savedOnly === 'true';
  const events = await getEvents(activeLocation.id, savedOnly);

  const days = uniqueWith(
    events.map((event) => startOfDay(event.start)),
    isEqual,
  );

  return (
    <div>
      <header className="row items-center justify-between">
        <LocationFilter locations={locations} active={activeLocation} searchParams={search} />
        <SavedEventsFilter isActive={Boolean(search.savedOnly)} searchParams={search} />
      </header>

      {events.length > 0 ? (
        days.map((day) => (
          <TimetableDay key={day.getTime()} day={day} events={events.filter((event) => isSameDay(event.start, day))} />
        ))
      ) : (
        <div className="sticky top-2 z-10 mx-auto w-fit rounded-md bg-primary text-accent">
          <p className="text-lg font-medium px-4 py-2">
            {savedOnly ? <Trans>No saved events</Trans> : <Trans>No events</Trans>}
          </p>
        </div>
      )}
    </div>
  );
}

async function getEvents(locationId: string, savedOnly: boolean) {
  const now = await getNow();

  const events = await db.query.events.findMany({
    with: { location: true, artists: true },
    where: { locationId },
    orderBy: { start: 'asc' },
  });

  if (savedOnly) {
    const savedEvents = await getSavedEventIds();

    return events.filter(({ id }) => savedEvents.has(id)).map((event) => eventToView(now, event));
  }

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

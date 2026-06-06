import { Card } from 'admin/components/card';
import { SearchInput } from 'admin/components/search-input';
import { Tabs } from 'admin/components/tabs';
import { format, intlFormat } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import Link from 'next/link';
import { Collapsible } from 'radix-ui';
import { db } from 'src/database/db';
import { Artist, Event } from 'src/database/model';

import { CreateEvent } from './create-event';
import { EventForm, EventFormDelete, EventFormSubmit } from './event-form';

export default async function ({ params, searchParams }: PageProps<'/admin/festivals/[festivalId]/timetables'>) {
  const { festivalId } = await params;
  const { search } = await searchParams;
  void search;

  const locations = await db.query.locations.findMany({
    where: { festivalId: { eq: festivalId } },
    orderBy: { sortOrder: 'asc' },
  });

  const events = await db.query.events.findMany({
    where: { festivalId: { eq: festivalId } },
    with: { artists: true },
    orderBy: { start: 'asc' },
  });

  const artists = await db.query.artists.findMany({
    where: { festivalId: { eq: festivalId } },
    orderBy: { name: 'asc' },
  });

  if (locations.length === 0) {
    return (
      <div className="row min-h-32 items-center justify-center">
        <p className="text-dim">
          You don't have any location yet. Start by creating one{' '}
          <Link href={`/admin/festivals/${festivalId}/map`}>here</Link>.
        </p>
      </div>
    );
  }

  return (
    <Tabs.Root defaultValue={locations[0]?.id} className="col gap-4">
      <Tabs.List className="self-start">
        {locations.map((location) => (
          <Tabs.Trigger key={location.id} value={location.id}>
            {location.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <SearchInput />

      {locations.map((location) => (
        <Tabs.Content key={location.id} value={location.id} tabIndex={-1}>
          <LocationEvents events={events.filter((event) => event.locationId === location.id)} artists={artists} />
          <div className="mt-4">
            <CreateEvent festivalId={festivalId} locationId={location.id} artists={artists} />
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}

function LocationEvents({ events, artists }: { events: Array<Event & { artists: Artist[] }>; artists: Artist[] }) {
  return (
    <ul className="col gap-2">
      {events.map((event) => (
        <li key={event.id} id={event.id}>
          <Collapsible.Root>
            <Card>
              <Collapsible.Trigger className="group row w-full cursor-pointer items-center gap-4 rounded-t-lg px-4 py-3 text-start transition-colors hover:bg-gray-100 data-[state=closed]:rounded-b-lg">
                <div className="w-32">
                  <div className="text-sm text-dim">{intlFormat(event.start, { dateStyle: 'long' })}</div>
                  <div className="text-dim">
                    {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-lg font-medium">{event.title ?? event.artists[0]?.name ?? '-'}</div>
                  <div className="text-dim">
                    {{ live: 'Live', dj_set: 'DJ Set', talk: 'Talk', workshop: 'Workshop' }[event.type]}
                  </div>
                </div>

                <div>
                  <ChevronDownIcon className="size-5 group-data-[state=open]:-scale-y-100" />
                </div>
              </Collapsible.Trigger>

              <Collapsible.Content>
                <div className="border-t p-4">
                  <EventForm
                    festivalId={event.festivalId}
                    locationId={event.locationId}
                    event={event}
                    artists={artists}
                    actions={
                      <div key="actions" className="row items-center gap-2">
                        <EventFormSubmit event={event} />
                        <EventFormDelete />
                      </div>
                    }
                  />
                </div>
              </Collapsible.Content>
            </Card>
          </Collapsible.Root>
        </li>
      ))}
    </ul>
  );
}

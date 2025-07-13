import { useIntl } from '@cookbook/solid-intl';
import { A, useSearchParams } from '@solidjs/router';
import { startOfDay } from 'date-fns';
import { groupBy } from 'remeda';
import { For, createEffect, createMemo } from 'solid-js';

import { DocumentTitle } from 'src/components/document-title';
import { FormatDate, Translate } from 'src/components/intl';
import { SlotItem } from 'src/components/slot-item';
import { Artist, Event, SlotData, data } from 'src/data';
import { searchString } from 'src/utils/search';
import { Slot } from 'src/utils/timetable';

export function Timetables() {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();

  const timetable = createMemo(() =>
    data.timetables.find((timetable) => timetable.data.name === searchParams.location),
  );

  createEffect(() => {
    if (timetable() === undefined) {
      setSearchParams({ location: data.timetables.at(0)?.data.name }, { replace: true });
    }
  });

  const slots = () => {
    const filters = getFilters(searchParams);

    return timetable()?.slots.filter((slot) => {
      if (slot.data.type === 'event') {
        return filters.event(data.events.get(slot.data.id)!);
      }

      if (slot.data.type === 'artist') {
        return filters.artist(data.artists.get(slot.data.id)!);
      }
    });
  };

  return (
    <div class="col gap-6">
      <DocumentTitle title={intl.formatMessage({ id: 'timetables.title' })} />

      <TimetableFilters
        filters={searchParams}
        onChange={(type, value) => setSearchParams({ [type]: value })}
      />

      <TimetableLocations
        location={searchParams.location as string | undefined}
        onChange={(value) => setSearchParams({ location: value })}
      />

      <SlotList slots={slots()} />
    </div>
  );
}

function getFilters(filters: Partial<Record<'search' | 'style' | 'type', string>>) {
  return {
    event: (event: Event) => {
      const search = (filter: string) => {
        return searchString(event.name, filter);
      };

      const style = (_filter: string) => {
        return false;
      };

      const type = (filter: string) => {
        return filter === 'event';
      };

      return [
        typeof filters.search === 'string' ? search(filters.search) : true,
        typeof filters.style === 'string' ? style(filters.style) : true,
        typeof filters.type === 'string' ? type(filters.type) : true,
      ].every(Boolean);
    },
    artist: (artist: Artist) => {
      const search = (filter: string) => {
        return searchString(artist.name, filter);
      };

      const style = (filter: string) => {
        return artist.styles.includes(filter);
      };

      const type = (filter: string) => {
        return artist.type === filter;
      };

      return [
        typeof filters.search === 'string' ? search(filters.search) : true,
        typeof filters.style === 'string' ? style(filters.style) : true,
        typeof filters.type === 'string' ? type(filters.type) : true,
      ].every(Boolean);
    },
  };
}

type Filter = 'search' | 'style' | 'type';

export function TimetableFilters(props: {
  filters: Partial<Record<Filter, string>>;
  onChange: (type: Filter, value: string) => void;
}) {
  const intl = useIntl();

  const stylesOptions = () => {
    return [
      {
        label: <Translate id="timetables.styles.all" />,
        value: '',
      },
      ...data.styles.map((label) => ({
        label,
        value: label,
      })),
    ];
  };

  const typesOptions = () => {
    return [
      {
        label: <Translate id="timetables.types.all" />,
        value: '',
      },
      ...(['live', 'liveband', 'djset'] as const).map((value) => ({
        label: <Translate id={`artistType.${value}`} />,
        value,
      })),
      {
        label: <Translate id="timetables.types.event" />,
        value: 'event',
      },
    ];
  };

  return (
    <form class="grid grid-cols-2 gap-2">
      <select
        value={props.filters.style ?? ''}
        onChange={(event) => props.onChange('style', event.target.value)}
      >
        <For each={stylesOptions()}>{({ value, label }) => <option value={value}>{label}</option>}</For>
      </select>

      <select
        value={props.filters.type ?? ''}
        onChange={(event) => props.onChange('type', event.target.value)}
      >
        <For each={typesOptions()}>{({ value, label }) => <option value={value}>{label}</option>}</For>
      </select>

      <input
        type="search"
        placeholder={intl.formatMessage({ id: 'timetables.search.placeholder' })}
        value={props.filters.search ?? ''}
        onInput={(event) => props.onChange('search', event.target.value)}
        class="col-span-2"
      />
    </form>
  );
}

export function TimetableLocations(props: { location?: string; onChange: (value: string) => void }) {
  const isActive = ({ name }: { name: string }) => {
    return name === props.location;
  };

  return (
    <div role="tablist" class="row justify-evenly overflow-x-auto">
      <For each={data.timetables}>
        {(timetable) => (
          <button
            role="tab"
            onClick={() => props.onChange(timetable.data.name)}
            class="rounded-md px-3 py-0.5 text-lg font-semibold text-nowrap"
            classList={{ 'bg-primary/10 shadow-sm': isActive(timetable.data) }}
          >
            {timetable.data.name}
          </button>
        )}
      </For>
    </div>
  );
}

export function SlotList(props: { slots?: Slot<SlotData>[] }) {
  const groups = () => {
    return groupBy(props.slots ?? [], (slot) => String(startOfDay(slot.start)));
  };

  return (
    <ul class="col gap-12">
      <For
        each={Object.entries(groups())}
        fallback={
          <li class="my-4 text-lg">
            <Translate id="timetables.noResults" />
          </li>
        }
      >
        {([day, slots]) => (
          <li>
            <div class="mb-4 text-2xl font-semibold capitalize">
              <FormatDate date={day} weekday="long" day="numeric" month="long" />
            </div>

            <ul class="col gap-8">
              <For each={slots}>
                {(slot) => (
                  <li>
                    <A href={`/${slot.data.type}/${slot.data.id}`}>
                      <SlotItem slot={slot} />
                    </A>
                  </li>
                )}
              </For>
            </ul>
          </li>
        )}
      </For>
    </ul>
  );
}

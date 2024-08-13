import { useIntl } from '@cookbook/solid-intl';
import { createForm, Field, FormStore, getValue, getValues, setValue } from '@modular-forms/solid';
import { useSearchParams } from '@solidjs/router';
import { createEffect, For, JSX, Match, Show, Switch } from 'solid-js';

import { ActivityItem } from '../components/activity-item';
import { ArtistItem } from '../components/artist-item';
import { DocumentTitle } from '../components/document-title';
import { FormattedDate, Translate } from '../components/intl';
import { data, isArtistSlot, TimetableSlot } from '../data';
import { defined } from '../utils/assert';
import { searchString } from '../utils/search';

type FiltersForm = {
  search: string;
  stage: string;
  style: string;
  type: string;
};

export function TimetablesPage() {
  const intl = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, { Form: FiltersForm }] = createForm<FiltersForm>({
    initialValues: {
      search: searchParams['search'] ?? '',
      stage: searchParams['stage'] ?? defined(data.stages[0]).id,
      style: searchParams['style'] ?? 'all',
      type: searchParams['type'] ?? 'all',
    },
  });

  createEffect(() => {
    setSearchParams(getValues(filters), { replace: true });
  });

  const days = () => {
    const stage = getValue(filters, 'stage');

    if (stage === undefined) {
      return [];
    }

    return data.days.map((day): [Date, TimetableSlot[]] => {
      const slots = data
        .timetable(stage)
        .getSlotsForDay(day)
        .filter((day) => filter(day, getValues(filters)));

      return [day, slots];
    });
  };

  return (
    <div class="col gap-8">
      <DocumentTitle title={intl.formatMessage({ id: 'navigation.timetables' })} />

      <FiltersForm onSubmit={() => {}} class="col gap-6">
        <Filters stage={getValue(filters, 'stage')} form={filters} />
      </FiltersForm>

      <div class="col gap-12">
        <For each={days()}>{([day, slots]) => <Day day={day} slots={slots} />}</For>
      </div>
    </div>
  );
}

const filter = (slot: TimetableSlot, { search, style, type }: Partial<FiltersForm>) => {
  if (search === undefined || style === undefined || type === undefined) {
    return true;
  }

  if (isArtistSlot(slot)) {
    const artist = data.findArtist(slot.artistId);

    return [
      searchString(artist?.name, search) ||
        searchString(artist?.label, search) ||
        searchString(artist?.origin, search),
      style === 'all' || artist?.styles.includes(style),
      type === 'all' || artist?.type === type,
    ].every(Boolean);
  } else {
    if (style !== 'all' || type !== 'all') {
      return false;
    }

    return searchString(slot.label, search) || searchString(slot.type, search);
  }
};

type FiltersProps = {
  stage?: string;
  form: FormStore<FiltersForm>;
};

function Filters(props: FiltersProps) {
  const intl = useIntl();
  const stage = () => props.stage;

  return (
    <>
      <div class="grid grid-cols-2 gap-2">
        <Field of={props.form} name="style">
          {(field, props) => (
            <select {...props}>
              <option value="all" selected={field.value === 'all'}>
                <Translate id="timetables.allStyles" />
              </option>
              <For each={stage() ? data.stageStyles(stage()!) : []}>
                {(style) => (
                  <option value={style} selected={field.value === style}>
                    {style}
                  </option>
                )}
              </For>
            </select>
          )}
        </Field>

        <Field of={props.form} name="type">
          {(field, props) => (
            <select {...props}>
              <option value="all" selected={field.value === 'all'}>
                <Translate id="timetables.allTypes" />
              </option>
              <For each={data.showTypes}>
                {({ id, label }) => (
                  <option value={id} selected={field.value === id}>
                    {label}
                  </option>
                )}
              </For>
            </select>
          )}
        </Field>

        <Field of={props.form} name="search">
          {(field, props) => (
            <input
              {...props}
              type="search"
              placeholder={intl.formatMessage({ id: 'timetables.searchPlaceholder' })}
              value={field.value}
              class="col-span-2"
            />
          )}
        </Field>
      </div>

      <Field of={props.form} name="stage">
        {(field) => (
          <Stages
            selected={field.value}
            setSelected={(stage) => {
              setValue(props.form, 'stage', stage);
              setValue(props.form, 'style', 'all');
            }}
          />
        )}
      </Field>
    </>
  );
}

function Stages(props: { selected?: string; setSelected: (stage: string) => void }) {
  return (
    <div class="row flex-wrap justify-evenly whitespace-nowrap">
      <For each={data.stages}>
        {({ id, label }) => (
          <Stage selected={props.selected === id} onClick={() => props.setSelected(id)}>
            {label}
          </Stage>
        )}
      </For>
    </div>
  );
}

function Stage(props: { selected: boolean; onClick: () => void; children: JSX.Element }) {
  return (
    <button
      class="rounded-md px-3 py-1 font-semibold"
      classList={{
        'text-primary bg-primary/10 shadow': props.selected,
        'text-dim': !props.selected,
      }}
      onClick={() => props.onClick()}
    >
      {props.children}
    </button>
  );
}

function Day(props: { day: Date; slots: TimetableSlot[] }) {
  return (
    <div class="col gap-6">
      <div class="text-center text-2xl font-semibold">
        <FormattedDate date={props.day} options={{ weekday: 'long', day: 'numeric', month: 'long' }} />
      </div>

      <Show
        when={props.slots.length > 0}
        fallback={
          <div class="text-dim text-center">
            <Translate id="timetables.noResults" />
          </div>
        }
      >
        <div class="col gap-4">
          <For each={props.slots}>
            {(slot) => (
              <Switch>
                <Match when={isArtistSlot(slot) ? data.findArtist(slot.artistId) : false}>
                  {(artist) => <ArtistItem href={`/timetables/${artist().id}`} artist={artist()} />}
                </Match>
                <Match when={!isArtistSlot(slot) ? slot : false}>
                  {(slot) => <ActivityItem {...slot()} />}
                </Match>
              </Switch>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

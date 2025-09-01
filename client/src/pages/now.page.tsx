import { useIntl } from '@cookbook/solid-intl';
import { A } from '@solidjs/router';
import { For, Match, Show, Switch } from 'solid-js';

import { FormatRelativeTime, Translate } from 'src/components/intl';
import { SlotItem } from 'src/components/slot-item';
import { SlotSwitch } from 'src/components/slot-switch';
import { SlotData, data } from 'src/data';
import { useNow } from 'src/utils/now';
import { usePageTitle } from 'src/utils/page-title';
import { Slot, Timetable } from 'src/utils/timetable';

export function Now() {
  const intl = useIntl();
  const now = useNow();

  usePageTitle(() => intl.formatMessage({ id: 'now.title' }));

  return (
    <div class="col gap-8">
      <For each={data.timetables}>
        {(timetable) => (
          <div>
            <div class="text-2xl font-semibold">{timetable.data.name}</div>

            <Show when={timetable.at(now())} fallback={<SlotFallback now={now()} timetable={timetable} />}>
              {(slot) => (
                <A href={`/${slot().data.type}/${slot().data.id}`} class="my-4 block">
                  <SlotItem slot={slot()} />
                </A>
              )}
            </Show>

            <Show when={timetable.next(now())}>{(slot) => <Next now={now()} slot={slot()} />}</Show>
          </div>
        )}
      </For>
    </div>
  );
}

function Next(props: { now: Date; slot: Slot<SlotData> }) {
  return (
    <A href={`/${props.slot.data.type}/${props.slot.data.id}`} class="text-sm">
      <Translate
        id="now.next"
        values={{
          name: <SlotLabel slot={props.slot} />,
          relativeTime: <FormatRelativeTime a={props.now} b={props.slot.start} />,
        }}
      />
    </A>
  );
}

function SlotLabel(props: { slot: Slot<SlotData> }) {
  return <SlotSwitch slot={props.slot} event={(event) => event.name} artist={(artist) => artist.name} />;
}

function SlotFallback(props: { now: Date; timetable: Timetable }) {
  return (
    <div class="my-4 text-lg">
      <Switch fallback={<Translate id="now.break" />}>
        <Match when={!props.timetable.hasStarted(props.now)}>
          <Translate id="now.notStarted" values={{ start: props.timetable.slots.at(0)?.start }} />
        </Match>

        <Match when={props.timetable.hasEnded(props.now)}>
          <Translate id="now.ended" />
        </Match>
      </Switch>
    </div>
  );
}

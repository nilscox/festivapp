import { JSX, Match, Switch } from 'solid-js';

import { Artist, Event, SlotData, data } from 'src/data';
import { defined } from 'src/utils/assert';
import { Slot } from 'src/utils/timetable';

export function SlotSwitch(props: {
  slot: Slot<SlotData>;
  event: (event: Event) => JSX.Element;
  artist: (artist: Artist) => JSX.Element;
}) {
  return (
    <Switch>
      <Match when={props.slot.data.type === 'event'}>
        {props.event(defined(data.events.get(props.slot.data.id)))}
      </Match>

      <Match when={props.slot.data.type === 'artist'}>
        {props.artist(defined(data.artists.get(props.slot.data.id)!))}
      </Match>
    </Switch>
  );
}

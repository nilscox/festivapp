import { Event, SlotData } from 'src/data';
import { Slot } from 'src/utils/timetable';

import { ArtistItem } from './artist-item';
import { SlotSwitch } from './slot-switch';

export function SlotItem(props: { slot: Slot<SlotData> }) {
  return (
    <SlotSwitch
      slot={props.slot}
      event={(event) => <EventItem event={event} />}
      artist={(artist) => <ArtistItem start={props.slot.start} artist={artist} />}
    />
  );
}

function EventItem(props: { event: Event }) {
  return <div>{props.event.name}</div>;
}

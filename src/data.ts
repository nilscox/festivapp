import { unique } from 'remeda';

import { assert } from './utils/assert';
import { Slot, Timetable } from './utils/timetable';

export type Event = {
  id: string;
  name: string;
};

export type Artist = {
  id: string;
  name: string;
  image: string;
  type: 'live' | 'liveband' | 'djset';
  styles: string[];
  origin?: string;
  label: string;
  description: string[];
  social: string[];
};

export type TimetableData = {
  name: string;
};

export type SlotData = {
  type: 'event' | 'artist';
  id: string;
};

class Data {
  public timetables: Array<Timetable<TimetableData, SlotData>>;

  public events: Map<string, Event>;
  public artists: Map<string, Artist>;

  constructor(private data: JsonData) {
    this.timetables = [];

    this.events = new Map(data.events.map((event) => [event.id, event]));
    this.artists = new Map(data.artists.map((artist) => [artist.id, artist]));

    for (const { name, slots } of data.timetables) {
      const timetable = new Timetable<{ name: string }, SlotData>({ name });

      this.timetables.push(timetable);

      for (const slot of slots) {
        if (slot.type === 'event') {
          assert(this.events.has(slot.id), `Event ${slot.id} not found`);
        }

        if (slot.type === 'artist') {
          assert(this.artists.has(slot.id), `Artist ${slot.id} not found`);
        }

        timetable.addSlot(
          new Slot<SlotData>(
            {
              start: new Date(slot.start),
              end: new Date(slot.end),
            },
            {
              type: slot.type,
              id: slot.id,
            },
          ),
        );
      }
    }
  }

  get title() {
    return this.data.title;
  }

  get map() {
    return this.data.map;
  }

  get styles() {
    return unique(
      this.artists
        .values()
        .toArray()
        .flatMap((artist) => artist.styles),
    );
  }
}

export const data = new Data(__DATA__ as JsonData);

type JsonData = {
  title: string;
  map: string;
  events: Event[];
  artists: Artist[];
  timetables: Array<{
    name: string;
    slots: Array<{
      start: string;
      end: string;
      type: 'event' | 'artist';
      id: string;
    }>;
  }>;
};

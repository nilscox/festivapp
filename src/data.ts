import { interval, isAfter, isSameDay, isWithinInterval, startOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { createEffect } from 'solid-js';
import { createStore, SetStoreFunction, Store } from 'solid-js/store';

import { defined } from './utils/assert';
import { trackEvent } from './utils/tracking';
import { unique } from './utils/unique';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Data {
  export type Artist = {
    id: string;
    name: string;
    image: string;
    type: string;
    styles: string[];
    label: string;
    origin?: string;
    description: string[];
    social: string[];
  };

  export type App = {
    name: string;
    background: string;
    theme: Theme;
    info: string;
  };

  export type Theme = {
    primary: string;
    secondary: string;
  };

  export type ArtistTimetableSlot = {
    start: string;
    end: string;
    artistId: string;
  };

  export type ActivityTimetableSlot = {
    start: string;
    end: string;
    label: string;
    type?: string;
  };

  export type TimetableSlot = ArtistTimetableSlot | ActivityTimetableSlot;

  export type AppData = {
    app: App;
    map: string;
    stages: Record<string, string>;
    types: Record<string, string>;
    artists: Record<string, Artist>;
    timetables: Record<string, TimetableSlot[]>;
  };
}

export type Artist = Data.Artist;

class Data {
  public readonly title: string;
  public readonly theme: Data.Theme;

  private readonly timetables: globalThis.Map<string, Timetable>;
  private readonly artistSlots: globalThis.Map<string, TimetableSlot[]>;

  readonly userData = new UserData();

  constructor(private readonly data: Data.AppData) {
    this.title = data.app.name;
    this.theme = data.app.theme;

    this.timetables = new Map(
      Object.entries(data.timetables).map(([stage, slots]) => [stage, new Timetable(slots)])
    );

    const slots = this.stages.flatMap(({ id }) => this.timetable(id).slots);

    this.artistSlots = new Map(
      Object.keys(data.artists).map((artistId) => [
        artistId,
        slots.filter((slot) => isArtistSlot(slot) && slot.artistId === artistId),
      ])
    );
  }

  get background() {
    return this.data.app.background;
  }

  get info() {
    return this.data.app.info;
  }

  get map() {
    return this.data.map;
  }

  get stages(): Array<{ id: string; label: string }> {
    return Object.entries(this.data.stages).map(([id, label]) => ({ id, label }));
  }

  get days(): Array<Date> {
    const days = Object.values(this.data.timetables)
      .flatMap((slots) => slots.map((slot) => startOfDay(slot.start)))
      .map((date) => date.toISOString());

    return unique(days).map((day) => new Date(day));
  }

  stageLabel(stageId: string): string {
    return defined(this.data.stages[stageId]);
  }

  stageArtists(stageId: string): Artist[] {
    return this.timetable(stageId).artistIds.map((artistId) => defined(this.data.artists[artistId]));
  }

  stageStyles(stageId: string): string[] {
    return unique(this.stageArtists(stageId).flatMap((artist) => artist.styles)).sort();
  }

  get showTypes(): Array<{ id: string; label: string }> {
    return Object.entries(this.data.types)
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  showTypeLabel(showTypeId: string): string {
    return defined(this.data.types[showTypeId]);
  }

  get artists(): Artist[] {
    return Object.values(this.data.artists);
  }

  findArtist(artistId: string): Artist | undefined {
    return this.data.artists[artistId];
  }

  timetable(stageId: string): Timetable {
    return defined(this.timetables.get(stageId));
  }

  artistPlayingNext(stage: string, date: Date): Artist | undefined {
    const slot = this.timetable(stage)?.findNextSlot(date);

    if (slot && isArtistSlot(slot)) {
      return this.findArtist(slot.artistId);
    }
  }

  findArtistDate(artistId: string): Record<'start' | 'end', Date> | undefined {
    return this.findArtistSlot(artistId);
  }

  findArtistStage(artistId: string): string | undefined {
    const slot = this.findArtistSlot(artistId);

    if (!slot) {
      return;
    }

    for (const { id: stage } of this.stages) {
      if (this.timetable(stage).slots.includes(slot)) {
        return stage;
      }
    }
  }

  private findArtistSlot(artistId: string): TimetableSlot | undefined {
    return this.artistSlots.get(artistId)?.[0];
  }
}

type ArtistTimetableSlot = {
  start: Date;
  end: Date;
  artistId: string;
};

type ActivityTimetableSlot = {
  start: Date;
  end: Date;
  label: string;
  type?: string;
};

export type TimetableSlot = ArtistTimetableSlot | ActivityTimetableSlot;

class Timetable {
  public readonly slots: TimetableSlot[];

  constructor(slots: Data.TimetableSlot[]) {
    this.slots = slots.map(({ start, end, ...slot }) => ({
      start: fromZonedTime(start, 'Europe/Paris'),
      end: fromZonedTime(end, 'Europe/Paris'),
      ...slot,
    }));
  }

  get artistIds() {
    return this.slots.filter(isArtistSlot).map((slot) => slot.artistId);
  }

  private get firstSlot(): TimetableSlot {
    return defined(this.slots[0]);
  }

  private get lastSlot(): TimetableSlot {
    return defined(this.slots[this.slots.length - 1]);
  }

  hasStarted(now: Date): boolean {
    return isAfter(now, this.firstSlot.start);
  }

  hasEnded(now: Date): boolean {
    return isAfter(now, this.lastSlot.end);
  }

  isPlaying(now: Date) {
    return this.hasStarted(now) && !this.hasEnded(now);
  }

  findSlot(date: Date): TimetableSlot | undefined {
    return this.slots.find((slot) => isBetween(date, slot.start, slot.end));
  }

  findNextSlot(date: Date): TimetableSlot | undefined {
    return this.slots.find((slot) => isAfter(slot.start, date));
  }

  getSlotsForDay(day: Date): TimetableSlot[] {
    return this.slots.filter((slot) => isSameDay(slot.start, day));
  }
}

export function isArtistSlot(slot?: TimetableSlot): slot is ArtistTimetableSlot {
  return slot !== undefined && 'artistId' in slot;
}

function isBetween(date: Date, from: Date, to: Date) {
  return isWithinInterval(date, interval(from, to));
}

type ArtistUserData = {
  artistId: string;
  bookmark: boolean;
  note: string;
  notify: boolean;
};

class UserData {
  private data: Store<Record<string, ArtistUserData>>;
  private setData: SetStoreFunction<Record<string, ArtistUserData>>;

  constructor() {
    const userData = JSON.parse(localStorage.getItem('user-data') ?? '{}') as Record<string, ArtistUserData>;

    // eslint-disable-next-line solid/reactivity
    [this.data, this.setData] = createStore(userData);

    createEffect(() => {
      localStorage.setItem('user-data', JSON.stringify(this.data));
    });
  }

  getAllData(): ArtistUserData[] {
    return Object.values(this.data).sort((a, b) => {
      const slotA = defined(data.findArtistDate(a.artistId));
      const slotB = defined(data.findArtistDate(b.artistId));

      return new Date(slotA.start).getTime() - new Date(slotB.start).getTime();
    });
  }

  getArtistData(artistId: string): ArtistUserData {
    if (this.data[artistId] === undefined) {
      return { artistId, bookmark: false, notify: false, note: '' };
    }

    return this.data[artistId];
  }

  setArtistData(artistId: string, data: Partial<Omit<ArtistUserData, 'artistId'>>) {
    this.setData(artistId, {
      ...this.getArtistData(artistId),
      ...data,
    });

    if (data.bookmark === true) {
      trackEvent('Artist', 'BookmarkAdded', `Artist ${artistId} bookmark added`);
    }

    if (data.bookmark === false) {
      trackEvent('Artist', 'BookmarkRemoved', `Artist ${artistId} bookmark removed`);
    }
  }

  removeArtistData(artistId: string) {
    this.setData(artistId, undefined!);
  }
}

export const data = new Data(__DATA__ as Data.AppData);

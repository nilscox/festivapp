import { areIntervalsOverlapping, isAfter, isBefore, isWithinInterval } from 'date-fns';

import { assert } from './assert';

export class DatesOverlappingError extends Error {
  constructor(
    public readonly slot: Slot,
    public readonly start: Date,
    public readonly end: Date,
  ) {
    super('Dates are overlapping');
  }
}

export class Timetable<T = unknown, S = unknown> {
  public readonly data: T;
  public readonly slots: Slot<S>[] = [];

  constructor(data: T) {
    this.data = data;
  }

  private get firstSlot(): Slot<S> | undefined {
    return this.slots[0];
  }

  private get lastSlot(): Slot<S> | undefined {
    return this.slots[this.slots.length - 1];
  }

  get start(): Date | undefined {
    return this.firstSlot?.start;
  }

  get end(): Date | undefined {
    return this.lastSlot?.end;
  }

  addSlot(slot: Slot<S>) {
    for (const { start, end } of this.slots) {
      if (areIntervalsOverlapping({ start, end }, slot)) {
        throw new DatesOverlappingError(slot, start, end);
      }
    }

    this.slots.push(slot);
    this.slots.sort((a, b) => (isBefore(a.start, b.start) ? -1 : 1));
  }

  at(date: Date): Slot<S> | undefined {
    for (const slot of this.slots) {
      if (isBefore(date, slot.start)) {
        return;
      }

      if (isWithinInterval(date, slot)) {
        return slot;
      }
    }
  }

  next(date: Date): Slot<S> | undefined {
    for (const slot of this.slots) {
      if (isBefore(date, slot.start)) {
        return slot;
      }
    }
  }

  before(slot: Slot<S>): Slot<S> | undefined {
    const index = this.slots.indexOf(slot);

    if (index >= 0) {
      return this.slots[index - 1];
    }
  }

  after(slot: Slot<S>): Slot<S> | undefined {
    const index = this.slots.indexOf(slot);

    if (index >= 0) {
      return this.slots[index + 1];
    }
  }

  hasStarted(now: Date): boolean {
    if (this.firstSlot === undefined) {
      return false;
    }

    return isAfter(now, this.firstSlot.start);
  }

  hasEnded(now: Date): boolean {
    if (this.lastSlot === undefined) {
      return false;
    }

    return isAfter(now, this.lastSlot.end);
  }
}

export class Slot<T = unknown> {
  public readonly start: Date;
  public readonly end: Date;
  public readonly data: T;

  constructor({ start, end }: { start: Date; end: Date }, data: T) {
    assert(isBefore(start, end), 'Start must be before end');

    this.start = start;
    this.end = end;
    this.data = data;
  }
}

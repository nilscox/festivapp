import { add } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { Slot, Timetable } from './timetable';

describe('data', () => {
  it('add slot', () => {
    const timetable = new Timetable({});

    timetable.addSlot(
      new Slot({ start: new Date('2025-01-01T12:00'), end: new Date('2025-01-01T13:00') }, {}),
    );

    expect(() =>
      timetable.addSlot(
        new Slot({ start: new Date('2025-01-01T11:00'), end: new Date('2025-01-01T12:30') }, {}),
      ),
    ).toThrow('Dates are overlapping');

    expect(() =>
      timetable.addSlot(
        new Slot({ start: new Date('2025-01-01T12:30'), end: new Date('2025-01-01T13:30') }, {}),
      ),
    ).toThrow('Dates are overlapping');

    timetable.addSlot(
      new Slot({ start: new Date('2025-01-01T11:00'), end: new Date('2025-01-01T12:00') }, {}),
    );
    timetable.addSlot(
      new Slot({ start: new Date('2025-01-01T13:00'), end: new Date('2025-01-01T14:00') }, {}),
    );

    expect(timetable.slots).toHaveLength(3);
  });

  it('get slot at', () => {
    const timetable = new Timetable({});
    const date = new Date('2025-01-01T12:00Z');

    const a = new Slot({ start: date, end: add(date, { hours: 1 }) }, {});
    const b = new Slot({ start: add(date, { hours: 3 }), end: add(date, { hours: 4 }) }, {});

    timetable.addSlot(a);
    timetable.addSlot(b);

    expect(timetable.at(date)).toEqual(a);
    expect(timetable.at(add(date, { hours: 1 }))).toEqual(a);
    expect(timetable.at(add(date, { hours: 2 }))).toBeUndefined();
    expect(timetable.at(add(date, { hours: 3 }))).toEqual(b);
    expect(timetable.at(add(date, { hours: 5 }))).toBeUndefined();
  });
});

import { EventCard } from 'app/components/event-card';
import { format, intlFormat } from 'date-fns';
import Link from 'next/link';
import { EventSlot } from 'src/database/model';

export function TimetableDay({ day, events }: { day: Date; events: EventSlot[] }) {
  return (
    <section id={day.toISOString()}>
      <DayHeader day={day} />

      <ul className="my-4 col gap-4">
        {events.map((event) => (
          <li key={event.start.getTime()}>
            <EventSlotItem event={event} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayHeader({ day }: { day: Date }) {
  return (
    <header className="sticky top-2 z-10 mx-auto w-fit rounded-md bg-primary text-accent">
      <h2 className="text-lg font-medium">
        <Link href={`#${day.toISOString()}`} className="block px-4 py-2">
          {intlFormat(day, { dateStyle: 'full' })}
        </Link>
      </h2>
    </header>
  );
}

function EventSlotItem({ event }: { event: EventSlot }) {
  if (event.type === 'break') {
    return (
      <div className="col items-center overflow-hidden rounded-lg border bg-light p-8 text-dark shadow-sm">
        <div className="text-lg font-medium">Break</div>
        <div className="text-dim">
          {format(event.start, 'HH:mm aa')} - {format(event.end, 'HH:mm aa')}
        </div>
      </div>
    );
  }

  return (
    <Link href={`/events/${event.id}`}>
      <EventCard event={event} />
    </Link>
  );
}

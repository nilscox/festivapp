import { EventCard } from 'app/components/event-card';
import Link from 'next/link';
import { EventView } from 'src/database/model';

export function EventsSection({ title, events }: { title: React.ReactNode; events: EventView[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="my-10">
      <h2 className="background-text my-4 text-xl font-medium">{title}</h2>

      <ul className="col gap-4">
        {events.map((event) => (
          <li key={event.id}>
            <Link href={`/events/${event.id}`}>
              <EventCard event={event} layout="large" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

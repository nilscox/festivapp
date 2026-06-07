import { db } from '@festivapp/persistence';
import { defined } from '@festivapp/utils';
import { notFound } from 'next/navigation';

import { HeaderBackLink } from '@/components/header-back-link';

import { SingleArtistEventDetails } from './single-artist-event-details';

export default async function ({ params }: PageProps<'/events/[eventId]'>) {
  const { eventId } = await params;
  const event = await getEvent(eventId);

  const artist = event.artists.length === 1 ? defined(event.artists[0]) : null;

  return (
    <>
      <HeaderBackLink />

      <div className="my-4 overflow-hidden rounded-lg bg-light text-dark">
        {artist && <SingleArtistEventDetails event={event} artist={artist} />}
      </div>
    </>
  );
}

async function getEvent(id: string) {
  const event = await db.query.events.findFirst({
    where: { id },
    with: { location: true, artists: true },
  });

  if (!event) {
    throw notFound();
  }

  return event;
}

import { HeaderBackLink } from 'app/components/header-back-link';
import { notFound } from 'next/navigation';
import { db } from 'src/database/db';
import { defined } from 'src/utils';

import { SingleArtistEventDetails } from './single-artist-event-details';

export default async function ({ params }: PageProps<'/app/[festivalId]/events/[eventId]'>) {
  const { eventId } = await params;
  const event = await getEvent(eventId);

  const artist = event.artists.length === 1 ? defined(event.artists.at(0)) : null;

  return (
    <>
      <HeaderBackLink />

      <div className="my-4 overflow-hidden rounded-lg bg-light text-dark">
        {artist && <SingleArtistEventDetails event={event} artist={artist} />}
      </div>
    </>
  );
}

async function getEvent(id: string | undefined) {
  if (!id) {
    throw notFound();
  }

  const event = await db.query.events.findFirst({
    where: { id },
    with: { location: true, artists: true },
  });

  if (!event) {
    throw notFound();
  }

  return event;
}

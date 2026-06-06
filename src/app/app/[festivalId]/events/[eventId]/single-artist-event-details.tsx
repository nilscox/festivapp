import { EventImage } from 'app/components/event-image';
import { ShareButton } from 'app/components/share-button';
import { getCurrentHostname, getNow } from 'app/server-utils';
import { add, formatDistanceStrict, intlFormat, isWithinInterval } from 'date-fns';
import { CalendarIcon, ClockIcon, Disc3Icon, MapIcon, MapPinIcon, Share2Icon } from 'lucide-react';
import Link from 'next/link';
import { Artist, Event, Location } from 'src/database/model';

import { SocialIcon } from './social-icon';

export async function SingleArtistEventDetails({
  event,
  artist,
}: {
  event: Event & { location: Location };
  artist: Artist;
}) {
  return (
    <>
      <EventImage src={event.image ?? artist.image} className="h-64 w-full object-cover" />

      <div className="col gap-4 p-4">
        <h1 className="my-0 text-2xl font-semibold">{event.title ?? artist.name}</h1>

        {(artist.origin || artist.label) && (
          <div className="row items-center gap-4 text-sm text-dim">
            {artist.origin && (
              <div className="row items-center gap-1">
                <MapIcon className="size-4" />
                {artist.origin}
              </div>
            )}
            {artist.label && (
              <div className="row items-center gap-1">
                <Disc3Icon className="size-4" />
                {artist.label}
              </div>
            )}
          </div>
        )}

        <div className="text-dim">{artist.styles.join(' / ')}</div>

        <ul className="col gap-3">
          <StartDateInfo event={event} />
          <StartTimeInfo event={event} />
          <LocationInfo event={event} />
        </ul>

        <p className="leading-relaxed">{event.description ?? artist.description}</p>

        <SocialLinks event={event} artist={artist} />
      </div>
    </>
  );
}

function StartDateInfo({ event }: { event: Event }) {
  return (
    <li className="row gap-2">
      <CalendarIcon aria-label="Date" className="size-(tw-leading) text-dim" />
      <div>{intlFormat(event.start, { dateStyle: 'full' })}</div>
    </li>
  );
}

async function StartTimeInfo({ event }: { event: Event }) {
  const now = await getNow();

  return (
    <li className="row gap-2">
      <ClockIcon aria-label="Time" className="size-(tw-leading) text-dim" />

      <div>
        <div>{intlFormat(event.start, { timeStyle: 'medium' })}</div>

        {isWithinInterval(event.start, { start: now, end: add(now, { hours: 6 }) }) && (
          <div className="text-sm text-dim">{formatDistanceStrict(event.start, now, { addSuffix: true })}</div>
        )}
      </div>
    </li>
  );
}

function LocationInfo({ event }: { event: Event & { location: Location } }) {
  return (
    <li className="row gap-2">
      <MapPinIcon aria-label="Location" className="size-(tw-leading) text-dim" />

      <div>
        <div>{event.location.label}</div>

        <Link href="/map" className="text-sm text-dim underline">
          View on map
        </Link>
      </div>
    </li>
  );
}

async function SocialLinks({ event, artist }: { event: Event; artist: Artist }) {
  return (
    <div className="my-4 row flex-wrap items-center justify-evenly gap-4">
      {artist.social?.map((link, index) => (
        <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="rounded-md bg-gray-200 p-2">
          <SocialIcon host={new URL(link).host} className="size-6 fill-gray-600" />
        </a>
      ))}

      <ShareButton
        url={`${await getCurrentHostname()}/events/${event.id}`}
        title={event.title ?? artist.name}
        type="button"
        className="row items-center gap-2 rounded-md bg-gray-200 p-2"
      >
        <Share2Icon className="size-6 shrink-0 text-gray-600" />
        <div className="text-sm font-semibold">Share</div>
      </ShareButton>
    </div>
  );
}

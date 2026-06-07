import { EventView } from '@festivapp/persistence';
import clsx from 'clsx';
import { add, format, isWithinInterval } from 'date-fns';
import { ClockIcon, MapPinIcon } from 'lucide-react';

import { getNow } from '@/server-utils';

import { DistanceToNow } from './distance-to-now';
import { EventImage } from './event-image';

export function EventCard({ event, layout }: { event: EventView; layout?: 'large' }) {
  return (
    <div
      id={event.id}
      className={clsx('overflow-hidden rounded-lg bg-light text-dark shadow-sm', {
        row: layout !== 'large',
        col: layout === 'large',
      })}
    >
      <div className={clsx('relative shrink-0', { 'w-32': layout !== 'large' })}>
        <EventImage
          src={event.image}
          className={clsx('w-full object-cover', layout === 'large' ? 'h-40' : 'min-h-34')}
        />

        {layout === 'large' && event.isLive && <LiveBadge />}
      </div>

      <div className="col flex-1 gap-2 p-4">
        <div className="row items-start justify-between gap-2">
          <div className="text-lg font-medium">{event.title}</div>
          <StartTimeInfo event={event} layout={layout} />
        </div>

        <div className="line-clamp-2 text-sm text-dim">{event.shortInfo}</div>

        <div className="row flex-wrap items-center gap-3 text-sm leading-none text-dim">
          <LocationInfo event={event} />
          <TimeInfo event={event} />
        </div>
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="absolute top-3 right-3 row items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white uppercase">
      <div className="size-2 animate-pulse rounded-full bg-white" />
      Live
    </div>
  );
}

async function StartTimeInfo({ event, layout }: { event: EventView; layout?: 'large' }) {
  const now = await getNow();

  if (event.isLive && layout !== 'large') {
    return (
      <div className="row items-center gap-1 text-sm leading-none text-red-600">
        <div className="size-2 animate-pulse rounded-full bg-current" />
        Live
      </div>
    );
  }

  if (isWithinInterval(event.start, { start: now, end: add(now, { hours: 6 }) })) {
    return (
      <div className="text-sm">
        <DistanceToNow date={event.start} abbreviated addSuffix strict />
      </div>
    );
  }

  return null;
}

function LocationInfo({ event }: { event: EventView }) {
  return (
    <div className="row items-center gap-1">
      <div>
        <MapPinIcon className="block size-4 shrink-0" />
      </div>
      {event.location}
    </div>
  );
}

function TimeInfo({ event }: { event: EventView }) {
  return (
    <div className="row items-center gap-1">
      <ClockIcon className="block size-4 shrink-0" />

      {event.isLive ? (
        <>
          {format(event.start, 'HH:mm aa')} - {format(event.end, 'HH:mm aa')}
        </>
      ) : (
        <>{format(event.start, 'HH:mm aa')}</>
      )}
    </div>
  );
}

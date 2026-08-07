import { formatImagePosition } from '@festivapp/utils';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { isWithinInterval } from 'date-fns';
import { Radio } from 'lucide-react';

import { type ResolvedSession } from '../lib/bootstrap.ts';
import { formatSessionType, sessionImage, sessionListMeta, sessionTitle } from '../lib/session.ts';
import { Chip } from './chip.tsx';

export function SessionCard({
  session,
  now,
  showLiveIcon = true,
}: {
  session: ResolvedSession;
  now: Date;
  showLiveIcon?: boolean;
}) {
  const isLive = isWithinInterval(now, { start: session.startsAt, end: session.endsAt });

  return (
    <Link to="/session/$sessionId" params={{ sessionId: session.id }} className="row items-start gap-4 py-3">
      <Thumbnail session={session} />

      <div className="min-w-0 flex-1">
        <div className="row items-center gap-2">
          {isLive && showLiveIcon && <Radio className="text-accent size-4" />}

          <div className="font-display line-clamp-2 leading-tight font-semibold">{sessionTitle(session)}</div>

          <Chip size="small">{formatSessionType(session.type)}</Chip>
        </div>

        <div className="text-muted mt-0.5 text-sm">{session.location.name}</div>

        <div className="text-muted mt-0.5 text-sm">{sessionListMeta(session)}</div>
      </div>
    </Link>
  );
}

function Thumbnail({ session }: { session: ResolvedSession }) {
  const image = sessionImage(session);

  const times = (
    <div
      className={clsx(
        'col absolute inset-x-0 rounded-b-lg bottom-0 px-2 pt-2 pb-0.5 font-mono leading-tight tabular-nums',
        image ? 'bg-linear-to-t from-black/80 via-black/50 via-60% to-transparent' : 'bg-black/60',
      )}
    >
      <span className="text-xs font-semibold text-white text-shadow-sm">{session.startTime}</span>
      <span className="text-xs text-white text-shadow-sm">{session.endTime}</span>
    </div>
  );

  if (image) {
    return (
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
        <img
          src={image.url}
          alt=""
          style={{ objectPosition: formatImagePosition(image.position) }}
          className="size-full object-cover"
        />
        {times}
      </div>
    );
  }

  return <div className="hatch border-line relative size-20 shrink-0 rounded-lg border">{times}</div>;
}

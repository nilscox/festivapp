'use client';

import { Festival } from '@festivapp/persistence';
import { Trans } from '@lingui/react/macro';
import { differenceInDays, intervalToDuration } from 'date-fns';

import { Markdown } from '@/components/markdown';
import { useNow } from '@/hooks/use-now';

export function BeforeStart({ festival, info }: { festival: Festival; info: string | null }) {
  const now = useNow();

  const { hours, minutes } = intervalToDuration({ start: now, end: festival.start });
  const days = differenceInDays(festival.start, now);

  return (
    <div className="bg-primary/80 rounded-md px-2 py-1 text-center col gap-6">
      <p className="text-dim text-sm">
        <Trans>{festival.name} has not started yet.</Trans>
      </p>

      <div className="row gap-2 items-center justify-evenly">
        <div className="col gap-1 items-center">
          <span className="text-4xl">{days}</span>
          <span className="text-dim">
            <Trans>days</Trans>
          </span>
        </div>

        <div className="col gap-1 items-center">
          <span className="text-4xl">{hours}</span>
          <span className="text-dim">
            <Trans>hours</Trans>
          </span>
        </div>

        <div className="col gap-1 items-center">
          <span className="text-4xl">{minutes}</span>
          <span className="text-dim">
            <Trans>minutes</Trans>
          </span>
        </div>
      </div>

      {info && <Markdown markdown={info} />}
    </div>
  );
}

'use client';

import { formatDistance, formatDistanceStrict } from 'date-fns';
import { useNow } from 'src/hooks/use-now';
import { formatDistanceAbbreviated } from 'src/utils';

export function DistanceToNow({
  date,
  strict,
  addSuffix,
  abbreviated,
}: {
  date: Date;
  strict?: boolean;
  addSuffix?: boolean;
  abbreviated?: boolean;
}) {
  const now = useNow();
  const fn = strict ? formatDistanceStrict : formatDistance;

  return fn(date, now, {
    addSuffix,
    locale: abbreviated ? { formatDistance: formatDistanceAbbreviated } : undefined,
  });
}

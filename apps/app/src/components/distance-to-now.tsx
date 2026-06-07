'use client';

import { formatDistanceAbbreviated } from '@festivapp/utils/client';
import { formatDistance, formatDistanceStrict } from 'date-fns';

import { useNow } from '@/hooks/use-now';

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

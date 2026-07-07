import { Trans } from '@lingui/react/macro';
import clsx from 'clsx';
import Link from 'next/link';

import { updateQuery } from '@/server-utils';

export function SavedEventsFilter({
  isActive,
  searchParams,
}: {
  isActive: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <Link
      href={updateQuery(searchParams, (params: URLSearchParams) => {
        if (isActive) {
          params.delete('savedOnly');
        } else {
          params.set('savedOnly', 'true');
        }
      })}
      className={clsx('rounded-full px-2 py-1.5 text-sm leading-none font-medium', {
        'bg-primary text-accent': !isActive,
        'bg-accent text-primary': isActive,
      })}
    >
      <Trans>Saved</Trans>
    </Link>
  );
}

import { Location } from '@festivapp/persistence';
import clsx from 'clsx';
import Link from 'next/link';

import { updateQuery } from '@/server-utils';

export function LocationFilter({
  locations,
  active,
  searchParams,
}: {
  locations: Location[];
  active: Location;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <div className="my-4 row flex-wrap items-center gap-3">
      {locations.map((location) => (
        <Link
          key={location.id}
          href={updateQuery(searchParams, (params: URLSearchParams) => {
            params.set('location', location.id);
          })}
          className={clsx('rounded-full px-2 py-1.5 text-sm leading-none font-medium', {
            'bg-primary text-accent': location.id !== active.id,
            'bg-accent text-primary': location.id === active.id,
          })}
        >
          {location.label}
        </Link>
      ))}
    </div>
  );
}

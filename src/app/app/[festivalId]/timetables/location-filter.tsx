import clsx from 'clsx';
import Link from 'next/link';
import { Location } from 'src/database/model';

export function LocationFilter({ locations, active }: { locations: Location[]; active: Location }) {
  return (
    <div className="my-4 row flex-wrap items-center gap-3">
      {locations.map((location) => (
        <Link
          key={location.id}
          href={`?location=${location.id}`}
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

import { getFestival } from 'app/server-utils';
import { CalendarIcon, MapPinIcon, PlayIcon, UsersIcon } from 'lucide-react';

import { NavigationItem } from './navigation-item';

export async function Navigation() {
  const festival = await getFestival();

  return (
    <nav
      className="fixed bottom-0 h-16 w-full max-w-4xl border-t z-10"
      style={{ backgroundColor: festival.primaryColor ?? undefined }}
    >
      <ul className="row h-full items-stretch">
        <li className="flex-1 py-2">
          <NavigationItem icon={<PlayIcon className="size-5" />} label="Now" href="/" strict />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem icon={<CalendarIcon className="size-5" />} label="Timetables" href="/timetables" />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem icon={<MapPinIcon className="size-5" />} label="Map" href="/map" />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem icon={<UsersIcon className="size-5" />} label="Social" href="/social" />
        </li>
      </ul>
    </nav>
  );
}

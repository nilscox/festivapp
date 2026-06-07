import { Trans } from '@lingui/react/macro';
import { CalendarIcon, MapPinIcon, PlayIcon, UsersIcon } from 'lucide-react';

import { getFestival } from '@/server-utils';

import { NavigationItem } from './navigation-item';

export async function Navigation() {
  const festival = await getFestival();

  return (
    <nav
      className="fixed bottom-0 z-10 h-16 w-full max-w-4xl border-t"
      style={{ backgroundColor: festival.primaryColor ?? undefined }}
    >
      <ul className="row h-full items-stretch">
        <li className="flex-1 py-2">
          <NavigationItem icon={<PlayIcon className="size-5" />} label={<Trans>Now</Trans>} href="/" strict />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem
            icon={<CalendarIcon className="size-5" />}
            label={<Trans>Timetables</Trans>}
            href="/timetables"
          />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem icon={<MapPinIcon className="size-5" />} label={<Trans>Map</Trans>} href="/map" />
        </li>

        <li className="flex-1 py-2">
          <NavigationItem icon={<UsersIcon className="size-5" />} label={<Trans>Social</Trans>} href="/social" />
        </li>
      </ul>
    </nav>
  );
}

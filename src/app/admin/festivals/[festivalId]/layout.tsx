import { CalendarRangeIcon, HouseIcon, MapPinIcon, PaintbrushIcon, UserIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getFestival } from '../../server-utils';
import { NavigationItem } from './navigation-item';

export default async function FestivalLayout({ params, children }: LayoutProps<'/admin/festivals/[festivalId]'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return (
    <div>
      <div className="row items-center gap-2 text-sm text-dim">
        <Link href="/admin">Festivals</Link>
        <span>/</span>
        <span>{festival.name}</span>
      </div>

      <h1 className="my-6">{festival.name}</h1>

      <div className="row gap-4 md:gap-6 items-start">
        <nav className="md:w-64">
          <ul className="col gap-2">
            <NavigationItem href={`/admin/festivals/${festivalId}`} strict icon={<HouseIcon className="size-4" />}>
              Main info
            </NavigationItem>
            <NavigationItem href={`/admin/festivals/${festivalId}/people`} icon={<UserIcon className="size-4" />}>
              People
            </NavigationItem>
            <NavigationItem
              href={`/admin/festivals/${festivalId}/schedule`}
              icon={<CalendarRangeIcon className="size-4" />}
            >
              Schedule
            </NavigationItem>
            <NavigationItem href={`/admin/festivals/${festivalId}/theme`} icon={<PaintbrushIcon className="size-4" />}>
              Theme
            </NavigationItem>
            <NavigationItem href={`/admin/festivals/${festivalId}/map`} icon={<MapPinIcon className="size-4" />}>
              Map
            </NavigationItem>
            <NavigationItem href={`/admin/festivals/${festivalId}/posts`} icon={<UsersIcon className="size-4" />}>
              Posts
            </NavigationItem>
          </ul>
        </nav>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

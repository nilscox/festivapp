import {
  CalendarRangeIcon,
  HouseIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PaintbrushIcon,
  UsersIcon,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { Breadcrumb } from '@/components/breadcrumb';
import { NavigationItem } from '@/components/navigation-item';
import { getFestival } from '@/server-utils';

export default async function FestivalLayout({ params, children }: LayoutProps<'/festivals/[festivalId]'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return (
    <div>
      <Breadcrumb parts={[{ label: 'Festivals', href: '/' }, { label: festival.name }]} />

      <div className="mt-6 row items-start gap-4 md:gap-6">
        <Navigation festivalId={festivalId} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function Navigation({ festivalId }: { festivalId: string }) {
  const prefix = `/festivals/${festivalId}`;

  return (
    <nav className="md:w-64">
      <ul className="col gap-2">
        <NavigationItem href={`${prefix}`} strict icon={<HouseIcon className="size-4" />}>
          Main info
        </NavigationItem>
        <NavigationItem href={`${prefix}/people`} icon={<UsersIcon className="size-4" />}>
          People
        </NavigationItem>
        <NavigationItem href={`${prefix}/timetables`} icon={<CalendarRangeIcon className="size-4" />}>
          Timetables
        </NavigationItem>
        <NavigationItem href={`${prefix}/theme`} icon={<PaintbrushIcon className="size-4" />}>
          Theme
        </NavigationItem>
        <NavigationItem href={`${prefix}/map`} icon={<MapPinIcon className="size-4" />}>
          Map
        </NavigationItem>
        <NavigationItem href={`${prefix}/posts`} icon={<MessageSquareTextIcon className="size-4" />}>
          Posts
        </NavigationItem>
      </ul>
    </nav>
  );
}

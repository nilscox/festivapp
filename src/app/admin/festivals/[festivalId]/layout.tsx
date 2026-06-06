import { Breadcrumb } from 'admin/components/breadcrumb';
import { NavigationItem } from 'admin/components/navigation-item';
import { getFestival } from 'admin/server-utils';
import {
  CalendarRangeIcon,
  HouseIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  PaintbrushIcon,
  UsersIcon,
} from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function FestivalLayout({ params, children }: LayoutProps<'/admin/festivals/[festivalId]'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return (
    <div>
      <Breadcrumb parts={[{ label: 'Festivals', href: '/admin' }, { label: festival.name }]} />

      <div className="row gap-4 md:gap-6 items-start mt-6">
        <Navigation festivalId={festivalId} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

function Navigation({ festivalId }: { festivalId: string }) {
  const prefix = `/admin/festivals/${festivalId}`;

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

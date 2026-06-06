import { getFestival } from 'admin/server-utils';
import { notFound } from 'next/navigation';

import { MapForm } from './map-form';

export default async function AdminMapPage({ params }: PageProps<'/admin/festivals/[festivalId]/map'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return <MapForm festival={festival} />;
}

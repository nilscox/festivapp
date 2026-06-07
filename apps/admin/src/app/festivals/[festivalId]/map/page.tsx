import { notFound } from 'next/navigation';

import { getFestival } from '@/server-utils';

import { MapForm } from './map-form';

export default async function AdminMapPage({ params }: PageProps<'/festivals/[festivalId]/map'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return <MapForm festival={festival} />;
}

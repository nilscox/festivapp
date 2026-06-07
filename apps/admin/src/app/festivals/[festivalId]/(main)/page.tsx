import { notFound } from 'next/navigation';

import { getFestival } from '@/server-utils';

import { MainInfoForm } from './main-info-form';

export default async function EditFestivalPage({ params }: PageProps<'/festivals/[festivalId]'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return <MainInfoForm festival={festival} />;
}

import { notFound } from 'next/navigation';
import { getFestival } from 'src/app/admin/server-utils';

import { MainInfoForm } from './main-info-form';

export default async function EditFestivalPage({ params }: PageProps<'/admin/festivals/[festivalId]'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return <MainInfoForm festival={festival} />;
}

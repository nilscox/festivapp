import { notFound } from 'next/navigation';

import { getFestival } from '@/server-utils';

import { ThemeForm } from './theme-form';

export default async function AdminThemePage({ params }: PageProps<'/festivals/[festivalId]/theme'>) {
  const { festivalId } = await params;
  const festival = await getFestival(festivalId);

  if (!festival) {
    notFound();
  }

  return <ThemeForm festival={festival} />;
}

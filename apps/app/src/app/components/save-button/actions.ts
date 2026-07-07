'use server';

import { refresh } from 'next/cache';
import { cookies } from 'next/headers';

import { getSavedEventIds } from '@/server-utils';

export async function onSaveEvent(eventId: string) {
  const savedEvents = await getSavedEventIds();
  const cookieStore = await cookies();

  if (savedEvents.has(eventId)) {
    savedEvents.delete(eventId);
  } else {
    savedEvents.add(eventId);
  }

  cookieStore.set('savedEvents', [...savedEvents.values()].join(';'));

  refresh();
}

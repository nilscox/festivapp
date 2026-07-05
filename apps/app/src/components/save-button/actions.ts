'use server';

import { refresh } from 'next/cache';
import { cookies } from 'next/headers';

import { getSavedEvents } from '@/server-utils';

export async function onSaveEvent(eventId: string) {
  const savedEvents = await getSavedEvents();
  const cookieStore = await cookies();
  const newSaved = new Set<string>(savedEvents);

  if (newSaved.has(eventId)) {
    newSaved.delete(eventId);
  } else {
    newSaved.add(eventId);
  }

  cookieStore.set('savedEvents', JSON.stringify([...newSaved.values()]));

  refresh();
}

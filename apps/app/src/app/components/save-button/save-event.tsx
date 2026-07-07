import { getSavedEventIds } from '@/server-utils';

import { SaveButton } from './save-button';

export async function SaveEvent({ eventId }: { eventId: string }) {
  const savedEvents = await getSavedEventIds();

  return <SaveButton eventId={eventId} isSaved={savedEvents.has(eventId)} />;
}

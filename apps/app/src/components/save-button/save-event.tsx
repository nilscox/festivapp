import { SaveButton } from '@/components/save-button/save-button';
import { getSavedEvents } from '@/server-utils';

export async function SaveEvent({ eventId }: { eventId: string }) {
  const savedEvents = await getSavedEvents();

  return <SaveButton eventId={eventId} isSaved={savedEvents.includes(eventId)} />;
}

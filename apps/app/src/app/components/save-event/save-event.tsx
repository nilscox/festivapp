import { Trans } from '@lingui/react/macro';
import clsx from 'clsx';
import { BookmarkIcon } from 'lucide-react';

import { onSaveEvent } from '@/app/components/save-event/actions';
import { getSavedEventIds } from '@/server-utils';

export async function SaveEvent({ eventId }: { eventId: string }) {
  const savedEvents = await getSavedEventIds();
  const isSaved = savedEvents.has(eventId);

  return (
    <button type="button" className="row items-center gap-1 cursor-pointer" onClick={onSaveEvent.bind(null, eventId)}>
      <BookmarkIcon className={clsx('size-4', isSaved ? 'fill-primary' : 'fill-none')} />
      {isSaved ? <Trans>Saved</Trans> : <Trans>Save</Trans>}
    </button>
  );
}

'use client';

import { Trans } from '@lingui/react/macro';
import clsx from 'clsx';
import { BookmarkIcon } from 'lucide-react';

import { onSaveEvent } from './actions';

export function SaveButton({ eventId, isSaved }: { eventId: string; isSaved: boolean }) {
  return (
    <button
      className="row items-center gap-1"
      onClick={(event) => {
        event.stopPropagation();
        onSaveEvent(eventId);
      }}
    >
      <BookmarkIcon className={clsx('size-4', isSaved ? 'fill-primary' : 'fill-none')} />
      {isSaved ? <Trans>Saved</Trans> : <Trans>Save</Trans>}
    </button>
  );
}

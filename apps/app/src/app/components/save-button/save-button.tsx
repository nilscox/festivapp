'use client';

import { Trans } from '@lingui/react/macro';
import clsx from 'clsx';
import { BookmarkIcon } from 'lucide-react';

import { onSaveEvent } from './actions';

export function SaveButton({ eventId, isSaved }: { eventId: string; isSaved: boolean }) {
  const handleSave: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    event.preventDefault();

    onSaveEvent(eventId);
  };

  return (
    <button className="row items-center gap-1" onClick={handleSave}>
      <BookmarkIcon className={clsx('size-4', isSaved ? 'fill-primary' : 'fill-none')} />
      {isSaved ? <Trans>Saved</Trans> : <Trans>Save</Trans>}
    </button>
  );
}

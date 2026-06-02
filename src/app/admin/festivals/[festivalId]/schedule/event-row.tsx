'use client';

import { format } from 'date-fns';
import { TrashIcon } from 'lucide-react';
import { useActionState, useState } from 'react';
import { Button } from 'src/app/admin/components/button';
import { Field } from 'src/app/admin/components/field';
import { ImageInput } from 'src/app/admin/components/image-input';
import { Input } from 'src/app/admin/components/input';
import { Textarea } from 'src/app/admin/components/textarea';
import { formatDateInput } from 'src/app/admin/utils';
import { Artist, Event } from 'src/database/model';

import { createEvent, deleteEvent, updateEvent } from './actions';
import { ArtistSearch } from './artist-search';

type EventRowProps = {
  festivalId: string;
  locationId: string;
  allArtists: Artist[];
  event?: Event & { artists: Artist[] };
};

export function EventRow({ festivalId, locationId, allArtists, event }: EventRowProps) {
  const [expanded, setExpanded] = useState(!event); // New events start expanded
  const isNew = !event;

  const action = isNew ? createEvent : updateEvent.bind(null);
  const [state, formAction, pending] = useActionState(action, { success: false });

  const handleAfterSubmit = () => {
    if (state.success) {
      setExpanded(false);
    }
  };

  if (expanded) {
    return (
      <div className="rounded-md border border-gray-300 bg-white p-4">
        <form action={formAction} className="col gap-4" onSubmit={() => handleAfterSubmit()}>
          {!state.success && state.error && (
            <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {state.error}
            </div>
          )}

          <input type="hidden" name="festivalId" value={festivalId} />
          <input type="hidden" name="locationId" value={locationId} />
          {event && <input type="hidden" name="eventId" value={event.id} />}

          <div className="row gap-4">
            <Field label="Start" className="flex-1">
              <Input
                type="datetime-local"
                name="start"
                required
                defaultValue={event ? formatDateInput(event.start) : ''}
              />
            </Field>

            <Field label="End" className="flex-1">
              <Input
                type="datetime-local"
                name="end"
                required
                defaultValue={event ? formatDateInput(event.end) : ''}
              />
            </Field>
          </div>

          <Field label="Type">
            <select
              name="type"
              defaultValue={event?.type ?? ''}
              className="rounded-md border border-gray-400 px-2 py-1 bg-white"
            >
              <option value="">-- Select type --</option>
              <option value="live">Live</option>
              <option value="dj_set">DJ Set</option>
              <option value="talk">Talk</option>
              <option value="workshop">Workshop</option>
            </select>
          </Field>

          <Field label="Title (optional)">
            <Input name="title" defaultValue={event?.title ?? ''} />
          </Field>

          <Field label="Description (optional)">
            <Textarea name="description" rows={3} defaultValue={event?.description ?? ''} />
          </Field>

          <Field label="Image">
            <ImageInput name="image" currentRef={event?.image} />
          </Field>

          <Field label="Artists">
            <ArtistSearch
              allArtists={allArtists}
              initialArtistIds={event?.artists.map((a) => a.id) ?? []}
            />
          </Field>

          <div className="row items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : isNew ? 'Create event' : 'Save event'}
            </Button>

            {!isNew && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            )}

            {isNew && (
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                Discard
              </button>
            )}

            {state.success && <span className="text-sm text-green-700">Saved.</span>}
          </div>
        </form>
      </div>
    );
  }

  // Collapsed view
  if (!event) {
    return null; // Should not happen, but guard it
  }

  return <CollapsedEventRow event={event} onExpand={() => setExpanded(true)} />;
}

function CollapsedEventRow({
  event,
  onExpand,
}: {
  event: Event & { artists: Artist[] };
  onExpand: () => void;
}) {

  return (
    <div
      onClick={onExpand}
      className="row items-center justify-between gap-4 rounded-md border border-gray-300 bg-white px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="row items-center gap-3 flex-1">
        <div className="w-24 flex-shrink-0 text-sm text-dim">
          {format(event.start, 'HH:mm')} – {format(event.end, 'HH:mm')}
        </div>

        {event.type && (
          <div className="inline-block text-xs px-2 py-1 rounded-full border border-gray-300 bg-gray-100 text-gray-700 flex-shrink-0">
            {event.type.replace('_', ' ')}
          </div>
        )}

        <div className="flex-1">
          <div className="font-medium">
            {event.title || event.artists[0]?.name || '(untitled)'}
          </div>
          {event.artists.length > 0 && (
            <div className="text-sm text-dim">{event.artists.map((a) => a.name).join(', ')}</div>
          )}
        </div>
      </div>

      <DeleteEventButton eventId={event.id} />
    </div>
  );
}

function DeleteEventButton({ eventId }: { eventId: string }) {
  const [, deleteAction] = useActionState(deleteEvent, { success: false });

  return (
    <form
      action={async (formData: FormData) => {
        if (window.confirm('Delete this event?')) {
          await deleteAction(formData);
        }
      }}
      className="flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        aria-label="Delete event"
      >
        <TrashIcon className="size-4" />
      </button>
    </form>
  );
}

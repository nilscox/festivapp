'use client';

import { Button } from 'admin/components/button';
import { Field } from 'admin/components/field';
import { ImageInput } from 'admin/components/image-input';
import { Input } from 'admin/components/input';
import { Textarea } from 'admin/components/textarea';
import { formatDateInput } from 'admin/utils';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Select } from 'src/app/admin/components/select';
import { Artist, Event } from 'src/database/model';

import { createEvent, deleteEvent, updateEvent } from './actions';
import { ArtistsCombobox } from './artists-combobox';

export function EventForm({
  festivalId,
  locationId,
  event,
  artists,
  actions,
  onSuccessAction,
}: {
  festivalId: string;
  locationId: string;
  event?: Event & { artists: Artist[] };
  artists: Artist[];
  actions: React.ReactNode;
  onSuccessAction?: () => void;
}) {
  const [state, action] = useActionState(event ? updateEvent : createEvent, { success: false });

  useEffect(() => {
    if (state.success) {
      onSuccessAction?.();
    }
  }, [state]);

  const getTypeLabel = (type: Event['type']) => {
    return {
      live: 'Live',
      dj_set: 'DJ Set',
      talk: 'Talk',
      workshop: 'Workshop',
    }[type];
  };

  return (
    <form action={action} className="col gap-4">
      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <input type="hidden" name="festivalId" value={festivalId} />
      <input type="hidden" name="locationId" value={locationId} />
      {event && <input type="hidden" name="eventId" value={event.id} />}

      <Field label="Type" className="max-w-lg">
        <Select<Event['type']>
          items={['live', 'dj_set', 'talk', 'workshop']}
          defaultValue={event?.type}
          itemToKey={(type) => type}
          itemToString={(type) => (type ? getTypeLabel(type) : '')}
          placeholder="Select a type"
          renderItem={getTypeLabel}
          renderSelectedItem={(type) => (
            <>
              {getTypeLabel(type)}
              <input type="hidden" name="type" value={type} />
            </>
          )}
        />
      </Field>

      <div className="row gap-4 max-w-lg">
        <Field label="Start" className="flex-1">
          <Input type="datetime-local" name="start" required defaultValue={event ? formatDateInput(event.start) : ''} />
        </Field>

        <Field label="End" className="flex-1">
          <Input type="datetime-local" name="end" required defaultValue={event ? formatDateInput(event.end) : ''} />
        </Field>
      </div>

      <Field label="Artists">
        <ArtistsCombobox artists={artists} defaultValue={event?.artists} />
      </Field>

      <Field label="Title">
        <Input name="title" placeholder={event?.artists[0]?.name} defaultValue={event?.title ?? ''} />
      </Field>

      <Field label="Description">
        <Textarea
          name="description"
          rows={6}
          placeholder={event?.artists[0]?.description ?? undefined}
          defaultValue={event?.description ?? ''}
        />
      </Field>

      <Field label="Image">
        <ImageInput name="image" src={event?.image ?? event?.artists[0]?.image ?? undefined} />
      </Field>

      {actions}
    </form>
  );
}

export function EventFormSubmit({ event }: { event?: Event }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending}>
      {event ? 'Save' : 'Create event'}
    </Button>
  );
}

export function EventFormDelete() {
  const [, deleteAction, deletePending] = useActionState(deleteEvent, { success: false });

  return (
    <Button
      type="submit"
      formAction={async (formData: FormData) => {
        if (window.confirm('Delete this event?')) {
          await deleteAction(formData);
        }
      }}
      variant="ghost"
      loading={deletePending}
    >
      Delete event
    </Button>
  );
}

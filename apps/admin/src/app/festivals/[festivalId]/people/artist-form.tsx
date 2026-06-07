'use client';

import { Artist } from '@festivapp/persistence';
import { Collapsible } from 'radix-ui';
import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { FieldArray } from '@/components/field-array';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';

import { updateArtist } from './actions';

export function ArtistForm({ artist }: { artist: Artist }) {
  const [state, action, pending] = useActionState(updateArtist, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state.success) {
      closeButton.current?.click();
    }
  }, [state.success]);

  return (
    <form action={action} className="col gap-4">
      <Collapsible.Trigger ref={closeButton} className="hidden" />

      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <input type="hidden" name="artistId" value={artist.id} />

      <Field label="Name" error={fieldError('name')} className="max-w-lg">
        <Input name="name" defaultValue={artist.name} />
      </Field>

      <Field label="Origin" error={fieldError('origin')} className="max-w-lg">
        <Input name="origin" defaultValue={artist.origin ?? ''} />
      </Field>

      <Field label="Label" error={fieldError('label')} className="max-w-lg">
        <Input name="label" defaultValue={artist.label ?? ''} />
      </Field>

      <Field label="Image" error={fieldError('image')}>
        <Input name="image" defaultValue={artist.image ?? ''} />
      </Field>

      <Field label="Description" error={fieldError('description')}>
        <Textarea name="description" defaultValue={artist.description ?? ''} rows={12} />
      </Field>

      <Field label="Styles" error={fieldError('styles')} className="max-w-lg">
        <FieldArray name="styles" values={artist.styles} />
      </Field>

      <Field label="Social links" error={fieldError('social')} className="max-w-lg">
        <FieldArray name="social" values={artist.social ?? []} />
      </Field>

      <div>
        <Button type="submit" disabled={pending} loading={pending}>
          Save change
        </Button>
      </div>
    </form>
  );
}

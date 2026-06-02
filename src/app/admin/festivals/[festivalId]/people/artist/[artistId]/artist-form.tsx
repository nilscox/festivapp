'use client';

import { produce } from 'immer';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useActionState, useReducer } from 'react';
import { Button } from 'src/app/admin/components/button';
import { Field } from 'src/app/admin/components/field';
import { Input } from 'src/app/admin/components/input';
import { Textarea } from 'src/app/admin/components/textarea';
import { Artist } from 'src/database/model';
import { createId } from 'src/utils';

import { updateArtist } from '../actions';

function producer(
  fields: Array<{ id: string; value: string }>,
  action: { type: 'add'; initialValue?: string } | { type: 'remove'; id: string },
) {
  if (action.type === 'add') {
    fields.push({ id: createId(), value: action.initialValue ?? '' });
  }

  if (action.type === 'remove') {
    const index = fields.findIndex((field) => field.id === action.id);

    fields.splice(index, 1);
  }
}

function useFieldArray(initialValues: string[]) {
  return useReducer(
    produce(producer),
    initialValues.map((value) => ({ id: createId(), value })),
  );
}

function FieldArray({ values: initialValues, name }: { values: string[]; name: string }) {
  const [values, dispatch] = useFieldArray(initialValues);

  return (
    <>
      {values.map(({ value, id }) => (
        <div key={id} className="row gap-2 items-center">
          <Input name={name} defaultValue={value} className="flex-1" />
          <Button variant="ghost" onClick={() => dispatch({ type: 'remove', id })}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" onClick={() => dispatch({ type: 'add' })} className="self-start">
        <PlusIcon className="size-4" />
        Add
      </Button>
    </>
  );
}

export function ArtistForm({ artist }: { artist: Artist }) {
  const [state, action, pending] = useActionState(updateArtist, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  return (
    <form action={action} className="col gap-4">
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

      <div className="row items-center gap-3 pt-2">
        <Button type="submit" disabled={pending} loading={pending}>
          Save change
        </Button>

        {state.success && <span className="text-sm text-green-700">Saved.</span>}
      </div>
    </form>
  );
}

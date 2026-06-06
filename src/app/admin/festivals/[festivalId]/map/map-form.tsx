'use client';

import { Button } from 'admin/components/button';
import { Field } from 'admin/components/field';
import { ImageInput } from 'admin/components/image-input';
import { useActionState } from 'react';
import { Festival } from 'src/database/model';

import { updateFestival } from '../../actions';

export function MapForm({ festival }: { festival: Festival }) {
  const [state, action, pending] = useActionState(updateFestival, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  return (
    <form action={action} className="col max-w-lg gap-4">
      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <input type="hidden" name="festivalId" value={festival.id} />

      <Field error={fieldError('map')} hint="Leave empty to keep the current image">
        <ImageInput name="map" src={festival.map} />
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

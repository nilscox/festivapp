'use client';

import { Button } from 'admin/components/button';
import { Field } from 'admin/components/field';
import { ImageInput } from 'admin/components/image-input';
import { Input } from 'admin/components/input';
import { Textarea } from 'admin/components/textarea';
import { updateFestival } from 'admin/festivals/actions';
import { useActionState } from 'react';
import { Festival } from 'src/database/model';

export function ThemeForm({ festival }: { festival: Festival }) {
  const [state, action, pending] = useActionState(updateFestival, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  return (
    <form action={action} className="col max-w-lg gap-4">
      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <input type="hidden" name="festivalId" value={festival.id} />

      <div className="row gap-4">
        <Field label="Primary color" error={fieldError('primaryColor')} className="max-w-32 flex-1">
          <Input
            type="color"
            name="primaryColor"
            defaultValue={festival.primaryColor ?? '#ffffff'}
            className="h-10 w-full"
          />
        </Field>

        <Field label="Accent color" error={fieldError('accentColor')} className="max-w-32 flex-1">
          <Input
            type="color"
            name="accentColor"
            defaultValue={festival.accentColor ?? '#000000'}
            className="h-10 w-full"
          />
        </Field>
      </div>

      <Field
        label="Background image"
        error={fieldError('backgroundImage')}
        hint="Leave empty to keep the current image"
      >
        <ImageInput name="backgroundImage" src={festival.backgroundImage} />
      </Field>

      <Field label="Global styles" error={fieldError('globalStyles')} hint="Raw CSS">
        <Textarea
          name="globalStyles"
          rows={12}
          defaultValue={festival.globalStyles ?? ''}
          className="rounded-md border border-gray-400 px-2 py-1 font-mono text-sm"
        />
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

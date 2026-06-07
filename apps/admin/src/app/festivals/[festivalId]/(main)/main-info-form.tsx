'use client';

import { Festival } from '@festivapp/persistence';
import { useActionState } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { formatDateInput } from '@/utils';

import { updateFestival } from '../../actions';

export function MainInfoForm({ festival }: { festival: Festival }) {
  const [state, action, pending] = useActionState(updateFestival, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  return (
    <form action={action} className="col gap-4">
      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <input type="hidden" name="festivalId" value={festival.id} />

      <Field label="Name" error={fieldError('name')} className="max-w-lg">
        <Input name="name" required defaultValue={festival.name} />
      </Field>

      <Field label="Domain" error={fieldError('domain')} className="max-w-lg">
        <Input name="domain" defaultValue={festival.domain ?? ''} />
      </Field>

      <div className="col max-w-lg gap-4 md:row md:items-center">
        <Field label="Start" error={fieldError('start')} className="flex-1">
          <Input type="datetime-local" name="start" required defaultValue={formatDateInput(festival.start)} />
        </Field>

        <Field label="End" error={fieldError('end')} className="flex-1">
          <Input type="datetime-local" name="end" required defaultValue={formatDateInput(festival.end)} />
        </Field>
      </div>

      <Field
        label="Info before start"
        error={fieldError('beforeStartInfo')}
        hint="Shown to attendees before the festival begins"
      >
        <Textarea
          name="beforeStartInfo"
          rows={3}
          defaultValue={festival.beforeStartInfo ?? ''}
          className="rounded-md border border-gray-400 px-2 py-1"
        />
      </Field>

      <Field
        label="Info after end"
        error={fieldError('afterEndInfo')}
        hint="Shown to attendees after the festival ends"
      >
        <Textarea
          name="afterEndInfo"
          rows={3}
          defaultValue={festival.afterEndInfo ?? ''}
          className="rounded-md border border-gray-400 px-2 py-1"
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

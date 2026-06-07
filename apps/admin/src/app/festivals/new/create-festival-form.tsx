'use client';

import { useActionState } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Input } from '@/components/input';

import { createFestival } from '../actions';

export function CreateFestivalForm() {
  const [state, action, pending] = useActionState(createFestival, { success: false });
  const fieldError = (name: string) => (state.success === false ? state.fields?.[name] : undefined);

  const defaultValue = (name: string) => {
    const value = state.data?.get(name);

    if (typeof value === 'string') {
      return value;
    }
  };

  return (
    <form action={action} className="col max-w-lg gap-4">
      {!state.success && state.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</div>
      )}

      <Field label="Name" error={fieldError('name')}>
        <Input name="name" required defaultValue={defaultValue('name')} />
      </Field>

      <div className="row items-center gap-4">
        <Field label="Start" error={fieldError('start')} className="flex-1">
          <Input type="datetime-local" name="start" required defaultValue={defaultValue('start')} />
        </Field>

        <Field label="End" error={fieldError('end')} className="flex-1">
          <Input type="datetime-local" name="end" required defaultValue={defaultValue('end')} />
        </Field>
      </div>

      <div>
        <Button type="submit" disabled={pending} loading={pending}>
          Create festival
        </Button>
      </div>
    </form>
  );
}

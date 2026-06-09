'use client';

import { useActionState } from 'react';

import { Button } from '@/components/button';
import { Field } from '@/components/field';
import { Input } from '@/components/input';

import { login } from './actions';

export function LoginForm() {
  const [data, action] = useActionState(login, { success: false });

  return (
    <form action={action} className="col gap-2">
      {data.success === false && data.error && <div className="text-red-600">{data.error}</div>}

      <Field>
        <Input name="email" placeholder="Email" />
      </Field>

      <Field>
        <Input type="password" name="password" placeholder="Password" />
      </Field>

      <Button type="submit" className="self-start">
        Log in
      </Button>
    </form>
  );
}

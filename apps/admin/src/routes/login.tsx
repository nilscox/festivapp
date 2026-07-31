import { Form } from '@base-ui/react/form';
import { CircleAlert } from 'lucide-react';
import { useMemo } from 'react';

import { Button } from '../components/button.tsx';
import { Field, Label } from '../components/field.tsx';
import { Input } from '../components/input.tsx';
import { ApiError } from '../lib/api.ts';
import { useLogin } from '../lib/auth.ts';
import { parseValidationError } from '../lib/errors.ts';

// oxlint-disable jsx-a11y/tabindex-no-positive

export function Login() {
  const { mutate, isPending, error } = useLogin();
  const errors = useMemo(() => parseValidationError(error), [error]);

  return (
    <div className="reveal col min-h-dvh items-center justify-center p-4 md:p-10">
      <div className="w-full max-w-90">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="text-muted mt-2 text-sm">Welcome back. Log in to manage your festivals.</p>
        </div>

        {ApiError.is(error) && error.error === 'invalid_credentials' && (
          <div
            role="alert"
            className="border-danger-line bg-danger/5 text-danger-ink row my-6 items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <span>The email or password is incorrect. Please try again.</span>
          </div>
        )}

        <Form
          errors={errors}
          onFormSubmit={(values: { email: string; password: string }) => mutate(values)}
          className="col gap-4"
        >
          <Field
            name="email"
            label="Email"
            errors={[
              { match: 'valueMissing', message: 'Enter your email address.' },
              { match: 'typeMismatch', message: 'Enter a valid email address.' },
            ]}
          >
            <Input type="email" required autoComplete="username" placeholder="your@email.org" tabIndex={1} />
          </Field>

          <Field
            name="password"
            label={
              <div className="row items-start justify-between">
                <Label>Password</Label>
                <a
                  href={`mailto:admin@festivapp?${new URLSearchParams({ subject: 'Please change my password' })}`}
                  className="text-muted hover:text-ink cursor-pointer rounded-sm text-xs"
                >
                  Forgot?
                </a>
              </div>
            }
            errors={[{ match: 'valueMissing', message: 'Enter your password.' }]}
          >
            <Input type="password" required autoComplete="current-password" placeholder="••••••••" tabIndex={2} />
          </Field>

          <Button type="submit" disabled={isPending} tabIndex={3} className="mt-2 h-12 w-full">
            Sign in
          </Button>
        </Form>
      </div>

      <p className="text-faint mt-4 text-center font-mono text-xs">
        Access is invite-only &bull;{' '}
        <a href="mailto:admin@festivapp" className="rounded-sm">
          Contact us
        </a>
      </p>
    </div>
  );
}

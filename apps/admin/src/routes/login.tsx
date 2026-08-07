import type { MeResponse } from '@festivapp/contracts';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { CircleAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as z from 'zod/mini';

import { Label } from '../components/form/fields.tsx';
import { Form, SubmitButton, useAppForm } from '../components/form/form.tsx';
import { api, ApiError } from '../lib/api.ts';
import { submitToApi } from '../lib/errors.ts';

// oxlint-disable jsx-a11y/tabindex-no-positive

export function Login() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, error } = useMutation({
    mutationFn: (body: z.infer<typeof schema>) => api.post<MeResponse>('/admin/auth/login', body),
    onError: (error) => {
      if (!ApiError.is(error, 400) && !ApiError.is(error, 401)) {
        toast.error(error.message);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['me'], data);
      void router.invalidate();
    },
  });

  const form = useAppForm({
    defaultValues: { email: '', password: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: ({ value, formApi }) => submitToApi(formApi, () => mutateAsync(value)),
  });

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

        <Form form={form} className="col gap-4">
          <form.AppField name="email">
            {({ InputField }) => (
              <InputField
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="your@email.org"
                tabIndex={1}
              />
            )}
          </form.AppField>

          <form.AppField name="password">
            {({ InputField }) => (
              <InputField
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
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                tabIndex={2}
              />
            )}
          </form.AppField>

          <SubmitButton tabIndex={3} className="mt-2 h-12 w-full">
            Sign in
          </SubmitButton>
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

const schema = z.object({
  email: z.pipe(
    z.string().check(z.minLength(1, 'Enter your email address.')),
    z.email({ error: 'Enter a valid email address.' }),
  ),
  password: z.string().check(z.minLength(1, 'Enter your password.')),
});

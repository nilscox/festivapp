import { Form } from '@base-ui-components/react/form';
import { useNavigate } from '@tanstack/react-router';
import { CircleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '../components/button.tsx';
import { Eyebrow } from '../components/eyebrow.tsx';
import { TextField } from '../components/text-field.tsx';
import { useLogin, useMe } from '../lib/auth.ts';

export function Login() {
  const me = useMe();
  const login = useLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (me.isSuccess) {
      void navigate({ to: '/' });
    }
  }, [me.isSuccess, navigate]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.reportValidity()) {
      return;
    }

    const data = new FormData(form);

    login.mutate(
      { email: String(data.get('email')), password: String(data.get('password')) },
      { onSuccess: () => void navigate({ to: '/' }) },
    );
  }

  return (
    <div className="reveal flex min-h-screen">
      <div className="bg-accent hidden w-[46%] flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="text-accent flex size-9 items-center justify-center rounded-lg bg-white text-lg font-bold">
            F
          </div>
          <span className="text-lg font-semibold tracking-tight">FestivApp</span>
        </div>
        <div>
          <Eyebrow className="text-white/70">Organizer backoffice</Eyebrow>
          <h1 className="mt-4 text-4xl leading-tight font-bold tracking-tight text-balance">
            Run your festival's schedule, artists and map — all in one place.
          </h1>
        </div>
        <p className="font-mono text-xs tracking-wide text-white/60">
          Manage every festival you organize from a single account.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-10">
        <div className="w-full max-w-90">
          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="text-muted mt-2 text-sm">Welcome back. Enter your organizer details.</p>

          {login.isError && (
            <div
              role="alert"
              className="border-danger-line bg-danger-soft text-danger-ink mt-6 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px]"
            >
              <CircleAlert className="mt-0.5 size-4.5 shrink-0" />
              <span>The email or password is incorrect. Please try again.</span>
            </div>
          )}

          <Form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4.5">
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@festival.org"
              errors={[
                { match: 'valueMissing', message: 'Enter your email address.' },
                { match: 'typeMismatch', message: 'Enter a valid email address.' },
              ]}
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              labelAddon={
                <button type="button" className="text-muted hover:text-ink cursor-pointer text-xs">
                  Forgot?
                </button>
              }
              errors={[{ match: 'valueMissing', message: 'Enter your password.' }]}
            />

            <Button type="submit" disabled={login.isPending} className="mt-2 h-12 w-full">
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>

          <p className="text-faint mt-6 text-center font-mono text-xs">Access is invite-only · ask your admin</p>
        </div>
      </div>
    </div>
  );
}

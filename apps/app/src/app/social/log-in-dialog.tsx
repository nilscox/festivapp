'use client';

import { Trans, useLingui } from '@lingui/react/macro';
import { useActionState, useEffect } from 'react';

import { Button } from '@/components/button';
import { Dialog, DialogActions } from '@/components/dialog';
import { Input } from '@/components/input';

import { logIn } from './actions';

export function LogInDialog() {
  const { t } = useLingui();

  const [result, action, pending] = useActionState(logIn, { state: 'email' });

  useEffect(() => {
    if (result.state === 'completed') {
      document.getElementById('log-in-dialog')?.hidePopover();
    }
  }, [result.state]);

  return (
    <Dialog id="log-in-dialog" popover="" className="max-w-md">
      <form action={action} className="col gap-4">
        <div className="text-lg font-semibold">
          <Trans>Log in</Trans>
        </div>

        {result.state === 'email' && (
          <>
            <p className="text-sm text-dim">
              <Trans>I know, having to log in sucks. But it's required for moderation.</Trans>
            </p>
            <Input name="name" required placeholder={t`Display name`} />
            <Input name="email" required placeholder={t`your@email.com`} />
          </>
        )}

        {result.state === 'verify' && (
          <>
            <p className="text-sm text-dim">
              <Trans>We've send you a code by email.</Trans>
            </p>
            <Input name="code" required placeholder={t`123456`} />
            <Input type="hidden" name="email" value={result.email} />
          </>
        )}

        {result.error && <p className="text-red-700">{result.error}</p>}

        <DialogActions>
          <Button variant="ghost" popoverTarget="log-in-dialog" popoverTargetAction="hide">
            <Trans>Close</Trans>
          </Button>
          <Button type="submit">
            {result.state === 'email' && <Trans>Log in</Trans>}
            {result.state === 'verify' && <Trans>Verify</Trans>}
            {pending && '...'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

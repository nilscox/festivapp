'use client';

import { useActionState, useEffect } from 'react';
import { Button } from 'src/components/button';
import { Dialog, DialogActions } from 'src/components/dialog';
import { Input } from 'src/components/input';

import { logIn } from './actions';

export function LogInDialog() {
  const [result, action, pending] = useActionState(logIn, { state: 'email' });

  useEffect(() => {
    if (result.state === 'completed') {
      document.getElementById('log-in-dialog')?.hidePopover();
    }
  }, [result.state]);

  return (
    <Dialog id="log-in-dialog" popover="" className="max-w-md">
      <form action={action} className="col gap-4">
        <div className="text-lg font-semibold">Log in</div>

        {result.state === 'email' && (
          <>
            <p className="text-sm text-dim">I know, having to log in sucks. But it's required for moderation.</p>
            <Input name="name" required placeholder="Display name" />
            <Input name="email" required placeholder="your@email.com" />
          </>
        )}

        {result.state === 'verify' && (
          <>
            <p className="text-sm text-dim">We've send you a code by email.</p>
            <Input name="code" required placeholder="123456" />
            <Input type="hidden" name="email" value={result.email} />
          </>
        )}

        {result.error && <p className="text-red-700">{result.error}</p>}

        <DialogActions>
          <Button variant="ghost" popoverTarget="log-in-dialog" popoverTargetAction="hide">
            Close
          </Button>
          <Button type="submit">
            {result.state === 'email' && <>Log in</>}
            {result.state === 'verify' && <>Verify</>}
            {pending && '...'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

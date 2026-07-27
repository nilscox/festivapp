import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { Button } from '../components/button.tsx';
import { FullPage, Spinner } from '../components/full-page.tsx';
import { useLogout, useMe } from '../lib/auth.ts';

export function IndexRedirect() {
  const me = useMe();
  const navigate = useNavigate();
  const logout = useLogout();

  const firstTenant = me.data?.tenants[0];

  useEffect(() => {
    if (me.isError) {
      void navigate({ to: '/login', replace: true });

      return;
    }

    if (firstTenant) {
      void navigate({
        to: '/festivals/$tenantId/locations',
        params: { tenantId: firstTenant.id },
        replace: true,
      });
    }
  }, [me.isError, firstTenant, navigate]);

  if (me.isSuccess && me.data.tenants.length === 0) {
    return (
      <FullPage>
        <div className="max-w-100">
          <h1 className="text-xl font-bold">No festivals yet</h1>
          <p className="text-muted mt-2 text-sm">
            Your account isn't linked to any festival yet. Ask your platform admin to grant you access.
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => logout.mutate(undefined, { onSuccess: () => void navigate({ to: '/login' }) })}
          >
            Log out
          </Button>
        </div>
      </FullPage>
    );
  }

  return (
    <FullPage>
      <Spinner />
    </FullPage>
  );
}

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { TabBar } from '../components/tab-bar.tsx';
import { useBootstrapQuery } from '../lib/bootstrap.ts';
import { warmTenantCache } from '../lib/cache.ts';
import { applyTenant } from '../lib/theme.ts';

export function RootLayout() {
  const query = useBootstrapQuery();
  const tenant = query.data?.tenant;

  useEffect(() => {
    if (tenant) {
      applyTenant(tenant);
      void warmTenantCache(tenant);
    }
  }, [tenant]);

  return (
    <div className="col border-line bg-app app-background mx-auto h-dvh w-full max-w-160 overflow-hidden sm:border-x">
      {query.data ? (
        <>
          <main className="col min-h-0 flex-1">
            <QueryErrorResetBoundary>
              {({ reset }) => (
                <ErrorBoundary onReset={reset} fallbackRender={Fallback}>
                  <Outlet />
                </ErrorBoundary>
              )}
            </QueryErrorResetBoundary>
          </main>

          <TabBar />
        </>
      ) : (
        <p className="text-muted m-auto max-w-80 p-8 text-center text-sm leading-normal">
          {query.isPending && <>Loading...</>}
          {query.isError && <>Error: {query.error.message}</>}
        </p>
      )}
    </div>
  );
}

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="col h-full items-center justify-center gap-4">
      <div className="text-xl">There was an error!</div>

      {error instanceof Error && <div className="text-muted font-mono text-sm">{error.message}</div>}

      <button type="button" onClick={resetErrorBoundary} className="bg-chip text-accent rounded-full px-4 py-2">
        Try again
      </button>
    </div>
  );
}

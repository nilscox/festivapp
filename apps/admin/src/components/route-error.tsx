import type { ErrorComponentProps } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';

import { ApiError } from '../lib/api.ts';
import { Button } from './button.tsx';
import { EmptyState } from './empty-state.tsx';
import { Spinner } from './spinner.tsx';

export function RouteError({ error, info }: ErrorComponentProps) {
  const router = useRouter();

  if (ApiError.is(error, 401)) {
    return <Spinner className="mx-auto my-8 size-6" />;
  }

  return (
    <div className="col mx-auto w-full max-w-7xl justify-center gap-4 overflow-y-auto px-4 py-6 md:px-8">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={error.message}
        cta={
          <Button variant="secondary" onClick={() => void router.invalidate()}>
            Try again
          </Button>
        }
      />

      {import.meta.env.DEV && (
        <details>
          <summary className="text-muted w-fit cursor-pointer text-sm">Details</summary>
          <pre className="bg-faint/10 scrollbar-thin overflow-x-auto rounded-md p-2 font-mono text-xs">
            {error.stack}
          </pre>
          {info && (
            <pre className="bg-faint/10 scrollbar-thin overflow-x-auto rounded-md p-2 font-mono text-xs">
              {info.componentStack}
            </pre>
          )}
        </details>
      )}
    </div>
  );
}

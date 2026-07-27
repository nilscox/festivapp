import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

export function FullPage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center p-6 text-center">{children}</div>;
}

export function Spinner() {
  return <LoaderCircle className="text-faint size-6 animate-spin" />;
}

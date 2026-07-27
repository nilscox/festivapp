import clsx from 'clsx';
import { LoaderCircle } from 'lucide-react';

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={clsx('text-faint animate-spin', className)} />;
}

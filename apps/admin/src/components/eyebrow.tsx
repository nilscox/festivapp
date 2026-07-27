import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('text-xxs text-faint font-mono font-semibold tracking-widest uppercase', className)}>
      {children}
    </span>
  );
}

import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('font-mono text-xxs font-semibold tracking-[0.14em] text-faint uppercase', className)}>
      {children}
    </span>
  );
}

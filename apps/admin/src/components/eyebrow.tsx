import clsx from 'clsx';

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('text-xxs text-faint font-mono font-semibold tracking-widest uppercase', className)}>
      {children}
    </span>
  );
}

import clsx from 'clsx';

export function Table({ children }: { children: React.ReactNode }) {
  return <div className="divide-line/60 divide-y overflow-hidden rounded-xl border">{children}</div>;
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <div className="bg-subtle row items-center gap-4 border-b px-4 py-3">{children}</div>;
}

export function TableHeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx('text-xxs text-faint font-mono tracking-widest uppercase', className)}>{children}</span>;
}

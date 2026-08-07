import clsx from 'clsx';

const cell = clsx('px-1.5 py-3 align-middle first:ps-3 last:pe-3 md:px-2 md:first:ps-4 md:last:pe-4');

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full table-fixed border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-subtle border-b">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableHeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={clsx(
        cell,
        'text-xxs text-faint text-start font-mono font-normal tracking-widest uppercase',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-line/60 divide-y">{children}</tbody>;
}

export function TableRow({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <tr id={id} className={clsx('hover:bg-subtle', className)}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={clsx(cell, className)}>{children}</td>;
}

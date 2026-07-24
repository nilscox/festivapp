import clsx from 'clsx';

export function Chip({ size = 'medium', children }: { size?: 'small' | 'medium'; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'text-accent bg-chip rounded-sm tracking-wider font-mono font-medium whitespace-nowrap uppercase',
        {
          'px-1 py-0.5 text-xxs rounded-sm': size === 'small',
          'px-2 py-1 text-xs rounded-md': size === 'medium',
        },
      )}
    >
      {children}
    </span>
  );
}

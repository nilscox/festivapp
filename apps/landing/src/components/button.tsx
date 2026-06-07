import clsx from 'clsx';

export function Button({
  href,
  variant = 'primary',
  children,
}: {
  href: string;
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={clsx(
        'inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer active:scale-95',
        {
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm': variant === 'primary',
          'border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600': variant === 'outline',
        },
      )}
    >
      {children}
    </a>
  );
}

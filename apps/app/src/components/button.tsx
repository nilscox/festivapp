import clsx from 'clsx';

export function Button({
  variant = 'primary',
  className,
  ...props
}: { variant?: 'primary' | 'ghost' } & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={clsx(
        className,
        'row cursor-pointer items-center gap-2 rounded-md px-3 py-1 font-medium outline-offset-2',
        {
          'bg-black text-white': variant === 'primary',
        },
      )}
      {...props}
    />
  );
}

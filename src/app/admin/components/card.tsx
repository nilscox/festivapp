import clsx from 'clsx';
import Link from 'next/link';

export function CardLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={clsx(
        className,
        'rounded-lg overflow-hidden border bg-white hover:border-gray-500 no-underline text-inherit transition-colors',
      )}
    />
  );
}

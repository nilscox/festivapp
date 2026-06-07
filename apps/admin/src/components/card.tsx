import { Extend } from '@festivapp/utils';
import clsx from 'clsx';
import Link from 'next/link';
import { Slot } from 'radix-ui';

export function Card({ asChild, className, ...props }: Extend<React.ComponentProps<'div'>, { asChild?: boolean }>) {
  const Comp = asChild ? Slot.Root : 'div';

  return <Comp {...props} className={clsx(className, 'rounded-lg border bg-white')} />;
}

export function CardLink({ className, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Card asChild>
      <Link {...props} className={clsx(className, 'text-inherit no-underline transition-colors hover:bg-gray-100')} />
    </Card>
  );
}

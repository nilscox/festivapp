import { Extend } from '@festivapp/utils';
import clsx from 'clsx';
import { Slot } from 'radix-ui';

export function Button({
  asChild,
  variant = 'solid',
  size = 'medium',
  loading,
  left,
  right,
  className,
  children,
  ...props
}: Extend<
  React.ComponentProps<'button'>,
  {
    asChild?: boolean;
    variant?: 'solid' | 'outline' | 'ghost';
    size?: 'small' | 'medium';
    loading?: boolean;
    left?: React.ReactNode;
    right?: React.ReactNode;
  }
>) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      type="button"
      className={clsx(
        className,
        'row cursor-pointer border border-transparent items-center gap-2 rounded-md font-medium outline-offset-2 transition-colors no-underline',
        {
          'bg-dark text-light hover:bg-gray-800': variant === 'solid',
          'border-gray-400!': variant === 'outline',
          'bg-transparent hover:bg-dark/5': variant === 'ghost',
        },
        {
          'px-2 py-1': size === 'small',
          'px-3 py-1.5': size === 'medium',
        },
      )}
      {...props}
    >
      {left}
      <Slot.Slottable>{children}</Slot.Slottable>
      {right}
      {loading && '...'}
    </Comp>
  );
}

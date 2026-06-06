import { cva } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { Extend } from 'src/utils';

export function Button({
  asChild,
  variant,
  size,
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
    <Comp type="button" className={buttonVariants({ variant, size, className })} {...props}>
      {left}
      <Slot.Slottable>{children}</Slot.Slottable>
      {right}
      {loading && '...'}
    </Comp>
  );
}

const buttonVariants = cva(
  'row cursor-pointer border border-transparent items-center gap-2 rounded-md font-medium outline-offset-2 transition-colors no-underline',
  {
    variants: {
      variant: {
        solid: 'bg-dark text-light hover:bg-gray-800',
        outline: 'border-gray-400!',
        ghost: 'bg-transparent hover:bg-dark/5',
      },
      size: {
        small: 'px-2 py-1',
        medium: 'px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'medium',
    },
  },
);

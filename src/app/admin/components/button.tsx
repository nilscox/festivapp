import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export function Button({ loading, variant, className, children, ...props }: ButtonProps) {
  return (
    <button type="button" className={buttonVariants({ variant, className })} {...props}>
      {children}
      {loading && '...'}
    </button>
  );
}

export type LinkButtonProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function LinkButton({ variant, className, ...props }: LinkButtonProps) {
  return <Link className={buttonVariants({ variant, className })} {...props} />;
}

const buttonVariants = cva(
  'row cursor-pointer border border-transparent items-center gap-2 rounded-md font-medium outline-offset-2 transition-colors no-underline',
  {
    variants: {
      variant: {
        primary: 'bg-dark text-light hover:bg-gray-800',
        outline: 'border-gray-400!',
        ghost: 'bg-transparent hover:bg-dark/5',
      },
      size: {
        small: 'px-2 py-1',
        medium: 'px-3 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'small',
    },
  },
);

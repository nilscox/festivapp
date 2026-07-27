import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-110',
  secondary: 'border border-line bg-surface text-muted-strong hover:border-line-strong',
  danger: 'bg-danger text-white hover:brightness-110',
  ghost: 'text-muted hover:bg-well',
};

const SIZES: Record<Size, string> = {
  md: 'h-11 gap-2 px-4 text-sm',
  sm: 'gap-1.5 px-3 py-2 text-[13px]',
};

export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex cursor-pointer items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

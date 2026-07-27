import { createLink } from '@tanstack/react-router';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

const VARIANTS: Record<Variant, string> = {
  primary: clsx('bg-accent text-white outline-offset-1 hover:brightness-110'),
  secondary: clsx('bg-surface text-ink/80 hover:text-ink hover:border-line-strong border'),
  danger: clsx('bg-danger text-white hover:brightness-110'),
  ghost: clsx('text-muted hover:bg-subtle'),
};

const SIZES: Record<Size, string> = {
  md: clsx('h-10 gap-2 px-4 text-sm'),
  sm: clsx('h-8 gap-1.5 px-3 text-sm'),
};

const buttonClassName = (variant: Variant, size: Size, className?: string) => {
  return clsx(
    'inline-flex cursor-pointer items-center justify-center truncate rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
};

type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = 'primary', size = 'md', type = 'button', className, ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, size, className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<'a'> & {
  variant?: Variant;
  size?: Size;
};

export const LinkButton = createLink(function ({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkButtonProps) {
  // oxlint-disable-next-line jsx-a11y/anchor-has-content
  return <a className={buttonClassName(variant, size, className)} {...props} />;
});

type IconButtonProps = React.ComponentProps<'button'> & {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: Variant;
};

export function IconButton({ icon: Icon, variant = 'primary', className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      <Icon className="size-4" />
    </button>
  );
}

import clsx from 'clsx';

export type ChipVariant = 'solid' | 'custom';
export type ChipSize = 'sm' | 'md' | 'lg';

const variants: Record<ChipVariant, string> = {
  solid: clsx('bg-subtle text-muted'),
  custom: '',
};

const sizes: Record<ChipSize, string> = {
  sm: clsx('text-xxs gap-1 rounded-sm px-1.5 py-0.5 font-mono font-medium'),
  md: clsx('gap-1.5 rounded-md px-2 py-1 text-xs'),
  lg: clsx('gap-1.5 rounded-lg px-2.5 py-1.5 text-sm'),
};

type ChipProps = React.ComponentProps<'span'> & {
  variant?: ChipVariant;
  size?: ChipSize;
};

export function Chip({ variant = 'solid', size = 'md', className, ...props }: ChipProps) {
  return (
    <span
      className={clsx(
        'row w-fit min-w-0 items-center truncate leading-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

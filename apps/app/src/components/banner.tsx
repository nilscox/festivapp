import clsx from 'clsx';

export function Banner({
  variant,
  inline,
  icon: Icon,
  title,
  description,
  actions,
}: {
  variant: 'primary' | 'secondary';
  inline?: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: React.ReactNode;
  description: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        'reveal m-2 gap-3 rounded-lg border px-4 py-3 shadow-lg',
        variant === 'primary' && 'bg-accent/8 border-accent/80',
        variant === 'secondary' && 'bg-surface border-line',
        inline ? 'row justify-between' : 'col',
      )}
    >
      <div className="row items-start gap-2">
        <Icon className="size-5 shrink-0 text-sm" />

        <div className="col gap-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-muted text-xs">{description}</div>
        </div>
      </div>

      <div className="row items-center justify-end gap-4">{actions}</div>
    </div>
  );
}

export function BannerButton({ className, ...props }: React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={clsx('whitespace-nowrap text-accent bg-app rounded-full px-4 py-1.5 text-sm font-medium', className)}
      {...props}
    />
  );
}

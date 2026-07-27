export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon?: React.ComponentType<React.ComponentProps<'svg'>>;
  title: React.ReactNode;
  description?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <section className="reveal border-line-strong col items-center gap-6 rounded-lg border border-dashed px-6 py-12 text-center md:px-8 md:py-16">
      {Icon && (
        <div className="bg-subtle text-faint flex size-14 items-center justify-center rounded-lg">
          <Icon className="size-8" />
        </div>
      )}

      <div className="col gap-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-muted max-w-96 text-sm text-pretty">{description}</p>}
      </div>

      {cta}
    </section>
  );
}

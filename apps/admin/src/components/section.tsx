export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="col gap-4 md:grid md:grid-cols-3 md:gap-8">
      <div className="md:col-span-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-muted mt-1 text-xs leading-normal">{description}</p>
      </div>

      <div className="col gap-6 md:col-span-2">{children}</div>
    </section>
  );
}

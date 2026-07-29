export function PageHeader({
  title,
  subtitle,
  end,
}: {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <header className="row border-line items-stretch justify-between gap-4 border-b px-4 pt-4 pb-3">
      <div>
        <h1 className="font-display mb-2 text-2xl leading-none font-bold tracking-tight">{title}</h1>
        {subtitle}
      </div>
      {end}
    </header>
  );
}

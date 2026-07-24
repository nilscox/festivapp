export function PageHeader({ title, subtitle }: { title: React.ReactNode; subtitle: React.ReactNode }) {
  return (
    <header className="border-line border-b px-4 pt-4 pb-3">
      <h1 className="font-display mb-2 text-2xl leading-none font-bold tracking-tight">{title}</h1>
      {subtitle}
    </header>
  );
}

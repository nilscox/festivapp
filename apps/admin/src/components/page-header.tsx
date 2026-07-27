import { Eyebrow } from './eyebrow.tsx';

export function Page({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      {header}
      <div className="col mx-auto w-full max-w-7xl flex-1 overflow-y-auto px-8 py-6">{children}</div>
    </>
  );
}

export function PageHeader({
  eyebrow,
  title,
  end,
}: {
  eyebrow?: React.ReactNode;
  title?: React.ReactNode;
  end?: React.ReactNode;
}) {
  return (
    <header className="border-b">
      <div className="row mx-auto w-full max-w-7xl items-end justify-between px-8 py-4">
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {end}
      </div>
    </header>
  );
}

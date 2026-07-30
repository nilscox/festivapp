import { defined } from '@festivapp/utils';
import { Menu } from 'lucide-react';
import { createContext, use } from 'react';

import { IconButton } from './button.tsx';
import { Eyebrow } from './eyebrow.tsx';

export function Page({ header, children }: { header?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <>
      {header}
      <div className="col flex-1 overflow-y-scroll">
        <div className="col mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">{children}</div>
      </div>
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
  const open = defined(use(OpenDrawerContext));

  return (
    <header className="bg-surface sticky top-0 shrink-0 border-b pe-3.75 max-md:shadow-sm">
      <div className="row mx-auto w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <IconButton icon={Menu} variant="ghost" aria-label="Open menu" onClick={open} className="shrink-0 md:hidden" />

        <div className="min-w-0 flex-1">
          <Eyebrow className="block truncate">{eyebrow}</Eyebrow>
          <h1 className="mt-1 truncate text-xl font-bold tracking-tight max-md:leading-none md:text-2xl">{title}</h1>
        </div>

        <div className="row self-stretch">{end}</div>
      </div>
    </header>
  );
}

const OpenDrawerContext = createContext<(() => void) | null>(null);

export function OpenDrawerProvider({ open, children }: { open: () => void; children: React.ReactNode }) {
  return <OpenDrawerContext value={open}>{children}</OpenDrawerContext>;
}

import { Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import { X } from 'lucide-react';

import { Eyebrow } from './eyebrow.tsx';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, eyebrow, title, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="base-ui-fade bg-ink/40 fixed inset-0 transition-opacity" />
        <Dialog.Popup
          className={clsx(
            'base-ui-fade col bg-surface fixed inset-y-0 right-0 flex w-full shadow-2xl md:max-w-xl',
            'md:transition-all md:duration-300 md:data-ending-style:translate-x-1/4 md:data-starting-style:translate-x-1/4',
          )}
        >
          <Header eyebrow={eyebrow} title={title} />
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Header({ eyebrow, title }: { eyebrow?: React.ReactNode; title: React.ReactNode }) {
  return (
    <div className="row items-start justify-between border-b px-4 py-6">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Dialog.Title className="mt-1 text-xl font-bold tracking-tight">{title}</Dialog.Title>
      </div>

      <Dialog.Close
        aria-label="Close"
        className="text-muted hover:bg-subtle flex size-8 cursor-pointer items-center justify-center rounded-lg"
      >
        <X className="size-4" />
      </Dialog.Close>
    </div>
  );
}

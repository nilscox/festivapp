import { Dialog } from '@base-ui-components/react/dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Eyebrow } from './eyebrow.tsx';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: ReactNode;
  title: ReactNode;
  // The content owns the remaining column (a scroll area + a pinned footer), so a
  // form's submit button can live inside its own <form> (Base UI Form only submits
  // from a descendant submit button).
  children: ReactNode;
};

export function Drawer({ open, onOpenChange, eyebrow, title, children }: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="bg-ink/40 fixed inset-0 z-40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col shadow-2xl transition-transform duration-300 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="border-line flex items-center justify-between border-b px-6 py-5">
            <div>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <Dialog.Title className="mt-1 text-xl font-bold tracking-tight">{title}</Dialog.Title>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="text-muted hover:bg-well flex size-9 cursor-pointer items-center justify-center rounded-lg"
            >
              <X className="size-4.5" />
            </Dialog.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

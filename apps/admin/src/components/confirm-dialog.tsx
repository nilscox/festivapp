import { AlertDialog } from '@base-ui/react/alert-dialog';
import { createContext, use, useCallback, useState, type ReactNode } from 'react';

import { assert, defined } from '../utils.ts';
import { Button } from './button.tsx';

type ConfirmOptions = {
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => unknown;
};

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions>();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    setOptions(options);
    setOpen(true);
  }, []);

  const onConfirm = async () => {
    assert(options);

    setPending(true);

    try {
      await options.onConfirm();
      setOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <ConfirmContext value={confirm}>
      {children}

      <AlertDialog.Root
        open={open}
        onOpenChange={setOpen}
        onOpenChangeComplete={(open) => !open && setOptions(undefined)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="base-ui-fade bg-inverted/25 fixed inset-0 backdrop-blur-xs" />
          <AlertDialog.Popup className="base-ui-fade bg-surface fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-4 shadow-2xl md:p-6">
            <AlertDialog.Title className="text-lg font-bold">{options?.title}</AlertDialog.Title>
            <AlertDialog.Description className="text-muted mt-2 text-sm">
              {options?.description}
            </AlertDialog.Description>
            <div className="row mt-6 gap-4">
              <AlertDialog.Close render={<Button variant="secondary" className="flex-1" />}>Cancel</AlertDialog.Close>
              <Button variant="danger" className="flex-1" disabled={pending} onClick={onConfirm}>
                {options?.confirmLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext>
  );
}

export function useConfirmDialog() {
  return defined(use(ConfirmContext));
}

const ConfirmContext = createContext<((options: ConfirmOptions) => void) | null>(null);

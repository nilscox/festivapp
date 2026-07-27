import { AlertDialog } from '@base-ui-components/react/alert-dialog';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './button.tsx';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="bg-ink/40 fixed inset-0 z-40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <AlertDialog.Popup className="reveal bg-surface fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl p-6 shadow-2xl">
          <div className="bg-danger-soft text-danger mb-4 flex size-11 items-center justify-center rounded-xl">
            <Trash2 className="size-5.5" />
          </div>
          <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-muted mt-2 text-sm">{description}</AlertDialog.Description>
          <div className="mt-6 flex gap-2.5">
            <AlertDialog.Close render={<Button variant="secondary" className="flex-1" />}>Cancel</AlertDialog.Close>
            <Button variant="danger" className="flex-1" disabled={pending} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

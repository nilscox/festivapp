import { AlertDialog } from '@base-ui/react/alert-dialog';
import type { ReactNode } from 'react';

import { Button } from './button.tsx';

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  pending?: boolean;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onOpenChangeComplete,
  title,
  description,
  confirmLabel,
  onConfirm,
  pending,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="base-ui-fade bg-inverted/25 fixed inset-0 backdrop-blur-xs" />
        <AlertDialog.Popup className="base-ui-fade bg-surface fixed top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl p-4 shadow-2xl md:p-6">
          <AlertDialog.Title className="text-lg font-bold">{title}</AlertDialog.Title>
          <AlertDialog.Description className="text-muted mt-2 text-sm">{description}</AlertDialog.Description>
          <div className="row mt-6 gap-4">
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

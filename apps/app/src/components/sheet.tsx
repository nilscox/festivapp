import { defined } from '@festivapp/utils';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function Sheet({
  open,
  label,
  onClose,
  children,
}: {
  open: boolean;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { render, state, onTransitionEnd } = useSheetState(open);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();

    return () => dialog.close();
  }, [render]);

  if (!render) {
    return null;
  }

  return createPortal(
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="col text-ink fixed inset-0 z-50 m-0 size-full max-h-none max-w-none justify-end overflow-hidden bg-transparent"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        onTransitionEnd={onTransitionEnd}
        className={clsx(
          'transition-opacity absolute inset-0 bg-app/65 starting:opacity-0',
          state === 'closed' && 'opacity-0',
        )}
      />

      <div
        className={clsx(
          'bg-app border-line relative mx-auto max-h-4/5 w-full max-w-160 overflow-y-auto rounded-t-2xl border-t pb-4 transition-all ease-in',
          state === 'open' &&
            'opacity-100 translate-none starting:opacity-0 starting:translate-y-1/4 starting:ease-out',
          state === 'closed' && 'opacity-0 translate-y-1/4',
        )}
      >
        {children}
      </div>
    </dialog>,
    defined(document.getElementById('root')),
  );
}

type SheetState = 'open' | 'closed';

function useSheetState(open: boolean) {
  const [render, setRender] = useState(open);
  const [state, setState] = useState<SheetState>(open ? 'open' : 'closed');

  useEffect(() => {
    if (open) {
      setRender(true);
      setState('open');
    } else {
      setState('closed');
    }
  }, [open]);

  const onTransitionEnd = () => {
    if (!open) {
      setRender(false);
    }
  };

  return {
    render,
    state,
    onTransitionEnd,
  };
}

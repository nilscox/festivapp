import clsx from 'clsx';
import React from 'react';

export function Dialog({ className, ...props }: React.ComponentProps<'dialog'>) {
  return (
    <dialog
      className={clsx(
        className,
        'fixed top-1/2 mx-auto max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-y-1/2 overflow-auto rounded-md p-4 backdrop:bg-black/20 backdrop:backdrop-blur-xs not-open:hidden',
      )}
      {...props}
    />
  );
}

export function DialogActions({ children }: { children: React.ReactNode }) {
  return <div className="row items-center justify-end gap-4">{children}</div>;
}

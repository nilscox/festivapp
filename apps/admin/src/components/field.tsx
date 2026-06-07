'use client';

import clsx from 'clsx';
import { createContext, use, useId } from 'react';

const fieldContext = createContext<{ id: string } | null>(null);

type FieldProps = {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();

  return (
    <fieldContext.Provider value={{ id }}>
      <div className={clsx('col gap-1', className)}>
        {label && (
          <label id={`${id}-label`} htmlFor={id} className="max-w-fit">
            {label}
          </label>
        )}

        {children}

        {hint && !error && <span className="text-xs text-dim">{hint}</span>}
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </fieldContext.Provider>
  );
}

export function useFieldId() {
  return use(fieldContext)?.id;
}

'use client';

import clsx from 'clsx';

import { useFieldId } from './field';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  const id = useFieldId();

  return (
    <input
      id={id}
      className={clsx(className, 'rounded-md border border-gray-400 px-2 py-1 bg-white text-ellipsis')}
      {...props}
    />
  );
}

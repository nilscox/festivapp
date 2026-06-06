'use client';

import clsx from 'clsx';

import { useFieldId } from './field';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  const id = useFieldId();

  return <input id={id} className={clsx(className, 'rounded-md border bg-white px-2 py-1 text-ellipsis')} {...props} />;
}

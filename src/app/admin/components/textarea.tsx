'use client';

import clsx from 'clsx';

import { useFieldId } from './field';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  const id = useFieldId();

  return <textarea id={id} className={clsx(className, 'rounded-md border bg-white px-2 py-1')} {...props} />;
}

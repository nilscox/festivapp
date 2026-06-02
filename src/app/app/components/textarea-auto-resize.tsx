'use client';

import clsx from 'clsx';

export function TextareaAutoResize({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      {...props}
      className={clsx(className, 'overflow-y-hidden')}
      onChange={(event) => {
        props.onChange?.(event);
        event.currentTarget.style.height = 'auto';
        event.currentTarget.style.height = event.currentTarget.scrollHeight + 'px';
      }}
    />
  );
}

import { Field } from '@base-ui/react/field';
import clsx from 'clsx';
import { useState } from 'react';

export function Range({ defaultValue, className, ...props }: React.ComponentProps<'input'>) {
  const [value, setValue] = useState(
    typeof props.value === 'number' ? props.value : typeof defaultValue === 'number' ? defaultValue : 0,
  );

  return (
    <div className="row items-center gap-3">
      <Field.Control
        {...props}
        type="range"
        value={value}
        onChange={(event) => {
          setValue(Number(event.currentTarget.value));
          props.onChange?.(event);
        }}
        className={clsx(
          'accent-accent flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />

      <span className={clsx('text-muted w-10 text-right font-mono text-xs', props.disabled && 'opacity-50')}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

import { Field as BaseField } from '@base-ui/react/field';
import type { Override } from '@festivapp/utils';
import clsx from 'clsx';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';

type RangeProps = Override<React.ComponentProps<'input'>, { value?: number }>;

export function Range({ className, ...props }: RangeProps) {
  return (
    <div className="row items-center gap-3">
      <BaseField.Control
        {...props}
        type="range"
        className={clsx(
          'accent-accent flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />

      <span className={clsx('text-muted w-10 text-right font-mono text-xs', props.disabled && 'opacity-50')}>
        {Math.round((props.value ?? 0) * 100)}%
      </span>
    </div>
  );
}

export function RangeField({ label, hint, ...props }: FieldProps & RangeProps) {
  const field = useFieldContext<number>();

  return (
    <Field label={label} hint={hint}>
      <Range
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(Number(event.currentTarget.value))}
        onBlur={field.handleBlur}
      />
    </Field>
  );
}

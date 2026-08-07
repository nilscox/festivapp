import { Field as BaseField } from '@base-ui/react/field';
import clsx from 'clsx';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <BaseField.Control
      render={
        <textarea
          {...props}
          className={clsx(
            'text-form bg-surface text-ink data-invalid:border-danger hover:border-line-strong w-full rounded-lg border px-3 py-2',
            className,
          )}
        />
      }
    />
  );
}

export function TextareaField({ label, hint, ...props }: FieldProps & React.ComponentProps<'textarea'>) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <Textarea
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        onBlur={field.handleBlur}
      />
    </Field>
  );
}

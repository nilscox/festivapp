import { Field as BaseField } from '@base-ui/react/field';
import clsx from 'clsx';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <BaseField.Control
      {...props}
      className={clsx(
        'text-form bg-surface text-ink data-invalid:border-danger hover:border-line-strong h-11 w-full rounded-lg border px-3',
        className,
      )}
    />
  );
}

export function InputField({ label, hint, ...props }: FieldProps & React.ComponentProps<'input'>) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <Input
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
        onBlur={field.handleBlur}
      />
    </Field>
  );
}

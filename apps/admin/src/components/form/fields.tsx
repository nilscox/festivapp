import { Field as BaseField } from '@base-ui/react/field';

import { Checkbox } from './checkbox.tsx';
import { Combobox } from './combobox.tsx';
import { useFieldContext } from './context.ts';
import { FileInput } from './file-input.tsx';
import { Input } from './input.tsx';
import { Range } from './range.tsx';
import { Select } from './select.tsx';
import { Textarea } from './textarea.tsx';

type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
};

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

export function SelectField<T extends string | number>({
  label,
  hint,
  items,
  placeholder,
}: FieldProps & {
  items: Array<{ value: T; label: React.ReactNode }>;
  placeholder?: string;
}) {
  const field = useFieldContext<T>();

  return (
    <Field label={label} hint={hint}>
      <Select
        name={field.name}
        items={items}
        placeholder={placeholder}
        value={field.state.value}
        onValueChange={(value) => value !== null && field.handleChange(value)}
      />
    </Field>
  );
}

export function ComboboxField({
  label,
  hint,
  items,
  placeholder,
}: FieldProps & { items: string[]; placeholder?: string }) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <Combobox
        name={field.name}
        items={items}
        placeholder={placeholder}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value ?? '')}
      />
    </Field>
  );
}

export function CheckboxField({ label, hint }: FieldProps & { label: React.ReactNode }) {
  const field = useFieldContext<boolean>();

  return (
    <Field>
      <Checkbox
        name={field.name}
        label={label}
        hint={hint}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
    </Field>
  );
}

export function RangeField({ label, hint, ...props }: FieldProps & React.ComponentProps<'input'>) {
  const field = useFieldContext<number>();

  return (
    <Field label={label} hint={hint}>
      <Range
        {...props}
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(Number(event.currentTarget.value))}
      />
    </Field>
  );
}

export function ColorField({ label, hint }: FieldProps) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <div className="row items-center gap-3">
        <BaseField.Control
          type="color"
          name={field.name}
          value={field.state.value}
          onChange={(event) => field.handleChange(event.currentTarget.value)}
          className="size-12 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
        />

        <span className="text-muted font-mono text-xs uppercase">{field.state.value}</span>
      </div>
    </Field>
  );
}

export function FileField({ label, hint, tenantId }: FieldProps & { tenantId: string }) {
  const field = useFieldContext<string | null>();

  return (
    <Field label={label} hint={hint}>
      <FileInput tenantId={tenantId} value={field.state.value} onValueChange={field.handleChange} />
    </Field>
  );
}

export function Field({ label, hint, children }: FieldProps & { children: React.ReactNode }) {
  const field = useFieldContext<unknown>();
  const error = fieldError(field.state.meta.errors);

  return (
    <BaseField.Root name={field.name} invalid={error !== undefined} touched={field.state.meta.isTouched}>
      {typeof label === 'string' ? <Label>{label}</Label> : label}

      {children}

      {hint && <div className="text-muted mt-1 text-xs">{hint}</div>}

      {error !== undefined && (
        <BaseField.Error match={true} className="text-danger-ink mt-1 text-xs">
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <BaseField.Label className="text-muted text-label mb-1 font-medium">{children}</BaseField.Label>;
}

export function fieldError(errors: unknown[]) {
  const [error] = errors;

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
}

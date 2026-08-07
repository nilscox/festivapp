import { Field as BaseField } from '@base-ui/react/field';

import { useFieldContext } from './context.ts';

export type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
};

export function Field({ label, hint, children }: FieldProps & { children: React.ReactNode }) {
  const field = useFieldContext<unknown>();
  const error = fieldError(field.state.meta.errors);

  return (
    <BaseField.Root name={field.name} invalid={error !== undefined} touched={field.state.meta.isTouched || undefined}>
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

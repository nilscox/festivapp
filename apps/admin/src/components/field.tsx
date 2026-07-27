import { Field as BaseField } from '@base-ui/react/field';

const { Root, Label: BaseLabel, Error } = BaseField;

type FieldError = { match: keyof ValidityState; message: React.ReactNode };

export function Field({
  name,
  label,
  errors,
  error,
  children,
}: {
  name?: string;
  label?: React.ReactNode;
  errors?: FieldError[];
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Root name={name}>
      {typeof label === 'string' ? <Label>{label}</Label> : label}

      {children}

      {error && <div className="text-danger-ink mt-1 text-xs">{error}</div>}

      {errors?.map((error) => (
        <Error key={error.match} match={error.match} className="text-danger-ink mt-1 text-xs">
          {error.message}
        </Error>
      ))}
    </Root>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <BaseLabel className="text-muted text-label mb-1 font-medium">{children}</BaseLabel>;
}

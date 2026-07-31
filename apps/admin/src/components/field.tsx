import { Field as BaseField } from '@base-ui/react/field';

const { Root, Label: BaseLabel, Error, Validity } = BaseField;

const errorClassName = 'text-danger-ink mt-1 text-xs';

type FieldError = { match: keyof ValidityState; message: React.ReactNode };

export function Field({
  name,
  label,
  hint,
  errors,
  error,
  children,
}: {
  name?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  errors?: FieldError[];
  error?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Root name={name}>
      {typeof label === 'string' ? <Label>{label}</Label> : label}

      {children}

      {hint && <div className="text-muted mt-1 text-xs">{hint}</div>}

      {error && <div className={errorClassName}>{error}</div>}

      {errors?.map((error) => (
        <Error key={error.match} match={error.match} className={errorClassName}>
          {error.message}
        </Error>
      ))}

      <Validity>
        {({ validity }) => !errors?.some(({ match }) => validity[match]) && <Error className={errorClassName} />}
      </Validity>
    </Root>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <BaseLabel className="text-muted text-label mb-1 font-medium">{children}</BaseLabel>;
}

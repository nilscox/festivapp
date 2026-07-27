import { Field } from '@base-ui-components/react/field';
import clsx from 'clsx';
import type { ComponentProps, ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

type FieldError = { match: ComponentProps<typeof Field.Error>['match']; message: ReactNode };

type TextFieldProps = ComponentPropsWithoutRef<'input'> & {
  label: string;
  labelAddon?: ReactNode;
  description?: ReactNode;
  // For Base UI Form usage: native-validity-matched messages.
  errors?: FieldError[];
  // For manual (non-Form) validation: an error shown whenever it is set.
  errorMessage?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({
  label,
  labelAddon,
  description,
  errors,
  errorMessage,
  inputRef,
  className,
  ...control
}: TextFieldProps) {
  return (
    <Field.Root name={control.name} className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <Field.Label className="text-label font-semibold">{label}</Field.Label>
        {labelAddon}
      </div>
      <Field.Control
        ref={inputRef}
        {...control}
        aria-invalid={errorMessage ? true : undefined}
        className={clsx(
          'text-form h-11 w-full rounded-xl border bg-surface px-3.5 text-ink outline-none placeholder:text-faint data-invalid:border-danger',
          errorMessage ? 'border-danger' : 'border-line',
          className,
        )}
      />
      {errorMessage && <p className="mt-1.5 text-xs text-danger-ink">{errorMessage}</p>}
      {errors?.map((error) => (
        <Field.Error key={String(error.match)} match={error.match} className="mt-1.5 text-xs text-danger-ink">
          {error.message}
        </Field.Error>
      ))}
      {description && <Field.Description className="mt-1.5 text-xs text-faint">{description}</Field.Description>}
    </Field.Root>
  );
}

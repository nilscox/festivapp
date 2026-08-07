import { type AnyFormApi, createFormHook } from '@tanstack/react-form';

import { Button } from '../button.tsx';
import { ArrayField } from './array-field.tsx';
import { FieldContext, FormContext, useFormContext } from './context.ts';
import { CheckboxField, ColorField, FileField, InputField, RangeField, SelectField, TextareaField } from './fields.tsx';

export const { useAppForm } = createFormHook({
  fieldContext: FieldContext,
  formContext: FormContext,
  fieldComponents: {
    ArrayField,
    CheckboxField,
    ColorField,
    FileField,
    RangeField,
    SelectField,
    TextareaField,
    InputField,
  },
  formComponents: {},
});

export function Form({
  form,
  className,
  children,
}: {
  form: AnyFormApi;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <FormContext value={form}>
      <form
        noValidate
        className={className}
        onSubmit={async (event) => {
          event.preventDefault();
          event.stopPropagation();

          const element = event.currentTarget;

          await form.handleSubmit();
          focusFirstError(element);
        }}
      >
        {children}
      </form>
    </FormContext>
  );
}

export function SubmitButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} className={className}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}

// the errors are React state, so the invalid controls only exist after the next paint
function focusFirstError(element: HTMLFormElement) {
  requestAnimationFrame(() => {
    const control = element.querySelector<HTMLElement>('input[data-invalid], textarea[data-invalid]');

    control?.focus();
    control?.scrollIntoView({ block: 'center' });
  });
}

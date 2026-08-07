import { type AnyFormApi, createFormHook } from '@tanstack/react-form';

import { Button } from '../button.tsx';
import { ArrayField } from './array-field.tsx';
import { CheckboxField } from './checkbox.tsx';
import { ColorField } from './color-input.tsx';
import { ComboboxField } from './combobox.tsx';
import { FieldContext, FormContext, useFormContext } from './context.ts';
import { FileField } from './file-input.tsx';
import { ImagePositionField } from './image-position.tsx';
import { InputField } from './input.tsx';
import { RangeField } from './range.tsx';
import { SelectField } from './select.tsx';
import { TextareaField } from './textarea.tsx';

export const { useAppForm } = createFormHook({
  fieldContext: FieldContext,
  formContext: FormContext,
  fieldComponents: {
    ArrayField,
    CheckboxField,
    ColorField,
    ComboboxField,
    FileField,
    ImagePositionField,
    InputField,
    RangeField,
    SelectField,
    TextareaField,
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

export function SubmitButton(props: Omit<React.ComponentProps<typeof Button>, 'type' | 'disabled'>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => <Button {...props} type="submit" disabled={isSubmitting} />}
    </form.Subscribe>
  );
}

// the errors are React state, so the invalid controls only exist after the next paint
function focusFirstError(element: HTMLFormElement) {
  requestAnimationFrame(() => {
    const control = element.querySelector<HTMLElement>('[data-invalid]:is(input, textarea, button, [tabindex])');

    control?.focus();
    control?.scrollIntoView({ block: 'center' });
  });
}

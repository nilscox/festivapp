import { createFormHookContexts } from '@tanstack/react-form';

export const {
  fieldContext: FieldContext,
  useFieldContext,
  formContext: FormContext,
  useFormContext,
} = createFormHookContexts();

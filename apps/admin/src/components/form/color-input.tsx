import { Field as BaseField } from '@base-ui/react/field';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';

export function ColorInput(props: React.ComponentProps<'input'>) {
  return (
    <div className="row items-center gap-3">
      <BaseField.Control
        {...props}
        type="color"
        className="size-12 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
      />

      <span className="text-muted font-mono text-xs uppercase">{props.value}</span>
    </div>
  );
}

export function ColorField({ label, hint }: FieldProps) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <ColorInput
        name={field.name}
        value={field.state.value}
        onChange={(event) => field.handleChange(event.currentTarget.value)}
      />
    </Field>
  );
}

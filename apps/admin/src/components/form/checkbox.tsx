import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import clsx from 'clsx';
import { Check } from 'lucide-react';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';

const { Root, Indicator } = BaseCheckbox;

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
  checked,
  onCheckedChange,
  onBlur,
}: {
  name?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onBlur?: React.FocusEventHandler;
}) {
  return (
    <label className="row cursor-pointer items-start gap-2">
      <Root
        name={name}
        defaultChecked={defaultChecked}
        checked={checked}
        onCheckedChange={onCheckedChange}
        onBlur={onBlur}
        className={clsx(
          'bg-surface hover:border-line-strong flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md border',
          'data-checked:bg-accent data-checked:border-accent',
        )}
      >
        <Indicator className="text-white">
          <Check className="size-3.5" strokeWidth={3} />
        </Indicator>
      </Root>

      <div>
        <div className="text-form font-medium">{label}</div>
        {hint && <div className="text-muted mt-0.5 text-xs">{hint}</div>}
      </div>
    </label>
  );
}

export function CheckboxField({ label, hint }: FieldProps) {
  const field = useFieldContext<boolean>();

  return (
    <Field>
      <Checkbox
        name={field.name}
        label={label}
        hint={hint}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
      />
    </Field>
  );
}

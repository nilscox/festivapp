import { Field as BaseField } from '@base-ui/react/field';
import { Plus, Trash2 } from 'lucide-react';

import { Button, IconButton } from '../button.tsx';
import { useFieldContext } from './context.ts';
import { fieldError } from './field.tsx';

export function ArrayField<T>({
  label,
  add,
  empty,
  children,
}: {
  label: React.ReactNode;
  add?: React.ReactNode;
  empty: T;
  children: (index: number) => React.ReactNode;
}) {
  const field = useFieldContext<T[]>();
  const error = fieldError(field.state.meta.errors);

  return (
    <BaseField.Root name={field.name} invalid={error !== undefined} render={<fieldset />} className="col gap-2">
      <legend className="text-muted text-label mb-1 font-medium">{label}</legend>

      {field.state.value.map((_, index) => (
        <div key={index} className="row items-start gap-2">
          <div className="min-w-0 flex-1">{children(index)}</div>

          <IconButton
            icon={Trash2}
            variant="ghost"
            aria-label="Remove"
            onClick={() => field.removeValue(index)}
            className="hover:text-danger mt-1.5"
          />
        </div>
      ))}

      <Button variant="secondary" size="sm" className="mr-auto" onClick={() => field.pushValue(empty)}>
        <Plus className="size-3" />
        {add}
      </Button>

      {error !== undefined && (
        <BaseField.Error match={true} className="text-danger-ink text-xs">
          {error}
        </BaseField.Error>
      )}
    </BaseField.Root>
  );
}

import { Field } from '@base-ui/react/field';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button, IconButton } from './button.tsx';

export function FieldArray<T>({
  fields,
  name,
  label,
  add,
  onAdd,
  onRemove,
  children,
}: {
  fields: Array<[key: React.Key, T]>;
  name?: string;
  label: React.ReactNode;
  add?: React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  children: (value: T, index: number) => React.ReactNode;
}) {
  return (
    <Field.Root name={name} render={<fieldset />} className="col gap-2">
      <legend className="text-muted text-label mb-1 font-medium">{label}</legend>

      {fields.map(([key, value], index) => (
        <div key={key} className="row items-start gap-2">
          <div className="min-w-0 flex-1">{children(value, index)}</div>

          <IconButton
            icon={Trash2}
            variant="ghost"
            aria-label="Remove"
            onClick={() => onRemove(index)}
            className="hover:text-danger mt-1.5"
          />
        </div>
      ))}

      <Button variant="secondary" size="sm" className="mr-auto" onClick={() => onAdd()}>
        <Plus className="size-3" />
        {add}
      </Button>

      <Field.Error className="text-danger-ink text-xs" />
    </Field.Root>
  );
}

export type FieldArray<T> = ReturnType<typeof useFieldArray<T>>;

export function useFieldArray<T>(items: T[]) {
  const [fields, setFields] = useState<Array<[React.Key, T]>>(() => items.map((item) => [createKey(), item]));

  return {
    fields,
    append: (item: T) => setFields((fields) => [...fields, [createKey(), item]]),
    remove: (index: number) => setFields((fields) => [...fields.slice(0, index), ...fields.slice(index + 1)]),
    update: (index: number, item: T) =>
      setFields((fields) => fields.map((field, at) => (at === index ? [field[0], item] : field))),
  };
}

function createKey() {
  return crypto.randomUUID();
}

export function getFieldArrayValues<T>(
  values: Record<string, unknown>,
  prefix: string,
  parse: (value: unknown) => T | undefined,
) {
  return Object.entries(values)
    .filter(([name]) => name.startsWith(`${prefix}.`))
    .map(([, value]) => parse(value))
    .filter((value): value is T => value !== undefined);
}

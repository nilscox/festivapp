import { produce } from 'immer';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { useReducer } from 'react';
import { createId } from 'src/utils';

import { Button } from './button';
import { useFieldId } from './field';
import { Input } from './input';

export function FieldArray({ values: initialValues, name }: { values: string[]; name: string }) {
  const [values, dispatch] = useFieldArray(initialValues);
  const fieldId = useFieldId();

  return (
    <>
      {values.map(({ value, id }, index) => (
        <div key={id} className="row gap-2 items-center">
          <Input
            name={name}
            id={index === 0 ? fieldId : [fieldId, id].join('_')}
            defaultValue={value}
            className="flex-1"
          />
          <Button variant="ghost" onClick={() => dispatch({ type: 'remove', id })}>
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ))}

      <Button variant="ghost" onClick={() => dispatch({ type: 'add' })} className="self-start">
        <PlusIcon className="size-4" />
        Add
      </Button>
    </>
  );
}

function useFieldArray(initialValues: string[]) {
  return useReducer(
    produce(producer),
    initialValues.map((value) => ({ id: createId(), value })),
  );
}

function producer(
  fields: Array<{ id: string; value: string }>,
  action: { type: 'add'; initialValue?: string } | { type: 'remove'; id: string },
) {
  if (action.type === 'add') {
    fields.push({ id: createId(), value: action.initialValue ?? '' });
  }

  if (action.type === 'remove') {
    const index = fields.findIndex((field) => field.id === action.id);

    fields.splice(index, 1);
  }
}

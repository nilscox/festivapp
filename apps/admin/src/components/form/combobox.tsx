import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { Check, ChevronDown } from 'lucide-react';

import { useFieldContext } from './context.ts';
import { Field, type FieldProps } from './field.tsx';
import { Input } from './input.tsx';

const { Root, Icon, Portal, Positioner, Popup, Empty, List, Item, ItemIndicator } = BaseCombobox;

type ComboboxProps = {
  items: string[];
  name?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
};

export function Combobox({ items, name, defaultValue, value, onValueChange, placeholder }: ComboboxProps) {
  return (
    <Root items={items} name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <div className="relative">
        <BaseCombobox.Input render={<Input />} placeholder={placeholder} />
        <Icon className="text-faint pointer-events-none absolute right-0 inline-flex h-full shrink-0 flex-row items-center px-3">
          <ChevronDown className="size-4" />
        </Icon>
      </div>

      <Portal>
        <Positioner sideOffset={6}>
          <Popup className="base-ui-fade bg-surface max-h-64 w-(--anchor-width) scrollbar-thin overflow-y-auto rounded-lg border p-1 shadow-xl">
            <Empty className="text-muted px-3 py-2 text-sm">No match</Empty>

            <List>
              {(item: string) => (
                <Item
                  key={item}
                  value={item}
                  className="text-form text-ink data-highlighted:bg-subtle row cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 outline-none"
                >
                  {item}
                  <ItemIndicator>
                    <Check className="text-accent size-4" />
                  </ItemIndicator>
                </Item>
              )}
            </List>
          </Popup>
        </Positioner>
      </Portal>
    </Root>
  );
}

export function ComboboxField({
  label,
  hint,
  items,
  placeholder,
}: FieldProps & Pick<ComboboxProps, 'items' | 'placeholder'>) {
  const field = useFieldContext<string>();

  return (
    <Field label={label} hint={hint}>
      <Combobox
        name={field.name}
        items={items}
        placeholder={placeholder}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value ?? '')}
      />
    </Field>
  );
}

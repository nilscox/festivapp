import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

const { Root, Trigger, Value, Icon, Portal, Positioner, Popup, Item, ItemText, ItemIndicator } = BaseSelect;

type Item<T> = { value: T; label: React.ReactNode };

type SelectProps<T> = {
  items: Item<T>[];
  name?: string;
  defaultValue?: T;
  value?: T;
  onValueChange?: (value: T | null) => void;
  placeholder?: string;
};

export function Select<T extends string | number>({
  items,
  name,
  defaultValue,
  value,
  onValueChange,
  placeholder,
}: SelectProps<T>) {
  return (
    <Root items={items} name={name} defaultValue={defaultValue} value={value} onValueChange={onValueChange}>
      <Trigger className="text-form bg-surface text-ink hover:border-line-strong row h-11 w-full cursor-pointer items-center justify-between rounded-lg border px-3">
        <Value placeholder={<span className="text-faint">{placeholder}</span>} />
        <Icon className="text-faint shrink-0 data-popup-open:-scale-y-100">
          <ChevronDown className="size-4" />
        </Icon>
      </Trigger>

      <Portal>
        <Positioner sideOffset={6} alignItemWithTrigger={false}>
          <Popup
            data-popup
            className="base-ui-fade bg-surface max-h-64 w-(--anchor-width) transform-none overflow-y-auto rounded-lg border p-1 shadow-xl"
          >
            {items.map((item) => (
              <Item
                key={String(item.value)}
                value={item.value}
                className="text-form text-ink data-highlighted:bg-subtle row cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 outline-none"
              >
                <ItemText>{item.label}</ItemText>
                <ItemIndicator>
                  <Check className="text-accent size-4" />
                </ItemIndicator>
              </Item>
            ))}
          </Popup>
        </Positioner>
      </Portal>
    </Root>
  );
}

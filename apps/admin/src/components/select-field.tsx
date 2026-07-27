import { Select } from '@base-ui-components/react/select';
import { Check, ChevronsUpDown } from 'lucide-react';

type Item<T> = { value: T; label: string };

type SelectFieldProps<T> = {
  label?: string;
  value: T;
  onValueChange: (value: T) => void;
  items: Item<T>[];
};

export function SelectField<T extends string | number>({ label, value, onValueChange, items }: SelectFieldProps<T>) {
  return (
    <div className="block">
      {label && <div className="text-label mb-1.5 font-semibold">{label}</div>}
      <Select.Root
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onValueChange(next);
          }
        }}
        items={items}
      >
        <Select.Trigger className="text-form border-line bg-surface text-ink flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border px-3.5 outline-none">
          <Select.Value />
          <Select.Icon className="text-faint">
            <ChevronsUpDown className="size-4" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-50">
            <Select.Popup className="border-line bg-surface max-h-64 w-(--anchor-width) overflow-y-auto rounded-xl border p-1 shadow-xl">
              {items.map((item) => (
                <Select.Item
                  key={String(item.value)}
                  value={item.value}
                  className="text-form text-ink data-[highlighted]:bg-well flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 outline-none"
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="text-accent size-4" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}

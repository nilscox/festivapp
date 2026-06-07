'use no memo';

import clsx from 'clsx';
import { useCombobox, useMultipleSelection } from 'downshift';
import { ArrowDownIcon } from 'lucide-react';
import { useState } from 'react';

import { useFieldId } from '@/components/field';
import { Input } from '@/components/input';

export function Combobox<T>({
  items,
  defaultValue,
  filter,
  itemToString,
  itemToKey,
  renderItem,
  renderSelectedItem,
}: {
  items: T[];
  defaultValue?: T[];
  filter: (selectedItems: T[], inputValue: string) => (item: T) => boolean;
  itemToString: (item: T | null) => string;
  itemToKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  renderSelectedItem: (item: T, onRemove: () => void) => React.ReactNode;
}) {
  const fieldId = useFieldId();

  const { selectedItems, getSelectedItemProps, getDropdownProps, addSelectedItem, removeSelectedItem } =
    useMultipleSelection({
      defaultSelectedItems: defaultValue,
      onStateChange({ selectedItems }) {
        if (selectedItems) {
          setFilteredItems(items.filter(filter(selectedItems, '')));
        }
      },
    });

  const [filteredItems, setFilteredItems] = useState(items.filter(filter(selectedItems, '')));

  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps } = useCombobox({
    items: filteredItems,
    selectedItem: null,
    itemToString,
    onInputValueChange({ inputValue }) {
      setFilteredItems(items.filter(filter(selectedItems, inputValue)));
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        addSelectedItem(selectedItem);
      }
    },
    stateReducer(state, { type, changes }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
          return { ...changes, inputValue: '' };
        default:
          return changes;
      }
    },
  });

  return (
    <div className="relative col max-w-lg gap-2">
      <div className="row items-stretch gap-1">
        <Input {...getInputProps(getDropdownProps({ id: fieldId }))} className="w-full" />
        <button type="button" {...getToggleButtonProps()} className="cursor-pointer px-2">
          <ArrowDownIcon className={clsx('size-4', { '-scale-y-100': isOpen })} />
        </button>
      </div>

      <ul
        className={clsx(
          'absolute z-10 mt-10 max-h-80 w-full overflow-y-auto overscroll-y-contain rounded-md border bg-white shadow-md',
          { hidden: !isOpen },
        )}
        {...getMenuProps()}
      >
        {isOpen &&
          filteredItems.map((item, index) => (
            <li
              className={clsx('col px-3 py-2', highlightedIndex === index && 'bg-gray-100')}
              key={`${itemToKey(item)}_${index}`}
              {...getItemProps({ item })}
            >
              {renderItem(item)}
            </li>
          ))}
      </ul>

      <div className="row flex-wrap items-center gap-2">
        {selectedItems.map((item) => (
          <div
            key={itemToKey(item)}
            className="row max-w-fit items-center gap-1 rounded-full bg-gray-100 px-3 py-0.5"
            {...getSelectedItemProps({ selectedItem: item })}
          >
            {renderSelectedItem(item, () => removeSelectedItem(item))}
          </div>
        ))}
      </div>
    </div>
  );
}

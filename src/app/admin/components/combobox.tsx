'use no memo';

import { useFieldId } from 'admin/components/field';
import { Input } from 'admin/components/input';
import clsx from 'clsx';
import { useCombobox, useMultipleSelection } from 'downshift';
import { ArrowDownIcon } from 'lucide-react';
import { useState } from 'react';

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
    <div className="relative col gap-2 max-w-lg">
      <div className="row gap-1 items-stretch">
        <Input {...getInputProps(getDropdownProps({ id: fieldId }))} className="w-full" />
        <button type="button" {...getToggleButtonProps()} className="px-2 cursor-pointer">
          <ArrowDownIcon className={clsx('size-4', { '-scale-y-100': isOpen })} />
        </button>
      </div>

      <ul
        className={clsx(
          'absolute w-full bg-white shadow-md max-h-80 overscroll-y-contain overflow-y-auto z-10 mt-10 rounded-md border',
          { hidden: !isOpen },
        )}
        {...getMenuProps()}
      >
        {isOpen &&
          filteredItems.map((item, index) => (
            <li
              className={clsx('py-2 px-3 col', highlightedIndex === index && 'bg-gray-100')}
              key={`${itemToKey(item)}_${index}`}
              {...getItemProps({ item })}
            >
              {renderItem(item)}
            </li>
          ))}
      </ul>

      <div className="row gap-2 items-center flex-wrap">
        {selectedItems.map((item) => (
          <div
            key={itemToKey(item)}
            className="bg-gray-100 rounded-full max-w-fit px-3 py-0.5 row gap-1 items-center"
            {...getSelectedItemProps({ selectedItem: item })}
          >
            {renderSelectedItem(item, () => removeSelectedItem(item))}
          </div>
        ))}
      </div>
    </div>
  );
}

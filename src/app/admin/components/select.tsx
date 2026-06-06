'use no memo';

import { useFieldId } from 'admin/components/field';
import clsx from 'clsx';
import { useSelect } from 'downshift';
import { ChevronDownIcon } from 'lucide-react';

export function Select<T>({
  items,
  defaultValue,
  placeholder,
  itemToString,
  itemToKey,
  renderItem,
  renderSelectedItem,
}: {
  items: T[];
  defaultValue?: T;
  placeholder?: string;
  itemToString: (item: T | null) => string;
  itemToKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  renderSelectedItem: (item: T) => React.ReactNode;
}) {
  const fieldId = useFieldId();

  const { isOpen, getToggleButtonProps, getMenuProps, highlightedIndex, getItemProps, selectedItem } = useSelect({
    items,
    defaultSelectedItem: defaultValue,
    itemToString,
  });

  return (
    <div className="relative col gap-2 max-w-lg">
      <button
        {...getToggleButtonProps({ id: fieldId })}
        type="button"
        className="rounded-md border px-2 py-1 bg-white text-ellipsis text-start row justify-between items-stretch"
      >
        {selectedItem ? (
          <div>{renderSelectedItem(selectedItem)}</div>
        ) : (
          <input readOnly placeholder={placeholder} className="cursor-default outline-none flex-1" />
        )}

        <div className="row items-center">
          <ChevronDownIcon className={clsx('size-4', { '-scale-y-100': isOpen })} />
        </div>
      </button>

      <ul
        className={clsx(
          'absolute w-full bg-white shadow-md max-h-80 overscroll-y-contain overflow-y-auto z-10 mt-10 rounded-md border',
          { hidden: !isOpen },
        )}
        {...getMenuProps()}
      >
        {isOpen &&
          items.map((item, index) => (
            <li
              className={clsx('py-2 px-3 col', highlightedIndex === index && 'bg-gray-100')}
              key={`${itemToKey(item)}_${index}`}
              {...getItemProps({ item })}
            >
              {renderItem(item)}
            </li>
          ))}
      </ul>
    </div>
  );
}

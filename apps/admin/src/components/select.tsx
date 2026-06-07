'use no memo';

import clsx from 'clsx';
import { useSelect } from 'downshift';
import { ChevronDownIcon } from 'lucide-react';

import { useFieldId } from '@/components/field';

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
    <div className="relative col max-w-lg gap-2">
      <button
        {...getToggleButtonProps({ id: fieldId })}
        type="button"
        className="row items-stretch justify-between rounded-md border bg-white px-2 py-1 text-start text-ellipsis"
      >
        {selectedItem ? (
          <div>{renderSelectedItem(selectedItem)}</div>
        ) : (
          <input
            readOnly
            placeholder={placeholder}
            aria-label="placeholder"
            className="flex-1 cursor-default outline-none"
          />
        )}

        <div className="row items-center">
          <ChevronDownIcon className={clsx('size-4', { '-scale-y-100': isOpen })} />
        </div>
      </button>

      <ul
        className={clsx(
          'absolute z-10 mt-10 max-h-80 w-full overflow-y-auto overscroll-y-contain rounded-md border bg-white shadow-md',
          { hidden: !isOpen },
        )}
        {...getMenuProps()}
      >
        {isOpen &&
          items.map((item, index) => (
            <li
              className={clsx('col px-3 py-2', highlightedIndex === index && 'bg-gray-100')}
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

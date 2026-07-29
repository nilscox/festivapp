import clsx from 'clsx';
import { Search } from 'lucide-react';

import { Input } from './input.tsx';

export function SearchInput({
  value,
  onValueChange,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={clsx('relative', className)}>
      <Search className="text-faint pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2" />

      <Input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        onKeyDown={(event) => event.key === 'Escape' && onValueChange('')}
        placeholder={placeholder}
        aria-label={placeholder}
        className="ps-9"
      />
    </div>
  );
}

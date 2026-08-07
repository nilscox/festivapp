import clsx from 'clsx';
import { Search, SearchX } from 'lucide-react';

import { Button } from './button.tsx';
import { EmptyState } from './empty-state.tsx';
import { Input } from './form/input.tsx';

export function SearchInput({
  value,
  onValueChange,
  placeholder,
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

export function SearchSummary({
  search,
  items,
  matching,
  className,
  children,
}: {
  search: string;
  items: unknown[];
  matching: unknown[];
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={clsx('text-muted font-mono text-xs tracking-wide', className)}>
      {search === '' ? (
        children
      ) : (
        <>
          {matching.length} of {items.length} &bull; matching "{search}"
        </>
      )}
    </p>
  );
}

export function NoMatch({
  title,
  description,
  onClear,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      cta={
        <Button variant="secondary" onClick={onClear}>
          Clear search
        </Button>
      }
    />
  );
}

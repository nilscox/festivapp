import clsx from 'clsx';
import { Heart, ListFilter, Search, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { useOverflows } from '../../hooks/use-overflows.ts';
import { useBootstrap } from '../../lib/bootstrap.ts';
import { type FilterChip, type TimetableFilters } from './use-timetable-filters.ts';

export function FiltersButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="border-line bg-surface row shrink-0 items-center gap-2 self-center rounded-full border px-3.5 py-2 text-sm font-semibold"
    >
      <ListFilter className="size-4" />

      <span>Filters</span>

      {count > 0 && (
        <span className="bg-accent text-app row text-xxs size-4.5 items-center justify-center rounded-full font-mono font-semibold">
          {count}
        </span>
      )}
    </button>
  );
}

export function FilterSearch({ search, setSearch }: { search: string; setSearch: (search: string) => void }) {
  return (
    <div className="border-line row items-center gap-2 border-b px-4 py-3">
      <Search className="text-faint size-4 shrink-0" />

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search artists, stages, styles"
        aria-label="Search sessions"
        className="placeholder:text-faint min-w-0 flex-1 text-sm outline-none"
      />
    </div>
  );
}

export function FilterChips({ chips, onClear }: { chips: FilterChip[]; onClear: () => void }) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="border-line row flex-wrap items-center gap-2 border-b px-4 py-2.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="bg-accent/12 text-accent row items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold"
        >
          {chip.label}
          <X className="size-3 opacity-65" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className="text-muted text-xxs px-1 py-1.5 font-mono tracking-wider uppercase underline"
      >
        Clear
      </button>
    </div>
  );
}

export function TimetableFilters({
  onClose,
  matches,
  filters,
}: {
  onClose: () => void;
  matches: number;
  filters: TimetableFilters;
}) {
  const { locations, days, styles } = useBootstrap();

  return (
    <div className="col h-full">
      <div className="bg-app border-line border-b px-4 pt-3 pb-2.5">
        <div className="bg-line mx-auto mb-2 h-1 w-9 rounded-full" />

        <div className="row items-center justify-between">
          <h2 className="font-display text-lg font-bold">Filters</h2>

          <div className="row items-center gap-5">
            <button
              type="button"
              onClick={filters.toggleLiked}
              aria-pressed={filters.liked}
              aria-label="Liked only"
              className="-m-2 p-2"
            >
              <Heart className={clsx('size-4', filters.liked && 'fill-accent text-accent')} />
            </button>

            <button
              type="button"
              onClick={filters.clear}
              className="text-muted text-xxs font-mono tracking-wider uppercase underline"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="col flex-1 gap-6 overflow-y-auto px-4 py-6">
        <Section label="Day">
          <Options>
            {days.map((day) => (
              <Chip key={day.day} selected={filters.day === day.day} onToggle={() => filters.toggleDay(day.day)}>
                {day.label}
              </Chip>
            ))}
          </Options>
        </Section>

        <Section label="Location">
          <Options>
            {locations.map((location) => (
              <Chip
                key={location.id}
                selected={filters.locations.includes(location.id)}
                onToggle={() => filters.toggleLocation(location.id)}
              >
                {location.name}
              </Chip>
            ))}
          </Options>
        </Section>

        {styles.length > 0 && (
          <Section label="Styles">
            <CollapsibleOptions>
              {styles.map((style) => (
                <Chip key={style} selected={filters.styles.includes(style)} onToggle={() => filters.toggleStyle(style)}>
                  {style}
                </Chip>
              ))}
            </CollapsibleOptions>
          </Section>
        )}
      </div>

      <div className="border-line border-t px-4 pt-5">
        <button type="button" onClick={onClose} className="bg-accent text-app w-full rounded-2xl py-3.5 font-semibold">
          Show {matches} event{matches === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-muted text-xxs mb-2.5 font-mono tracking-widest uppercase">{label}</h3>

      {children}
    </section>
  );
}

function Options({ children }: { children: React.ReactNode }) {
  return <div className="row flex-wrap gap-2">{children}</div>;
}

function CollapsibleOptions({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const overflows = useOverflows(ref);

  const collapsed = !expanded && overflows;

  return (
    <>
      <div className="relative">
        <div ref={ref} className={clsx('row flex-wrap gap-2', !expanded && 'max-h-28 overflow-hidden')}>
          {children}
        </div>

        {collapsed && (
          <div className="from-app via-app/65 pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t to-transparent" />
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-muted mt-1 w-full text-center font-mono text-xs font-semibold tracking-wider uppercase"
        >
          + view all
        </button>
      )}
    </>
  );
}

function Chip({
  selected,
  onToggle,
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={clsx(
        'rounded-full border px-3 py-1.5 text-sm font-medium',
        selected ? 'border-accent bg-accent/12 text-accent' : 'border-line text-ink',
      )}
    >
      {children}
    </button>
  );
}

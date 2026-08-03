import { has } from '@festivapp/utils';
import { useState } from 'react';

import { PageHeader } from '../../components/page-header.tsx';
import { SessionCard } from '../../components/session-card.tsx';
import { Sheet } from '../../components/sheet.tsx';
import { useClock } from '../../hooks/use-clock.ts';
import { useBootstrap } from '../../lib/bootstrap.ts';
import { FilterChips, FiltersButton, FilterSearch, TimetableFilters } from './filters.tsx';
import { useTimetableFilters } from './use-timetable-filters.ts';

export function Timetable() {
  const { sessions, days, locations } = useBootstrap();

  const now = useClock();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters = useTimetableFilters(days, locations);
  const filtered = sessions.filter(filters.filterSession);

  const groups = days
    .map((day) => ({ ...day, sessions: filtered.filter(has('day', day.day)) }))
    .filter((day) => day.sessions.length > 0);

  return (
    <div className="col min-h-0 flex-1">
      <PageHeader
        title="Timetable"
        subtitle={
          <div className="text-faint font-mono text-xs uppercase">
            {filters.hasFilters ? (
              <>
                {filtered.length} of {sessions.length} events
              </>
            ) : (
              <>{sessions.length} events</>
            )}
          </div>
        }
        end={<FiltersButton count={filters.filtersCount} onOpen={() => setFiltersOpen(true)} />}
      />

      <FilterSearch search={filters.search} setSearch={filters.setSearch} />

      <FilterChips chips={filters.chips} onClear={filters.clear} />

      <div className="reveal col min-h-0 flex-1 gap-8 overflow-y-auto pb-8">
        {groups.length === 0 && <NoMatch hasFilters={filters.hasFilters} onClear={filters.clear} />}

        {groups.map((day) => (
          <section key={day.day} className="px-4">
            <h2 className="font-display text-accent from-app via-app/75 sticky top-0 z-10 bg-linear-to-b via-75% to-transparent py-2 font-semibold">
              {day.label}
            </h2>

            {day.sessions.map((session) => (
              <SessionCard key={session.id} session={session} now={now} />
            ))}
          </section>
        ))}
      </div>

      <Sheet open={filtersOpen} label="Filter events" onClose={() => setFiltersOpen(false)}>
        <TimetableFilters onClose={() => setFiltersOpen(false)} matches={filtered.length} filters={filters} />
      </Sheet>
    </div>
  );
}

function NoMatch({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  if (!hasFilters) {
    return <p className="text-muted px-4 py-8 text-center text-sm">No results.</p>;
  }

  return (
    <div className="col items-center gap-3 px-8 py-14 text-center">
      <p className="text-muted text-sm">No events match these filters.</p>

      <button
        type="button"
        onClick={onClear}
        className="border-line text-accent rounded-full border px-4 py-2 text-sm font-semibold"
      >
        Clear filters
      </button>
    </div>
  );
}

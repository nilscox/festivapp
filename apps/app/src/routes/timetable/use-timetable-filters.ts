import type { Location } from '@festivapp/contracts';
import { get, has, matchesSearch } from '@festivapp/utils';
import { useReducer } from 'react';

import { sessionStyles, sessionTitle } from '../../lib/session.ts';

import type { Day, ResolvedSession } from '../../lib/bootstrap.ts';

export type TimetableFilters = ReturnType<typeof useTimetableFilters>;

type Filters = {
  search: string;
  day: string | null;
  locations: string[];
  styles: string[];
};

export type FilterChip = {
  key: React.Key;
  label: React.ReactNode;
  onRemove: () => void;
};

type Action =
  | { type: 'set-search'; search: string }
  | { type: 'toggle-day'; day: string }
  | { type: 'toggle-location'; id: string }
  | { type: 'toggle-style'; style: string }
  | { type: 'clear' };

const noFilters: Filters = {
  search: '',
  day: null,
  locations: [],
  styles: [],
};

export function useTimetableFilters(days: Day[], locations: Location[]) {
  const [filters, dispatch] = useReducer(reducer, noFilters);

  const setSearch = (search: string) => dispatch({ type: 'set-search', search });
  const toggleDay = (day: string) => dispatch({ type: 'toggle-day', day });
  const toggleLocation = (id: string) => dispatch({ type: 'toggle-location', id });
  const toggleStyle = (style: string) => dispatch({ type: 'toggle-style', style });
  const clear = () => dispatch({ type: 'clear' });

  const day = days.find(has('day', filters.day));

  const chips: FilterChip[] = [
    ...(day ? [{ key: day.day, label: day.label, onRemove: () => toggleDay(day.day) }] : []),
    ...filters.locations.map((id) => ({
      key: id,
      label: locations.find(has('id', id))?.name ?? id,
      onRemove: () => toggleLocation(id),
    })),
    ...filters.styles.map((style) => ({
      key: style,
      label: style,
      onRemove: () => toggleStyle(style),
    })),
  ];

  return {
    filterSession: (session: ResolvedSession) => matchesFilters(session, filters),
    filtersCount: countActiveFilters(filters),
    hasFilters: filters.search !== '' || countActiveFilters(filters) > 0,
    chips,
    search: filters.search,
    setSearch,
    day: filters.day,
    toggleDay,
    locations: filters.locations,
    toggleLocation,
    styles: filters.styles,
    toggleStyle,
    clear,
  };
}

function reducer(filters: Filters, action: Action): Filters {
  switch (action.type) {
    case 'set-search':
      return { ...filters, search: action.search };

    case 'toggle-day':
      return { ...filters, day: filters.day === action.day ? null : action.day };

    case 'toggle-location':
      return { ...filters, locations: toggle(filters.locations, action.id) };

    case 'toggle-style':
      return { ...filters, styles: toggle(filters.styles, action.style) };

    case 'clear':
      return noFilters;
  }
}

function matchesFilters(session: ResolvedSession, filters: Filters): boolean {
  const { search, day, locations, styles } = filters;

  if (day !== null && session.day !== day) {
    return false;
  }

  if (locations.length > 0 && !locations.includes(session.locationId)) {
    return false;
  }

  const ownStyles = sessionStyles(session);

  if (styles.length > 0 && !styles.some((style) => ownStyles.includes(style))) {
    return false;
  }

  if (
    search !== '' &&
    !matchesSearch(
      search,
      sessionTitle(session),
      session.location.name,
      ...session.participants.map(get('name')),
      ...ownStyles,
    )
  ) {
    return false;
  }

  return true;
}

function countActiveFilters({ day, locations, styles }: Filters): number {
  return (day === null ? 0 : 1) + locations.length + styles.length;
}

function toggle(values: string[], value: string): string[] {
  if (values.includes(value)) {
    return values.filter((val) => val !== value);
  }

  return [...values, value];
}

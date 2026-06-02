'use client';

import clsx from 'clsx';
import { XIcon } from 'lucide-react';
import { useReducer, useState } from 'react';
import { Button } from 'src/app/admin/components/button';
import { Input } from 'src/app/admin/components/input';
import { Artist } from 'src/database/model';

type ArtistSearchState = {
  selectedIds: Set<string>;
  search: string;
};

type ArtistSearchAction =
  | { type: 'add'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'setSearch'; search: string };

function reducer(state: ArtistSearchState, action: ArtistSearchAction): ArtistSearchState {
  switch (action.type) {
    case 'add':
      return { ...state, selectedIds: new Set([...state.selectedIds, action.id]), search: '' };
    case 'remove':
      return {
        ...state,
        selectedIds: new Set([...state.selectedIds].filter((id) => id !== action.id)),
      };
    case 'setSearch':
      return { ...state, search: action.search };
  }
}

export function ArtistSearch({
  allArtists,
  initialArtistIds = [],
}: {
  allArtists: Artist[];
  initialArtistIds: string[];
}) {
  const [state, dispatch] = useReducer(reducer, {
    selectedIds: new Set(initialArtistIds),
    search: '',
  });

  const [isOpen, setIsOpen] = useState(false);

  const filtered = allArtists.filter(
    (artist) =>
      !state.selectedIds.has(artist.id) &&
      artist.name.toLowerCase().includes(state.search.toLowerCase()),
  );

  const selectedArtists = allArtists.filter((artist) => state.selectedIds.has(artist.id));

  return (
    <div className="col gap-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search and add artists..."
          value={state.search}
          onChange={(e) => dispatch({ type: 'setSearch', search: e.currentTarget.value })}
          onFocus={() => setIsOpen(true)}
          className="w-full"
        />

        {isOpen && state.search && filtered.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg">
            {filtered.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'add', id: artist.id })}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                >
                  <div className="font-medium">{artist.name}</div>
                  <div className="text-xs text-dim">{artist.styles.join(' / ')}</div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0"
            aria-label="Close dropdown"
          />
        )}
      </div>

      {selectedArtists.length > 0 && (
        <div className="col gap-2">
          <div className="flex flex-wrap gap-2">
            {selectedArtists.map((artist) => (
              <div
                key={artist.id}
                className="row items-center gap-2 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-sm"
              >
                <span>{artist.name}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'remove', id: artist.id })}
                  className="flex items-center justify-center rounded hover:bg-gray-200"
                  aria-label={`Remove ${artist.name}`}
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedArtists.map((artist) => (
        <input key={artist.id} type="hidden" name="artistIds" value={artist.id} />
      ))}
    </div>
  );
}

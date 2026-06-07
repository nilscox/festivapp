import { Artist } from '@festivapp/persistence';
import { XIcon } from 'lucide-react';
import { useCallback } from 'react';

import { Combobox } from '@/components/combobox';

export function ArtistsCombobox({ artists, defaultValue }: { artists: Artist[]; defaultValue?: Artist[] }) {
  const filter = useCallback((selectedItems: Artist[], inputValue: string) => {
    const selectedIds = new Set(selectedItems.map(({ id }) => id));

    return (artist: Artist) => {
      if (selectedIds.has(artist.id)) {
        return false;
      }

      if (inputValue !== '') {
        return artist.name.toLowerCase().includes(inputValue.toLowerCase());
      }

      return true;
    };
  }, []);

  const itemToKey = useCallback((artist: Artist) => artist.id, []);
  const itemToString = useCallback((artist: Artist | null) => artist?.name ?? '', []);

  return (
    <Combobox
      items={artists}
      defaultValue={defaultValue}
      filter={filter}
      itemToKey={itemToKey}
      itemToString={itemToString}
      renderItem={(artist) => (
        <>
          <span>{artist.name}</span>
          <span className="text-sm text-gray-700">{artist.styles.join(' / ')}</span>
        </>
      )}
      renderSelectedItem={(artist, onRemove) => (
        <>
          {artist.name}

          <button type="button" onClick={onRemove} className="cursor-pointer">
            <XIcon className="size-4" />
          </button>

          <input type="hidden" name="artistId" value={artist.id} />
        </>
      )}
    />
  );
}

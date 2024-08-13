import { useIntl } from '@cookbook/solid-intl';
import { createSignal, For } from 'solid-js';

import { ArtistItem } from '../components/artist-item';
import { DocumentTitle } from '../components/document-title';
import { Translate } from '../components/intl';
import { Artist, data } from '../data';
import { defined } from '../utils/assert';

export function BookmarksPage() {
  const intl = useIntl();

  return (
    <div class="col gap-6">
      <DocumentTitle title={intl.formatMessage({ id: 'navigation.data' })} />

      <For
        each={data.userData.getAllData()}
        fallback={
          <div class="col my-6 gap-2">
            <p class="text-lg font-medium">
              <Translate id="userData.noNotes.title" />
            </p>

            <p class="text-dim">
              <Translate id="userData.noNotes.line1" />
            </p>

            <p class="text-dim">
              <Translate id="userData.noNotes.line2" />
            </p>
          </div>
        }
      >
        {(data) => <UserData {...data} />}
      </For>
    </div>
  );
}

function UserData(props: { artistId: string; bookmark: boolean; note: string }) {
  const intl = useIntl();
  const artist = () => defined(data.findArtist(props.artistId));

  const handleRemove = () => {
    if (window.confirm(intl.formatMessage({ id: 'userData.confirmRemove' }))) {
      data.userData.removeArtistData(props.artistId);
    }
  };

  return (
    <div class="col gap-2">
      <ArtistItem href={`/data/${artist().id}`} artist={artist()} onRemove={handleRemove} />
      <Note artist={artist()} />
    </div>
  );
}

function Note(props: { artist: Artist }) {
  const intl = useIntl();

  const [rows, setRows] = createSignal(2);

  const artistUserData = () => data.userData.getArtistData(props.artist.id);
  const setNote = (note: string) => data.userData.setArtistData(props.artist.id, { note });

  return (
    <textarea
      placeholder={intl.formatMessage({ id: 'artist.notePlaceholder' })}
      rows={rows()}
      value={artistUserData().note}
      onInput={(event) => setNote(event.target.value)}
      onFocus={() => setRows(6)}
      onBlur={() => setRows(2)}
      class="w-full"
      {...props}
    />
  );
}

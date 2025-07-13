import { useIntl } from '@cookbook/solid-intl';
import { A } from '@solidjs/router';
import { For } from 'solid-js';

import { ArtistItem } from 'src/components/artist-item';
import { DocumentTitle } from 'src/components/document-title';
import { Translate } from 'src/components/intl';
import { data } from 'src/data';
import { defined } from 'src/utils/assert';
import { getBookmarks } from 'src/utils/bookmarks';

export function Bookmarks() {
  const intl = useIntl();

  return (
    <div class="col gap-4">
      <DocumentTitle title={intl.formatMessage({ id: 'bookmarks.title' })} />

      <h2 class="my-8 text-center text-2xl font-bold">
        <Translate id="bookmarks.title" />
      </h2>

      <For
        each={getBookmarks()}
        fallback={
          <div class="my-4 text-lg">
            <Translate id="bookmarks.empty" />
          </div>
        }
      >
        {(artistId) => (
          <A href={`/artist/${artistId}`}>
            <ArtistItem artist={defined(data.artists.get(artistId))} />
          </A>
        )}
      </For>
    </div>
  );
}

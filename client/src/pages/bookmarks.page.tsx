import { useIntl } from '@cookbook/solid-intl';
import { A } from '@solidjs/router';
import { For } from 'solid-js';

import { ArtistItem } from 'src/components/artist-item';
import { Translate } from 'src/components/intl';
import { data } from 'src/data';
import { defined } from 'src/utils/assert';
import { getBookmarks } from 'src/utils/bookmarks';
import { usePageTitle } from 'src/utils/page-title';

export function Bookmarks() {
  const intl = useIntl();

  usePageTitle(() => intl.formatMessage({ id: 'bookmarks.title' }));

  return (
    <div class="col gap-4">
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

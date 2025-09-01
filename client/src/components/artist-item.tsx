import StarIcon from 'lucide-solid/icons/star';
import { Show } from 'solid-js';

import { Artist } from 'src/data';
import { isBookmarked } from 'src/utils/bookmarks';

import { FormatDate, Translate } from './intl';

export function ArtistItem(props: { start?: Date; artist: Artist }) {
  return (
    <div class="relative rounded-lg border border-primary/10">
      <img src={props.artist.image} class="h-64 w-full rounded-lg object-cover shadow-lg" />

      <div class="absolute inset-x-0 top-0 row justify-between rounded-t-lg bg-linear-180 from-black/80 via-black/30 via-70% to-transparent p-4">
        <div class="row items-center gap-2">
          <div class="text-2xl font-semibold text-white text-shadow-sm">{props.artist.name}</div>
          <StarIcon
            class="size-4"
            classList={{
              'fill-secondary': !isBookmarked(props.artist.id),
              'fill-primary': isBookmarked(props.artist.id),
            }}
          />
        </div>

        <Show when={props.start}>
          {(start) => (
            <div class="font-medium text-white capitalize text-shadow-sm">
              <FormatDate date={start()} weekday="long" hour="numeric" minute="numeric" />
            </div>
          )}
        </Show>
      </div>

      <div class="absolute inset-x-0 bottom-0 rounded-b-lg bg-linear-0 from-black/60 to-transparent p-2">
        <div class="text-white text-shadow-lg">
          <Translate id={`artistType.${props.artist.type}`} />
        </div>

        <div class="text-white text-shadow-lg">{props.artist.styles.join(' | ')}</div>
      </div>
    </div>
  );
}

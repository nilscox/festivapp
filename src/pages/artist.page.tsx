import { useParams } from '@solidjs/router';
import { Clock4Icon, Link, MapPin, StarIcon } from 'lucide-solid';
import { Component, For, JSX, Show } from 'solid-js';

import { FormatDate, Translate } from 'src/components/intl';
import { type Artist, data } from 'src/data';
import Bandcamp from 'src/icons/bandcamp.svg';
import Facebook from 'src/icons/facebook.svg';
import Instagram from 'src/icons/instagram.svg';
import Soundcloud from 'src/icons/soundcloud.svg';
import Spotify from 'src/icons/spotify.svg';
import Youtube from 'src/icons/youtube.svg';
import { assert, defined } from 'src/utils/assert';
import { isBookmarked, setBookmarked } from 'src/utils/bookmarks';
import { usePageTitle } from 'src/utils/page-title';

export function Artist() {
  const { artistId } = useParams();
  assert(typeof artistId === 'string');

  const artist = () => {
    return defined(data.artists.get(artistId));
  };

  const slots = () => {
    return data.timetables.flatMap((timetable) =>
      timetable.slots
        .filter((slot) => slot.data.type === 'artist' && slot.data.id === artistId)
        .map((slot) => [timetable, slot] as const),
    );
  };

  usePageTitle(() => artist().name);

  return (
    <div class="col gap-8">
      <div class="relative h-96">
        <button
          onClick={() => setBookmarked(artistId, !isBookmarked(artistId))}
          class="absolute top-4 right-4"
        >
          <StarIcon
            class="size-5"
            classList={{ 'fill-secondary': !isBookmarked(artistId), 'fill-primary': isBookmarked(artistId) }}
          />
        </button>

        <img src={artist().image} class="size-full rounded-lg object-cover shadow-lg" />

        <div class="absolute inset-x-0 bottom-0 flex justify-center p-4">
          <div class="rounded-lg bg-secondary px-4 py-1">
            <h2 class="text-2xl font-bold text-primary">{artist().name}</h2>
          </div>
        </div>
      </div>

      <div class="col gap-4">
        <For each={slots()}>
          {([timetable, slot]) => (
            <div class="col gap-1">
              <div class="row items-center gap-2">
                <Clock4Icon class="size-5" />
                <FormatDate date={slot.start} weekday="long" hour="numeric" minute="numeric" />
              </div>
              <div class="row items-center gap-2">
                <MapPin class="size-5" />
                {timetable.data.name}
              </div>
            </div>
          )}
        </For>
      </div>

      <Show when={artist().styles.length > 0 ? artist().styles : false}>
        {(styles) => <div>{styles().join(', ')}</div>}
      </Show>

      <div>
        <Show when={artist().origin}>
          {(origin) => (
            <div>
              <Translate id="artist.origin" values={{ origin: origin(), strong }} />
            </div>
          )}
        </Show>

        <div>
          <Translate id="artist.label" values={{ label: artist().label, strong }} />
        </div>
      </div>

      {artist().description}

      <ul class="row justify-evenly gap-2">
        <For each={getSocialLinks(artist())}>
          {([Icon, link]) => (
            <li>
              <a
                href={link}
                class="block rounded-lg bg-primary fill-secondary p-2 text-secondary"
                target="_blank"
              >
                <Icon class="size-8" />
              </a>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

function strong(children: JSX.Element) {
  return <span class="font-semibold">{children}</span>;
}

function getSocialLinks(artist: Artist): Array<[Component<{ class?: string }>, string]> {
  return artist.social.map((link) => {
    if (link.includes('facebook.com')) {
      return [Facebook, link] satisfies [unknown, unknown];
    }

    if (link.includes('instagram.com')) {
      return [Instagram, link] satisfies [unknown, unknown];
    }

    if (link.includes('youtube.com')) {
      return [Youtube, link] satisfies [unknown, unknown];
    }

    if (link.includes('soundcloud.com')) {
      return [Soundcloud, link] satisfies [unknown, unknown];
    }

    if (link.includes('spotify.com')) {
      return [Spotify, link] satisfies [unknown, unknown];
    }

    if (link.includes('bandcamp.com')) {
      return [Bandcamp, link] satisfies [unknown, unknown];
    }

    return [Link, link];
  });
}

import { A } from '@solidjs/router';
import clsx from 'clsx';
import { Star, X } from 'lucide-solid';
import { Show } from 'solid-js';

import { Artist, data } from '../data';
import { defined } from '../utils/assert';

import { ArtistDate } from './intl';

export function ArtistItem(props: {
  href: string;
  artist: Artist;
  onRemove?: () => void;
  classes?: Partial<Record<'image' | 'info', string>>;
}) {
  const artistUserData = () => data.userData.getArtistData(props.artist.id);
  const setBookmark = (bookmark: boolean) => data.userData.setArtistData(props.artist.id, { bookmark });

  return (
    <A href={props.href} class="row gap-2">
      <Show when={props.artist.image} fallback={<div class="w-1/3 rounded-lg bg-slate-500/25 shadow-md" />}>
        <img
          src={props.artist.image}
          class={clsx('max-h-32 w-1/3 rounded-lg bg-white object-cover shadow-md', props.classes?.image)}
        />
      </Show>

      <div class="col min-w-0 flex-1 gap-0.5">
        <div class="row items-center gap-2">
          <div class="truncate text-lg font-medium">{props.artist.name}</div>

          <button
            onClick={(event) => {
              event.preventDefault();
              setBookmark(!artistUserData().bookmark);
            }}
          >
            <Star class="size-4" classList={{ 'fill-primary': artistUserData()?.bookmark }} />
          </button>

          <button
            onClick={(event) => {
              event.preventDefault();
              props.onRemove?.();
            }}
            classList={{ hidden: props.onRemove === undefined }}
            class="ml-auto"
          >
            <X class="text-dim size-4" />
          </button>
        </div>

        <div class={clsx('text-dim text-xs', props.classes?.info)}>
          <ArtistDate date={data.findArtistDate(props.artist.id)?.start} /> |{' '}
          {data.stageLabel(defined(data.findArtistStage(props.artist.id)))}
        </div>

        <div class="text-dim text-xs">{data.showTypeLabel(props.artist.type)}</div>

        <div class="text-dim text-xs">{props.artist.styles.join(', ')}</div>
      </div>
    </A>
  );
}

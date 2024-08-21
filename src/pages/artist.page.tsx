import { useIntl } from '@cookbook/solid-intl';
import { useParams } from '@solidjs/router';
import { ArrowDown, Bell, BellRing, Clock, MapPin, Star } from 'lucide-solid';
import { siFacebook, siInstagram, siSoundcloud, siSpotify, siYoutube } from 'simple-icons';
import { createSignal, For, Match, Show, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { DocumentTitle } from '../components/document-title';
import { ArtistDate, Translate } from '../components/intl';
import { Artist, data } from '../data';
import { defined } from '../utils/assert';

export function ArtistPage() {
  const { artistId } = useParams();
  const artist = data.findArtist(defined(artistId));

  return (
    <Show when={artist} fallback={<Translate id="artist.artistNotFound" />}>
      {(artist) => <ArtistDetails artist={artist()} />}
    </Show>
  );
}

function ArtistDetails(props: { artist: Artist }) {
  const artistUserData = () => data.userData.getArtistData(props.artist.id);
  const setBookmark = (bookmark: boolean) => data.userData.setArtistData(props.artist.id, { bookmark });
  const setNotify = (notify: boolean) => data.userData.setArtistData(props.artist.id, { notify });

  return (
    <div class="col gap-4">
      <DocumentTitle title={props.artist.name} />

      <Show when={props.artist.image}>
        <img src={props.artist.image} class="rounded-lg bg-white shadow-lg" />
      </Show>

      <div class="row my-2 items-center justify-center gap-2">
        <h2>{props.artist.name}</h2>
        <button onClick={() => setBookmark(!artistUserData().bookmark)}>
          <Star class="size-4" classList={{ 'fill-primary': artistUserData()?.bookmark }} />
        </button>
      </div>

      <div>
        <div class="row items-center gap-2">
          <Clock size={20} class="text-dim" />
          <ArtistDate date={data.findArtistDate(props.artist.id)?.start} />
          <button onClick={() => setNotify(!artistUserData().notify)} class="hidden">
            <Dynamic
              component={artistUserData().notify ? BellRing : Bell}
              class="size-4"
              classList={{ 'fill-primary': artistUserData()?.notify }}
            />
          </button>
        </div>

        <div class="row items-center gap-2">
          <MapPin size={20} class="text-dim" />
          {data.stageLabel(defined(data.findArtistStage(props.artist.id)))}
        </div>
      </div>

      <div>
        <div>
          <Translate id="artist.styles" values={{ styles: props.artist.styles.join(', ') }} />
        </div>
        <div>
          <Translate id="artist.label" values={{ label: props.artist.label }} />
        </div>
        <div>
          <Translate id="artist.origin" values={{ origin: props.artist.origin }} />
        </div>
      </div>

      <Description description={props.artist.description} />

      <ul class="row justify-center gap-4">
        <For each={props.artist.social}>
          {(link) => (
            <li>
              <a href={link} target="_blank">
                <SocialIcon link={link} />
              </a>
            </li>
          )}
        </For>
      </ul>

      <Note artist={props.artist} />
    </div>
  );
}

function Description(props: { description: string[] }) {
  // eslint-disable-next-line solid/reactivity
  const [showMore, setShowMore] = createSignal(props.description.join(' ').length < 50);

  return (
    <div>
      <div classList={{ 'line-clamp-6': !showMore() }}>
        <For each={props.description}>{(text) => <p>{text}</p>}</For>
      </div>

      <button
        onClick={() => setShowMore(true)}
        classList={{ '!hidden': showMore() }}
        class="row my-2 w-full items-center justify-center gap-2 text-sm font-bold uppercase"
      >
        <Translate id="artist.showMore" />
        <ArrowDown class="size-4" />
      </button>
    </div>
  );
}

function Note(props: { artist: Artist }) {
  const intl = useIntl();

  const artistUserData = () => data.userData.getArtistData(props.artist.id);
  const setNote = (note: string) => data.userData.setArtistData(props.artist.id, { note });

  return (
    <textarea
      placeholder={intl.formatMessage({ id: 'artist.notePlaceholder' })}
      rows={6}
      class="w-full"
      value={artistUserData().note}
      onInput={(event) => setNote(event.target.value)}
      {...props}
    />
  );
}

function SocialIcon(props: { link: string }) {
  return (
    <svg viewBox="0 0 24 24" class="size-12 rounded-md bg-primary/75 p-2 text-secondary">
      <Switch>
        <Match when={props.link.includes('facebook.com')}>
          <path d={siFacebook.path} class="fill-current" />
        </Match>

        <Match when={props.link.includes('instagram.com')}>
          <path d={siInstagram.path} class="fill-current" />
        </Match>

        <Match when={props.link.includes('soundcloud.com')}>
          <path d={siSoundcloud.path} class="fill-current" />
        </Match>

        <Match when={props.link.includes('youtube.com')}>
          <path d={siYoutube.path} class="fill-current" />
        </Match>

        <Match when={props.link.includes('spotify.com')}>
          <path d={siSpotify.path} class="fill-current" />
        </Match>
      </Switch>
    </svg>
  );
}

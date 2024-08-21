import { useIntl } from '@cookbook/solid-intl';
import { A } from '@solidjs/router';
import { For, JSX, Match, Show, Switch } from 'solid-js';

import { ActivityItem } from '../components/activity-item';
import { ArtistItem } from '../components/artist-item';
import { DocumentTitle } from '../components/document-title';
import { FormattedDate, Translate } from '../components/intl';
import { data, isArtistSlot } from '../data';
import { defined } from '../utils/assert';
import { createNow } from '../utils/now';

export function NowPage() {
  const intl = useIntl();

  return (
    <>
      <DocumentTitle title={intl.formatMessage({ id: 'navigation.now' })} />

      <div class="my-8 text-center text-2xl font-bold">
        <Translate id="now.title" />
      </div>

      <ul class="col gap-6">
        <For each={data.stages}>
          {(stage) => (
            <li class="col gap-2">
              <h2>{stage.label}</h2>
              <CurrentArtist stage={stage.id} />
              <NextArtist stage={stage.id} />
            </li>
          )}
        </For>
      </ul>
    </>
  );
}

function CurrentArtist(props: { stage: string }) {
  const now = createNow();

  const timetable = () => data.timetable(props.stage);
  const currentSlot = () => data.timetable(props.stage).findSlot(now());

  const artist = () => {
    const slot = currentSlot();

    if (isArtistSlot(slot)) {
      return defined(data.findArtist(slot.artistId));
    }
  };

  const activity = () => {
    const slotValue = currentSlot();

    if (!isArtistSlot(slotValue)) {
      return slotValue;
    }
  };

  return (
    <Switch
      fallback={
        <Fallback>
          <Translate id="now.break" />
        </Fallback>
      }
    >
      <Match when={!timetable().hasStarted(now())}>
        <Fallback>
          <Translate id="now.notStarted" />
        </Fallback>
      </Match>

      <Match when={timetable().hasEnded(now())}>
        <Fallback>
          <Translate id="now.ended" />
        </Fallback>
      </Match>

      <Match when={artist()}>
        {(artist) => (
          <ArtistItem href={`/now/${artist().id}`} artist={artist()} classes={{ info: 'hidden' }} />
        )}
      </Match>

      <Match when={activity()}>{(activity) => <ActivityItem {...activity()} />}</Match>
    </Switch>
  );
}

function Fallback(props: { children: JSX.Element }) {
  return <div class="text-dim my-2 text-center font-medium uppercase">— {props.children} —</div>;
}

function NextArtist(props: { stage: string }) {
  const now = createNow();

  const timetable = () => data.timetable(props.stage);
  const nextSlot = () => timetable().findNextSlot(now());

  const artist = () => {
    const slot = nextSlot();

    if (isArtistSlot(slot)) {
      return defined(data.findArtist(slot.artistId));
    }
  };

  const activity = () => {
    const slot = nextSlot();

    if (!isArtistSlot(slot)) {
      return slot;
    }
  };

  const date = (
    <span>
      (<FormattedDate date={nextSlot()?.start} options={{ timeStyle: 'short' }} />)
    </span>
  );

  return (
    <Show when={timetable().isPlaying(now())}>
      <div class="text-dim row gap-1 text-sm">
        <span>
          <Translate id="now.next" />
        </span>

        <Switch
          fallback={
            <span class="uppercase">
              <Translate id="now.break" />
            </span>
          }
        >
          <Match when={artist()}>
            {(artist) => (
              <A href={`/now/${artist().id}`} class="underline">
                {artist().name} {date}
              </A>
            )}
          </Match>

          <Match when={activity()}>
            {(activity) => (
              <div>
                {activity().label} {date}
              </div>
            )}
          </Match>
        </Switch>
      </div>
    </Show>
  );
}

import { Show } from 'solid-js';

import { ArtistDate } from './intl';

export function ActivityItem(props: { start: Date; end: Date; label: string; type?: string }) {
  return (
    <div>
      <div class="row items-center justify-between text-sm text-dim">
        <ArtistDate date={props.start} />
        <Show when={props.type}>{(type) => <div>{type()}</div>}</Show>
      </div>
      <div class="text-lg">{props.label}</div>
    </div>
  );
}

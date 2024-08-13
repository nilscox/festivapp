import { onMount } from 'solid-js';

import { data } from '../data';

export function DocumentTitle(props: { title?: string }) {
  onMount(() => {
    document.title = props.title ? `${props.title} - ${data.title}` : data.title;
  });

  return null;
}

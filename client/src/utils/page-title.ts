import { createEffect, createSignal } from 'solid-js';

import { data } from 'src/data';

export const [pageTitle, setPageTitle] = createSignal(data.title);

export function usePageTitle(title: () => string) {
  createEffect(() => {
    document.title = `${title()} - ${data.title}`;
    setPageTitle(title());
  });
}

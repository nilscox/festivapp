import { useIntl } from '@cookbook/solid-intl';
import { createEffect, createSignal } from 'solid-js';

import { DocumentTitle } from '../components/document-title';
import { data } from '../data';

export function InfoPage() {
  const intl = useIntl();

  const [html, setHtml] = createSignal<string>();

  createEffect(() => {
    import('../utils/markdown')
      .then(({ markdownToHtml }) => markdownToHtml(data.info))
      .then(setHtml, console.error);
  });

  return (
    <div class="col h-full gap-2">
      <DocumentTitle title={intl.formatMessage({ id: 'info.title' })} />

      {/* eslint-disable-next-line solid/no-innerhtml */}
      <section innerHTML={html()} class="info" />

      <div class="mt-auto pb-2 pt-4 text-center text-xs">
        <span>Version de l'app : {__VERSION__}</span>
        <span class="mx-2">&bullet;</span>
        <span>
          <a href="https://github.com/nilscox/festivapp" target="_blank" class="underline">
            Code source
          </a>
        </span>
      </div>
    </div>
  );
}

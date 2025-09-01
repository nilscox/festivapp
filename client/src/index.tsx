/* @refresh reload */
import { IntlProvider } from '@cookbook/solid-intl';
import '@fontsource-variable/open-sans';
import en from 'lang/en.json';
import fr from 'lang/fr.json';
import { render } from 'solid-js/web';

import { App } from './app';
import './index.css';

const locale = import.meta.env.VITE_LANGUAGE;

render(
  () => (
    <IntlProvider locale={locale} messages={{ fr, en }[locale] ?? fr}>
      <App />
    </IntlProvider>
  ),
  document.getElementById('app')!,
);

/* @refresh reload */
import { IntlProvider } from '@cookbook/solid-intl';
import { Navigate, Route, Router } from '@solidjs/router';
import { render } from 'solid-js/web';
// eslint-disable-next-line import-x/no-unresolved
import { registerSW } from 'virtual:pwa-register';

import en from 'lang/en.json';
import fr from 'lang/fr.json';

import { App } from './app';
import { ArtistPage } from './pages/artist.page';
import { InfoPage } from './pages/info.page';
import { MapPage } from './pages/map.page';
import { NowPage } from './pages/now.page';
import { TimetablesPage } from './pages/timetables.page';
import { BookmarksPage } from './pages/user-data.page';

import '@fontsource-variable/open-sans';
import './index.css';

registerSW({ immediate: true });

const root = document.getElementById('root')!;

const messages = { en, fr }[import.meta.env.VITE_LANGUAGE] ?? en;

render(
  () => (
    <IntlProvider locale="fr" messages={messages}>
      <Router root={App}>
        <Route path="/now">
          <Route path="/" component={NowPage} />
          <Route path="/:artistId" component={ArtistPage} />
        </Route>

        <Route path="/timetables">
          <Route path="" component={TimetablesPage} />
          <Route path="/:artistId" component={ArtistPage} />
        </Route>

        <Route path="/data">
          <Route path="" component={BookmarksPage} />
          <Route path="/:artistId" component={ArtistPage} />
        </Route>

        <Route path="/map" component={MapPage} />

        <Route path="/info" component={InfoPage} />

        <Route path="/*" component={NotFound} />
      </Router>
    </IntlProvider>
  ),
  root
);

function NotFound() {
  return <Navigate href="/now" />;
}

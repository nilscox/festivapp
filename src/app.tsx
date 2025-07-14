import { Navigate, Route, Router } from '@solidjs/router';

import { Layout } from './layout';
import { Artist } from './pages/artist.page';
import { Bookmarks } from './pages/bookmarks.page';
import { Event } from './pages/event.page';
import { Map } from './pages/map.page';
import { Now } from './pages/now.page';
import { Timetables } from './pages/timetables.page';

export function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Now} />
      <Route path="/timetables" component={Timetables} />
      <Route path="/map" component={Map} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/event/:eventId" component={Event} />
      <Route path="/artist/:artistId" component={Artist} />
      <Route component={() => <Navigate href="/" />} />
    </Router>
  );
}

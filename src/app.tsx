import { A } from '@solidjs/router';
import { MapPin, Pen, Play, TableCellsMerge } from 'lucide-solid';
import { JSX } from 'solid-js';

import { Translate } from './components/intl';
import { data } from './data';

export function App(props: { children?: JSX.Element }) {
  return (
    <div
      class="col h-full bg-bottom bg-no-repeat sm:bg-cover sm:bg-center"
      style={{ 'background-image': `url("${data.background}")` }}
    >
      <Styles />
      <AppHeader />
      <main class="flex-1 overflow-auto p-2">{props.children}</main>
      <AppFooter />
    </div>
  );
}

function Styles() {
  const styles = `
    :root {
      --color-primary: ${data.theme.primary};
      --color-secondary: ${data.theme.secondary};
    }
  `;

  return <style innerText={styles} />;
}

function AppHeader() {
  return (
    <header class="bg-primary p-4 text-center text-xl font-bold tracking-wider text-secondary shadow-md">
      {data.title}
    </header>
  );
}

function AppFooter() {
  return (
    <footer class="row justify-evenly rounded-t-xl bg-primary/80 p-2 font-semibold tracking-tight text-secondary">
      <A
        href="/now"
        class="col min-w-16 items-center gap-1 text-xs uppercase transition-colors"
        inactiveClass="grayscale opacity-70"
      >
        <Play class="size-6" />
        <Translate id="navigation.now" />
      </A>

      <A
        href="/timetables"
        class="col min-w-16 items-center gap-1 text-xs uppercase transition-colors"
        inactiveClass="grayscale opacity-70"
      >
        <TableCellsMerge class="size-6" />
        <Translate id="navigation.timetables" />
      </A>

      <A
        href="/data"
        class="col min-w-16 items-center gap-1 text-xs uppercase transition-colors"
        inactiveClass="grayscale opacity-70"
      >
        <Pen class="size-6" />
        <Translate id="navigation.data" />
      </A>

      <A
        href="/map"
        class="col min-w-16 items-center gap-1 text-xs uppercase transition-colors"
        inactiveClass="grayscale opacity-70"
      >
        <MapPin class="size-6" />
        <Translate id="navigation.map" />
      </A>
    </footer>
  );
}

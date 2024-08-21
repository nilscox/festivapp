import { A } from '@solidjs/router';
import { Info, MapPin, Pen, Play, TableCellsMerge } from 'lucide-solid';
import { JSX } from 'solid-js';

import { Translate } from './components/intl';
import { data } from './data';

export function App(props: { children?: JSX.Element }) {
  return (
    <div
      class="col h-full bg-bottom bg-no-repeat sm:bg-cover sm:bg-center"
      style={{ 'background-image': `url("${data.background}")` }}
    >
      <ThemeVariables />
      <AppHeader />
      <main class="flex-1 overflow-auto p-2">{props.children}</main>
      <AppFooter />
    </div>
  );
}

function ThemeVariables() {
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
    <header class="row items-center justify-center bg-primary p-4 text-xl font-bold tracking-wider text-secondary shadow-md">
      <div class="w-6" />
      <h1 class="flex-1 text-center">{data.title}</h1>
      <A href="/info" class="w-6">
        <Info class="size-full" />
      </A>
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

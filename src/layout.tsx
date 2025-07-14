import { A } from '@solidjs/router';
import { MapPinIcon, PlayIcon, StarIcon, TableCellsMergeIcon } from 'lucide-solid';
import { Component, JSX } from 'solid-js';

import { Translate } from './components/intl';
import { pageTitle } from './utils/page-title';

export function Layout(props: { children?: JSX.Element }) {
  return (
    <>
      <Header />
      <main class="mx-auto col min-h-screen max-w-3xl py-16">
        <div class="col flex-1 px-2 py-4">{props.children}</div>
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header class="fixed inset-x-0 top-0 z-10 mx-auto row h-16 max-w-3xl items-center justify-center bg-secondary/80 shadow-lg before:absolute before:inset-0 before:bg-white/5">
      <h1 class="text-2xl font-semibold">{pageTitle()}</h1>
    </header>
  );
}

function Footer() {
  return (
    <footer class="fixed inset-x-0 bottom-0 z-10 mx-auto h-16 max-w-3xl rounded-t-xl bg-primary text-secondary">
      <nav class="row h-full items-center justify-evenly gap-3">
        <NavLink href="/" end Icon={PlayIcon}>
          <Translate id="navigation.now" />
        </NavLink>

        <NavLink href="/timetables" Icon={TableCellsMergeIcon}>
          <Translate id="navigation.timetables" />
        </NavLink>

        <NavLink href="/bookmarks" Icon={StarIcon}>
          <Translate id="navigation.bookmarks" />
        </NavLink>

        <NavLink href="/map" Icon={MapPinIcon}>
          <Translate id="navigation.map" />
        </NavLink>
      </nav>
    </footer>
  );
}

function NavLink(props: {
  href: string;
  end?: boolean;
  Icon: Component<{ class?: string }>;
  children: JSX.Element;
}) {
  return (
    <A
      href={props.href}
      end={props.end}
      class="col w-20 items-center gap-1 text-xs font-semibold uppercase no-underline transition-colors"
      inactiveClass="grayscale opacity-60"
    >
      <props.Icon class="size-6" />
      {props.children}
    </A>
  );
}

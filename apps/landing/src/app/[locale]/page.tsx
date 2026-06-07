import { Trans } from '@lingui/react/macro';

import { Button } from '@/components/button';
import { configureI18n } from '@/i18n/i18n';

import { Features } from './features';
import { Hero } from './hero';
import { Organizers } from './organizers';

export default function LandingPage({ params }: PageProps<'/[locale]'>) {
  configureI18n(params);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 antialiased">
      <Nav />
      <Hero />
      <Features />
      <Organizers />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <span className="text-xl font-extrabold tracking-tight text-indigo-600">FestivApp</span>
        <Button href="#contact" variant="outline">
          <Trans>Contact us</Trans>
        </Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6 text-sm text-slate-400">
        <span>
          <Trans>© 2025 FestivApp</Trans>
        </span>
        <span>
          <Trans>Made for event creators</Trans>
        </span>
      </div>
    </footer>
  );
}

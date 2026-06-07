import { Trans } from '@lingui/react/macro';

import { Button } from '../../components/button';

export function Hero() {
  return (
    <section className="bg-linear-to-b from-indigo-50 to-white px-6 py-28 text-center">
      <div className="mx-auto max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-indigo-500 uppercase">
          <Trans>Festivals, conferences, workshops & more</Trans>
        </span>

        <h1 className="mt-4 text-5xl leading-tight font-extrabold tracking-tight text-slate-900">
          <Trans>
            Your event,
            <br />
            in your pocket.
          </Trans>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
          <Trans>
            FestivApp is a white-label mobile application that gives your attendees everything they need — schedule,
            map, social feed and live updates.
          </Trans>
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="#contact">
            <Trans>Get started</Trans>
          </Button>
          <Button href="#demo" variant="outline">
            <Trans>See the demo</Trans>
          </Button>
        </div>
      </div>
    </section>
  );
}

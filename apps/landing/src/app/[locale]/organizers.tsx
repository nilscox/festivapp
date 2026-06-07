import { Trans } from '@lingui/react/macro';

import { Button } from '../../components/button';

export function Organizers() {
  return (
    <section className="px-6 py-24 text-center">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          <Trans>One platform, all your events</Trans>
        </h2>

        <p className="mx-auto mt-4 max-w-xl leading-relaxed text-slate-500">
          <Trans>
            FestivApp is a multi-tenant platform. Each event gets its own branded experience, managed from a dedicated
            back-office. One event or a hundred — the architecture scales.
          </Trans>
        </p>

        <div className="mt-10">
          <Button href="#contact">
            <Trans>Let's talk</Trans>
          </Button>
        </div>
      </div>
    </section>
  );
}

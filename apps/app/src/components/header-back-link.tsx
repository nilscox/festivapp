import { Trans } from '@lingui/react/macro';
import { ArrowLeft } from 'lucide-react';

import { BackLink } from './back-link';

export function HeaderBackLink() {
  return (
    <header className="my-4">
      <BackLink className="background-text row items-center gap-2 font-semibold">
        <ArrowLeft className="size-5" />
        <Trans>Back</Trans>
      </BackLink>
    </header>
  );
}

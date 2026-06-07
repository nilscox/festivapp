import { Trans, useLingui } from '@lingui/react/macro';

import { configureI18n } from '@/i18n/i18n';
import { getFestival } from '@/server-utils';

export default async function () {
  await configureI18n();

  const { t } = useLingui();

  const festival = await getFestival();
  const map = festival.map ? `/uploads/${festival.map}` : null;

  return (
    <div className="col h-full items-center justify-center">
      {map ? (
        <a download href={map} aria-label={t`Download map`}>
          <img alt={t`Map`} src={map} className="w-full rounded-md" />
        </a>
      ) : (
        <p className="text-dim">
          <Trans>No map available.</Trans>
        </p>
      )}
    </div>
  );
}

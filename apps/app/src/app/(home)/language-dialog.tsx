'use client';

import { Trans, useLingui } from '@lingui/react/macro';

import { Button } from '@/components/button';
import { Dialog, DialogActions } from '@/components/dialog';

import { changeLanguage } from './actions';

export function LanguageDialog() {
  const { i18n } = useLingui();

  const languages = {
    en: { flag: 'https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg', label: 'English' },
    fr: { flag: 'https://purecatamphetamine.github.io/country-flag-icons/3x2/FR.svg', label: 'Français' },
  };

  return (
    <Dialog id="language-dialog" popover="" className="col gap-4">
      <header className="text-lg font-semibold">
        <Trans>Change language</Trans>
      </header>

      <form action={changeLanguage} className="col gap-2">
        {Object.entries(languages).map(([lang, { flag, label }], index) => (
          <label
            key={index}
            className="has-checked:bg-primary has-checked:text-accent p-2 rounded-md row gap-2 items-center"
          >
            <input
              type="radio"
              name="lang"
              value={lang}
              onChange={async (event) => {
                const messages = await import(`../../i18n/locales/${lang}/messages`);

                i18n.load(messages);
                i18n.activate(lang);

                event.target.form?.requestSubmit();
              }}
              defaultChecked={i18n.locale === lang}
              aria-label={label}
              className="sr-only"
            />

            <div className="p-0.5 bg-white rounded-xs max-w-fit">
              <img alt={lang} src={flag} className="h-4" />
            </div>

            <span className="font-medium">{label}</span>
          </label>
        ))}
      </form>

      <DialogActions>
        <Button variant="ghost" popoverTarget="language-dialog" popoverTargetAction="hide">
          <Trans>Close</Trans>
        </Button>
      </DialogActions>
    </Dialog>
  );
}

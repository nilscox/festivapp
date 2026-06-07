import { defined } from '@festivapp/utils';
import { setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import { cookies } from 'next/headers';
import { cache } from 'react';

const locales = ['en', 'fr'] as const;
type Locale = (typeof locales)[number];

const defaultLocale: Locale = 'en';

const i18nInstances = new Map<string, ReturnType<typeof setupI18n>>();

export async function configureI18n() {
  const locale = await getPreferredLocale();
  const i18n = await getI18nInstance(locale);

  setI18n(i18n);

  return i18n;
}

export async function getI18nInstance(locale: string) {
  if (i18nInstances.has(locale)) {
    return defined(i18nInstances.get(locale));
  }

  const { messages } = await import(`./locales/${locale}/messages`);

  const i18n = setupI18n({
    locale,
    messages: { [locale]: messages },
  });

  i18nInstances.set(locale, i18n);

  return i18n;
}

export const getPreferredLocale = cache(async function (): Promise<Locale> {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang');

  if (lang && isValidLocale(lang.value)) {
    return lang.value;
  }

  const acceptLanguage = cookieStore.get('accept-language')?.value;

  if (!acceptLanguage) {
    return defaultLocale;
  }

  const languages = acceptLanguage
    .split(',')
    .map(parseAcceptLanguagePart)
    .sort(({ q: a }, { q: b }) => b - a)
    .map(({ lang }) => lang);

  return languages.find(isValidLocale) ?? defaultLocale;
});

function parseAcceptLanguagePart(part: string) {
  const [lang = '', q = 'q=1'] = part.trim().split(';');

  return {
    lang: lang.trim().split('-')[0]!.toLowerCase(),
    q: parseFloat(q.replace('q=', '')),
  };
}

export function isValidLocale(lang: string): lang is Locale {
  return (locales as readonly string[]).includes(lang);
}

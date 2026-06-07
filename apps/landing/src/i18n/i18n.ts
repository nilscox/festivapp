import { defined } from '@festivapp/utils';
import { setupI18n } from '@lingui/core';
import { setI18n } from '@lingui/react/server';
import { notFound } from 'next/navigation';
import { use } from 'react';

const locales = ['en', 'fr'] as const;
type Locale = (typeof locales)[number];

const defaultLocale: Locale = 'en';

const i18nInstances = new Map<string, ReturnType<typeof setupI18n>>();

export function configureI18n(params: Promise<Record<string, string>>) {
  const { locale = '' } = use(params);

  if (!isValidLocale(locale)) {
    notFound();
  }

  const i18n = use(getI18nInstance(locale));

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

export function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) {
    return defaultLocale;
  }

  const languages = acceptLanguage
    .split(',')
    .map(parseAcceptLanguagePart)
    .sort(({ q: a }, { q: b }) => b - a)
    .map(({ lang }) => lang);

  return languages.find(isValidLocale) ?? defaultLocale;
}

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

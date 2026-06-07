'use server';

import { assert } from '@festivapp/utils';
import { cookies } from 'next/headers';
import { isString } from 'remeda';

import { isValidLocale } from '@/i18n/i18n';

export async function changeLanguage(formData: FormData) {
  const lang = formData.get('lang');

  assert(isString(lang));
  assert(isValidLocale(lang));

  const cookieStore = await cookies();

  cookieStore.set('lang', lang);
}

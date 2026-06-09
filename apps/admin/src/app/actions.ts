'use server';

import { db, schema } from '@festivapp/persistence';
import { assert } from '@festivapp/utils';
import { ActionResult } from '@festivapp/utils/client';
import { createId } from '@festivapp/utils/server';
import bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { nanoid } from 'nanoid';
import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import { promisify } from 'node:util';
import { isString } from 'remeda';

export async function login(state: ActionResult, formData: FormData): Promise<ActionResult> {
  const cookieStore = await cookies();

  if (cookieStore.has('token')) {
    cookieStore.delete('token');
  }

  const email = formData.get('email');
  const password = formData.get('password');

  assert(isString(email));
  assert(isString(password));

  const admin = await db.query.admins.findFirst({
    where: { email: { eq: email } },
  });

  if (!admin) {
    return { success: false, error: 'Invalid password' };
  }

  try {
    await promisify(bcrypt.compare)(password, admin.password);
  } catch {
    return { success: false, error: 'Invalid password' };
  }

  const token = nanoid(16);

  await db.insert(schema.authTokens).values({
    id: createId(),
    adminId: admin.id,
    value: token,
    expires: add(new Date(), { months: 3 }),
  });

  cookieStore.set('token', token);

  refresh();

  return {
    success: true,
    data: {},
  };
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete('token');

  refresh();
}

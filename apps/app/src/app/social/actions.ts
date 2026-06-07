'use server';

import { db, User } from '@festivapp/persistence';
import { schema } from '@festivapp/persistence/src/schema';
import { defined } from '@festivapp/utils';
import { createId, saveUploadedImage } from '@festivapp/utils/server';
import { msg } from '@lingui/core/macro';
import { getI18n } from '@lingui/react/server';
import assert from 'assert';
import { and, eq } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import { refresh } from 'next/cache';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';
import { isString } from 'remeda';
import { promisify } from 'util';

import { getFestival, getUser } from '@/server-utils';

const createAuthCode = customAlphabet('0123456789', 6);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendMail = promisify(transporter.sendMail.bind(transporter));

type LoginState = {
  state: 'email' | 'verify' | 'completed';
  email?: string;
  error?: string;
};

export async function logIn(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const { i18n } = defined(getI18n());

  try {
    const cookieStore = await cookies();

    if (cookieStore.has('authCode')) {
      throw new Error(i18n._(msg`You're already authenticated`));
    }

    if (!formData.has('code')) {
      await requestAuthCode(formData);

      return {
        state: 'verify',
        email: formData.get('email') as string,
      };
    } else {
      await verifyAuthCode(formData);

      return {
        state: 'completed',
      };
    }
  } catch (error) {
    console.error(error);
    return {
      ...prevState,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function requestAuthCode(formData: FormData) {
  const { i18n } = defined(getI18n());
  const festival = await getFestival();

  const name = formData.get('name');
  const email = formData.get('email');

  assert(isString(name));
  assert(isString(email));

  const authCode = process.env.AUTH_CODE ?? createAuthCode();

  await db
    .insert(schema.users)
    .values({
      id: createId(),
      festivalId: festival.id,
      name,
      email,
      authCode,
    })
    .onConflictDoUpdate({
      target: [schema.users.festivalId, schema.users.email],
      set: { name, authCode },
    });

  await sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    // replyTo: '',
    subject: i18n._(msg`${authCode} - Your festivapp authentication code`),
    text: i18n._(msg`Hey ${name}, here's your authentication code: ${authCode}.`),
    // html: '',
  });
}

async function verifyAuthCode(formData: FormData) {
  const { i18n } = defined(getI18n());

  const code = formData.get('code');
  const email = formData.get('email');

  assert(isString(code));
  assert(isString(email));

  const user = await db.query.users.findFirst({
    where: { email: { eq: email }, authCode: { eq: code } },
  });

  if (!user) {
    throw new Error(i18n._(msg`Invalid authentication code`));
  }

  const cookieStore = await cookies();

  cookieStore.set('authCode', code);

  refresh();
}

export async function logOut() {
  const cookieStore = await cookies();

  cookieStore.delete('authCode');
  refresh();
}

function auth(user: User | undefined) {
  const { i18n } = defined(getI18n());

  assert(user, new Error(i18n._(msg`Authentication required`)));

  return user;
}

export async function changeName(formData: FormData) {
  const user = auth(await getUser());
  const name = formData.get('name');

  assert(isString(name));

  await db.update(schema.users).set({ name }).where(eq(schema.users.id, user.id));
  refresh();
}

export async function changeProfileImage(formData: FormData) {
  const user = auth(await getUser());
  const image = formData.get('image');

  assert(image instanceof File);

  const imageRef = await saveUploadedImage(image);

  await db.update(schema.users).set({ imageRef }).where(eq(schema.users.id, user.id));
  refresh();
}

export async function createPost(formData: FormData) {
  const festival = await getFestival();
  const user = auth(await getUser());

  const parentId = formData.get('parentId');
  const message = formData.get('message');

  assert(isString(message));
  assert(parentId === null || isString(parentId));

  await db.insert(schema.posts).values({
    id: createId(),
    festivalId: festival.id,
    authorId: user.id,
    parentId,
    message,
    postedAt: new Date(),
  });

  refresh();
}

export async function toggleLike(formData: FormData) {
  const user = auth(await getUser());

  const postId = formData.get('postId');

  assert(isString(postId));

  const like = await db.query.likes.findFirst({
    where: { userId: user.id, postId },
  });

  if (like) {
    await db.delete(schema.likes).where(and(eq(schema.likes.userId, user.id), eq(schema.likes.postId, postId)));
  } else {
    await db.insert(schema.likes).values({ id: createId(), userId: user.id, postId });
  }

  refresh();
}

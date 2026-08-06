import type { TenantTheme } from '@festivapp/contracts';
import { defined } from '@festivapp/utils';
import { add } from 'date-fns';

import { hashPassword } from '../../src/auth/password.ts';
import {
  authSessions,
  locations,
  messages,
  organizers,
  organizerTenants,
  participants,
  pushSubscriptions,
  sessionParticipants,
  sessions,
  tenants,
  type Location,
  type Message,
  type Organizer,
  type Participant,
  type PushSubscription,
  type Session,
  type Tenant,
} from '../../src/db/schema.ts';

import type { Database } from '../../src/db/client.ts';

export function fixtures(db: Database) {
  let counter = 0;

  return {
    theme,
    tenant,
    organizer,
    authSession,
    location,
    participant,
    message,
    pushSubscription,
    session,
  };

  async function tenant(values: Partial<Tenant> = {}): Promise<Tenant> {
    const index = ++counter;

    const [row] = await db
      .insert(tenants)
      .values({
        name: `Festival ${index}`,
        domain: `festival-${index}.localhost`,
        timezone: 'Europe/Paris',
        theme: theme(),
        ...values,
      })
      .returning();

    return defined(row);
  }

  async function organizer(
    values: Partial<Organizer> & { password?: string; tenants?: Tenant[] } = {},
  ): Promise<Organizer & { password: string }> {
    const { password = 'password', tenants: memberships = [], ...rest } = values;
    const index = ++counter;

    const [row] = await db
      .insert(organizers)
      .values({
        email: `organizer-${index}@test.local`,
        passwordHash: hashPassword(password),
        ...rest,
      })
      .returning();

    const organizer = defined(row);

    if (memberships.length > 0) {
      await db
        .insert(organizerTenants)
        .values(memberships.map((tenant) => ({ organizerId: organizer.id, tenantId: tenant.id })));
    }

    return { ...organizer, password };
  }

  async function authSession(
    organizer: Organizer,
    values: Partial<{ token: string; expiresAt: Date }> = {},
  ): Promise<string> {
    const token = values.token ?? `token-${++counter}`;

    await db.insert(authSessions).values({
      token,
      organizerId: organizer.id,
      expiresAt: values.expiresAt ?? new Date(add(Date.now(), { months: 3 })),
    });

    return token;
  }

  async function location(tenant: Tenant, values: Partial<Location> = {}): Promise<Location> {
    const [row] = await db
      .insert(locations)
      .values({
        tenantId: tenant.id,
        name: `Location ${++counter}`,
        ...values,
      })
      .returning();

    return defined(row);
  }

  async function participant(tenant: Tenant, values: Partial<Participant> = {}): Promise<Participant> {
    const [row] = await db
      .insert(participants)
      .values({
        tenantId: tenant.id,
        name: `Participant ${++counter}`,
        ...values,
      })
      .returning();

    return defined(row);
  }

  async function message(tenant: Tenant, values: Partial<Message> = {}): Promise<Message> {
    const index = ++counter;

    const [row] = await db
      .insert(messages)
      .values({
        tenantId: tenant.id,
        title: `Message ${index}`,
        body: `Body ${index}`,
        ...values,
      })
      .returning();

    return defined(row);
  }

  async function pushSubscription(tenant: Tenant, values: Partial<PushSubscription> = {}): Promise<PushSubscription> {
    const index = ++counter;

    const [row] = await db
      .insert(pushSubscriptions)
      .values({
        tenantId: tenant.id,
        endpoint: `https://push.test.local/${index}`,
        p256dh: `p256dh-${index}`,
        auth: `auth-${index}`,
        ...values,
      })
      .returning();

    return defined(row);
  }

  async function session(
    tenant: Tenant,
    location: Location,
    values: Partial<Session> & { participants?: Participant[] } = {},
  ): Promise<Session> {
    const { participants: lineup = [], ...rest } = values;

    const [row] = await db
      .insert(sessions)
      .values({
        tenantId: tenant.id,
        locationId: location.id,
        type: 'live',
        startsAt: new Date('2026-07-01T20:00:00Z'),
        endsAt: new Date('2026-07-01T21:00:00Z'),
        ...rest,
      })
      .returning();

    const session = defined(row);

    if (lineup.length > 0) {
      await db.insert(sessionParticipants).values(
        lineup.map((participant, position) => ({
          sessionId: session.id,
          participantId: participant.id,
          position,
        })),
      );
    }

    return session;
  }
}

function theme(values: Partial<TenantTheme> = {}) {
  return {
    backgroundColor: '#000000',
    accentColor: '#ffffff',
    fonts: { display: 'sans-serif', body: 'sans-serif', mono: 'monospace' },
    logo: { wordmarkUrl: null, iconUrl: null },
    backgroundImage: null,
    pwa: { name: null, shortName: null },
    customCss: null,
    ...values,
  };
}

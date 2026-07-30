import type { TenantTheme } from '@festivapp/contracts';
import { defined } from '@festivapp/utils';
import { add } from 'date-fns';

import { hashPassword } from '../../src/auth/password.ts';
import { db } from '../../src/db/client.ts';
import {
  authSessions,
  locations,
  organizers,
  organizerTenants,
  participants,
  sessionParticipants,
  sessions,
  tenants,
  type Location,
  type Organizer,
  type Participant,
  type Session,
  type Tenant,
} from '../../src/db/schema.ts';

type Values<T> = Partial<T>;

let counter = 0;

export const theme: TenantTheme = {
  backgroundColor: '#101014',
  accentColor: '#f0f0ff',
  fonts: { display: 'sans-serif', body: 'sans-serif', mono: 'monospace' },
  logo: { wordmarkUrl: null, iconUrl: null },
  backgroundImage: null,
  pwa: { name: null, shortName: null },
  customCss: null,
};

export async function createTenant(values: Values<Tenant> = {}): Promise<Tenant> {
  const index = ++counter;

  const [row] = await db
    .insert(tenants)
    .values({
      name: `Festival ${index}`,
      domain: `festival-${index}.localhost`,
      timezone: 'Europe/Paris',
      theme,
      ...values,
    })
    .returning();

  return defined(row);
}

export async function createOrganizer(
  values: Values<Organizer> & { password?: string; tenants?: Tenant[] } = {},
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

export async function createAuthSession(
  organizer: Organizer,
  values: Values<{ token: string; expiresAt: Date }> = {},
): Promise<string> {
  const token = values.token ?? `token-${++counter}`;

  await db.insert(authSessions).values({
    token,
    organizerId: organizer.id,
    expiresAt: values.expiresAt ?? new Date(add(Date.now(), { months: 3 })),
  });

  return token;
}

export async function createLocation(tenant: Tenant, values: Values<Location> = {}): Promise<Location> {
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

export async function createParticipant(tenant: Tenant, values: Values<Participant> = {}): Promise<Participant> {
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

export async function createSession(
  tenant: Tenant,
  location: Location,
  values: Values<Session> & { participants?: Participant[] } = {},
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

import type { TenantTheme } from '@festivapp/contracts';
import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

import { createId } from '../utils.ts';

export type Tenant = typeof tenants.$inferSelect;
export type File = typeof files.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type Organizer = typeof organizers.$inferSelect;
export type OrganizerTenant = typeof organizerTenants.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;

export const sessionType = p.pgEnum('session_type', ['dj_set', 'live', 'talk', 'workshop', 'other']);
export const mapLabelPosition = p.pgEnum('map_label_position', ['top', 'bottom', 'left', 'right']);

export const tenants = p.pgTable('tenants', {
  id: p.text().primaryKey().$defaultFn(createId),
  name: p.text().notNull(),
  domain: p.text().notNull().unique(),
  timezone: p.text().notNull(),
  mapUrl: p.text(),
  theme: p.jsonb().$type<TenantTheme>().notNull(),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const files = p.pgTable('files', {
  id: p.text().primaryKey().$defaultFn(createId),
  tenantId: p
    .text()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  storageKey: p.text().notNull().unique(),
  name: p.text(),
  contentType: p.text().notNull(),
  size: p.integer().notNull(),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const locations = p.pgTable('locations', {
  id: p.text().primaryKey().$defaultFn(createId),
  tenantId: p
    .text()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: p.text().notNull(),
  description: p.text(),
  position: p.integer().notNull().default(0),
  mapX: p.real().notNull().default(50),
  mapY: p.real().notNull().default(50),
  mapLabelPosition: mapLabelPosition().notNull().default('bottom'),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const participants = p.pgTable('participants', {
  id: p.text().primaryKey().$defaultFn(createId),
  tenantId: p
    .text()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: p.text().notNull(),
  description: p.text(),
  imageUrl: p.text(),
  origin: p.text(),
  label: p.text(),
  styles: p.text().array().notNull().default([]),
  socialLinks: p.jsonb().$type<string[]>().notNull().default([]),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessions = p.pgTable('sessions', {
  id: p.text().primaryKey().$defaultFn(createId),
  tenantId: p
    .text()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: p
    .text()
    .notNull()
    .references(() => locations.id, { onDelete: 'cascade' }),
  type: sessionType().notNull(),
  title: p.text(),
  description: p.text(),
  startsAt: p.timestamp({ withTimezone: true }).notNull(),
  endsAt: p.timestamp({ withTimezone: true }).notNull(),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessionParticipants = p.pgTable(
  'session_participants',
  {
    sessionId: p
      .text()
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    participantId: p
      .text()
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    position: p.integer().notNull(),
  },
  (table) => [
    p.primaryKey({ columns: [table.sessionId, table.participantId] }),
    p.unique('session_participant_position').on(table.sessionId, table.participantId, table.position),
  ],
);

export const organizers = p.pgTable('organizers', {
  id: p.text().primaryKey().$defaultFn(createId),
  email: p.text().notNull().unique(),
  passwordHash: p.text().notNull(),
  name: p.text(),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const organizerTenants = p.pgTable(
  'organizer_tenants',
  {
    organizerId: p
      .text()
      .notNull()
      .references(() => organizers.id, { onDelete: 'cascade' }),
    tenantId: p
      .text()
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
  },
  (table) => [p.primaryKey({ columns: [table.organizerId, table.tenantId] })],
);

export const authSessions = p.pgTable('auth_sessions', {
  token: p.text().primaryKey(),
  organizerId: p
    .text()
    .notNull()
    .references(() => organizers.id, { onDelete: 'cascade' }),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: p.timestamp({ withTimezone: true }).notNull(),
});

export const relations = defineRelations(
  {
    organizers,
    organizerTenants,
    authSessions,
    tenants,
    files,
    locations,
    participants,
    sessions,
    sessionParticipants,
  },
  (r) => ({
    organizers: {
      tenants: r.many.tenants({
        from: r.organizers.id.through(r.organizerTenants.organizerId),
        to: r.tenants.id.through(r.organizerTenants.tenantId),
      }),
    },
    tenants: {
      organizers: r.many.organizers({
        from: r.tenants.id.through(r.organizerTenants.tenantId),
        to: r.organizers.id.through(r.organizerTenants.organizerId),
      }),
    },
    sessions: {
      location: r.one.locations({
        from: r.sessions.locationId,
        to: r.locations.id,
      }),
      participants: r.many.participants({
        from: r.sessions.id.through(r.sessionParticipants.sessionId),
        to: r.participants.id.through(r.sessionParticipants.participantId),
      }),
    },
    sessionParticipants: {
      session: r.one.sessions({
        from: r.sessionParticipants.sessionId,
        to: r.sessions.id,
      }),
    },
  }),
);

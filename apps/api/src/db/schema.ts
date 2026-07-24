import type { SocialLink, TenantTheme } from '@festivapp/contracts';
import { defineRelations } from 'drizzle-orm';
import * as p from 'drizzle-orm/pg-core';

export type Tenant = typeof tenants.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionParticipant = typeof sessionParticipants.$inferSelect;

export const sessionType = p.pgEnum('session_type', ['dj_set', 'live', 'talk', 'workshop', 'other']);

export const tenants = p.pgTable('tenants', {
  id: p.uuid().primaryKey().defaultRandom(),
  name: p.text().notNull(),
  domain: p.text().notNull().unique(),
  timezone: p.text().notNull(),
  theme: p.jsonb().$type<TenantTheme>().notNull(),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const locations = p.pgTable('locations', {
  id: p.uuid().primaryKey().defaultRandom(),
  tenantId: p
    .uuid()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: p.text().notNull(),
  position: p.integer().notNull().default(0),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const participants = p.pgTable('participants', {
  id: p.uuid().primaryKey().defaultRandom(),
  tenantId: p
    .uuid()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: p.text().notNull(),
  description: p.text(),
  imageUrl: p.text(),
  origin: p.text(),
  label: p.text(),
  styles: p.text().array().notNull().default([]),
  socialLinks: p.jsonb().$type<SocialLink[]>().notNull().default([]),
  createdAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: p.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessions = p.pgTable('sessions', {
  id: p.uuid().primaryKey().defaultRandom(),
  tenantId: p
    .uuid()
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: p
    .uuid()
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
      .uuid()
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    participantId: p
      .uuid()
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    position: p.integer().notNull().default(0),
  },
  (table) => [
    p.primaryKey({ columns: [table.sessionId, table.participantId] }),
    p.unique('session_participant_position').on(table.sessionId, table.participantId, table.position),
  ],
);

export const relations = defineRelations(
  {
    tenants,
    locations,
    participants,
    sessions,
    sessionParticipants,
  },
  (r) => ({
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
  }),
);

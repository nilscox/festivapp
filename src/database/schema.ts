import { defineRelations } from 'drizzle-orm';
import {
  AnyPgColumn,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

const id = () => varchar({ length: 8 });

export const festivals = pgTable('festivals', {
  id: id().primaryKey(),
  name: varchar({ length: 255 }).notNull().unique(),
  domain: varchar({ length: 255 }),
  start: timestamp().notNull(),
  end: timestamp().notNull(),
  map: varchar({ length: 255 }),
  primaryColor: varchar({ length: 16 }),
  accentColor: varchar({ length: 16 }),
  backgroundImage: varchar({ length: 255 }),
  globalStyles: varchar({ length: 255 }),
  beforeStartInfo: text(),
  afterEndInfo: text(),
});

export const locations = pgTable('locations', {
  id: id().primaryKey(),
  festivalId: id()
    .notNull()
    .references(() => festivals.id),
  label: varchar({ length: 255 }).notNull(),
  sortOrder: integer(),
});

export const eventType = pgEnum('eventType', ['live', 'dj_set', 'talk', 'workshop']);

export const events = pgTable('events', {
  id: id().primaryKey(),
  festivalId: id()
    .notNull()
    .references(() => festivals.id),
  locationId: id()
    .notNull()
    .references(() => locations.id),
  type: eventType(),
  start: timestamp().notNull(),
  end: timestamp().notNull(),
  title: varchar({ length: 255 }),
  description: text(),
  image: varchar({ length: 255 }),
});

export const eventsArtists = pgTable(
  'artists_events',
  {
    eventId: id()
      .notNull()
      .references(() => events.id),
    artistId: id()
      .notNull()
      .references(() => artists.id),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.artistId] })],
);

export const artists = pgTable('artists', {
  id: id().primaryKey(),
  festivalId: id()
    .notNull()
    .references(() => festivals.id),
  name: varchar({ length: 255 }).notNull(),
  image: varchar({ length: 255 }),
  styles: varchar({ length: 255 }).array().notNull(),
  origin: varchar({ length: 255 }),
  label: varchar({ length: 255 }),
  description: text(),
  social: varchar({ length: 255 }).array(),
});

export const speakers = pgTable('speakers', {
  id: id().primaryKey(),
  festivalId: id()
    .notNull()
    .references(() => festivals.id),
  name: varchar({ length: 255 }).notNull(),
  image: varchar({ length: 255 }).notNull(),
  origin: varchar({ length: 255 }),
  position: varchar({ length: 255 }),
  description: text(),
  social: varchar({ length: 255 }).array(),
});

export const users = pgTable(
  'users',
  {
    id: id().primaryKey(),
    festivalId: id()
      .notNull()
      .references(() => festivals.id),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    authCode: varchar({ length: 6 }),
    imageRef: varchar({ length: 16 }),
  },
  (t) => [unique().on(t.festivalId, t.email)],
);

export const posts = pgTable('posts', {
  id: id().primaryKey(),
  festivalId: id()
    .notNull()
    .references(() => festivals.id),
  authorId: id()
    .notNull()
    .references(() => users.id),
  parentId: id().references((): AnyPgColumn => posts.id),
  message: text().notNull(),
  postedAt: timestamp().notNull(),
});

export const likes = pgTable('likes', {
  id: id().primaryKey(),
  userId: id()
    .notNull()
    .references(() => users.id),
  postId: id()
    .notNull()
    .references(() => posts.id),
});

export const schema = {
  festivals,
  locations,
  eventType,
  events,
  eventsArtists,
  artists,
  speakers,
  users,
  posts,
  likes,
};

export const relations = defineRelations(schema, (r) => ({
  locations: {
    festival: r.one.festivals({
      from: r.locations.festivalId,
      to: r.festivals.id,
      optional: false,
    }),
  },

  events: {
    festival: r.one.festivals({
      from: r.events.festivalId,
      to: r.festivals.id,
      optional: false,
    }),
    location: r.one.locations({
      from: r.events.locationId,
      to: r.locations.id,
      optional: false,
    }),
    artists: r.many.artists({
      from: r.events.id.through(r.eventsArtists.eventId),
      to: r.artists.id.through(r.eventsArtists.artistId),
    }),
  },

  artists: {
    festival: r.one.festivals({
      from: r.artists.festivalId,
      to: r.festivals.id,
      optional: false,
    }),
  },

  speakers: {
    festival: r.one.festivals({
      from: r.speakers.festivalId,
      to: r.festivals.id,
      optional: false,
    }),
  },

  posts: {
    festival: r.one.festivals({
      from: r.posts.festivalId,
      to: r.festivals.id,
      optional: false,
    }),
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      optional: false,
    }),
    replies: r.many.posts({
      from: r.posts.id,
      to: r.posts.parentId,
    }),
  },
}));

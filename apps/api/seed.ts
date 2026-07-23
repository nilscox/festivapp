import fs from "node:fs";
import z from "zod";
import { db } from "./src/db/client.ts";
import * as schema from "./src/db/schema.ts";

const input = process.argv[2];

if (!input) {
  throw new Error("Usage: seed.ts <input.json>");
}

const dataSchema = z.object({
  tenant: z.object({
    name: z.string(),
    domain: z.string(),
    timezone: z.string(),
    theme: z.object({
      primaryColor: z.string(),
      logoUrl: z.string().nullable(),
    }),
  }),
  participants: z.array(
    z.object({
      name: z.string(),
      image: z.string().optional(),
      styles: z.array(z.string()).optional(),
      label: z.string().optional(),
      origin: z.string().optional(),
      description: z.string().optional(),
      socialLinks: z
        .array(z.object({ platform: z.string(), url: z.string() }))
        .optional(),
    }),
  ),
  sessions: z.array(
    z.object({
      title: z.string().optional(),
      type: z.enum(["live", "dj_set", "talk", "workshop", "other"]),
      location: z.string(),
      start: z.iso.datetime(),
      end: z.iso.datetime(),
      description: z.string().optional(),
      participants: z.array(z.string()).min(1),
    }),
  ),
});

const data = dataSchema.parse(JSON.parse(String(await fs.readFileSync(input))));

const [tenantRow] = await db
  .insert(schema.tenants)
  .values(data.tenant)
  .returning();

const tenantId = tenantRow!.id;

const locationRows = await db
  .insert(schema.locations)
  .values(
    Array.from(new Set(data.sessions.map((session) => session.location))).map(
      (location) => ({
        tenantId,
        name: location,
      }),
    ),
  )
  .returning();

const locations = new Map(locationRows.map((row) => [row.name, row.id]));

const participantRows = await db
  .insert(schema.participants)
  .values(
    data.participants.map((participant) => ({
      tenantId,
      ...participant,
    })),
  )
  .returning();

const participants = new Map(participantRows.map((row) => [row.name, row.id]));

const sessionRows = await db
  .insert(schema.sessions)
  .values(
    data.sessions.map((session) => ({
      tenantId,
      locationId: locations.get(session.location)!,
      type: session.type,
      title: session.title,
      startsAt: new Date(session.start),
      endsAt: new Date(session.end),
      description: session.description,
    })),
  )
  .returning();

const sessions = new Map(sessionRows.map((row, index) => [index, row.id]));

await db.insert(schema.sessionParticipants).values(
  data.sessions.flatMap((session, index) =>
    session.participants.map((participant) => ({
      sessionId: sessions.get(index)!,
      participantId: participants.get(participant)!,
    })),
  ),
);

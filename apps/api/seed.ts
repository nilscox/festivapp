import { db } from "./src/db/client.ts";
import { categories, sessions, stages, tenants } from "./src/db/schema.ts";

// Wall-clock times below are Europe/Paris (CEST, +02:00 in July).
function at(day: 24 | 25, time: string): Date {
  return new Date(`2026-07-${day}T${time}:00+02:00`);
}

await db.delete(tenants);

const [tenant] = await db
  .insert(tenants)
  .values({
    name: "Coolfest",
    domain: "coolfest.localhost",
    timezone: "Europe/Paris",
    theme: { primaryColor: "#6d28d9", logoUrl: null },
  })
  .returning();

if (!tenant) {
  throw new Error("failed to insert tenant");
}

const stageRows = await db
  .insert(stages)
  .values([
    { tenantId: tenant.id, name: "Main Stage", position: 0 },
    { tenantId: tenant.id, name: "The Barn", position: 1 },
    { tenantId: tenant.id, name: "Sunset Grove", position: 2 },
    { tenantId: tenant.id, name: "Talks Tent", position: 3 },
  ])
  .returning();

const categoryRows = await db
  .insert(categories)
  .values([
    { tenantId: tenant.id, name: "Live", color: "#ef4444", position: 0 },
    { tenantId: tenant.id, name: "DJ Set", color: "#6d28d9", position: 1 },
    { tenantId: tenant.id, name: "Talk", color: "#0ea5e9", position: 2 },
    { tenantId: tenant.id, name: "Workshop", color: "#22c55e", position: 3 },
  ])
  .returning();

function pickStage(name: string): string {
  const id = stageRows.find((row) => row.name === name)?.id;

  if (id === undefined) {
    throw new Error(`unknown stage: ${name}`);
  }

  return id;
}

function pickCategory(name: string): string {
  const id = categoryRows.find((row) => row.name === name)?.id;

  if (id === undefined) {
    throw new Error(`unknown category: ${name}`);
  }

  return id;
}

await db.insert(sessions).values([
  {
    tenantId: tenant.id,
    stageId: pickStage("Talks Tent"),
    categoryId: pickCategory("Talk"),
    title: "The Future of Festivals",
    description: "A panel on how live events are reinventing themselves for the next decade.",
    startsAt: at(24, "16:00"),
    endsAt: at(24, "16:45"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Sunset Grove"),
    categoryId: pickCategory("Live"),
    title: "Acoustic Sunrise",
    description: null,
    startsAt: at(24, "17:00"),
    endsAt: at(24, "18:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Talks Tent"),
    categoryId: pickCategory("Workshop"),
    title: "Screen-printing Workshop",
    description: "Bring a shirt and print your own festival poster. Materials provided.",
    startsAt: at(24, "17:30"),
    endsAt: at(24, "19:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("Live"),
    title: "Neon Tigers",
    description: null,
    startsAt: at(24, "18:00"),
    endsAt: at(24, "19:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("The Barn"),
    categoryId: pickCategory("Live"),
    title: "The Wooden Spoons",
    description: null,
    startsAt: at(24, "18:30"),
    endsAt: at(24, "19:30"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Sunset Grove"),
    categoryId: pickCategory("DJ Set"),
    title: "Golden Hour",
    description: null,
    startsAt: at(24, "19:00"),
    endsAt: at(24, "20:30"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("Live"),
    title: "Aurora Wave",
    description: "Dream-pop headliners closing out the first evening on the Main Stage.",
    startsAt: at(24, "19:30"),
    endsAt: at(24, "21:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("The Barn"),
    categoryId: pickCategory("DJ Set"),
    title: "Deep Roots",
    description: null,
    startsAt: at(24, "20:00"),
    endsAt: at(24, "21:30"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("DJ Set"),
    title: "Midnight Pulse",
    description: null,
    startsAt: at(24, "21:30"),
    endsAt: at(24, "23:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Talks Tent"),
    categoryId: pickCategory("Talk"),
    title: "Sustainable Sound",
    description: "How festivals are cutting their footprint without cutting the party.",
    startsAt: at(25, "15:00"),
    endsAt: at(25, "15:45"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Talks Tent"),
    categoryId: pickCategory("Workshop"),
    title: "Modular Synth Workshop",
    description: "Patch your first modular synth and leave with a track of your own.",
    startsAt: at(25, "16:30"),
    endsAt: at(25, "18:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("Live"),
    title: "Solar Flare",
    description: null,
    startsAt: at(25, "17:00"),
    endsAt: at(25, "18:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("The Barn"),
    categoryId: pickCategory("Live"),
    title: "Brass Republic",
    description: null,
    startsAt: at(25, "18:00"),
    endsAt: at(25, "19:00"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("Live"),
    title: "Velvet Static",
    description: "Saturday headliners. Do not miss the light show.",
    startsAt: at(25, "19:00"),
    endsAt: at(25, "20:30"),
  },
  {
    tenantId: tenant.id,
    stageId: pickStage("Main Stage"),
    categoryId: pickCategory("DJ Set"),
    title: "DJ Halcyon",
    description: "The closing set. See you on the dancefloor.",
    startsAt: at(25, "21:00"),
    endsAt: at(25, "23:30"),
  },
]);

console.log("[seed] done: Coolfest with 4 stages, 4 categories, 15 sessions");

process.exit(0);

import type { BootstrapResponse } from "@festivapp/contracts";
import { asc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.ts";
import { categories, sessions, stages } from "../db/schema.ts";

export const bootstrapRouter = Router();

bootstrapRouter.get("/bootstrap", async (req, res) => {
  const tenant = req.tenant;

  if (!tenant) {
    res.status(404).json({ error: "tenant_not_found" });

    return;
  }

  const [stageRows, categoryRows, sessionRows] = await Promise.all([
    db.select().from(stages).where(eq(stages.tenantId, tenant.id)).orderBy(asc(stages.position)),
    db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenant.id))
      .orderBy(asc(categories.position)),
    db
      .select()
      .from(sessions)
      .where(eq(sessions.tenantId, tenant.id))
      .orderBy(asc(sessions.startsAt)),
  ]);

  const updatedTimes = [
    tenant.updatedAt,
    ...stageRows.map((row) => row.updatedAt),
    ...categoryRows.map((row) => row.updatedAt),
    ...sessionRows.map((row) => row.updatedAt),
  ];
  const version = new Date(Math.max(...updatedTimes.map((date) => date.getTime()))).toISOString();

  const body: BootstrapResponse = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      timezone: tenant.timezone,
      theme: tenant.theme,
    },
    stages: stageRows.map((row) => ({ id: row.id, name: row.name, position: row.position })),
    categories: categoryRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      position: row.position,
    })),
    sessions: sessionRows.map((row) => ({
      id: row.id,
      stageId: row.stageId,
      categoryId: row.categoryId,
      title: row.title,
      description: row.description,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
    })),
    version,
  };

  res.json(body);
});

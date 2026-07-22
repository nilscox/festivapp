import type { BootstrapResponse } from "@festivapp/contracts";
import { Router } from "express";

export const bootstrapRouter = Router();

bootstrapRouter.get("/bootstrap", (req, res) => {
  const tenant = req.tenant;

  if (!tenant) {
    res.status(404).json({ error: "tenant_not_found" });

    return;
  }

  const body: BootstrapResponse = {
    tenant: {
      id: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      theme: tenant.theme,
    },
    version: tenant.updatedAt.toISOString(),
  };

  res.json(body);
});

import express, { type Express } from "express";
import { errorHandler } from "./middleware/error.ts";
import { resolveTenant } from "./middleware/tenant.ts";
import { bootstrapRouter } from "./routes/bootstrap.ts";

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(resolveTenant);
  app.use(bootstrapRouter);
  app.use(errorHandler);

  return app;
}

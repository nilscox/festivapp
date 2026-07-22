import { Router } from "express";

export const manifestRouter = Router();

manifestRouter.get("/manifest.webmanifest", (req, res) => {
  const tenant = req.tenant;

  if (!tenant) {
    res.status(404).json({ error: "tenant_not_found" });

    return;
  }

  res.type("application/manifest+json");
  res.json({
    name: tenant.name,
    short_name: tenant.name,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#131118",
    theme_color: tenant.theme.primaryColor,
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  });
});

import { db } from "./src/db/client.ts";
import { tenants } from "./src/db/schema.ts";

await db
  .insert(tenants)
  .values({
    name: "Coolfest",
    domain: "coolfest.localhost",
    theme: { primaryColor: "#6d28d9", logoUrl: null },
  })
  .onConflictDoNothing({ target: tenants.domain });

console.log("[seed] done: tenant 'Coolfest' @ coolfest.localhost");

process.exit(0);

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.ts";
import * as schema from "./schema.ts";

const pool = new pg.Pool({ connectionString: config.databaseUrl });

export const db = drizzle(pool, { schema });

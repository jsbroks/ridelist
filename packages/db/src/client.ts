import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
const connectionString = process.env.POSTGRES_URL as string;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL environment variable");
}

export const pool = new Pool({
  connectionString,
  keepAlive: true,
  ssl: false,
});


export const db = drizzle({
  client: pool,
  schema,
  casing: "snake_case",
});

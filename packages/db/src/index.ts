import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL || "", {
  // Prepared statements can cause issues on some hosted Postgres; disable by default
  prepare: false,
});

export const db = drizzle(client);

// Export schema tables
// biome-ignore lint/performance/noBarrelFile: Package exports require barrel pattern
export * from "./schema/auth";
export * from "./schema/todo";

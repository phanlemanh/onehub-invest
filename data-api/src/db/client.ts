import { Pool } from "pg";

/**
 * DB connection — reads DATABASE_URL env.
 * Works with: Supabase pooler, local Postgres, Docker Postgres.
 */
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}
const connectionString = process.env.DATABASE_URL;

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  max: 5,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

import { Pool } from "pg";

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ??
    "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  max: 5,
});

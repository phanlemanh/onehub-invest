import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Remote (Supabase pooler qua Vercel): Node ≥20 coi sslmode=require là
// verify-full và từ chối chain của pooler — đặt ssl tường minh. Local thì
// giữ nguyên (không TLS).
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

export const pool = new Pool({
  connectionString,
  max: 5,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

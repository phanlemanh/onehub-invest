#!/usr/bin/env node
// kev-vocab-db.mjs — PL5 E2: `vocab --check-db` (checkDb) trên DB thử sau khi áp 057 trong giao dịch phải sạch; đối chứng
// cùng lệnh: chưa áp 057 thì checkDb phải lệch và gọi tên field_assertions. BEGIN … ROLLBACK — DB thử không đổi.
// DATABASE_URL từ môi trường (mặc định DB thử oneinvest_p1_n1, không bao giờ DB oneinvest dùng chung).
import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
try {
  const reg = readMappings(ROOT);
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c, { moCong: false });
  // Đối chứng trước: trạng thái «chưa áp 057». DB thử đã áp 057 thì đưa về: bỏ hai CHECK có tên rồi nạp lại toàn văn 045
  // (CHECK bản 045 thêm lại theo tên, ref_field_lookup field_assertions.field → enrich_field) — trong SAVEPOINT.
  await c.query("SAVEPOINT chua_057");
  await c.query("ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk");
  await c.query("ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_method_chk");
  await c.query(readFileSync(join(ROOT, "db/migrations/045_phat_bieu_va_phan_xu.sql"), "utf8"));
  const lechChua = await checkDb(c, reg);
  const goiTen = lechChua.filter((x) => /field_assertions/.test(x.msg) || x.column?.startsWith("field_assertions."));
  console.log(`--check-db (chưa áp 057): ${lechChua.length} lệch, ${goiTen.length} gọi tên field_assertions`);
  for (const x of goiTen) console.log(`  ${x.msg}`);
  if (!goiTen.length) { console.error("kev-vocab-db: đối chứng hỏng — chưa áp 057 mà checkDb không báo field_assertions"); code = 1; }
  await c.query("ROLLBACK TO SAVEPOINT chua_057");
  // Vế chính: áp 057 (hai lần) rồi checkDb phải sạch.
  await napKev(c);
  await napKev(c);
  const lech = await checkDb(c, reg);
  console.log(`--check-db (đã áp 057): ${lech.length} lệch`);
  for (const x of lech) console.log(`  ${x.msg}`);
  if (lech.length) code = 1;
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
console.log(code ? "kev-vocab-db: ĐỎ" : "kev-vocab-db: xanh");
process.exit(code);

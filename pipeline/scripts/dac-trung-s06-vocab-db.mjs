#!/usr/bin/env node
// dac-trung-s06-vocab-db.mjs — HD5 (dac-trung-nha-s06-len-canonical) E2: `vocab --check-db` (checkDb) trên DB thử sau khi áp 061
// trong giao dịch phải sạch; đối chứng cùng lệnh: chưa áp 061 thì checkDb phải lệch và gọi tên field_assertions.field.
// BEGIN … ROLLBACK — DB thử không đổi. DATABASE_URL từ môi trường (mặc định DB thử oneinvest_p1_n4).
import pg from "pg";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n4";

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
try {
  const reg = readMappings(ROOT);
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  // Đối chứng trước: DB thử chưa áp 061 (sổ đã có bảy mã mới) → checkDb phải gọi tên field_assertions.field.
  const lechChua = await checkDb(c, reg);
  const goiTen = lechChua.filter((x) => x.column === "field_assertions.field" || /field_assertions\.field|assertion_field/.test(x.msg));
  console.log(`--check-db (chưa áp 061): ${lechChua.length} lệch, ${goiTen.length} gọi tên field_assertions.field / assertion_field`);
  for (const x of goiTen) console.log(`  ${x.msg}`);
  if (!goiTen.length) { console.error("dac-trung-s06-vocab-db: đối chứng hỏng — chưa áp 061 mà checkDb không báo field_assertions.field"); code = 1; }
  // Vế chính: áp 061 (hai lần) rồi checkDb phải sạch.
  await napDacTrung(c);
  await napDacTrung(c);
  const lech = await checkDb(c, reg);
  console.log(`--check-db (đã áp 061): ${lech.length} lệch`);
  for (const x of lech) console.log(`  ${x.msg}`);
  if (lech.length) code = 1;
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
console.log(code ? "dac-trung-s06-vocab-db: ĐỎ" : "dac-trung-s06-vocab-db: xanh");
process.exit(code);

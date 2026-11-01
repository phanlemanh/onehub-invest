#!/usr/bin/env node
// dac-trung-s06-vocab-db.mjs — HD5 (dac-trung-nha-s06-len-canonical) E2: `vocab --check-db` (checkDb) trên DB thử sau khi áp 061
// trong giao dịch phải sạch; đối chứng cùng lệnh: chưa áp 061 thì checkDb phải lệch và gọi tên field_assertions.field.
// BEGIN … ROLLBACK — DB thử không đổi. DATABASE_URL từ môi trường (mặc định DB thử oneinvest_p1_n4).
import pg from "pg";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napDacTrung } from "../lib/nap-061.mjs";
import { ASSERTION_FIELD, ENRICH_FIELD } from "../lib/vocab.generated.mjs";

// Tập mã của 059 (năm trường enrich + trạng thái chào) và bảy mã HD5 thêm ở 061 — rút từ hằng sinh của sổ.
const MA_059 = [...Object.values(ENRICH_FIELD), ASSERTION_FIELD.offer_status];
const MA_061 = Object.values(ASSERTION_FIELD).filter((m) => !MA_059.includes(m));
const lit = (ds) => ds.map((m) => `'${m}'`).join(", ");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n4";

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
try {
  const reg = readMappings(ROOT);
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  // Đối chứng trước: trạng thái «chưa áp 061» (sổ đã có bảy mã mới). DB thử đã áp 061 (máy thu sau triển khai) thì đưa về
  // trong SAVEPOINT: CHECK trường phát biểu về tập 059, bỏ bảy dòng sổ của 061.
  await c.query("SAVEPOINT chua_061");
  await c.query("ALTER TABLE field_assertions DROP CONSTRAINT IF EXISTS field_assertions_field_chk");
  await c.query(`ALTER TABLE field_assertions ADD CONSTRAINT field_assertions_field_chk
    CHECK (field IN (${lit(MA_059)})) NOT VALID`);
  await c.query(`DELETE FROM ref_lookup WHERE lookup_name = 'assertion_field' AND lookup_value IN (${lit(MA_061)})`);
  const lechChua = await checkDb(c, reg);
  const goiTen = lechChua.filter((x) => x.column === "field_assertions.field" || /field_assertions\.field|assertion_field/.test(x.msg));
  console.log(`--check-db (chưa áp 061): ${lechChua.length} lệch, ${goiTen.length} gọi tên field_assertions.field / assertion_field`);
  for (const x of goiTen) console.log(`  ${x.msg}`);
  if (!goiTen.length) { console.error("dac-trung-s06-vocab-db: đối chứng hỏng — chưa áp 061 mà checkDb không báo field_assertions.field"); code = 1; }
  await c.query("ROLLBACK TO SAVEPOINT chua_061");
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

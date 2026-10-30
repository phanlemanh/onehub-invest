#!/usr/bin/env node
// yeu-cau-vocab-db.mjs — bang-yeu-cau E2: `vocab --check-db` (checkDb) trên DB thử sau khi áp 057 + 058 trong giao dịch phải
// sạch; đối chứng cùng lệnh: chưa áp 058 thì checkDb phải lệch và gọi tên inquiry_records, và DQ enum bỏ qua hai mục
// inquiries thay vì văng. BEGIN … ROLLBACK — DB thử không đổi.
// DATABASE_URL từ môi trường (mặc định DB thử oneinvest_p1_n1, không bao giờ DB oneinvest dùng chung).
import pg from "pg";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napKev } from "../lib/nap-057.mjs";
import { napYeuCau } from "../lib/nap-058.mjs";
import { KIEM_ENUM, coBang } from "../dq-enum-vocab.mjs";

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
  await napKev(c);
  // Đối chứng trước: trạng thái «chưa áp 058». DB thử đã áp 058 thì đưa về: bỏ view, bảng và hai dòng ref_field_lookup.
  await c.query("SAVEPOINT chua_058");
  await c.query("DROP VIEW IF EXISTS inquiries");
  await c.query("DROP TABLE IF EXISTS inquiry_records");
  await c.query("DELETE FROM ref_field_lookup WHERE table_name = 'inquiry_records'");
  const lechChua = await checkDb(c, reg);
  const goiTen = lechChua.filter((x) => /inquiry_records/.test(x.msg) || x.column?.startsWith("inquiry_records."));
  console.log(`--check-db (chưa áp 058): ${lechChua.length} lệch, ${goiTen.length} gọi tên inquiry_records`);
  for (const x of goiTen) console.log(`  ${x.msg}`);
  if (!goiTen.length) { console.error("yeu-cau-vocab-db: đối chứng hỏng — chưa áp 058 mà checkDb không báo inquiry_records"); code = 1; }
  const mucYc = KIEM_ENUM.filter((m) => m.bang === "inquiries");
  const boQua = [];
  for (const m of mucYc) if (!(await coBang(c, m.bang))) boQua.push(`${m.bang}.${m.cot}`);
  console.log(`DQ enum (chưa áp 058): bỏ qua ${boQua.join(", ") || "—"}`);
  if (mucYc.length !== 2 || boQua.length !== 2) { console.error("yeu-cau-vocab-db: DQ enum không bỏ qua đủ hai mục inquiries"); code = 1; }
  await c.query("ROLLBACK TO SAVEPOINT chua_058");
  // Vế chính: áp 058 (hai lần) rồi checkDb phải sạch.
  await napYeuCau(c);
  await napYeuCau(c);
  const lech = await checkDb(c, reg);
  console.log(`--check-db (đã áp 057 + 058): ${lech.length} lệch`);
  for (const x of lech) console.log(`  ${x.msg}`);
  if (lech.length) code = 1;
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
console.log(code ? "yeu-cau-vocab-db: ĐỎ" : "yeu-cau-vocab-db: xanh");
process.exit(code);

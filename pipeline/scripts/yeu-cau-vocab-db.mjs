#!/usr/bin/env node
// yeu-cau-vocab-db.mjs — YC0 bang-yeu-cau-noi-lai E2 (AC-2): `vocab --check-db` (checkDb) trên DB thử sau khi áp 136 trong giao
// dịch phải sạch; đối chứng cùng hàm, cùng giao dịch: bỏ trục khỏi inquiry_post_records.kind (CHECK, rồi dòng ref_field_lookup) thì
// checkDb phải đỏ gọi tên cột; DQ enum có mục cho bảng Yêu cầu, chạy được khi có bảng và bỏ qua (không văng) khi chưa áp 136.
// BEGIN … ROLLBACK — DB thử không đổi. Chỉ chạy trên DB thử oneinvest_<…> (lệnh yc0_vocab qua db/db-thu.sh --chay).
import pg from "pg";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDb, readMappings } from "../lib/vocab-core.mjs";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napYeuCau } from "../lib/nap-136.mjs";
import { KIEM_ENUM, coBang, kiemEnum } from "../dq-enum-vocab.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_[a-z0-9_]+(\?.*)?$/.test(DB_URL)) {
  console.error("yeu-cau-vocab-db: cần DATABASE_URL trỏ DB thử oneinvest_<…> (db/db-thu.sh), không chạy trên oneinvest");
  process.exit(2);
}

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
let code = 0;
const do_ = (msg) => { console.error(`yeu-cau-vocab-db: ${msg}`); code = 1; };
const goiTenCot = (lech) => lech.filter((x) => x.column === "inquiry_post_records.kind" || /inquiry_post_records\.kind/.test(x.msg));
try {
  const reg = readMappings(ROOT);
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(33033)");
  await napPhatBieu(c, { moCong: false });
  // Vế chính: áp 136 (hai lần) rồi checkDb phải sạch.
  await napYeuCau(c);
  await napYeuCau(c);
  const lech = await checkDb(c, reg);
  console.log(`--check-db (đã áp 136): ${lech.length} lệch`);
  for (const x of lech) console.log(`  ${x.msg}`);
  if (lech.length) do_("đã áp 136 mà checkDb còn lệch");

  // Đối chứng 1: bỏ CHECK theo trục của inquiry_post_records.kind → checkDb phải gọi tên cột.
  await c.query("SAVEPOINT bo_check");
  await c.query("ALTER TABLE inquiry_post_records DROP CONSTRAINT inquiry_post_records_kind_chk");
  const l1 = goiTenCot(await checkDb(c, reg));
  console.log(`đối chứng bỏ CHECK kind: ${l1.length} lệch gọi tên inquiry_post_records.kind${l1[0] ? ` — ${l1[0].msg}` : ""}`);
  if (!l1.length) do_("đối chứng hỏng — bỏ CHECK của inquiry_post_records.kind mà checkDb không gọi tên cột");
  await c.query("ROLLBACK TO SAVEPOINT bo_check");

  // Đối chứng 2: bỏ dòng ref_field_lookup của cột (cột rời trục) → checkDb phải gọi tên cột.
  await c.query("SAVEPOINT bo_truc");
  await c.query("UPDATE ref_field_lookup SET lookup_name = 'kind' WHERE table_name = 'inquiry_post_records' AND column_name = 'kind'");
  const l2 = goiTenCot(await checkDb(c, reg));
  console.log(`đối chứng cột rời trục inquiry_kind: ${l2.length} lệch gọi tên inquiry_post_records.kind${l2[0] ? ` — ${l2[0].msg}` : ""}`);
  if (!l2.length) do_("đối chứng hỏng — cột rời trục mà checkDb không gọi tên inquiry_post_records.kind");
  await c.query("ROLLBACK TO SAVEPOINT bo_truc");

  // DQ enum: hai mục của bảng Yêu cầu chạy được khi có bảng (0 dòng lệch), bỏ qua khi chưa áp 136.
  const mucYc = KIEM_ENUM.filter((m) => m.bang === "inquiry_post_records");
  if (mucYc.length !== 2) do_(`DQ enum phải có hai mục inquiry_post_records, có ${mucYc.length}`);
  for (const m of mucYc) {
    const { status, bad } = await kiemEnum(c, m);
    console.log(`DQ enum ${m.bang}.${m.cot} (trục ${m.truc}): ${status} (${bad} lệch)`);
    if (status !== "pass") do_(`DQ enum ${m.bang}.${m.cot} đỏ trên bảng mới`);
  }
  await c.query("SAVEPOINT chua_136");
  await c.query("DROP VIEW inquiries");
  await c.query("DROP TABLE inquiry_post_records");
  const boQua = [];
  for (const m of mucYc) if (!(await coBang(c, m.bang))) boQua.push(`${m.bang}.${m.cot}`);
  console.log(`DQ enum (chưa áp 136): bỏ qua ${boQua.join(", ") || "—"}`);
  if (boQua.length !== mucYc.length) do_("DQ enum không bỏ qua đủ các mục của bảng Yêu cầu khi chưa áp 136");
  await c.query("ROLLBACK TO SAVEPOINT chua_136");
} finally {
  await c.query("ROLLBACK").catch(() => {});
  await c.end();
}
console.log(code ? "yeu-cau-vocab-db: ĐỎ" : "yeu-cau-vocab-db: xanh");
process.exit(code);

#!/usr/bin/env node
// hinh.mjs — PB8 AC-3 (eval E3): bảy quan hệ khúc PB8 thêm vào lược đồ mẫu có ĐÚNG hình cột của DB thật — cùng tập cột, cùng
// kiểu (information_schema.columns: tên, data_type, udt_name) — cho asset_nodes, buildings, units, registry_aliases,
// field_assertions, view offer_building và cột sale_offers.offer_status. Chỉ ĐỌC lược đồ DB thật (bản chép db-thu qua DATABASE_URL), không
// đọc dòng nào. Dựng lược đồ mẫu trên DB tạm rồi xoá. Chiều đỏ cùng lượt: bản chép schema.sql đổi kiểu units.floor sang int →
// «PB8 lệch hình cột: units.floor».
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
// Địa chỉ DB chỉ lấy từ môi trường (CHUNG điểm 17 — không viết chuỗi kết nối vào kho); executor chạy probe qua db/db-thu.sh.
const QUAN = process.env.DATABASE_URL;
if (!QUAN) { console.log(`${path.basename(fileURLToPath(import.meta.url))}: thiếu DATABASE_URL — chạy qua bash db/db-thu.sh <tên> --chay node <probe>`); process.exit(2); }
const urlDb = (db) => { const u = new URL(QUAN); u.pathname = `/${db}`; return u.toString(); };
const BANG = ["asset_nodes", "buildings", "units", "registry_aliases", "field_assertions", "offer_building"];
const COT_LE = [["sale_offers", "offer_status"]];

async function hinh(url) {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT table_name AS t, column_name AS c, data_type AS k, udt_name AS u FROM information_schema.columns
        WHERE table_schema = 'public' AND (table_name = ANY($1) OR (table_name || '.' || column_name) = ANY($2))`,
      [BANG, COT_LE.map(([t, c]) => `${t}.${c}`)],
    );
    return new Map(rows.map((r) => [`${r.t}.${r.c}`, `${r.k}/${r.u}`]));
  } finally {
    await c.end();
  }
}
export function soHinh(that, mau) {
  const loi = [];
  for (const k of new Set([...that.keys(), ...mau.keys()])) if (that.get(k) !== mau.get(k)) loi.push(`PB8 lệch hình cột: ${k} (thật ${that.get(k) ?? "vắng"}, mẫu ${mau.get(k) ?? "vắng"})`);
  for (const t of BANG) if (![...that.keys()].some((k) => k.startsWith(`${t}.`))) loi.push(`PB8 DB thật không có ${t} — không so được`);
  return loi;
}
async function hinhMau(schema) {
  const db = `oneinvest_suite_pb8_hinh_${process.pid}`;
  const quan = new pg.Client({ connectionString: QUAN });
  await quan.connect();
  try {
    await quan.query(`DROP DATABASE IF EXISTS ${db}`);
    await quan.query(`CREATE DATABASE ${db}`);
    const c = new pg.Client({ connectionString: urlDb(db) });
    await c.connect();
    try { await c.query(schema); } finally { await c.end(); }
    return await hinh(urlDb(db));
  } finally {
    await quan.query(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`).catch(() => {});
    await quan.end();
  }
}

const schema = readFileSync(path.join(ROOT, "data-api", "db", "schema.sql"), "utf8");
const that = await hinh(QUAN);
const loi = soHinh(that, await hinhMau(schema));
const cayGoc = "  floor        text CHECK (floor ~ '^[0-9]+[A-Z]?$'),";
if (!schema.includes(cayGoc)) { console.log("hinh: không cấy được (khuôn cột units.floor đổi)"); process.exit(2); }
const loiCay = soHinh(that, await hinhMau(schema.replace(cayGoc, "  floor        int,")));
const o = loiCay.length === 1 && loiCay[0].startsWith("PB8 lệch hình cột: units.floor ");
console.log(`chieu-do: units.floor đổi kiểu → ${o ? "đúng một lệch, gọi đúng cột" : `SAI (${loiCay.join(" | ")})`}`);
for (const l of loi) console.log(l);
const soCot = [...that.keys()].length;
console.log(loi.length || !o ? `hinh: ${loi.length} lệch${o ? "" : "; thước không đỏ"}` : `hinh: ${soCot} cột của ${BANG.length} quan hệ và ${COT_LE.length} cột lẻ khớp DB thật`);
process.exit(loi.length || !o ? 1 : 0);

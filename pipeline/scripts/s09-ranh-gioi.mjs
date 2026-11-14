#!/usr/bin/env node
// s09-ranh-gioi.mjs — hồ sơ toa-s09-hai-khu-vao-danh-ba (DA31) E9 (AC-9): ranh giới diff của hàng, tên nguồn thật, 097 áp hai lần.
// Danh sách tên nguồn đọc từ source_registry của DB máy thu (chỉ đọc; tầng A — không in ra, chỉ in số tên); rỗng → thoát 2.
// 097 áp hai lần trên DB thử oneinvest_dbv_s09rg_<pid> (xoá khi xong).
//   node pipeline/scripts/s09-ranh-gioi.mjs --base origin/main [--them-gia]   (--them-gia: đối chứng đỏ, thêm một tệp giả ngoài vùng)
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const arg = (t, m) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const BASE = arg("--base", "origin/main");
const VUNG = [
  /^db\/migrations\/097_[^/]+$/, /^pipeline\/lib\/s09[^/]*$/, /^pipeline\/scripts\/[^/]*s09[^/]*$/,
  /^pipeline\/danh-ba-vat-the\.mjs$/, /^pipeline\/lib\/danh-ba-vat-the\.mjs$/, /^_acceptance\/toa-s09-hai-khu-vao-danh-ba\//,
  /^_acceptance\/config\.yaml$/, /^docs\/superpowers\/(specs|plans)\/2026-11-13-toa-s09-hai-khu-vao-danh-ba[^/]*$/,
  /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/,
  /^scripts\/ops-local-dong-bang\.test\.mjs$/, // một dòng miễn DBS-AC-6 cho câu chặn trùng thẻ toà S09 (sau chữ ký, CI chân scripts)
];

const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const tep = git("diff", "--name-only", `${BASE}...HEAD`).split("\n").filter(Boolean);
if (process.argv.includes("--them-gia")) tep.push("app/src/gia-ngoai-vung.ts");
const dem = (re) => tep.filter((f) => re.test(f)).length;
const kq = {
  tep: tep.length,
  ngoai_vung: tep.filter((f) => !VUNG.some((re) => re.test(f))).length,
  collector_doi: dem(/^collector\//),
  snapshots_doi: dem(/(^|\/)snapshots\//),
  sync_cloud_doi: dem(/^pipeline\/sync-cloud\.mjs$/),
  app_doi: dem(/^app\//),
};

const may = new pg.Client({ connectionString: process.env.S09_MAY_THU ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await may.connect();
await may.query("SET default_transaction_read_only = on");
const { rows } = await may.query("SELECT real_name, source_ids FROM source_registry");
// Định danh lược đồ có từ trước hàng (tên bảng, cột: airbnb_snapshots, stg_zalo_posts…) không phải chỗ lộ tên nguồn: bỏ khỏi dòng trước khi dò.
const { rows: dd } = await may.query(`SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public'
                                       UNION SELECT column_name FROM information_schema.columns WHERE table_schema = 'public'`);
await may.end();
const DINH_DANH = new Set(dd.map((r) => r.t.toLowerCase()));
const ten = new Set();
for (const r of rows) for (const t of [r.real_name, ...(Array.isArray(r.source_ids) ? r.source_ids : [])]) {
  const s = String(t ?? "").trim().toLowerCase();
  if (s.length >= 4) ten.add(s);
}
console.log(`ten_nguon_doi_chung=${ten.size}`);
if (ten.size === 0) { console.error("danh sách tên nguồn rỗng — không đo được"); process.exit(2); }
// Bỏ tệp máy sinh từ hồ sơ chung (bản đồ, lộ trình — không do hàng viết).
const MAY_SINH = new Set(["LO-TRINH.html", "PRODUCT-MAP.md"]);
const boDinhDanh = (l) => l.replace(/[a-z0-9_]+/g, (w) => (w.includes("_") && DINH_DANH.has(w) ? "" : w));
const them = [];
let tepDang = "";
for (const l of git("diff", "-U0", `${BASE}...HEAD`).split("\n")) {
  if (l.startsWith("+++ ")) { tepDang = l.replace(/^\+\+\+ (b\/)?/, ""); continue; }
  if (l.startsWith("+") && !MAY_SINH.has(tepDang)) them.push(boDinhDanh(l.toLowerCase()));
}
const coTen = (l) => [...ten].some((t) => l.includes(t));
kq.ten_nguon = them.filter(coTen).length;
// Đối chứng dương của bộ dò (không in tên): dòng giả mang một tên thật phải bị bắt, tên bảng có sẵn thì không.
const mau = [...ten][0];
if (!coTen(boDinhDanh(`+ const x = "${mau}";`)) || coTen(boDinhDanh("+ from stg_zalo_posts p"))) {
  console.error("bộ dò tên nguồn hỏng — đối chứng dương không bắt được"); process.exit(2);
}
console.log("doi_chung_bo_do=ok");

const db = `oneinvest_dbv_s09rg_${process.pid}`;
try {
  await taoDbThu(db, { hetSo: 96 });
  const f = join(GOC, "db/migrations/097_stg_s09_item.sql");
  apTep(db, f);
  apTep(db, f);
  kq["097_ap_hai_lan"] = "ok";
} catch (e) {
  kq["097_ap_hai_lan"] = `loi: ${String(e.stderr ?? e.message).split("\n")[0]}`;
} finally {
  await xoaDbThu(db);
}
console.log(Object.entries(kq).map(([k, v]) => `${k}=${v}`).join(" "));
const dat = kq.ngoai_vung === 0 && kq.collector_doi === 0 && kq.snapshots_doi === 0 && kq.sync_cloud_doi === 0 && kq.app_doi === 0
  && kq.ten_nguon === 0 && kq["097_ap_hai_lan"] === "ok";
process.exit(dat ? 0 : 1);

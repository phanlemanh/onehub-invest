#!/usr/bin/env node
// nap-s09-ranh-gioi.mjs — hồ sơ nap-s09 E6 (AC-6): ranh giới diff và commit của hàng, tên nguồn thật, chia nửa test.
// Vùng đúng bằng chữ AC-6. Tên nguồn đọc từ source_registry của DB máy thu (chỉ đọc; tầng A — không in tên, chỉ in số);
// rỗng → thoát 2. Quét dòng thêm, thông điệp, tác giả và tên tệp của mọi commit <base>..HEAD; định danh lược đồ có sẵn
// (tên bảng, cột như airbnb_snapshots) bỏ khỏi dòng trước khi dò; tệp máy sinh (bản đồ, lộ trình) không quét chữ.
//   node pipeline/scripts/nap-s09-ranh-gioi.mjs --base origin/main [--them-gia]
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const GOC = join(import.meta.dirname, "../..");
const arg = (t, m) => { const i = process.argv.indexOf(t); return i > 0 ? process.argv[i + 1] : m; };
const BASE = arg("--base", "origin/main");
const TEST_MOI = "tests/import-s09.test.mjs";
// Vùng của hàng — đúng bằng chữ AC-6.
const VUNG = [
  /^pipeline\/import-s09\.mjs$/, /^pipeline\/tests\/import-s09\.test\.mjs$/, /^pipeline\/package\.json$/,
  /^pipeline\/test-nua\.json$/, /^collector\/docs\/DATA-CONTRACT\.md$/, /^pipeline\/scripts\/nap-s09[^/]*$/,
  /^_acceptance\/nap-s09\//, /^_acceptance\/config\.yaml$/, /^docs\/superpowers\/(specs|plans)\/2026-11-14-nap-s09[^/]*$/,
  /^PRODUCT-MAP\.md$/, /^LO-TRINH\.html$/,
];
const MAY_SINH = new Set(["PRODUCT-MAP.md", "LO-TRINH.html"]);

const git = (...a) => execFileSync("git", ["-C", GOC, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const tep = git("diff", "--name-only", `${BASE}...HEAD`).split("\n").filter(Boolean);
if (process.argv.includes("--them-gia")) tep.push("pipeline/scripts/khac.mjs");
const dem = (re) => tep.filter((f) => re.test(f)).length;
const kq = {
  tep: tep.length,
  ngoai_vung: tep.filter((f) => !VUNG.some((re) => re.test(f))).length,
  sync_cloud_doi: dem(/^pipeline\/sync-cloud\.mjs$/),
  app_doi: dem(/^app\//),
  migration_doi: dem(/^db\/migrations\//),
};

// Danh sách tên nguồn thật + định danh lược đồ có sẵn, đọc từ DB máy thu (chỉ đọc).
const may = new pg.Client({ connectionString: process.env.NS09_MAY_THU ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await may.connect();
await may.query("SET default_transaction_read_only = on");
const { rows } = await may.query("SELECT real_name, source_ids FROM source_registry");
const { rows: dd } = await may.query(`SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'public'
                                       UNION SELECT column_name FROM information_schema.columns WHERE table_schema = 'public'`);
await may.end();
const ten = new Set();
for (const r of rows) for (const t of [r.real_name, ...(Array.isArray(r.source_ids) ? r.source_ids : [])]) {
  const s = String(t ?? "").trim().toLowerCase();
  if (s.length >= 4) ten.add(s);
}
console.log(`ten_nguon_doi_chung=${ten.size}`);
if (ten.size === 0) { console.error("danh sách tên nguồn rỗng — không đo được"); process.exit(2); }
const DINH_DANH = new Set(dd.map((r) => r.t.toLowerCase()));
const boDinhDanh = (l) => l.toLowerCase().replace(/[a-z0-9_]+/g, (w) => (w.includes("_") && DINH_DANH.has(w) ? "" : w));
const coTen = (l) => { const x = boDinhDanh(l); return [...ten].some((t) => x.includes(t)); };

// Dòng thêm của diff.
const them = [];
let tepDang = "";
for (const l of git("diff", "-U0", `${BASE}...HEAD`).split("\n")) {
  if (l.startsWith("+++ ")) { tepDang = l.replace(/^\+\+\+ (b\/)?/, ""); continue; }
  if (l.startsWith("+") && !MAY_SINH.has(tepDang)) them.push(l);
}
kq.ten_nguon = them.filter(coTen).length;
// Thông điệp, tác giả, email tác giả của mọi commit; tên tệp đổi.
const commit = git("log", "--format=%B%n%an%n%ae", `${BASE}..HEAD`).split("\n");
kq.ten_nguon_commit = commit.filter(coTen).length + tep.filter(coTen).length;

// Đối chứng dương (không in tên): dòng giả và thông điệp giả mang một tên thật phải bị bắt; tên bảng có sẵn thì không.
const mau = [...ten][0];
if (!coTen(`+ const x = "${mau}";`) || !coTen(`fix: ${mau} trong thông điệp`) || coTen("+ INSERT INTO airbnb_snapshots")) {
  console.error("bộ dò tên nguồn hỏng — đối chứng dương không bắt được"); process.exit(2);
}
console.log("doi_chung_bo_do=ok");

// Tệp test mới nằm trong đúng một nửa của test-nua.json, và ca chia-nua xanh.
const nua = JSON.parse(readFileSync(join(GOC, "pipeline/test-nua.json"), "utf8"));
const soNua = ["a", "b"].filter((k) => (nua[k] ?? []).includes(TEST_MOI)).length;
const chia = spawnSync(process.execPath, ["--test", "scripts/chia-nua.test.mjs"], { cwd: join(GOC, "pipeline"), encoding: "utf8" });
kq.test_nua = soNua === 1 && chia.status === 0 ? "ok" : `loi(so_nua=${soNua},chia_nua=${chia.status})`;

console.log(Object.entries(kq).map(([k, v]) => `${k}=${v}`).join(" "));
const dat = kq.ngoai_vung === 0 && kq.sync_cloud_doi === 0 && kq.app_doi === 0 && kq.migration_doi === 0
  && kq.ten_nguon === 0 && kq.ten_nguon_commit === 0 && kq.test_nua === "ok";
process.exit(dat ? 0 : 1);

#!/usr/bin/env node
// ban-chep-da-loc.mjs — bản chép DB đã lọc cho máy phát triển M5 (HT18 `ban-chep-da-loc-cho-may-phat-trien`).
// M5 chỉ chạy API công khai và cổng Invest, không được giữ tầng A (AGENTS.md luật 6). Lệnh này chép DB máy thu (CHỈ ĐỌC)
// sang một DB đích tạm `oneinvest_m5_<yyyymmdd>` trên cùng máy chủ :5433, đúng bộ lọc của pipeline/sync-cloud.mjs (import,
// không chép lại), soát tầng A trên chính DB đích, rồi xuất một tệp dump `state/ban-chep-m5/oneinvest-m5-<ngày>.dump` + ke.json.
// Thiết kế: docs/superpowers/specs/2026-11-25-ban-chep-da-loc-cho-may-phat-trien-design.md. Hợp đồng: _acceptance/<slug>/.
//
//   node scripts/ban-chep-da-loc.mjs                         chép DATABASE_URL (mặc định DB máy thu) → oneinvest_m5_<hôm nay>
//   node scripts/ban-chep-da-loc.mjs --dich oneinvest_m5_<ngày> --ra <thư mục>
//   node scripts/ban-chep-da-loc.mjs --kiem <tệp.dump> [--khong-tu-dien]   khôi phục vào DB tạm, soát lại, so ke.json
//   node scripts/ban-chep-da-loc.mjs --don                   xoá mọi DB oneinvest_m5_*
//
// Mã thoát: 0 xanh · 1 soát trúng hay lỗi (DB đích đã xoá, không ghi dump) · 2 đối số/đích sai khuôn.
// Luật: DB nguồn chỉ đọc (giao dịch REPEATABLE READ READ ONLY + default_transaction_read_only cho mọi phiên đọc); không ghi
// cloud, không gọi mạng ngoài; KHÔNG in giá trị tầng A — mọi dòng in ra đi qua che() (tên nguồn → mã S0x), thông điệp chỉ nêu
// bảng/cột/loại chỗ. Tên DB tạm của --kiem: `oneinvest_m5_kiem_<pid>` (cũng bị --don dọn).
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FILL, RENAME, CLOUD_ALLOW, PII_EXCLUDE, SOURCE_EXCLUDE, selectList, childFilterSql,
} from "../pipeline/sync-cloud.mjs";
import { docSourceNameEntries } from "../pipeline/lib/source-name-entries.mjs";
import { tokensFromEntries } from "../pipeline/lib/tier-a-guard.mjs";
import { findSourceNames, maskSourceNames, fold, nameVariants } from "../pipeline/lib/mask-source-names.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// scripts/ ở gốc không có node_modules: mượn pg của app (như scripts/dev-ops-account.mjs).
const pg = createRequire(path.join(REPO, "app/package.json"))("pg");

export const CONTAINER = "one-invest-db";
export const NGUON_MAC_DINH = "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const RA_MAC_DINH = path.join(REPO, "state", "ban-chep-m5");

// ───────────────────────── Task 1 — lõi thuần ─────────────────────────

/** Bảng cấm: phải 0 dòng ở đích (AC-4). Hồ sơ user app, ảnh chụp Airbnb thô, thẻ duyệt, mọi bảng thô `stg_*`. */
export const BANG_CAM = Object.freeze([
  "users", "sessions", "machine_tokens", "user_events", "user_profile", "saved_markets", "review_queue", "airbnb_snapshots",
  /^stg_/,
]);
export const laBangCam = (t) => BANG_CAM.some((m) => (typeof m === "string" ? m === t : m.test(t)));

/** Ngoài FILL chỉ hai bảng này được có dòng ở đích (AC-1): sổ nguồn chỉ mã (AC-5) và bảng của PostGIS. */
export const NGOAI_FILL_CO_DONG = Object.freeze(["source_registry", "spatial_ref_sys"]);
/** Tên đích các bảng được có dòng (FILL đã đổi tên ref_calib_* + hai bảng trên). */
export const BANG_CO_DONG = Object.freeze([...FILL.map(RENAME), ...NGOAI_FILL_CO_DONG]);

/** source_registry ở đích chỉ giữ mã và vai trò (nhãn tầng C cho UI) — GS 25/11 Hỏi-2; mọi cột khác NULL. */
export const COT_NGUON_GIU = Object.freeze(["code", "label_vi"]);

export const TEN_DICH_RE = /^oneinvest_m5_[0-9]{8}$/;
export const TEN_KIEM_RE = /^oneinvest_m5_kiem_[0-9]+$/;
/** Mọi DB do lệnh này dựng (đích + DB tạm --kiem) — `--don` và bước «trần một bản sống» xoá theo khuôn này. */
export const TEN_M5_RE = /^oneinvest_m5_[a-z0-9_]+$/;

/** Tên cột hay khoá JSON mang ngày sinh/giới tính (AC-6). */
export const MAU_SINH_GIOI = /(dob|birth|gender|ngay_sinh|gioi_tinh)/i;
export const MAU_SINH_GIOI_SQL = "(dob|birth|gender|ngay_sinh|gioi_tinh)";

/** Kiểu cột chứa chữ — bộ soát tên nguồn đọc các cột này (ép ::text). Kiểu mảng có tiền tố `_`. */
const KIEU_CHU = new Set(["text", "varchar", "bpchar", "name", "citext", "json", "jsonb", "xml", "hstore"]);
export function loaiO(udt) {
  const mang = udt.startsWith("_");
  const goc = mang ? udt.slice(1) : udt;
  if (!KIEU_CHU.has(goc)) return null;
  if (mang) return "o_mang";
  return goc === "json" || goc === "jsonb" ? "o_json" : "o_chu";
}

const q = (id) => `"${String(id).replace(/"/g, '""')}"`;
const lit = (s) => `'${String(s).replace(/'/g, "''")}'`;

/** Tên đích theo ngày giờ máy (giờ VN trên máy thu): oneinvest_m5_yyyymmdd. */
export function tenDich(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `oneinvest_m5_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/** null khi tên đích hợp lệ; chuỗi lý do khi phải từ chối (mã 2). */
export function loiTenDich(ten, nguon) {
  if (!ten) return "thiếu tên DB đích";
  if (ten === "oneinvest") return "đích không được là DB máy thu oneinvest";
  if (!TEN_DICH_RE.test(ten)) return `đích phải dạng oneinvest_m5_<yyyymmdd>, nhận «${ten.replace(/[^A-Za-z0-9_]/g, "?")}»`;
  if (nguon && ten === nguon) return "đích trùng DB nguồn";
  return null;
}

/** Cột lên đích của một bảng: dùng chính selectList của sync-cloud (geoCols rỗng — COPY giữ kiểu gốc), riêng source_registry
 *  chỉ mã + vai trò. Trả { sql, cols, unapproved }. */
export function keHoachCot(table, localCols, tokens) {
  if (table === "source_registry") {
    const cols = COT_NGUON_GIU.filter((c) => localCols.includes(c));
    return { sql: cols.map(q).join(", "), cols, unapproved: [] };
  }
  return selectList(table, localCols, [], tokens);
}

/** Cột có ở đích mà kế hoạch không cho (chiều đỏ của AC-2: bản chép «SELECT *» thì cột mới chưa duyệt lọt lên). */
export function cotThua(table, colsDich, localCols, tokens = []) {
  const cho = new Set(keHoachCot(table, localCols, tokens).cols);
  return colsDich.filter((c) => !cho.has(c));
}

/** Câu đọc nguồn cho COPY: đúng cột và lọc dòng của câu đọc sync-cloud (bảng con theo cha sống, dòng chỉ ở máy thu). */
export const cauDocNguon = (table, list) => `SELECT ${list || "NULL"} FROM ${q(table)}${table === "source_registry" ? "" : childFilterSql(table)}`;
/** Số dòng kỳ vọng ở đích = số dòng câu đọc của sync-cloud trả. */
export const cauDemNguon = (table) => `SELECT count(*)::bigint AS n FROM ${q(table)}${table === "source_registry" ? "" : childFilterSql(table)}`;

/** Thứ tự chép cha trước con theo khoá ngoại giữa các bảng được chép (Kahn). Vòng → giữ thứ tự gốc cho phần còn lại. */
export function thuTuChep(tables, fks) {
  const set = new Set(tables);
  const cha = new Map(tables.map((t) => [t, new Set()]));
  for (const { src, dst } of fks) if (set.has(src) && set.has(dst) && src !== dst) cha.get(src).add(dst);
  const out = [];
  const xong = new Set();
  let tien = true;
  while (out.length < tables.length && tien) {
    tien = false;
    for (const t of tables) {
      if (xong.has(t)) continue;
      if ([...cha.get(t)].every((p) => xong.has(p))) { out.push(t); xong.add(t); tien = true; }
    }
  }
  for (const t of tables) if (!xong.has(t)) out.push(t);
  return out;
}

/** Định danh có cả chuỗi là một biến thể tên nguồn — không được bỏ (bỏ thì cấy đúng tên ấy vào COMMENT sẽ lọt). */
function laTokenTron(id, entries) {
  return findSourceNames(id, entries).some((h) => h.start === 0 && h.end === id.length);
}

/** Bỏ định danh lược đồ có sẵn (tên bảng, tên cột của catalog đích) khỏi văn bản DDL trước khi dò tên nguồn (sổ quyết định
 *  d-…-23, tiền lệ toa-s09). Khớp khi đứng riêng giữa ký tự không phải chữ/số; `_` tính là ranh (để `stg_x_pkey`, `t_c_seq`
 *  rơi về hậu tố). Định danh dài trước. */
export function boDinhDanh(text, idents, entries = []) {
  const ds = [...new Set(idents.map((s) => String(s).toLowerCase()))]
    .filter((s) => s.length >= 2 && !laTokenTron(s, entries))
    .sort((a, b) => b.length - a.length);
  const lo = String(text ?? "").toLowerCase();
  if (!ds.length) return lo;
  const esc = ds.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(?<![a-z0-9])(?:${esc.join("|")})(?![a-z0-9])`, "g");
  return lo.replace(re, " ");
}

/** Dò một dòng DDL: [{ loai, cho, ma }] — `ma` là mã S0x của chỗ trúng, không bao giờ là tên. */
export function soatDongDdl(rows, idents, entries) {
  const out = [];
  if (!entries?.length) return out;
  // Biên dịch regex bỏ định danh một lần cho cả lô.
  const ds = [...new Set(idents.map((s) => String(s).toLowerCase()))]
    .filter((s) => s.length >= 2 && !laTokenTron(s, entries));
  for (const r of rows) {
    const sach = boDinhDanh(r.txt, ds, []);
    const hit = findSourceNames(sach, entries)[0];
    if (hit) out.push({ muc: r.loai, cho: r.cho, ma: hit.code });
  }
  return out;
}

/** Câu catalog: mười loại chỗ của lược đồ mà bộ soát đọc (thân hàm, view, COMMENT, DEFAULT, CHECK, enum, tên ràng buộc, tên
 *  chỉ mục; ô dữ liệu đọc riêng). Bỏ schema hệ thống và đối tượng thuộc extension (PostGIS tự mang COMMENT, hàm). */
export const SQL_DDL_CHO = `
WITH ns AS (
  SELECT oid, nspname FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname <> 'information_schema'
), ext AS (
  SELECT classid, objid FROM pg_depend WHERE deptype = 'e'
), rel AS (
  SELECT c.oid, c.relname, c.relkind, ns.nspname FROM pg_class c JOIN ns ON ns.oid = c.relnamespace
  WHERE NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_class'::regclass AND ext.objid = c.oid)
), typ AS (
  SELECT t.oid, t.typname, ns.nspname FROM pg_type t JOIN ns ON ns.oid = t.typnamespace
  WHERE NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_type'::regclass AND ext.objid = t.oid)
), con AS (
  SELECT k.oid, k.conname, k.contype, coalesce(r.nspname || '.' || r.relname, ty.nspname || '.' || ty.typname) AS chu
  FROM pg_constraint k LEFT JOIN rel r ON r.oid = k.conrelid LEFT JOIN typ ty ON ty.oid = k.contypid
  WHERE r.oid IS NOT NULL OR ty.oid IS NOT NULL
)
SELECT 'ham' AS loai, ns.nspname || '.' || p.proname AS cho, p.prosrc AS txt
  FROM pg_proc p JOIN ns ON ns.oid = p.pronamespace
  WHERE NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_proc'::regclass AND ext.objid = p.oid)
UNION ALL SELECT 'view', nspname || '.' || relname, pg_get_viewdef(oid) FROM rel WHERE relkind IN ('v', 'm')
UNION ALL SELECT 'comment', o.type || ' ' || o.identity, d.description
  FROM pg_description d CROSS JOIN LATERAL pg_identify_object(d.classoid, d.objoid, d.objsubid) o
  WHERE (o.schema IN (SELECT nspname FROM ns) OR (o.type = 'schema' AND o.identity IN (SELECT nspname FROM ns)))
    AND NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = d.classoid AND ext.objid = d.objoid)
UNION ALL SELECT 'default', r.nspname || '.' || r.relname || '.' || a.attname, pg_get_expr(ad.adbin, ad.adrelid)
  FROM pg_attrdef ad JOIN rel r ON r.oid = ad.adrelid
  JOIN pg_attribute a ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
UNION ALL SELECT 'check', chu || '.' || conname, pg_get_constraintdef(oid) FROM con WHERE contype = 'c'
UNION ALL SELECT 'enum', ty.nspname || '.' || ty.typname, e.enumlabel FROM pg_enum e JOIN typ ty ON ty.oid = e.enumtypid
UNION ALL SELECT 'rang_buoc', chu, conname FROM con
UNION ALL SELECT 'chi_muc', r.nspname || '.' || t.relname, r.relname
  FROM pg_index i JOIN rel r ON r.oid = i.indexrelid JOIN rel t ON t.oid = i.indrelid`;

/** Định danh lược đồ có sẵn của catalog đích: tên bảng/view và tên cột trong public. */
export const SQL_DINH_DANH = `
SELECT DISTINCT x FROM (
  SELECT c.relname::text AS x FROM pg_class c
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  UNION
  SELECT a.attname::text FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
  WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm', 'f') AND a.attnum > 0 AND NOT a.attisdropped
) s`;

// Bảng gập dấu cho translate(), sinh từ chính fold() của lõi khớp (cùng cách sync-cloud dựng — hàm ấy không export).
const FOLD_FROM = [];
const FOLD_TO = [];
for (const [lo, hi] of [[0xc0, 0x24f], [0x1e00, 0x1eff]]) {
  for (let cp = lo; cp <= hi; cp++) {
    const ch = String.fromCodePoint(cp);
    const b = fold(ch);
    if (b !== ch && b.length === 1) { FOLD_FROM.push(ch); FOLD_TO.push(b); }
  }
}

/** Biến thể đã gập của từ điển, bản giữ dấu phân tách và bản bỏ hết ký tự không phải chữ/số — cho bộ lọc thô. */
export function bienTheLoc(entries) {
  const v = [...new Set(entries.flatMap((e) => nameVariants(e.realName, { wholeOnly: e.wholeOnly })))];
  const lien = [...new Set(v.map((x) => x.replace(/[^\p{L}\p{N}]+/gu, "")).filter((x) => x.length >= 3))];
  return { v, lien };
}

/**
 * Câu lọc thô một cột: TẬP TRÊN của findSourceNames (không xét ranh từ, thêm bản bỏ dấu phân tách và mã %XX), mỗi dòng gập dấu
 * một lần (OFFSET 0 chặn Postgres nhân biểu thức theo từng biến thể). JS xác nhận lại bằng findSourceNames — lõi khớp duy nhất.
 * Đo 25/11: biểu thức che của sync-cloud (maskedSourceExpr) tính lại regexp cho từng biến thể ngắn, quá 180 s một cột trên
 * sale_offers của máy thu — không dùng được cho bộ soát toàn bảng. Không LIMIT: lọc thô có thể trúng thừa, cắt N dòng đầu thì
 * một ô trúng thật phía sau bị bỏ. `voiCtid` trả thêm ctid cho bước che.
 */
export function cauLocTenNguon(table, col, entries, { voiCtid = false } = {}) {
  const { v, lien } = bienTheLoc(entries);
  if (!v.length) return `SELECT NULL::text AS v WHERE false`;
  const dieu = [...v.map((x) => `position(${lit(x)} in m.f) > 0`), ...lien.map((x) => `position(${lit(x)} in n.g) > 0`)].join(" OR ");
  return `SELECT ${voiCtid ? "s.id, " : ""}s.v FROM (SELECT ${voiCtid ? "ctid::text AS id, " : ""}${q(col)}::text AS v FROM ${q(table)}) s
    CROSS JOIN LATERAL (SELECT translate(lower(normalize(s.v, NFC)), ${lit(FOLD_FROM.join(""))}, ${lit(FOLD_TO.join(""))}) AS f OFFSET 0) m
    CROSS JOIN LATERAL (SELECT regexp_replace(m.f, '(%[0-9a-f]{2}|[^[:alnum:]])+', '', 'g') AS g OFFSET 0) n
    WHERE s.v IS NOT NULL AND (${dieu})`;
}

/** Che tên nguồn trong một dòng sắp in (mã S0x thay tên). Không có từ điển thì in nguyên — chế độ --khong-tu-dien không biết tên. */
export function taoChe(entries) {
  return (s) => {
    const t = String(s ?? "");
    if (!entries?.length) return t;
    return maskSourceNames(t, entries) ?? "?";
  };
}

/** Một dòng báo trúng: mục + chỗ (đã che), không giá trị. */
export const dongTrung = (h, che) => `TRÚNG ${h.muc}: ${che(h.cho)}${h.ma ? ` (mã ${h.ma})` : ""}`;

// ───────────────────────── tiến trình và DB ─────────────────────────

/** URL nguồn → { db, url }. Chỉ nhận máy chủ :5433 local (đi qua psql trong container). */
export function phanTichNguon(url = NGUON_MAC_DINH) {
  let u;
  try { u = new URL(url); } catch { return { loi: "DATABASE_URL không đọc được" }; }
  const host = u.hostname;
  if (!["localhost", "127.0.0.1"].includes(host) || u.port !== "5433") return { loi: "nguồn phải là Postgres local :5433 (container one-invest-db)" };
  const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!/^[a-z0-9_]+$/.test(db)) return { loi: "tên DB nguồn lạ" };
  return { db, url: `postgres://oneinvest:oneinvest@localhost:5433/${db}` };
}
const urlCua = (db) => `postgres://oneinvest:oneinvest@localhost:5433/${db}`;

/** Lệnh docker exec. `chiDoc` thêm default_transaction_read_only cho mọi phiên của lệnh (phiên đọc DB nguồn). */
export function dx(args, { chiDoc = false } = {}) {
  const env = ["-e", "PGPASSWORD=oneinvest"];
  if (chiDoc) env.push("-e", "PGOPTIONS=-c default_transaction_read_only=on");
  return ["docker", ["exec", "-i", ...env, CONTAINER, ...args]];
}
export const psqlArgs = (db, extra = []) => ["psql", "-U", "oneinvest", "-h", "localhost", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-d", db, ...extra];

/** Chạy một tiến trình; stdin từ chuỗi/luồng, stdout gom (hoặc ghi tệp). stderr gom để báo — người gọi che trước khi in. */
export function chay([cmd, args], { input, outFile, inFile } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ["pipe", outFile ? "pipe" : "pipe", "pipe"] });
    const out = [];
    const err = [];
    let ws;
    if (outFile) { ws = createWriteStream(outFile); p.stdout.pipe(ws); } else p.stdout.on("data", (b) => out.push(b));
    p.stderr.on("data", (b) => err.push(b));
    p.on("error", reject);
    if (inFile) createReadStream(inFile).pipe(p.stdin);
    else { p.stdin.on("error", () => {}); p.stdin.end(input ?? ""); }
    p.on("close", (code) => {
      const done = () => resolve({ code, stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8") });
      if (ws && !ws.closed) ws.on("close", done); else done();
    });
  });
}

/** Ống COPY nguồn → đích: psql nguồn (giao dịch READ ONLY, nhập snapshot) `COPY (SELECT …) TO STDOUT` | psql đích `COPY t(cột) FROM STDIN`. */
export function ongCopy({ nguonDb, snapshot, cauDoc, dichDb, bangDich, cols }) {
  return new Promise((resolve, reject) => {
    const [c1, a1] = dx(psqlArgs(nguonDb, [
      "-c", "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
      "-c", `SET TRANSACTION SNAPSHOT ${lit(snapshot)}`,
      "-c", `COPY (${cauDoc}) TO STDOUT`,
      "-c", "COMMIT",
    ]), { chiDoc: true });
    const [c2, a2] = dx(psqlArgs(dichDb, ["-c", `COPY ${q(bangDich)} (${cols.map(q).join(", ")}) FROM STDIN`]));
    const src = spawn(c1, a1, { stdio: ["ignore", "pipe", "pipe"] });
    const dst = spawn(c2, a2, { stdio: ["pipe", "pipe", "pipe"] });
    const e1 = [];
    const e2 = [];
    src.stderr.on("data", (b) => e1.push(b));
    dst.stderr.on("data", (b) => e2.push(b));
    dst.stdout.resume();
    dst.stdin.on("error", () => {});
    src.stdout.pipe(dst.stdin);
    let m1 = null;
    let m2 = null;
    const xong = () => {
      if (m1 === null || m2 === null) return;
      if (m1 === 0 && m2 === 0) resolve();
      else reject(new Error(`COPY ${bangDich} lỗi (nguồn ${m1}, đích ${m2}): ${Buffer.concat([...e1, ...e2]).toString("utf8").slice(0, 400)}`));
    };
    src.on("error", reject);
    dst.on("error", reject);
    src.on("close", (c) => { m1 = c; xong(); });
    dst.on("close", (c) => { m2 = c; xong(); });
  });
}

async function moClient(url, { chiDoc = false } = {}) {
  const c = new pg.Client({ connectionString: url, ...(chiDoc ? { options: "-c default_transaction_read_only=on" } : {}) });
  await c.connect();
  return c;
}

/** Mở phiên nguồn: REPEATABLE READ READ ONLY, giữ mở; trả { client, snapshot, luc }. */
export async function moNguon(url) {
  const c = await moClient(url, { chiDoc: true });
  await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  const { rows: [r] } = await c.query("SELECT pg_export_snapshot() AS s, transaction_timestamp()::text AS t");
  return { client: c, snapshot: r.s, luc: r.t };
}

async function quanTri(fn) {
  const c = await moClient(urlCua("postgres"));
  try { return await fn(c); } finally { await c.end().catch(() => {}); }
}
export const dsDbM5 = () => quanTri(async (c) =>
  (await c.query("SELECT datname FROM pg_database WHERE datname ~ '^oneinvest_m5_' ORDER BY 1")).rows.map((r) => r.datname));
export async function xoaDb(ten) {
  if (!TEN_M5_RE.test(ten)) throw new Error("từ chối xoá DB ngoài khuôn oneinvest_m5_*");
  await quanTri((c) => c.query(`DROP DATABASE IF EXISTS ${q(ten)} WITH (FORCE)`));
}
async function taoDb(ten) {
  if (!TEN_M5_RE.test(ten)) throw new Error("từ chối dựng DB ngoài khuôn oneinvest_m5_*");
  await quanTri((c) => c.query(`CREATE DATABASE ${q(ten)} TEMPLATE template0 ENCODING 'UTF8'`));
}
/** `--don`: xoá mọi DB oneinvest_m5_* (đích và DB tạm --kiem). */
export async function donHet() {
  const ds = await dsDbM5();
  for (const d of ds) await xoaDb(d);
  return ds;
}

// ───────────────────────── Task 2 — chép ─────────────────────────

/** Cột của bảng ở một DB (bỏ cột sinh). */
async function cotCua(client, tables) {
  const { rows } = await client.query(
    `SELECT c.relname AS t, a.attname AS c, a.attnotnull AS nn, a.attgenerated <> '' AS gen, format_type(a.atttypid, a.atttypmod) AS kieu
       FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
      WHERE c.relnamespace = 'public'::regnamespace AND c.relname = ANY($1) AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum`, [tables]);
  const m = new Map();
  for (const r of rows) (m.get(r.t) ?? m.set(r.t, []).get(r.t)).push(r);
  return m;
}

/** Bảng FILL là VIEW ở nguồn (sale_offers, listings, sellers…) → bảng cùng kiểu cột ở đích; view phụ thuộc dựng lại từ định
 *  nghĩa đã lưu. Trả { thanhBang, dungLai, hamMat }. Đọc catalog, không đoán. */
async function doiViewThanhBang(dc, tables) {
  const { rows: kv } = await dc.query(
    `SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('v', 'm') AND relname = ANY($1)`, [tables]);
  const views = kv.map((r) => r.relname);
  if (!views.length) return { thanhBang: [], dungLai: [], hamMat: [] };
  const { rows: luu } = await dc.query(
    `SELECT c.relname, c.relkind, pg_get_viewdef(c.oid) AS def, c.reloptions AS opts, obj_description(c.oid, 'pg_class') AS cmt
       FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('v', 'm')
        AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.deptype = 'e' AND d.classid = 'pg_class'::regclass AND d.objid = c.oid)
      ORDER BY c.oid`);
  const hamTruoc = (await dc.query(`SELECT oid::regprocedure::text AS f FROM pg_proc WHERE pronamespace = 'public'::regnamespace`)).rows.map((r) => r.f);
  await dc.query("BEGIN");
  for (const v of views) await dc.query(`CREATE TABLE ${q(`__bcl_${v}`)} AS SELECT * FROM ${q(v)} WITH NO DATA`);
  for (const v of views) await dc.query(`DROP VIEW IF EXISTS ${q(v)} CASCADE`);
  for (const v of views) await dc.query(`ALTER TABLE ${q(`__bcl_${v}`)} RENAME TO ${q(v)}`);
  const conLai = async () => new Set((await dc.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace`)).rows.map((r) => r.relname));
  let co = await conLai();
  let cho = luu.filter((r) => !views.includes(r.relname) && !co.has(r.relname));
  const dungLai = [];
  // View phụ thuộc lẫn nhau: thử lần lượt tới khi không dựng thêm được.
  for (let vong = 0; cho.length && vong < 20; vong++) {
    const sau = [];
    for (const r of cho) {
      await dc.query("SAVEPOINT v");
      try {
        const opts = r.opts?.length ? ` WITH (${r.opts.join(", ")})` : "";
        await dc.query(r.relkind === "m"
          ? `CREATE MATERIALIZED VIEW ${q(r.relname)}${opts} AS ${r.def.replace(/;\s*$/, "")} WITH NO DATA`
          : `CREATE VIEW ${q(r.relname)}${opts} AS ${r.def.replace(/;\s*$/, "")}`);
        if (r.cmt != null) await dc.query(`COMMENT ON ${r.relkind === "m" ? "MATERIALIZED VIEW" : "VIEW"} ${q(r.relname)} IS ${lit(r.cmt)}`);
        await dc.query("RELEASE SAVEPOINT v");
        dungLai.push(r.relname);
      } catch {
        await dc.query("ROLLBACK TO SAVEPOINT v");
        sau.push(r);
      }
    }
    if (sau.length === cho.length) break;
    cho = sau;
  }
  if (cho.length) {
    await dc.query("ROLLBACK");
    throw new Error(`không dựng lại được view phụ thuộc: ${cho.map((r) => r.relname).join(", ")}`);
  }
  await dc.query("COMMIT");
  const hamSau = new Set((await dc.query(`SELECT oid::regprocedure::text AS f FROM pg_proc WHERE pronamespace = 'public'::regnamespace`)).rows.map((r) => r.f));
  return { thanhBang: views, dungLai, hamMat: hamTruoc.filter((f) => !hamSau.has(f)) };
}

/** Khoá ngoại từ bảng được chép tới bảng không chép (0 dòng ở đích: listing_records, sale_offer_records…) — giữ thì nạp và
 *  pg_restore trên M5 gãy. Bỏ ở đích, ghi vào ke.json. */
async function boKhoaNgoaiRaNgoai(dc, chep) {
  const { rows } = await dc.query(
    `SELECT conrelid::regclass::text AS src, conname, confrelid::regclass::text AS dst FROM pg_constraint
      WHERE contype = 'f' AND connamespace = 'public'::regnamespace`);
  const strip = (s) => s.replace(/^public\./, "").replace(/^"(.*)"$/, "$1");
  const bo = rows.filter((r) => chep.includes(strip(r.src)) && !chep.includes(strip(r.dst)));
  for (const r of bo) await dc.query(`ALTER TABLE ${q(strip(r.src))} DROP CONSTRAINT ${q(r.conname)}`);
  return { bo: bo.map((r) => `${strip(r.src)}.${r.conname}`), fks: rows.filter((r) => !bo.includes(r)).map((r) => ({ src: strip(r.src), dst: strip(r.dst) })) };
}

/** Cột bị loại khỏi bản chép: bỏ DEFAULT và NOT NULL ở đích để cột về NULL (AC-2, AC-5). Cột thuộc khoá chính giữ. */
async function moCotLoai(dc, table, colsDich, giu) {
  const { rows: pk } = await dc.query(
    `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indisprimary AND i.indrelid = to_regclass($1)`, [`public.${q(table)}`]);
  const pkCols = new Set(pk.map((r) => r.attname));
  const loai = colsDich.filter((c) => !c.gen && !giu.includes(c.c) && !pkCols.has(c.c));
  for (const c of loai) await dc.query(`ALTER TABLE ${q(table)} ALTER COLUMN ${q(c.c)} DROP DEFAULT, ALTER COLUMN ${q(c.c)} DROP NOT NULL`);
  return loai.map((c) => c.c);
}

const DUOI_DOI_TEN = FILL.filter((x) => x !== RENAME(x)).map((x) => x.replace(/^airdna_/, "")).sort((a, b) => b.length - a.length);
/** Tên chỉ mục/chuỗi/ràng buộc: mọi chỗ nhắc tên bảng airdna_<x> cũ → ref_calib_<x>; cột như `airdna_id` giữ nguyên. */
export const doiTenDoiTuong = (ten) => ten.replace(new RegExp(`airdna_(${DUOI_DOI_TEN.join("|")})`, "g"), "ref_calib_$1");

/** airdna_* → ref_calib_* như cloud (C4 SPL), kèm chỉ mục, chuỗi, ràng buộc mang tên bảng cũ. */
async function doiTenRefCalib(dc) {
  const doi = [];
  for (const t of FILL.filter((x) => x !== RENAME(x))) {
    const { rows: [r] } = await dc.query("SELECT to_regclass($1) IS NOT NULL AS co", [`public.${t}`]);
    if (!r.co) continue;
    await dc.query(`ALTER TABLE ${q(t)} RENAME TO ${q(RENAME(t))}`);
    doi.push(t);
  }
  // Tên đối tượng mang tên bảng cũ ở bất kỳ vị trí nào (`airdna_listings_pkey`, `idx_airdna_listings_captured_at`).
  const { rows: rel } = await dc.query(
    `SELECT relname, relkind FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('i', 'I', 'S') AND relname ~ 'airdna_'`);
  for (const r of rel) {
    if (doiTenDoiTuong(r.relname) === r.relname) continue;
    await dc.query(`ALTER ${r.relkind === "S" ? "SEQUENCE" : "INDEX"} ${q(r.relname)} RENAME TO ${q(doiTenDoiTuong(r.relname))}`);
  }
  // Đổi tên chỉ mục của khoá chính/duy nhất đã đổi luôn tên ràng buộc — đọc lại sau bước trên.
  const { rows: con } = await dc.query(
    `SELECT conrelid::regclass::text AS t, conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conname ~ 'airdna_' AND conrelid <> 0`);
  for (const r of con) {
    if (doiTenDoiTuong(r.conname) === r.conname) continue;
    await dc.query(`ALTER TABLE ${r.t} RENAME CONSTRAINT ${q(r.conname)} TO ${q(doiTenDoiTuong(r.conname))}`);
  }
  const { rows: tg } = await dc.query(
    `SELECT tgrelid::regclass::text AS t, tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname ~ 'airdna_'`);
  for (const r of tg) {
    if (doiTenDoiTuong(r.tgname) === r.tgname) continue;
    await dc.query(`ALTER TRIGGER ${q(r.tgname)} ON ${r.t} RENAME TO ${q(doiTenDoiTuong(r.tgname))}`);
  }
  return doi;
}

/** Hàm ở đích có thân nhắc tên bảng airdna_* cũ (sau đổi tên không còn bảng ấy, bộ soát sẽ bắt) — bỏ ở đích. Trang công khai
 *  của app/data-api không gọi hàm SQL nào của DB (đọc bảng/view), nên bỏ không ảnh hưởng M5; ghi tên vào ke.json. */
async function boHamNhacTenCu(dc) {
  const { rows } = await dc.query(
    `SELECT p.oid::regprocedure::text AS f FROM pg_proc p
      WHERE p.pronamespace = 'public'::regnamespace AND p.prosrc ~* '\\mairdna_(${FILL.filter((x) => x !== RENAME(x)).map((x) => x.replace(/^airdna_/, "")).join("|")})\\M'
        AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.deptype = 'e' AND d.classid = 'pg_proc'::regclass AND d.objid = p.oid)`);
  for (const r of rows) await dc.query(`DROP FUNCTION IF EXISTS ${r.f} CASCADE`);
  return rows.map((r) => r.f);
}

/** Kiểu cột có chữ (text/json/mảng chữ) của các bảng có dòng ở public — chung cho bước che và bộ soát. */
async function cotChuCoDong(c) {
  const { rows } = await c.query(
    `SELECT c.relname AS t, a.attname AS c, t.typname AS udt, format_type(a.atttypid, a.atttypmod) AS kieu
       FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped
        AND a.attgenerated = '' ORDER BY c.relname, a.attnum`);
  const out = [];
  const coDong = new Map();
  for (const r of rows) {
    if (!loaiO(r.udt)) continue;
    if (!coDong.has(r.t)) coDong.set(r.t, (await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(r.t)}) AS co`)).rows[0].co);
    if (coDong.get(r.t)) out.push(r);
  }
  return out;
}

/**
 * Che tên nguồn còn trong ô dữ liệu đã chép (thay tên bằng mã S0x, như bộ che của app). Đo 25/11 trên DB máy thu: tập FILL của
 * sync-cloud còn mang tên nguồn thật ở `areas.meta` (khoá và giá trị, ~500 dòng) và `listings.name`/`photo_urls` — bộ soát đích
 * (AC-3) sẽ đỏ trên mọi bản chép nếu không che. Bước này chỉ là che; bộ soát chạy SAU và độc lập. Trả { "bảng.cột": số ô }.
 */
export async function cheGiaTri(dc, entries) {
  const dem = {};
  for (const r of await cotChuCoDong(dc)) {
    const { rows } = await dc.query(cauLocTenNguon(r.t, r.c, entries, { voiCtid: true }));
    for (const x of rows) {
      if (!findSourceNames(x.v, entries).length) continue;
      const moi = maskSourceNames(x.v, entries);
      if (moi == null) throw new Error(`không che được ${r.t}.${r.c}`);
      await dc.query(`UPDATE ${q(r.t)} SET ${q(r.c)} = $1::${r.kieu} WHERE ctid = $2::tid`, [moi, x.id]);
      dem[`${r.t}.${r.c}`] = (dem[`${r.t}.${r.c}`] ?? 0) + 1;
    }
  }
  return dem;
}

/** Dựng extension trên đích theo nguồn (thứ tự dựng gốc), trừ pg_cron (chỉ sống ở DB chính) và plpgsql (có sẵn). */
async function dungExtension(nc, dc) {
  const { rows } = await nc.query(`SELECT extname FROM pg_extension WHERE extname NOT IN ('pg_cron', 'plpgsql') ORDER BY oid`);
  for (const r of rows) await dc.query(`CREATE EXTENSION IF NOT EXISTS ${q(r.extname)} CASCADE`);
  return rows.map((r) => r.extname);
}

/** Lược đồ public từ nguồn (cùng snapshot) → đích. Đích đã có schema public nên dòng CREATE SCHEMA public đổi thành IF NOT EXISTS. */
async function chepLuocDo({ nguonDb, snapshot, dichDb }) {
  const d = await chay(dx(["pg_dump", "-U", "oneinvest", "-h", "localhost", "--schema-only", "-n", "public", "--no-owner", "--no-acl",
    `--snapshot=${snapshot}`, nguonDb], { chiDoc: true }));
  if (d.code !== 0) throw new Error(`pg_dump lược đồ lỗi (mã ${d.code}): ${d.stderr.slice(0, 400)}`);
  const sql = d.stdout.replace(/^CREATE SCHEMA public;$/m, "CREATE SCHEMA IF NOT EXISTS public;");
  const n = await chay(dx(psqlArgs(dichDb)), { input: sql });
  if (n.code !== 0) throw new Error(`nạp lược đồ vào đích lỗi (mã ${n.code}): ${n.stderr.slice(0, 400)}`);
}

/** pg_dump -Fc DB đích → tệp (ghi tạm rồi đổi tên). Trả { sha256, coByte }. */
export async function xuatDump(dichDb, tep) {
  const tam = `${tep}.tam`;
  const r = await chay(dx(["pg_dump", "-U", "oneinvest", "-h", "localhost", "-Fc", "--no-owner", "--no-acl", dichDb]), { outFile: tam });
  if (r.code !== 0) { rmSync(tam, { force: true }); throw new Error(`pg_dump -Fc lỗi (mã ${r.code}): ${r.stderr.slice(0, 400)}`); }
  renameSync(tam, tep);
  return { sha256: await sha256Tep(tep), coByte: statSync(tep).size };
}

export function sha256Tep(tep) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(tep).on("data", (b) => h.update(b)).on("error", reject).on("end", () => resolve(h.digest("hex")));
  });
}

function shaMa() {
  try { return execFileSync("git", ["-C", REPO, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return null; }
}

/** Đếm dòng các bảng (tên đích). */
export async function demDong(client, tables) {
  const out = {};
  for (const t of tables) {
    const { rows: [r] } = await client.query(`SELECT count(*)::bigint AS n FROM ${q(t)}`);
    out[t] = Number(r.n);
  }
  return out;
}

/**
 * Lệnh chép. Trả mã thoát. `sauChep(dichClient)` — móc cho itest (cấy vào ĐÍCH sau bước chép, trước bộ soát).
 * `loiCay` — "giua-chep": ném lỗi sau bảng đầu tiên (E10: lệnh gãy giữa chừng thì không còn DB đích).
 */
export async function chayChep({ nguonUrl = NGUON_MAC_DINH, dich = tenDich(), ra = RA_MAC_DINH, out = console.log, err = console.error,
  sauChep, loiCay } = {}) {
  const ng = phanTichNguon(nguonUrl);
  if (ng.loi) { err(`ban-chep-da-loc: ${ng.loi}`); return 2; }
  const loiTen = loiTenDich(dich, ng.db);
  if (loiTen) { err(`ban-chep-da-loc: ${loiTen}`); return 2; }
  if (TEN_M5_RE.test(ng.db)) { err("ban-chep-da-loc: nguồn không được là một DB oneinvest_m5_* (bước dọn sẽ xoá nó)"); return 2; }

  const t0 = Date.now();
  let che = (s) => String(s);
  let nguon;
  let dc;
  let dungDich = false;
  try {
    nguon = await moNguon(ng.url);
    const nc = nguon.client;
    const entries = await docSourceNameEntries(nc);
    if (!entries.length) { err("ban-chep-da-loc: không đọc được từ điển tên nguồn từ source_registry nguồn — không soát được, không chép"); return 1; }
    che = taoChe(entries);
    const tokens = tokensFromEntries(entries);

    // Trần một bản sống: xoá mọi oneinvest_m5_* cũ (kể cả bản cùng ngày) trước khi dựng.
    for (const cu of await dsDbM5()) { await xoaDb(cu); out(`xoá bản cũ ${cu}`); }
    await taoDb(dich);
    dungDich = true;
    dc = await moClient(urlCua(dich));
    const ext = await dungExtension(nc, dc);
    await chepLuocDo({ nguonDb: ng.db, snapshot: nguon.snapshot, dichDb: dich });

    const { rows: coBang } = await nc.query(`SELECT relname FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relname = ANY($1)`,
      [[...FILL, "source_registry"]]);
    const chep = [...FILL, "source_registry"].filter((t) => coBang.some((r) => r.relname === t));
    const view = await doiViewThanhBang(dc, chep);
    const kn = await boKhoaNgoaiRaNgoai(dc, chep);
    const cotNguon = await cotCua(nc, chep);
    const cotDich = await cotCua(dc, chep);

    const soDong = {};
    const cotLoai = {};
    const thuTu = thuTuChep(chep, kn.fks);
    let lan = 0;
    for (const t of thuTu) {
      const local = (cotNguon.get(t) ?? []).filter((c) => !c.gen).map((c) => c.c);
      const ke = keHoachCot(t, local, tokens);
      cotLoai[t] = await moCotLoai(dc, t, cotDich.get(t) ?? [], ke.cols);
      if (ke.cols.length) {
        await ongCopy({ nguonDb: ng.db, snapshot: nguon.snapshot, cauDoc: cauDocNguon(t, ke.sql), dichDb: dich, bangDich: t, cols: ke.cols });
      }
      if (loiCay === "giua-chep" && ++lan === 1) throw new Error("lỗi cấy giữa bước chép (E10)");
    }
    const doiTen = await doiTenRefCalib(dc);
    const hamBo = await boHamNhacTenCu(dc);
    const daChe = await cheGiaTri(dc, entries);
    for (const [k, n] of Object.entries(daChe)) out(`che tên nguồn → mã: ${k} ${n} ô`);
    for (const t of chep) soDong[RENAME(t)] = (await demDong(dc, [RENAME(t)]))[RENAME(t)];
    out(`chép xong ${chep.length} bảng (${Object.values(soDong).reduce((a, b) => a + b, 0)} dòng), view → bảng: ${view.thanhBang.join(", ") || "—"}`);

    if (sauChep) await sauChep(dc);

    const hits = await soatDich(dc, { entries });
    if (hits.length) {
      for (const h of hits) err(dongTrung(h, che));
      err(`ban-chep-da-loc: bộ soát trúng ${hits.length} chỗ — xoá DB đích, không ghi dump`);
      return 1;
    }

    mkdirSync(ra, { recursive: true });
    const ngay = dich.replace(/^oneinvest_m5_/, "");
    const tep = path.join(ra, `oneinvest-m5-${ngay}.dump`);
    // Một ke.json cho một thư mục → dump ngày khác không còn kiểm được, xoá cùng lúc.
    for (const f of readdirSync(ra)) if (/^oneinvest-m5-[0-9]{8}\.dump$/.test(f) && f !== path.basename(tep)) rmSync(path.join(ra, f), { force: true });
    const { sha256, coByte } = await xuatDump(dich, tep);
    const ke = {
      ten_dich: dich, tep: path.basename(tep), sha256, co_byte: coByte, sha_ma: shaMa(), luc_snapshot: nguon.luc,
      so_dong: soDong, extension: ext, view_thanh_bang: view.thanhBang, view_dung_lai: view.dungLai, ham_mat_khi_doi_view: view.hamMat,
      khoa_ngoai_bo: kn.bo, cot_loai_ve_null: cotLoai, o_da_che: daChe, doi_ten: doiTen.map((t) => [t, RENAME(t)]), ham_bo: hamBo,
      thoi_gian_s: Math.round((Date.now() - t0) / 1000),
    };
    writeFileSync(path.join(ra, "ke.json"), `${JSON.stringify(ke, null, 2)}\n`);
    out(`xanh: ${che(tep)} (${coByte} byte, sha256 ${sha256.slice(0, 12)}…), ${Object.values(soDong).filter((n) => n > 0).length} bảng có dòng, ${ke.thoi_gian_s}s`);
    dungDich = false; // giữ bản sống
    return 0;
  } catch (e) {
    err(`ban-chep-da-loc: lỗi — ${che(e?.message ?? e)}`);
    return 1;
  } finally {
    if (dc) await dc.end().catch(() => {});
    if (nguon) { await nguon.client.query("COMMIT").catch(() => {}); await nguon.client.end().catch(() => {}); }
    if (dungDich) await xoaDb(dich).catch(() => err(`ban-chep-da-loc: chưa xoá được ${dich}`));
  }
}

// ───────────────────────── Task 3 — bộ soát đích + --kiem ─────────────────────────

/**
 * Bộ soát tầng A đọc lại DB đích (không tin bước chép). `entries` null = --khong-tu-dien (bỏ phần dò tên nguồn).
 * Trả [{ muc, cho, ma? }] — không giá trị. Mục: o_chu/o_json/o_mang + mười loại DDL (tên nguồn), bang_cam, bang_ngoai, nguon,
 * cot_chua_duyet, sinh_gioi_cot, sinh_gioi_khoa, schema_la.
 */
export async function soatDich(c, { entries = null } = {}) {
  const hits = [];
  // (e) schema ngoài public và schema của extension (PostGIS topology).
  const { rows: sch } = await c.query(
    `SELECT nspname FROM pg_namespace n WHERE nspname !~ '^pg_' AND nspname NOT IN ('public', 'information_schema')
       AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.deptype = 'e' AND d.classid = 'pg_namespace'::regclass AND d.objid = n.oid)
     ORDER BY 1`);
  for (const r of sch) hits.push({ muc: "schema_la", cho: r.nspname });

  // Bảng của public (bỏ bảng thuộc extension trừ khi có dòng ngoài danh sách — spatial_ref_sys được phép).
  const { rows: bang } = await c.query(
    `SELECT c.relname AS t FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') ORDER BY 1`);
  const coDong = new Set();
  for (const { t } of bang) {
    const { rows: [r] } = await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(t)}) AS co`);
    if (!r.co) continue;
    coDong.add(t);
    if (laBangCam(t)) hits.push({ muc: "bang_cam", cho: t });
    else if (!BANG_CO_DONG.includes(t)) hits.push({ muc: "bang_ngoai", cho: t });
  }

  // (c) source_registry: mọi cột ngoài mã + vai trò phải NULL.
  if (coDong.has("source_registry")) {
    const { rows: cot } = await c.query(
      `SELECT attname FROM pg_attribute WHERE attrelid = 'public.source_registry'::regclass AND attnum > 0 AND NOT attisdropped`);
    for (const { attname } of cot) {
      if (COT_NGUON_GIU.includes(attname)) continue;
      const { rows: [r] } = await c.query(`SELECT EXISTS (SELECT 1 FROM source_registry WHERE ${q(attname)} IS NOT NULL) AS co`);
      if (r.co) hits.push({ muc: "nguon", cho: `source_registry.${attname}` });
    }
  }

  // Cột của mọi bảng có dòng.
  const { rows: cols } = await c.query(
    `SELECT c.relname AS t, a.attname AS c, t.typname AS udt FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_type t ON t.oid = a.atttypid
      WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped
        AND c.relname = ANY($1) ORDER BY c.relname, a.attnum`, [[...coDong]]);

  // AC-2 ở đích: bảng người bán chỉ có giá trị ở cột cho phép.
  for (const [t, allow] of Object.entries(CLOUD_ALLOW)) {
    const td = RENAME(t);
    if (!coDong.has(td)) continue;
    for (const r of cols.filter((x) => x.t === td && !allow.includes(x.c))) {
      const { rows: [k] } = await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(td)} WHERE ${q(r.c)} IS NOT NULL) AS co`);
      if (k.co) hits.push({ muc: "cot_chua_duyet", cho: `${td}.${r.c}` });
    }
  }
  for (const [t, loai] of [...Object.entries(PII_EXCLUDE), ...Object.entries(SOURCE_EXCLUDE)]) {
    const td = RENAME(t);
    if (!coDong.has(td) || CLOUD_ALLOW[t]) continue;
    for (const col of loai.filter((x) => cols.some((r) => r.t === td && r.c === x))) {
      const { rows: [k] } = await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(td)} WHERE ${q(col)} IS NOT NULL) AS co`);
      if (k.co) hits.push({ muc: "cot_chua_duyet", cho: `${td}.${col}` });
    }
  }

  // (d) ngày sinh/giới tính: cột tên khớp có giá trị; khoá JSON khớp.
  for (const r of cols) {
    if (MAU_SINH_GIOI.test(r.c)) {
      const { rows: [k] } = await c.query(`SELECT EXISTS (SELECT 1 FROM ${q(r.t)} WHERE ${q(r.c)} IS NOT NULL) AS co`);
      if (k.co) hits.push({ muc: "sinh_gioi_cot", cho: `${r.t}.${r.c}` });
    }
    const lo = loaiO(r.udt);
    if (lo === "o_json" || (lo === "o_mang" && /json/.test(r.udt))) {
      const { rows: [k] } = await c.query(
        `SELECT EXISTS (SELECT 1 FROM ${q(r.t)} WHERE ${q(r.c)}::text ~* ${lit(`"[^"]*${MAU_SINH_GIOI_SQL}[^"]*"\\s*:`)}) AS co`);
      if (k.co) hits.push({ muc: "sinh_gioi_khoa", cho: `${r.t}.${r.c}` });
    }
  }

  if (!entries) return hits;
  if (!entries.length) { hits.push({ muc: "tu_dien", cho: "từ điển tên nguồn rỗng — không soát được" }); return hits; }

  // (a1) ô dữ liệu text/json/mảng chữ.
  for (const r of cols) {
    const lo = loaiO(r.udt);
    if (!lo) continue;
    const { rows } = await c.query(cauLocTenNguon(r.t, r.c, entries));
    const hit = rows.map((x) => findSourceNames(x.v, entries)[0]).find(Boolean);
    if (hit) hits.push({ muc: lo, cho: `${r.t}.${r.c}`, ma: hit.code });
  }

  // (a2) lược đồ: mười loại chỗ, sau khi bỏ định danh có sẵn.
  const idents = (await c.query(SQL_DINH_DANH)).rows.map((r) => r.x);
  const { rows: ddl } = await c.query(SQL_DDL_CHO);
  hits.push(...soatDongDdl(ddl, idents, entries));
  return hits;
}

/** `--kiem <dump>`: sha256 = ke.json, khôi phục vào DB tạm, số dòng = ke.json, bộ soát; xoá DB tạm cả khi đỏ. */
export async function chayKiem({ tep, khongTuDien = false, nguonUrl = NGUON_MAC_DINH, out = console.log, err = console.error } = {}) {
  if (!tep || !existsSync(tep)) { err("ban-chep-da-loc --kiem: không thấy tệp dump"); return 2; }
  const keTep = path.join(path.dirname(tep), "ke.json");
  if (!existsSync(keTep)) { err("ban-chep-da-loc --kiem: thiếu ke.json cạnh tệp dump"); return 2; }
  let ke;
  try { ke = JSON.parse(readFileSync(keTep, "utf8")); } catch { err("ban-chep-da-loc --kiem: ke.json hỏng"); return 1; }
  if (ke.tep !== path.basename(tep)) { err("ban-chep-da-loc --kiem: ke.json không ứng với tệp dump này"); return 1; }

  let entries = null;
  let che = (s) => String(s);
  if (!khongTuDien) {
    const ng = phanTichNguon(nguonUrl);
    if (ng.loi) { err(`ban-chep-da-loc --kiem: ${ng.loi}`); return 2; }
    const nc = await moClient(ng.url, { chiDoc: true });
    try { entries = await docSourceNameEntries(nc); } finally { await nc.end().catch(() => {}); }
    if (!entries.length) { err("ban-chep-da-loc --kiem: từ điển tên nguồn rỗng — dùng --khong-tu-dien trên máy không có sổ nguồn"); return 1; }
    che = taoChe(entries);
  }

  const sha = await sha256Tep(tep);
  if (sha !== ke.sha256) { err("ĐỎ sha256: băm tệp dump không khớp ke.json"); return 1; }
  out("sha256 khớp ke.json");

  const tam = `oneinvest_m5_kiem_${process.pid}`;
  let dc;
  try {
    await xoaDb(tam);
    await taoDb(tam);
    const r = await chay(dx(["pg_restore", "-U", "oneinvest", "-h", "localhost", "--no-owner", "--no-acl", "--exit-on-error", "-d", tam]), { inFile: tep });
    if (r.code !== 0) { err(`ĐỎ khôi phục: pg_restore lỗi (mã ${r.code}): ${che(r.stderr.slice(0, 400))}`); return 1; }
    dc = await moClient(urlCua(tam));
    const lech = [];
    for (const [t, n] of Object.entries(ke.so_dong ?? {})) {
      const { rows: [x] } = await dc.query("SELECT to_regclass($1) IS NOT NULL AS co", [`public.${q(t)}`]);
      const thuc = x.co ? (await demDong(dc, [t]))[t] : null;
      if (thuc !== n) lech.push(`${t} (ke.json ${n}, dump ${thuc ?? "không có bảng"})`);
    }
    for (const l of lech) err(`ĐỎ số dòng: ${che(l)}`);
    const hits = await soatDich(dc, { entries });
    for (const h of hits) err(dongTrung(h, che));
    if (lech.length || hits.length) return 1;
    out(`xanh: số dòng ${Object.keys(ke.so_dong ?? {}).length} bảng khớp ke.json, bộ soát 0 trúng${khongTuDien ? " (không từ điển)" : ""}`);
    return 0;
  } catch (e) {
    err(`ban-chep-da-loc --kiem: lỗi — ${che(e?.message ?? e)}`);
    return 1;
  } finally {
    if (dc) await dc.end().catch(() => {});
    await xoaDb(tam).catch(() => err(`ban-chep-da-loc --kiem: chưa xoá được ${tam}`));
  }
}

// ───────────────────────── CLI ─────────────────────────

export function docDoiSo(argv) {
  const a = { che: "chep" };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--kiem") { a.che = "kiem"; a.tep = argv[++i]; }
    else if (x === "--khong-tu-dien") a.khongTuDien = true;
    else if (x === "--don") a.che = "don";
    else if (x === "--dich") a.dich = argv[++i];
    else if (x === "--ra") a.ra = argv[++i];
    else return { loi: `đối số lạ «${String(x).replace(/[^A-Za-z0-9_-]/g, "?")}»` };
  }
  if (a.khongTuDien && a.che !== "kiem") return { loi: "--khong-tu-dien chỉ đi với --kiem" };
  return a;
}

async function main() {
  const a = docDoiSo(process.argv.slice(2));
  if (a.loi) { console.error(`ban-chep-da-loc: ${a.loi}`); process.exitCode = 2; return; }
  const nguonUrl = process.env.DATABASE_URL ?? NGUON_MAC_DINH;
  if (a.che === "don") {
    const ds = await donHet();
    console.log(`đã xoá ${ds.length} DB oneinvest_m5_*${ds.length ? `: ${ds.join(", ")}` : ""}`);
    return;
  }
  if (a.che === "kiem") {
    process.exitCode = await chayKiem({ tep: a.tep && path.resolve(a.tep), khongTuDien: a.khongTuDien, nguonUrl });
    return;
  }
  const dich = a.dich ?? tenDich();
  // Ngắt giữa chừng (Ctrl-C, TERM) → xoá DB đích như mọi lỗi khác.
  const ngat = async () => { await xoaDb(dich).catch(() => {}); process.exit(130); };
  if (TEN_DICH_RE.test(dich)) { process.once("SIGINT", ngat); process.once("SIGTERM", ngat); }
  process.exitCode = await chayChep({ nguonUrl, dich, ra: a.ra ? path.resolve(a.ra) : RA_MAC_DINH });
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    // Lỗi ngoài luồng chính: không in stack (có thể mang câu SQL); chỉ thông điệp ngắn.
    console.error(`ban-chep-da-loc: lỗi — ${String(e?.message ?? e).slice(0, 300)}`);
    process.exit(1);
  });
}

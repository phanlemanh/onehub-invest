// import-s07-danh-muc.mjs — nạp raw S07 (nguồn `s07-danh-muc`, DATA-CONTRACT v9) vào `stg_s07_*` (migration 093).
// Làn thu (phiên thu thay ZCode, 11/11 — DAZ3). Chỉ ghi ba bảng `stg_s07_*` và dòng đánh dấu ở `airbnb_snapshots`.
//
// Dùng:
//   node import-s07-danh-muc.mjs <thư mục snapshot>…          nạp đúng các snapshot nêu tên (nạp lại không nhân dòng)
//   node import-s07-danh-muc.mjs <thư mục chứa snapshot>      (vd ../collector/snapshots/vn) nạp mọi snapshot S07 CHƯA
//                                                             có dấu trong airbnb_snapshots; snapshot nguồn khác bỏ qua
//
// - `project_list_page` → `stg_s07_project_card` (một dòng mỗi thẻ chính, 10 thẻ/trang)
// - `project_catalog`   → `stg_s07_project`      (một dòng mỗi trang dự án)
// - `project_sitemap`   → `stg_s07_sitemap_url`  (một dòng mỗi đường dẫn dự án)
// Khoá cả ba bảng là (snapshot_id, pj_id): nạp lại cùng snapshot ghi 0 dòng. Chọn bản mới nhất của một dự án là việc
// của bước đọc stg (làn Claude). DB chưa có bảng → in CHUA-AP-093, thoát 0, KHÔNG đánh dấu snapshot đã nạp.
// Tên miền nguồn (tầng A) không vào stg: mọi dòng đi qua `boMien`; còn sót thì dừng cả lượt, không ghi.
import { readFile, readdir } from "node:fs/promises";
import { existsSync, realpathSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { NGUON_S07, bocDuAn, bocSitemap, bocTheDanhSach, laPhienKhach, mienCua } from "./lib/s07-danh-muc.mjs";

export const SCHEMA_S07 = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // snapshot S07 trước khi SnapshotWriter nhận số phiên bản ghi 4
export const BANG_S07 = { the: "stg_s07_project_card", duAn: "stg_s07_project", sitemap: "stg_s07_sitemap_url" };
// Cùng khuôn mốc thời gian với import-airbnb.mjs (SNAPSHOT_TS_RE) — '__TEST'/'__e2e' không phải mốc.
const TS_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$/;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
// Tên miền nguồn là tầng A: không nằm trong mã. Mặc định suy từ chính snapshot; đặt S07_HOST (cấu hình local) để ép.
const MIEN_EP = (process.env.S07_HOST ?? "").trim().toLowerCase().replace(/^www\./, "") || null;

/** Tên thư mục là snapshot S07 hợp khuôn `<city>__s07-danh-muc__<mốc>`. */
export function laSnapshotS07(ten) {
  const p = String(ten).split("__");
  return p.length === 3 && p[0] !== "" && p[1] === NGUON_S07 && TS_RE.test(p[2]);
}

const boNull = (v) => {
  if (typeof v === "string") return v.replace(/\0/g, "");
  if (Array.isArray(v)) return v.map(boNull);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, boNull(x)]));
  return v;
};

export const COT_S07 = {
  the: ["pj_id", "list_page", "list_position", "path", "project_type_slug", "area_slug", "project_name",
    "development_status_raw", "unparsed_address", "land_area_raw", "number_of_units_total", "number_of_buildings_total",
    "builder_name_raw", "summary_raw", "image_paths"],
  duAn: ["pj_id", "path", "final_path", "project_type_slug", "area_slug", "project_name", "unparsed_address", "breadcrumb",
    "latitude", "longitude", "development_status_raw", "status_note_raw", "attributes", "land_area_raw",
    "number_of_units_raw", "number_of_buildings_total_raw", "builder_name_raw", "builder_ref", "builder_path", "legal_raw",
    "scale_raw", "price_range_raw", "amenities", "description_html", "faq", "child_pj_ids", "desc_link_pj_ids",
    "related_pj_ids", "image_paths", "og_image_path", "http_status"],
  sitemap: ["pj_id", "path", "project_type_slug", "area_slug"],
};
const JSONB = new Set(["image_paths", "breadcrumb", "attributes", "amenities", "faq"]);

/** Chèn theo lô; trả số dòng THẬT SỰ ghi (trùng khoá (snapshot_id, pj_id) → bỏ qua). */
async function chen(client, loai, dong, snapshotId) {
  const cot = COT_S07[loai];
  let ghi = 0;
  for (let i = 0; i < dong.length; i += 200) {
    const params = [];
    const values = dong.slice(i, i + 200).map((d) => {
      const v = [snapshotId, d.captured_at, ...cot.map((c) => (JSONB.has(c) ? JSON.stringify(d[c] ?? null) : d[c] ?? null))];
      const base = params.length;
      params.push(...v);
      return `(${v.map((_, j) => `$${base + j + 1}`).join(",")})`;
    });
    const r = await client.query(
      `INSERT INTO ${BANG_S07[loai]} (snapshot_id, captured_at, ${cot.join(", ")}) VALUES ${values.join(",")}
       ON CONFLICT (snapshot_id, pj_id) DO NOTHING`, params);
    ghi += r.rowCount ?? 0;
  }
  return ghi;
}

async function coDuBang(client) {
  const r = await client.query(
    `SELECT count(DISTINCT table_name)::int n FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = ANY($1)`, [Object.values(BANG_S07)]);
  return r.rows[0].n === Object.keys(BANG_S07).length;
}

/** Đọc + kiểm một snapshot; trả { manifest, items } hoặc { boQua: lý do }. Lỗi checksum / phiên bản lạ thì ném. */
async function docSnapshot(dir) {
  if (!laSnapshotS07(basename(dir))) return { boQua: "không đúng khuôn <city>__s07-danh-muc__<mốc thời gian>" };
  if (!existsSync(join(dir, "manifest.json"))) return { boQua: "mồ côi (thiếu manifest)" };
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  if (manifest.source !== NGUON_S07) return { boQua: `manifest.source=${manifest.source}` };
  if (!SCHEMA_S07.includes(manifest.schemaVersion)) throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ: ${dir}`);
  const items = [];
  for (const f of manifest.files) {
    const buf = await readFile(join(dir, f.name));
    if (createHash("sha256").update(buf).digest("hex") !== f.sha256) throw new Error(`checksum sai: ${f.name} (${dir})`);
    if (f.name.startsWith("items-")) items.push(...JSON.parse(gunzipSync(buf).toString("utf8")));
  }
  return { manifest, items };
}

const BO_RONG = () => ({ dang_nhap: 0, lap: 0, trang_rong: 0, the_khong_du_an: 0, kind_la: 0, nguon_khac: 0 });

/**
 * Bóc mọi item của một snapshot thành dòng ba bảng; phần bỏ đếm theo lý do (`bo`). Thuần (không DB) — export để test.
 * dang_nhap: item cờ đăng nhập true, hoặc trang danh sách / trang dự án thiếu cờ · lap: mã dự án lặp trong cùng snapshot ·
 * trang_rong: trang dự án không có nội dung hay đường dẫn không phải dự án · the_khong_du_an: thẻ không trỏ tới trang dự án ·
 * kind_la: kind ngoài ba kind của hợp đồng · nguon_khac: item của nguồn khác lẫn vào.
 */
export function dongCuaSnapshot(items, mienEp = null) {
  const ra = { the: [], duAn: [], sitemap: [], bo: BO_RONG(), mien: new Set() };
  // Tên miền dùng để BÓC: cấu hình local (S07_HOST) → canonical của một trang dự án trong cùng snapshot → link của chính item.
  // Tên miền dùng để SOÁT (ra.mien): MỌI miền suy được — cấu hình sai cũng không che được miền thật.
  const tuCanonical = items.map((it) => (it?.source === NGUON_S07 && typeof it?.payload?.canonical === "string" ? mienCua(it) : null)).find(Boolean) ?? null;
  for (const m of [mienEp, tuCanonical]) if (m) ra.mien.add(m);
  const thay = { the: new Set(), duAn: new Set(), sitemap: new Set() };
  for (const it of items) {
    if (it.source !== NGUON_S07) { ra.bo.nguon_khac++; continue; }
    if (!["project_list_page", "project_catalog", "project_sitemap"].includes(it.kind)) { ra.bo.kind_la++; continue; }
    if (!laPhienKhach(it)) { ra.bo.dang_nhap++; continue; }
    const cuaItem = mienCua(it);
    if (cuaItem) ra.mien.add(cuaItem);
    const mien = mienEp ?? tuCanonical ?? cuaItem;
    const luc = it.fetchedAt;
    const them = (loai, d) => {
      if (thay[loai].has(d.pj_id)) { ra.bo.lap++; return; }
      thay[loai].add(d.pj_id);
      ra[loai].push({ ...d, captured_at: luc });
    };
    if (it.kind === "project_list_page") {
      const r = bocTheDanhSach(it, mien);
      ra.bo.the_khong_du_an += r.khongMa;
      for (const d of r.the) them("the", d);
    } else if (it.kind === "project_catalog") {
      const d = bocDuAn(it, mien);
      if (!d) ra.bo.trang_rong++;
      else them("duAn", d);
    } else {
      const r = bocSitemap(it, mien);
      ra.bo.lap += r.lap;
      for (const d of r.duAn) them("sitemap", d);
    }
  }
  return ra;
}

/** Rào tầng A: còn tên miền nguồn trong bất kỳ dòng nào thì ném — không ghi gì của snapshot đó. */
export function kiemKhongMien(ra) {
  for (const mien of ra.mien) {
    for (const loai of ["the", "duAn", "sitemap"]) {
      for (const d of ra[loai]) {
        if (JSON.stringify(d).toLowerCase().includes(mien)) throw new Error(`S07: còn tên miền nguồn trong dòng ${BANG_S07[loai]} pj_id=${d.pj_id} — dừng, không ghi`);
      }
    }
  }
}

async function main() {
  const JSON_RA = process.argv.includes("--json");
  const args = process.argv.slice(2).filter((a) => a !== "--json");
  if (!args.length) {
    console.error("thiếu tham số: node import-s07-danh-muc.mjs <snapshot-dir | thư mục chứa snapshot>…");
    process.exit(1);
  }
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    if (!(await coDuBang(client))) {
      console.log(`CHUA-AP-093: thiếu bảng ${Object.values(BANG_S07).join(" / ")} (migration 093 chưa áp) — snapshot S07 bỏ qua, KHÔNG đánh dấu đã nạp`);
      return;
    }
    // Gom danh sách snapshot: thư mục nêu tên nạp luôn; thư mục cha thì chỉ lấy snapshot S07 chưa có dấu.
    const viec = [];
    let daNap = 0;
    for (const a of args) {
      if (laSnapshotS07(basename(a))) { viec.push(a); continue; }
      if (!existsSync(a) || !statSync(a).isDirectory()) { console.warn(`bỏ qua (không phải thư mục snapshot S07): ${a}`); continue; }
      const con = (await readdir(a)).filter(laSnapshotS07).sort();
      if (!con.length) { console.warn(`bỏ qua (không phải snapshot S07, không chứa snapshot S07): ${a}`); continue; }
      const r = await client.query(`SELECT snapshot_id FROM airbnb_snapshots WHERE snapshot_id = ANY($1)`, [con]);
      const co = new Set(r.rows.map((x) => x.snapshot_id));
      daNap += co.size;
      viec.push(...con.filter((c) => !co.has(c)).map((c) => join(a, c)));
    }
    const tong = { snapshot: 0, the: 0, duAn: 0, sitemap: 0, boSnapshot: 0, bo: BO_RONG() };
    for (const dir of viec) {
      const s = await docSnapshot(dir);
      if (s.boQua) { console.warn(`bỏ qua snapshot ${s.boQua}: ${dir}`); tong.boSnapshot++; continue; }
      const ra = dongCuaSnapshot(boNull(s.items), MIEN_EP);
      kiemKhongMien(ra);
      await client.query("BEGIN");
      try {
        await client.query(
          `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (snapshot_id) DO UPDATE SET manifest = EXCLUDED.manifest`,
          [s.manifest.snapshotId, s.manifest.city, s.manifest.source, s.manifest.finishedAt, JSON.stringify(s.manifest)]);
        tong.the += await chen(client, "the", ra.the, s.manifest.snapshotId);
        tong.duAn += await chen(client, "duAn", ra.duAn, s.manifest.snapshotId);
        tong.sitemap += await chen(client, "sitemap", ra.sitemap, s.manifest.snapshotId);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK").catch(() => {});
        throw e;
      }
      tong.snapshot++;
      for (const k of Object.keys(tong.bo)) tong.bo[k] += ra.bo[k];
    }
    console.log(
      `S07 đã nạp: ${tong.snapshot} snapshot (${daNap} đã có dấu — không đọc lại, ${tong.boSnapshot} bỏ) · ${tong.the} thẻ danh sách · ${tong.duAn} trang dự án · ${tong.sitemap} đường dẫn sitemap`
      + ` · bỏ: ${tong.bo.dang_nhap} phiên đăng nhập hoặc thiếu cờ, ${tong.bo.lap} lặp trong snapshot, ${tong.bo.trang_rong} trang dự án rỗng, ${tong.bo.the_khong_du_an} thẻ không trỏ dự án, ${tong.bo.kind_la} kind lạ, ${tong.bo.nguon_khac} nguồn khác`);
    if (JSON_RA) console.log(JSON.stringify({ snapshot: tong.snapshot, da_co_dau: daNap, bo_snapshot: tong.boSnapshot, the: tong.the, du_an: tong.duAn, sitemap: tong.sitemap, bo: tong.bo }));
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}

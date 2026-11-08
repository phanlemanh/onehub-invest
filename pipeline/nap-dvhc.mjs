// nap-dvhc.mjs — PX1 danh-ba-phuong-xa-toan-quoc: nạp danh bạ 3.321 xã, phường, đặc khu (Cục Thống kê, QĐ 19/2025)
// vào areas dưới 34 thị trường, gắn mã vào khu vực con đang có mà GIỮ id/tên/ranh giới, chèn xã còn thiếu, ghi
// 10.033 bí danh xã cũ vào area_aliases. Một giao dịch, khoá advisory 56084; chạy lại không đổi dòng nào.
// Cần migration 084. Xong thì chạy reassign-areas rồi 300 + 400 (pipeline/CLAUDE.md).
//   node nap-dvhc.mjs                 # nạp
//   node nap-dvhc.mjs --thu           # chạy rồi ROLLBACK, in số
//   node nap-dvhc.mjs --data <thư mục>  # thư mục dữ liệu khác (test băm lệch)
// Mã thoát: 0 xong · 1 dừng có tên (thiếu thị trường, tên lệch, khớp hai khu vực, chưa áp 084) · 2 dữ liệu lệch băm.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import {
  DATA_DIR, demKhoaXaCu, docDanhBa, idXa, khopXa, slugTrungTrongTinh, thiTruongCuaTinh,
} from "./lib/dvhc.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const KHOA_NAP = 56084;

function dung(msg) {
  const e = new Error(msg);
  e.code = "PX1_DUNG";
  return e;
}

/**
 * Thân bộ nạp — người gọi giữ giao dịch (CLI bọc BEGIN…COMMIT, test bọc BEGIN…ROLLBACK).
 * @param {import("pg").Client} client
 * @param {{ dir?: string, log?: { log: Function, warn: Function } }} [o]
 */
export async function napDvhc(client, { dir = DATA_DIR, log = console } = {}) {
  const D = docDanhBa(dir); // lệch băm → ném BAM_LECH trước mọi lần ghi
  const { rows: [co] } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'areas' AND column_name = 'admin_code')
            AND to_regclass('area_aliases') IS NOT NULL AS ok`,
  );
  if (!co.ok) throw dung("PX1 chưa áp 084 — thiếu areas.admin_code hoặc area_aliases");

  // ---- 1. 34 thị trường ----
  const { rows: mk } = await client.query(
    `SELECT id, name FROM areas WHERE region_type = 'market' AND country_code = 'vn'`,
  );
  const thiTruong = new Map(mk.map((r) => [r.id, r]));
  for (const t of D.tinh) {
    const r = thiTruong.get(thiTruongCuaTinh(t.ma));
    if (!r) throw dung(`PX1 thiếu thị trường ${t.ma}`);
    if (r.name.normalize("NFC") !== t.ten.normalize("NFC")) throw dung(`PX1 tên thị trường lệch ${t.ma}`);
  }
  let doi = 0;
  for (const t of D.tinh) {
    const { rowCount } = await client.query(
      `UPDATE areas SET admin_code = $2 WHERE id = $1 AND admin_code IS DISTINCT FROM $2`,
      [thiTruongCuaTinh(t.ma), t.ma],
    );
    doi += rowCount;
  }

  // ---- 2. Xã: khớp khu vực con đang có, chèn xã còn thiếu ----
  const markets = D.tinh.map((t) => thiTruongCuaTinh(t.ma));
  const { rows: con } = await client.query(
    `SELECT id, parent_id, name, meta->>'source' AS source FROM areas
     WHERE region_type = 'submarket' AND parent_id = ANY($1::text[])`,
    [markets],
  );
  const { rows: tatCa } = await client.query(`SELECT id FROM areas`);
  const idDaCo = new Set(tatCa.map((r) => r.id));
  const theoTinh = [];
  const khongKhop = [];
  for (const t of D.tinh) {
    const market = thiTruongCuaTinh(t.ma);
    const xas = D.xa.filter((x) => x.maTinh === t.ma);
    const conT = con.filter((c) => c.parent_id === market);
    const trung = slugTrungTrongTinh(xas);
    const daKhop = new Set();
    let khopSan = 0, chenMoi = 0;
    for (const x of xas) {
      const k = khopXa(x, conT);
      if (k?.loi) throw dung(`PX1 khớp hai khu vực: ${x.ma} (${k.ids.join(", ")})`);
      if (k) {
        daKhop.add(k.id);
        if (conT.find((c) => c.id === k.id)?.source !== "dvhc") khopSan++;
        const { rowCount } = await client.query(
          `UPDATE areas SET admin_code = $2, meta = meta || jsonb_build_object('loai', $3::text)
           WHERE id = $1 AND (admin_code IS DISTINCT FROM $2 OR meta->>'loai' IS DISTINCT FROM $3)`,
          [k.id, x.ma, x.loai],
        );
        doi += rowCount;
        continue;
      }
      const id = idXa(x, market, trung, idDaCo);
      idDaCo.add(id);
      const { rowCount } = await client.query(
        `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta, admin_code)
         VALUES ($1, $2, 'submarket', $3, 'vn', jsonb_build_object('source', 'dvhc', 'loai', $4::text), $5)
         ON CONFLICT (id) DO NOTHING`,
        [id, market, x.ten, x.loai, x.ma],
      );
      doi += rowCount;
      chenMoi++;
    }
    for (const c of conT) if (!daKhop.has(c.id) && c.source !== "dvhc") khongKhop.push({ id: c.id, name: c.name });
    theoTinh.push({ market, xa: xas.length, khopSan, chenMoi, coRanhGioi: 0 });
  }
  const { rows: rg } = await client.query(
    `SELECT parent_id, count(*) FILTER (WHERE geom IS NOT NULL)::int AS n FROM areas
     WHERE region_type = 'submarket' AND admin_code IS NOT NULL GROUP BY 1`,
  );
  for (const r of rg) {
    const t = theoTinh.find((x) => x.market === r.parent_id);
    if (t) t.coRanhGioi = r.n;
  }

  // ---- 3. Bí danh xã cũ ----
  const ban = D.xaCu.map((r) => ({
    old_code: r.ma, name: r.ten, kind: r.loai ?? null, old_district: r.huyenCu, old_district_code: r.maHuyenCu,
    old_province_code: r.maTinhCu, province_code: r.maTinh, targets: r.vao, split: r.vao.length > 1,
  }));
  const { rowCount: doiBiDanh } = await client.query(
    `INSERT INTO area_aliases (old_code, name, kind, old_district, old_district_code, old_province_code, province_code,
                               targets, split, source_sha)
     SELECT j.old_code, j.name, j.kind, j.old_district, j.old_district_code, j.old_province_code, j.province_code,
            ARRAY(SELECT jsonb_array_elements_text(j.targets)), j.split, $2
     FROM jsonb_to_recordset($1::jsonb) AS j(old_code text, name text, kind text, old_district text,
          old_district_code text, old_province_code text, province_code text, targets jsonb, split boolean)
     ON CONFLICT (old_code) DO UPDATE SET
       name = EXCLUDED.name, kind = EXCLUDED.kind, old_district = EXCLUDED.old_district,
       old_district_code = EXCLUDED.old_district_code, old_province_code = EXCLUDED.old_province_code,
       province_code = EXCLUDED.province_code, targets = EXCLUDED.targets, split = EXCLUDED.split,
       source_sha = EXCLUDED.source_sha, updated_at = now()
     WHERE (area_aliases.name, area_aliases.kind, area_aliases.old_district, area_aliases.old_district_code,
            area_aliases.old_province_code, area_aliases.province_code, area_aliases.targets, area_aliases.split,
            area_aliases.source_sha)
       IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.kind, EXCLUDED.old_district, EXCLUDED.old_district_code,
            EXCLUDED.old_province_code, EXCLUDED.province_code, EXCLUDED.targets, EXCLUDED.split, EXCLUDED.source_sha)`,
    [JSON.stringify(ban), D.nguon.sha256["xa-cu.json"]],
  );
  doi += doiBiDanh;

  const out = {
    doi, theoTinh, khongKhop, biDanh: D.xaCu.length, tach: ban.filter((b) => b.split).length, khoa: demKhoaXaCu(D.xaCu),
  };
  for (const t of theoTinh)
    log.log(`${t.market}: ${t.xa} xã · khớp sẵn ${t.khopSan} · chèn mới ${t.chenMoi} · có ranh giới ${t.coRanhGioi}`);
  for (const k of khongKhop) log.log(`  không khớp xã nào (giữ nguyên, không mã): ${k.id} ${k.name}`);
  log.log(`bí danh: ${out.biDanh} xã cũ · tách ${out.tach} · khoá tên một đích ${out.khoa.motDich}, tách ${out.khoa.tach}, trùng tên ${out.khoa.trungTen}`);
  log.log(`doi=${doi}`);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const thu = args.includes("--thu");
  const iData = args.indexOf("--data");
  const dir = iData >= 0 ? args[iData + 1] : DATA_DIR;
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [KHOA_NAP]);
    await napDvhc(client, { dir });
    await client.query(thu ? "ROLLBACK" : "COMMIT");
    if (thu) console.log("--thu: đã ROLLBACK, DB không đổi");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e.message);
    process.exitCode = e.code === "BAM_LECH" ? 2 : e.code === "PX1_DUNG" ? 1 : 1;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

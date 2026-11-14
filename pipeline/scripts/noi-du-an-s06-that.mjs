#!/usr/bin/env node
// noi-du-an-s06-that.mjs — hồ sơ _acceptance/ma-du-an-s06-thanh-nut (DA32) E9 / AC-9: chạy trọn thẻ luật S06 trên bản chép DB
// máy thu (DB của riêng lượt, db/db-thu.sh oneinvest_suite_* --chay; DB ấy xoá khi lệnh dừng): áp 100, dựng thẻ ra evidence,
// đếm độc lập, áp đúng băm, ba câu kiểm bất biến, đếm view khớp đếm độc lập, soát thẻ không lộ mã nguồn.
//   --doi-chung   phá bộ đếm độc lập lệch 1 → phải đỏ «tong-lech» (chứng phép so có răng)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import pg from "pg";

import { dungTheLuat, apTheLuat, kiemHaiNut, kiemLechTinh, kiemThieuTrangThai } from "../noi-du-an-s06.mjs";
import { dungThe } from "../lib/noi-du-an-s06-lop.mjs";

const DB_URL = process.env.DATABASE_URL ?? "";
if (!/\/oneinvest_suite_[a-z0-9_]+$/.test(DB_URL)) {
  console.error("noi-du-an-s06-that: cần DATABASE_URL trỏ DB của riêng lượt oneinvest_suite_*, không chạy trên oneinvest");
  process.exit(2);
}
const DOI_CHUNG = process.argv.includes("--doi-chung");
const GOC = join(import.meta.dirname, "..", "..");
const RA = join(GOC, "_acceptance/ma-du-an-s06-thanh-nut/evidence");

// Đếm độc lập — viết lại từ đầu, không dùng SQL_DOC_MA của lệnh.
const DEM_DOC_LAP = `
  SELECT count(*)::int AS ma, coalesce(sum(n), 0)::int AS tin FROM (
    SELECT s.payload ->> 'projectid' AS ma, count(*) AS n
      FROM sale_offer_records r JOIN stg_chotot_ads s ON s.list_id::text = r.originating_system_key
     WHERE r.source = 'S06' AND r.property_type = 'apartment' AND r.retired_at IS NULL AND r.superseded_by IS NULL
       AND coalesce(s.payload ->> 'projectid', '') <> ''
     GROUP BY 1 HAVING count(*) >= 10) x`;
const DEM_NHOM_GIA = `
  SELECT count(*)::int FROM (
    SELECT s.payload ->> 'projectid' AS ma
      FROM sale_offer_records r JOIN stg_chotot_ads s ON s.list_id::text = r.originating_system_key
     WHERE r.source = 'S06' AND r.property_type = 'apartment' AND r.retired_at IS NULL AND r.superseded_by IS NULL
       AND coalesce(s.payload ->> 'projectid', '') <> '' AND r.price_perm2 IS NOT NULL
     GROUP BY 1 HAVING count(*) FILTER (WHERE r.kind = 'sale') >= 10 OR count(*) FILTER (WHERE r.kind <> 'sale') >= 10) x`;
const DEM_VIEW_DOC_LAP = `
  SELECT count(*)::int FROM sale_offer_records r JOIN stg_chotot_ads s ON s.list_id::text = r.originating_system_key
    JOIN registry_aliases a ON a.source = 'S06' AND a.kind = 'ma_nguon' AND a.retired_at IS NULL
     AND a.value = 'du_an/' || (s.payload ->> 'projectid')
   WHERE r.source = 'S06' AND r.property_type = 'apartment' AND r.retired_at IS NULL AND r.superseded_by IS NULL`;

const loi = [];
const kiem = (dk, nhan, chiTiet) => { if (!dk) loi.push(`${nhan}: ${chiTiet}`); };

const c = new pg.Client({ connectionString: DB_URL });
await c.connect();
try {
  await c.query(readFileSync(join(GOC, "db/migrations/100_ma_du_an_s06_nut.sql"), "utf8"));
  const the = await dungTheLuat(c);
  mkdirSync(RA, { recursive: true });
  writeFileSync(join(RA, "the-luat-s06.md"), the.markdown);
  const tinThe = Object.values(the.tong).reduce((s, t) => s + t.tin, 0);
  console.log(`thẻ: ${the.ds.length} mã ≥10 tin, ${tinThe} tin, băm ${the.bam}`);
  for (const [k, t] of Object.entries(the.tong)) console.log(`  ngả ${k}: ${t.ma} mã, ${t.tin} tin`);

  const dl = (await c.query(DEM_DOC_LAP)).rows[0];
  if (DOI_CHUNG) dl.ma += 1;
  console.log(`đếm độc lập: ${dl.ma} mã, ${dl.tin} tin · định nghĩa nhóm giá (đối chiếu số 268 của lời hàng): ${(await c.query(DEM_NHOM_GIA)).rows[0].count} mã`);
  kiem(dl.ma === the.ds.length && dl.tin === tinThe, "tong-lech", `thẻ ${the.ds.length}/${tinThe} ≠ độc lập ${dl.ma}/${dl.tin}`);
  const tongLop = the.ds.reduce((m, d) => ((m[d.kq.status] = (m[d.kq.status] ?? 0) + d.soTin), m), {});
  for (const [k, t] of Object.entries(the.tong)) kiem(tongLop[k] === t.tin, "tong-lech", `ngả ${k}: ${tongLop[k]} ≠ ${t.tin}`);

  // Thẻ không lộ mã nguồn: thay mọi mã bằng mã giả thì phần thân (trừ dòng băm) y hệt.
  const thuTu = new Map([...the.ds.map((d) => d.ma)].sort().map((m, i) => [m, `zz${String(i).padStart(6, "0")}`]));
  const gia = dungThe(the.ds.map((d) => ({ ...d, ma: thuTu.get(d.ma) }))); // mã giả giữ thứ tự sắp của mã thật
  kiem(gia.markdown.replace(/băm: .*/, "") === the.markdown.replace(/băm: .*/, ""), "lo-ma-nguon", "thẻ phụ thuộc mã nguồn");

  const ap = await apTheLuat(c, { bam: the.bam, nguoi: "noi-du-an-s06-that" });
  console.log(`áp: luật ${ap.rule_id}`);
  for (const [ten, fn] of [["kiemHaiNut", kiemHaiNut], ["kiemLechTinh", kiemLechTinh], ["kiemThieuTrangThai", kiemThieuTrangThai]]) {
    const r = await fn(c);
    console.log(`${ten}: ${r.length}`);
    kiem(r.length === 0, ten, r.slice(0, 5).map((x) => x.ma).join(","));
  }
  const v = (await c.query("SELECT count(*)::int n FROM s06_offer_project")).rows[0].n;
  const vd = (await c.query(DEM_VIEW_DOC_LAP)).rows[0].count;
  console.log(`tin đọc được dự án qua bí danh: view ${v}, đếm độc lập ${vd}`);
  kiem(v === vd && v > 0, "view-lech", `${v} ≠ ${vd}`);
  const haiNut = (await c.query("SELECT count(*)::int n FROM (SELECT offer_id FROM s06_offer_project GROUP BY 1 HAVING count(DISTINCT node_id) > 1) x")).rows[0].n;
  kiem(haiNut === 0, "view-lech", `${haiNut} tin ra hai nút`);
} finally {
  await c.end();
}

if (loi.length) {
  for (const l of loi) console.error(l);
  if (DOI_CHUNG && loi.every((l) => l.startsWith("tong-lech"))) console.error("ĐỐI CHỨNG ĐỎ ĐÚNG: tong-lech");
  process.exit(1);
}
if (DOI_CHUNG) { console.error("doi-chung: phá bộ đếm mà không đỏ — phép so không có răng"); process.exit(3); }
console.log("ĐẠT");

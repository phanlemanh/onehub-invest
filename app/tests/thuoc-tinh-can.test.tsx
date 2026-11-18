// thuoc-tinh-can.test.tsx — hồ sơ _acceptance/thuoc-tinh-can-s16 (DA40), ca «TTC-AC-9», «TTC-AC-10» phần lớp đọc
// (app/src/lib/ops/thuoc-tinh-can.ts). DB thử oneinvest_dbv_ttca_<pid> dựng từ db/migrations (pipeline/scripts/db-thu-dbv.mjs),
// xoá khi xong; phát biểu do chính lệnh pipeline/scripts/thuoc-tinh-can-s16.mjs ghi (bên ghi thật); số đối chiếu bằng SQL
// viết riêng trong tệp này, không import lớp đọc. Chạy: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { taoDbThu, xoaDbThu } from "../../pipeline/scripts/db-thu-dbv.mjs"
import { ghi, tinh } from "../../pipeline/scripts/thuoc-tinh-can-s16.mjs"
import type * as Lop from "../src/lib/ops/thuoc-tinh-can"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TEP_LOP = join(APP, "src/lib/ops/thuoc-tinh-can.ts")
const TEN = `oneinvest_dbv_ttca_${process.pid}`
const TEN_CU = `oneinvest_dbv_ttcb_${process.pid}`
const DA = "q-da"
const B1 = `bld_${"8".padStart(26, "0")}`
const B2 = `bld_${"9".padStart(26, "0")}`
const can = (n: number) => `unt_${String(800 + n).padStart(26, "0")}`
let db: pg.Client
let lop: typeof Lop

before(async () => {
  db = new pg.Client({ connectionString: await taoDbThu(TEN) })
  await db.connect()
  lop = await import(pathToFileURL(TEP_LOP).href)
  const nut = (await db.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q DA', 'q-da-ttca', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`)).rows[0].id
  for (const b of [B1, B2]) {
    await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                    VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [b, nut])
  }
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')`, [B1, `${DA}/TOA1`])
  for (const [n, ma, b] of [[1, "QA1", B1], [2, "QA2", B1], [3, "QA3", B1], [4, "QA4", B1], [5, "QB1", B2]] as const) {
    await db.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, '10', $1, 'xac_minh')`, [can(n), b])
    if (b === B1) await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')`, [can(n), `${DA}/${ma}`])
  }
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ('q__ttca', 'vn', 'S16', '2026-11-18T01:00:00Z', '{}')`)
  const dong = [
    ["T1", "QA1", "HIGH_RISE", "APARTMENT", 2, 1, "", "NE_NW", 2_000_000_000, 68.5, 74.9],
    ["T1", "QA2", "LOW_RISE", "SHOP_HOUSE", 0, 0, "SW", "", 0, 90, 95],
    ["T1", "QA3", "HIGH_RISE", "UNDEF", 1, 0, "", "OTHER", 1_500_000_000, 45, 50],
    ["T1", "QA5", "HIGH_RISE", "APARTMENT", 2, 1, "", "SE", 0, 60, 65],
    ["T1", "QA6", "HIGH_RISE", "APARTMENT", 2, 1, "", "SE", 0, 60, 65],
    ["T2", "QA6", "HIGH_RISE", "APARTMENT", 2, 1, "", "SE", 0, 61, 66],
    ["T1", "QA8", "HIGH_RISE", "APARTMENT", 2, 1, "", "SE", 0, 60, 65],
  ] as const
  for (const [i, d] of dong.entries()) {
    await db.query(`INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, toa, ma_can, dong, height_type, property_type, bedroom, bathroom,
        direction, balcony_direction, sale_price, area_using, area_building) VALUES ('q__ttca', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [DA, d[0], d[1], i, d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10]])
  }
  // QA8: không có căn, một dòng trong bảng nạp, nhưng mơ hồ toà theo v_s16_can (hai toà) → không tính vào «chưa vào danh bạ»
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q__ttca_can', 'vn', 'S16', '{}')`)
  for (const toa of ["ZZ1", "ZZ2"]) {
    await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha) VALUES ('q__ttca_can', $1, 'K', $2, $2, '10', 'QA8', 1)`, [DA, toa])
  }
  const kq = await tinh(db)
  await db.query("BEGIN")
  await ghi(db, kq.phat, kq.observed_at, "ttca")
  await db.query("COMMIT")
})
after(async () => {
  await db?.end().catch(() => {})
  await xoaDbThu(TEN)
  await xoaDbThu(TEN_CU)
})

test("TTC-AC-9 lớp đọc trả đúng giá trị của bộ phân xử và view giá cho từng căn; căn không có thuộc tính không có dòng", async () => {
  const kq = await lop.docThuocTinhCan([B1, B2], db)
  if (!kq.ok) return assert.fail(`TTC-AC-9 lớp đọc lỗi: ${kq.loi}`)
  const doc = (await db.query(`SELECT v.unit_key, v.living_area::float8 tt, v.building_area_total::float8 tim, v.lot_size_area::float8 dat, v.bedrooms_total pn,
      v.bathrooms_total_integer wc, v.direction_faces h, v.property_sub_type lh, g.list_price::float8 gia, g.gia_m2_thong_thuy::float8 m2
      FROM v_unit_thuoc_tinh v LEFT JOIN v_s16_gia_cdt g USING (unit_key) ORDER BY 1`)).rows
  assert.deepEqual([...kq.data.keys()].sort(), [can(1), can(2), can(3)], "TTC-AC-9 tập căn có thuộc tính")
  for (const r of doc) {
    const x: Lop.ThuocTinhCan = kq.data.get(r.unit_key)!
    assert.deepEqual([x.thongThuy, x.timTuong, x.datDat, x.phongNgu, x.wc, x.huong, x.loaiHinh, x.giaCdt, x.giaM2ThongThuy],
      [r.tt, r.tim, r.dat, r.pn, r.wc, r.h ?? [], r.lh, r.gia, r.m2], `TTC-AC-9 giá trị lệch ở ${r.unit_key}`)
    assert.deepEqual(x.nguon, ["S16"], `TTC-AC-9 nguồn ở ${r.unit_key}`)
    assert.equal(x.lanThu, "2026-11-18T01:00:00.000Z", `TTC-AC-9 mốc thu ở ${r.unit_key}`)
  }
  // ba trường hợp biên của lõi tới tận lớp đọc: căn góc hai hướng, shophouse = commercial, PN/WC 0 = trống
  assert.deepEqual(kq.data.get(can(1))!.huong, ["northeast", "northwest"], "TTC-AC-9 căn góc")
  assert.equal(kq.data.get(can(2))!.loaiHinh, "commercial", "TTC-AC-9 shophouse")
  assert.deepEqual([kq.data.get(can(2))!.datDat, kq.data.get(can(2))!.timTuong], [95, null], "TTC-AC-9 thấp tầng: đất thay tim tường")
  assert.equal(kq.data.get(can(2))!.phongNgu, null, "TTC-AC-9 PN 0 thành giá trị")
  assert.equal(kq.data.get(can(3))!.loaiHinh, null, "TTC-AC-9 UNDEF thành giá trị")
})

/** Bản sao lớp đọc có một chỗ phá, nạp qua tsx từ thư mục tạm. */
async function lopPha(tu: string, sang: string): Promise<typeof Lop> {
  const src = readFileSync(TEP_LOP, "utf8")
  assert.ok(src.includes(tu), `TTC chỗ phá không còn trong lớp đọc: ${tu}`)
  const dir = mkdtempSync(join(tmpdir(), "ttca-pha-"))
  const tep = join(dir, "lop.ts")
  writeFileSync(tep, src.replace(tu, sang).replace('from "../db"', `from ${JSON.stringify(pathToFileURL(join(APP, "src/lib/db.ts")).href)}`))
  try { return await import(pathToFileURL(tep).href) } finally { rmSync(dir, { recursive: true, force: true }) }
}

const DEM_PHU = `SELECT
  (SELECT count(*) FROM units WHERE building_key = $1 AND status = 'active')::int AS y,
  (SELECT count(DISTINCT subject_key) FROM field_assertions f JOIN units u ON u.unit_key = f.subject_key
    WHERE u.building_key = $1 AND f.resource_name = 'Unit' AND f.retracted_at IS NULL)::int AS x,
  (SELECT count(*) FROM units u WHERE u.building_key = $1 AND EXISTS (
     SELECT 1 FROM stg_s16_can_chi_tiet c JOIN registry_aliases a ON a.value = c.du_an || '/' || upper(c.ma_can) AND a.object_key = u.unit_key
      WHERE c.sale_price > 0))::int AS z`

test("TTC-AC-10 ô phủ bằng lệnh đếm độc lập; dự án không có toà S16 → không nguồn; chưa áp 113 → không nguồn; lỗi bọc lại", async () => {
  const phu = await lop.docPhuThuocTinh([B1], db)
  assert.ok(phu.ok && phu.data.trangThai === "co", "TTC-AC-10 ô phủ không ra trạng thái có")
  const d = (await db.query(DEM_PHU, [B1])).rows[0]
  // N độc lập: mã một toà trong bảng nạp của dự án mà không có bí danh căn (QA5; QA6 ở hai toà không tính)
  const n = (await db.query(`SELECT count(*)::int n FROM (SELECT ma_can FROM stg_s16_can_chi_tiet WHERE du_an = $1 GROUP BY ma_can
      HAVING count(DISTINCT toa) = 1) k WHERE NOT EXISTS (SELECT 1 FROM registry_aliases a WHERE a.value = $1 || '/' || k.ma_can AND a.object_key LIKE 'unt%')
      AND NOT EXISTS (SELECT 1 FROM v_s16_can m WHERE m.mo_ho AND m.du_an = $1 AND m.ma_can = k.ma_can)`, [DA])).rows[0].n
  assert.deepEqual({ y: phu.data.trongDanhBa, x: phu.data.coThuocTinh, z: phu.data.coGia, n: phu.data.chuaVaoDanhBa }, { ...d, n }, "TTC-AC-10 ô phủ lệch đếm độc lập")
  assert.deepEqual({ ...d, n }, { y: 4, x: 3, z: 2, n: 1 }, "TTC-AC-10 fixture đổi")
  const khong = await lop.docPhuThuocTinh([B2], db)
  assert.ok(khong.ok && khong.data.trangThai === "khong-nguon", "TTC-AC-10 dự án không có toà S16")
  const cu = new pg.Client({ connectionString: await taoDbThu(TEN_CU, { hetSo: 110 }) })
  await cu.connect()
  try {
    const p = await lop.docPhuThuocTinh([B1], cu)
    const t = await lop.docThuocTinhCan([B1], cu)
    assert.ok(p.ok && p.data.trangThai === "khong-nguon" && t.ok && t.data.size === 0, "TTC-AC-10 DB chưa áp 113 phải là không nguồn, không lỗi")
  } finally { await cu.end() }
  process.env.ONEHUB_TTC_LOI_THU = "1"
  try {
    const l1 = await lop.docPhuThuocTinh([B1], db)
    const l2 = await lop.docThuocTinhCan([B1], db)
    assert.ok(!l1.ok && !l2.ok, "TTC-AC-9 lỗi đọc không được bọc thành giá trị lỗi")
  } finally { delete process.env.ONEHUB_TTC_LOI_THU }
})

test("TTC-AC-10 chiều đỏ: bỏ điều kiện một toà, hay luật mơ hồ toà, khi đếm «chưa vào danh bạ» → ô N lệch đếm độc lập", async () => {
  const pha = await lopPha("GROUP BY c.du_an, upper(btrim(c.ma_can)) HAVING count(DISTINCT c.toa) = 1", "GROUP BY c.du_an, upper(btrim(c.ma_can))")
  const p = await pha.docPhuThuocTinh([B1], db)
  assert.ok(p.ok && p.data.trangThai === "co")
  assert.notEqual(p.data.chuaVaoDanhBa, 1, "TTC-AC-10 lớp đọc phá vẫn ra N đúng — phép đếm không phân biệt")
  const pha2 = await lopPha("WHERE b.value IS NULL AND m.gia_tri IS NULL", "WHERE b.value IS NULL")
  const p2 = await pha2.docPhuThuocTinh([B1], db)
  assert.ok(p2.ok && p2.data.trangThai === "co" && p2.data.chuaVaoDanhBa === 2, "TTC-AC-10 bỏ luật mơ hồ toà mà N không đổi — phép đếm không phân biệt")
})

// ---- Mức màn (TTC-AC-9, AC-10): render tĩnh component thật với dữ liệu lớp đọc trả về ----
const ttMau = (o: Partial<Lop.ThuocTinhCan> = {}): Lop.ThuocTinhCan => ({ unitKey: can(1), thongThuy: 68.5, timTuong: 74.9, datDat: null, phongNgu: 2, wc: 1,
  huong: ["northeast", "northwest"], loaiHinh: "apartment", giaCdt: 2_000_000_000, giaM2ThongThuy: 29_197_080, nguon: ["S16"], lanThu: "2026-11-18T01:00:00.000Z", ...o })
const hang = (k: string, tt: Lop.ThuocTinhCan | null | undefined) => ({ key: k, laCan: true, ten: k, phu: "", bac: "xac_minh", nguon: ["S16"], soTruc: null, soCan: null,
  ...(tt === undefined ? {} : { thuocTinh: tt }) })

test("TTC-AC-9 lưới toà: căn có thuộc tính hiện số, hướng, loại hình, giá, nhãn S16 + mốc thu; căn chưa có hiện nhãn; thấp tầng hiện sàn + đất", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { DuAnToaGrid } = await import("../src/components/ops/registry/du-an-toa-grid")
  const { fmtVnDate } = await import("../src/lib/format")
  const html = renderToStaticMarkup(<DuAnToaGrid rows={[hang("C1", ttMau()), hang("C2", null), hang("C3", ttMau({ datDat: 84, thongThuy: 285, timTuong: null, loaiHinh: "house", huong: ["southwest"], giaCdt: null, giaM2ThongThuy: null })), hang("C4", undefined)]} />)
  for (const chu of ["68,5 m²", "Tim tường 74,9 m²", "Đông Bắc · Tây Bắc", "Căn hộ", "2 tỷ", "29,2 tr/m² thông thuỷ", `Thu ${fmtVnDate("2026-11-18T01:00:00.000Z")}`, "Chưa có thuộc tính", "285 m² sàn", "Đất 84 m²", "Nhà riêng", "Tây Nam"]) {
    assert.ok(html.includes(chu), `TTC-AC-9 lưới thiếu «${chu}»`)
  }
  assert.equal((html.match(/Chưa có thuộc tính/g) ?? []).length, 1, "TTC-AC-9 nhãn «Chưa có thuộc tính» chỉ ở căn null (C4 không đọc thì trống)")
  assert.match(html, /data-thuoc-tinh="nguon"[\s\S]*?S16/, "TTC-AC-9 thiếu nhãn nguồn S16 ở ô thuộc tính")
})

test("TTC-AC-9, AC-10 trang dự án: ô phủ ba trạng thái; lỗi đọc giữ lưới và hiện «Thử lại»; không lỗi thì không có cảnh báo", async () => {
  const { renderToStaticMarkup } = await import("react-dom/server")
  const { DuAnView } = await import("../src/components/ops/registry/du-an-view")
  const goc = { ten: "Q DA", biDanh: [], bac: "xac_minh", tinh: null, nguon: ["S16"], maNoi: [], soPhanKhu: 0, soToa: 1, toaChuaCan: 0, soTruc: 0, soCan: 4, tin: {}, rows: [hang("C1", ttMau())] }
  const co = renderToStaticMarkup(<DuAnView {...goc} phuThuocTinh={{ trangThai: "co", trongDanhBa: 38135, coThuocTinh: 37589, coGia: 1850, chuaVaoDanhBa: 2, lanThu: "2026-11-18T01:00:00.000Z" }} loiThuocTinh={false} />)
  for (const chu of ["Căn có thuộc tính", "37.589 / 38.135", "Căn có giá chủ đầu tư", "1.850", "Chưa vào danh bạ", "Toà và căn"]) assert.ok(co.includes(chu), `TTC-AC-10 ô phủ thiếu «${chu}»`)
  assert.ok(!co.includes("Thử lại"), "TTC-AC-9 không lỗi mà có cảnh báo")
  const khong = renderToStaticMarkup(<DuAnView {...goc} phuThuocTinh={{ trangThai: "khong-nguon" }} loiThuocTinh={false} />)
  assert.ok(khong.includes("Chưa có nguồn thuộc tính căn") && !khong.includes("Căn có thuộc tính"), "TTC-AC-10 dự án không nguồn")
  const loi = renderToStaticMarkup(<DuAnView {...goc} phuThuocTinh={null} loiThuocTinh={true} />)
  assert.ok(loi.includes("Không tải được thuộc tính căn") && loi.includes("Thử lại") && loi.includes("Toà và căn"), "TTC-AC-9 lỗi đọc: thiếu cảnh báo, «Thử lại» hay mất lưới")
  // React chỉ định dạng số của SQL: hàm ô phủ không đếm hay cộng trên hàng căn
  const nguon = readFileSync(join(APP, "src/components/ops/registry/du-an-view.tsx"), "utf8")
  const oPhu = nguon.slice(nguon.indexOf("function oPhu"), nguon.indexOf("export function DuAnView"))
  assert.ok(oPhu.length > 0 && !/\.reduce\(|\.filter\(|\.length/.test(oPhu), "TTC-AC-10 ô phủ tự đếm trên dữ liệu thô")
})

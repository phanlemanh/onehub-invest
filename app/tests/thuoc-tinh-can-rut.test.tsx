// thuoc-tinh-can-rut.test.tsx — hồ sơ thuoc-tinh-can-s16-rut-khi-mo-ho (DA48), ca «RMH-AC-6»: lớp đọc của trang dự án Danh bạ không còn
// thấy thuộc tính của căn đã thành mơ hồ toà. DB thử oneinvest_dbv_rmha_<pid> dựng từ db/migrations, xoá khi xong; phát biểu và bước rút
// do chính lệnh pipeline/scripts/thuoc-tinh-can-s16.mjs chạy. Chạy: bash _acceptance/thuoc-tinh-can-s16-rut-khi-mo-ho/probes/kiem.sh app
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { taoDbThu, xoaDbThu } from "../../pipeline/scripts/db-thu-dbv.mjs"
import { ghi, rutMoHo, tinh } from "../../pipeline/scripts/thuoc-tinh-can-s16.mjs"
import type * as Lop from "../src/lib/ops/thuoc-tinh-can"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TEN = `oneinvest_dbv_rmha_${process.pid}`
const DA = "q-rmha"
const B1 = `bld_${"5".padStart(26, "0")}`
const can = (n: number) => `unt_${String(500 + n).padStart(26, "0")}`
let db: pg.Client
let lop: typeof Lop

async function thu(snap: string, luc: string) {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1, 'vn', 'S16', $2, '{}')`, [snap, luc])
  for (const [i, ma] of ["QC1", "QC2"].entries()) {
    await db.query(`INSERT INTO stg_s16_can_chi_tiet (snapshot_id, du_an, toa, ma_can, dong, height_type, property_type, bedroom, bathroom,
        direction, balcony_direction, sale_price, area_using, area_building)
      VALUES ($1, $2, 'T1', $3, $4, 'HIGH_RISE', 'APARTMENT', 2, 1, '', 'NE', 0, 70, 75)`, [snap, DA, ma, i])
  }
}
async function chayGhi() {
  const kq = await tinh(db)
  await db.query("BEGIN")
  await rutMoHo(db, kq.can_mo_ho)
  await ghi(db, kq.phat, kq.observed_at, "rmha")
  await db.query("COMMIT")
}

before(async () => {
  const url = await taoDbThu(TEN)
  process.env.DATABASE_URL = url
  db = new pg.Client({ connectionString: url })
  await db.connect()
  lop = await import(pathToFileURL(join(APP, "src/lib/ops/thuoc-tinh-can.ts")).href)
  const nut = (await db.query(`INSERT INTO asset_nodes (node_type, name, slug, aliases, area_ids, dd_field, meta)
    VALUES ('project', 'Q RMHA', 'q-rmha', '{}', '{}', 'SubdivisionName', '{}') RETURNING id::int AS id`)).rows[0].id
  await db.query(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier)
                  VALUES ($1, $2, 'urn:onehub:upi:1:VN:VN-HN:' || $1, 'VN-HN', 'xac_minh')`, [B1, nut])
  await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')`, [B1, `${DA}/TOA1`])
  for (const [n, ma] of [[1, "QC1"], [2, "QC2"]] as const) {
    await db.query(`INSERT INTO units (unit_key, building_key, floor, sub_id, catalog_tier) VALUES ($1, $2, '10', $1, 'xac_minh')`, [can(n), B1])
    await db.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ma_nguon', $2, 'S16')`, [can(n), `${DA}/${ma}`])
  }
})
after(async () => {
  await db?.end().catch(() => {})
  await (await import("../src/lib/db")).pool.end().catch(() => {})
  await xoaDbThu(TEN)
})

test("RMH-AC-6 căn thành mơ hồ không còn thuộc tính ở lớp đọc, ô phủ giảm đúng một; chiều đỏ: phát biểu sống lại thì lớp đọc thấy lại", async () => {
  const doc = async () => {
    const tt = await lop.docThuocTinhCan([B1], db)
    const phu = await lop.docPhuThuocTinh([B1], db)
    if (!tt.ok || !phu.ok || phu.data.trangThai !== "co") return assert.fail("RMH-AC-6 lớp đọc lỗi hoặc không có nguồn")
    return { can: [...tt.data.keys()].sort(), co: phu.data.coThuocTinh }
  }
  await thu("q__rmha__1", "2026-11-18T01:00:00Z")
  await chayGhi()
  assert.deepEqual(await doc(), { can: [can(1), can(2)], co: 2 }, "RMH-AC-6 đối chứng: hai căn phải có thuộc tính trước khi rút")
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('q__rmha__can', 'vn', 'S16', '{}')`)
  for (const toa of ["ZZ1", "ZZ2"]) {
    await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha) VALUES ('q__rmha__can', $1, 'K', $2, $2, '10', 'QC2', 1)`, [DA, toa])
  }
  await thu("q__rmha__2", "2026-11-19T01:00:00Z")
  await chayGhi()
  assert.deepEqual(await doc(), { can: [can(1)], co: 1 }, "RMH-AC-6 lớp đọc còn thấy căn đã thành mơ hồ")
  await db.query(`INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
    VALUES ('Unit', $1, 'living_area', '70', 'fact', 'source_field', '{"nguon":"S16"}', '2026-11-19T02:00:00Z')`, [can(2)])
  assert.deepEqual(await doc(), { can: [can(1), can(2)], co: 2 }, "RMH-AC-6 phát biểu sống lại mà lớp đọc không thấy — phép đo không phân biệt")
})

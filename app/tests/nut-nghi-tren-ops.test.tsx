// nut-nghi-tren-ops.test.tsx — hồ sơ _acceptance/noi-phan-khu-trung-s16 (DA46), ca «NPS-AC-6». Nút phân khu đã nối về nút khác mang
// meta.nghi: danh bạ Ops và danh sách phân khu của thẻ địa chỉ nhóm không trả nó, không đếm nó; nút thường cùng cha vẫn có mặt.
// Chạy trên DB của lượt (db/db-thu.sh … --chay), mọi dòng thử nằm trong một giao dịch rồi ROLLBACK.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// Cùng quy ước can-gia-cung-loai-db.test.tsx: CI dựng DB trống từ migration ở :5433; máy local thiếu DATABASE_URL thì dừng,
// không mặc định về DB dùng chung. Ca tự gieo dòng thử nên chạy được trên DB trống.
const DB_URL = process.env.DATABASE_URL ?? (process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "")
if (!DB_URL) throw new Error("nut-nghi-tren-ops.test: thiếu DATABASE_URL — chạy qua npm test (db/db-thu.sh --chay)")
process.env.DATABASE_URL = DB_URL
const c = new pg.Client({ connectionString: DB_URL })
let P = 0, THUONG = 0, NGHI = 0, NGHI_CON_DU_AN = 0

const nut = async (type: string, slug: string, ten: string, parent: number | null, meta: object) => (await c.query<{ id: number }>(
  `INSERT INTO asset_nodes (node_type, name, slug, parent_id, aliases, area_ids, dd_field, meta)
   VALUES ($1, $3, $2, $4, '{}', '{}', 'SubdivisionName', $5) RETURNING id::int AS id`, [type, slug, ten, parent, meta])).rows[0].id

before(async () => {
  await c.connect()
  await c.query("BEGIN")
  P = await nut("project", "nps-ops-p", "NPS Dự án", null, {})
  THUONG = await nut("subzone", "nps-ops-thuong", "NPS Phân khu thường", P, {})
  NGHI = await nut("subzone", "nps-ops-nghi", "NPS Phân khu nghỉ", THUONG, { nghi: true })
  NGHI_CON_DU_AN = await nut("subzone", "nps-ops-nghi2", "NPS Phân khu nghỉ hai", P, { nghi: true })
})
after(async () => {
  await c.query("ROLLBACK").catch(() => {})
  await c.end()
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

test("NPS-AC-6 danh bạ Ops: danh sách không trả nút nghỉ, số phân khu không đếm nó, nút thường vẫn có", async () => {
  const { docDanhBa } = await import("../src/lib/ops/registry/doc")
  const db = await docDanhBa(c)
  const ids = new Set(db.nut.map((n) => n.id))
  assert.ok(ids.has(THUONG), "đối chứng: nút thường phải có mặt")
  assert.ok(!ids.has(NGHI), "nút nghỉ là con của nút thường không được hiện")
  assert.ok(!ids.has(NGHI_CON_DU_AN), "nút nghỉ là con của dự án không được hiện")
  assert.equal(db.nut.find((n) => n.id === P)?.soPhanKhu, 1, "số phân khu của dự án chỉ đếm nút thường")
  const { rows: [r] } = await c.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM asset_nodes WHERE node_type IN ('subzone', 'building') AND COALESCE((meta ->> 'nghi')::boolean, false) = false")
  assert.equal(db.tong.phanKhu, r.n, "ô tổng số phân khu không đếm nút nghỉ")
})

test("NPS-AC-6 chi tiết dự án Ops: cây con không có nút nghỉ", async () => {
  const { docDuAn } = await import("../src/lib/ops/registry/du-an")
  const mot = await docDuAn(P, c)
  assert.deepEqual(mot?.nut.map((n) => n.id).sort((a, b) => a - b), [P, THUONG].sort((a, b) => a - b), "chi tiết dự án chỉ có dự án và nút thường")
})

test("NPS-AC-6 thẻ địa chỉ nhóm: ô chọn phân khu không có nút nghỉ", async () => {
  const { docDanhMucThe } = await import("../src/lib/the-dia-chi-nhom")
  const { subzones } = await docDanhMucThe(c as never)
  const ids = new Set(subzones.map((s) => s.id))
  assert.ok(ids.has(THUONG), "đối chứng: nút thường phải có trong ô chọn")
  assert.ok(!ids.has(NGHI) && !ids.has(NGHI_CON_DU_AN), "nút nghỉ không được có trong ô chọn")
})

// Mỗi câu SQL đọc asset_nodes của cổng Invest và API công khai phải khoá vào nút dự án.
const cauDocNut = (src: string) => src.split("\n").filter((d) => /(FROM|JOIN)\s+asset_nodes\b/.test(d))
const chiNutDuAn = (d: string) => /node_type\s*=\s*'project'/.test(d) || /h\.cap\s*=\s*'du_an'/.test(d)

test("NPS-AC-6 cổng Invest và API công khai chỉ đọc nút dự án", () => {
  const deals = readFileSync(join(APP, "src/lib/deals.ts"), "utf8")
  const api = readFileSync(join(APP, "../data-api/src/routes/deals.ts"), "utf8")
  const dong = cauDocNut(deals)
  assert.ok(dong.length >= 2, "đối chứng: phải tìm thấy câu đọc nút trong deals.ts")
  assert.deepEqual(dong.filter((d) => !chiNutDuAn(d)), [], "câu đọc nút của cổng Invest phải khoá vào nút dự án")
  assert.deepEqual(cauDocNut(api).filter((d) => !chiNutDuAn(d)), [], "câu đọc nút của API công khai phải khoá vào nút dự án")
  assert.equal(chiNutDuAn("SELECT name FROM asset_nodes WHERE node_type = 'subzone'"), false, "đối chứng: bộ dò phải bắt câu đọc phân khu")
})

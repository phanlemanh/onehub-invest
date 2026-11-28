// do-hang-ngay-che.test.tsx — HT26 `sync-cloud-che-ten-nguon-moi-cot` E4 (AC-4): khối «Đo hằng ngày» của /ops/quality che tên nguồn
// trong dq_check_results.detail như bảng chung (dq-checks.ts). Tên nguồn ở đây là chuỗi BỊA. Ca chính chạy trên DB giả (Queryable
// trả đúng các câu thật của loadDo1); ca «lược đồ tạm» chạy khi có DATABASE_URL trỏ DB thử (không phải oneinvest), trong giao dịch
// ROLLBACK. Chiều đỏ: bản cũ (gom thẳng, không che) để lọt token.
import { test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { cheDetail, do1Sql, gomDo1, loadDo1, type Do1 } from "../src/lib/do-hang-ngay"
import { SQL_SO_CO_CO, SQL_SO_HINH, findSourceNames, type SourceNameEntry } from "../src/lib/mask-source-names"

const BIA: SourceNameEntry[] = [
  { code: "S97", realName: "Nguonbia Kappa", wholeOnly: true },
  { code: "S97", realName: "nguonbiakappa.example", wholeOnly: true },
]
const so = { code: "S97", real_name: "Nguonbia Kappa", ids: ["nguonbiakappa.example"], match_whole: true }
const dong = [
  {
    check_name: "do1-giu-nhap", entity: "tong", status: "pass", checked_at: "2026-11-25 01:00:00+00",
    detail: JSON.stringify({ dong: [], ghi_chu: "mẫu rút từ Nguonbia Kappa", lat: { "nguonbiakappa.example": { o: { a: 1 }, tong: 1 } } }),
  },
  { check_name: "do1-so-sanh", entity: "cap-1", status: "warn", checked_at: "2026-11-25 01:00:00+00", detail: JSON.stringify({ cu: "đọc NGUONBIA KAPPA", o: {} }) },
  { check_name: "do1-bo-sot", entity: "tong", status: "pass", checked_at: "2026-11-25 01:00:00+00", detail: null },
]

/** Queryable giả trả đúng các câu thật: hình sổ, sổ, câu khối. `coBang=false` = cloud (không có sổ nguồn). */
function dbGia({ coBang = true, soDong = [so] } = {}) {
  const goi: string[] = []
  return {
    goi,
    query: async (sql: string) => {
      goi.push(sql)
      if (sql === SQL_SO_HINH) return { rows: [{ bang: coBang, cot: coBang }] }
      if (sql === SQL_SO_CO_CO) return { rows: soDong }
      if (sql === do1Sql()) return { rows: dong.map((r) => ({ ...r })) }
      throw new Error(`câu lạ: ${sql.slice(0, 40)}`)
    },
  }
}

/** Đầu ra khối không được chứa tên nguồn (theo lõi che của app) — đỏ thì nêu «do-hang-ngay», không in token. */
function kiemKhongLot(data: Do1 | null, entries = BIA) {
  const s = JSON.stringify(data)
  if (findSourceNames(s, entries).length || /nguonbia/i.test(s)) throw new Error("do-hang-ngay để lọt tên nguồn trong detail")
}

test("SCC-4: loadDo1 che tên nguồn trong detail như dq-checks — đầu ra không chứa token, chứa mã S97; số và cấu trúc giữ", async () => {
  const data = await loadDo1(dbGia())
  assert.ok(data, "SCC-4: khối rỗng")
  kiemKhongLot(data)
  const s = JSON.stringify(data)
  assert.ok(s.includes("S97"), "SCC-4: không thấy mã S97 thay tên")
  assert.equal(data.giuNhap?.lat?.S97?.tong, 1, "SCC-4: khoá lát mang tên nguồn phải đổi thành mã, giữ số")
  assert.equal(data.soSanh[0]?.cu, "đọc S97", "SCC-4: chữ hoa không được che")
  assert.equal(data.boSot?.status, "pass", "SCC-4: dòng detail null phải giữ")
})

test("SCC-4: chiều đỏ — bản cũ (gom thẳng, không che) để lọt token, ca nêu «do-hang-ngay»", () => {
  assert.throws(() => kiemKhongLot(gomDo1(dong)), /do-hang-ngay/)
})

test("SCC-4: đóng chặt — có sổ mà không đọc được tên nào thì ẩn chi tiết; cloud (không có sổ) giữ dòng đã che ở đường lên", async () => {
  const an = await cheDetail(dbGia({ soDong: [] }), dong)
  assert.ok(an.every((r) => r.detail === null), "SCC-4: sổ rỗng mà chi tiết vẫn hiện")
  const cloud = await cheDetail(dbGia({ coBang: false }), dong)
  assert.deepEqual(cloud.map((r) => r.detail), dong.map((r) => r.detail), "SCC-4: cloud không có sổ — dòng phải giữ nguyên")
})

const DB = process.env.DATABASE_URL
test("SCC-4: lược đồ tạm trên DB thử — detail cấy tên nguồn đọc qua loadDo1 thật không còn token", { skip: DB ? false : "thiếu DATABASE_URL (DB thử)" }, async () => {
  const c = new pg.Client({ connectionString: DB })
  await c.connect()
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db")
    if (db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
    await c.query("BEGIN")
    await c.query("CREATE SCHEMA scc4_tam")
    await c.query("SET LOCAL search_path = scc4_tam, public")
    await c.query("CREATE TABLE scc4_tam.source_registry (code text, real_name text, source_ids text[], match_whole boolean)")
    await c.query("INSERT INTO scc4_tam.source_registry VALUES ($1, $2, $3, $4)", [so.code, so.real_name, so.ids, so.match_whole])
    await c.query("CREATE TABLE scc4_tam.dq_check_results (LIKE public.dq_check_results INCLUDING DEFAULTS)")
    for (const r of dong) await c.query("INSERT INTO scc4_tam.dq_check_results (check_name, entity, status, detail, checked_at) VALUES ($1, $2, $3, $4, now())", [r.check_name, r.entity, r.status, r.detail])
    const data = await loadDo1(c)
    assert.ok(data, "SCC-4 lược đồ tạm: khối rỗng")
    kiemKhongLot(data)
    assert.ok(JSON.stringify(data).includes("S97"), "SCC-4 lược đồ tạm: không thấy mã")
    const tho = (await c.query(do1Sql())).rows as Parameters<typeof gomDo1>[0]
    assert.throws(() => kiemKhongLot(gomDo1(tho)), /do-hang-ngay/, "SCC-4 lược đồ tạm chiều đỏ: bản không che phải lọt")
  } finally {
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
})

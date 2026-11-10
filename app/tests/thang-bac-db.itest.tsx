// thang-bac-db.itest.tsx — thang-bac-moi-b0-b5 E12 (AC-11), E7b (AC-7), E8b (AC-8): bên ghi thật → bên đọc thật của app trên
// DB của riêng lượt (config:executors.test.tb_app_db, bản chép DB máy thu chưa áp 087). Ca E12 chạy TRƯỚC, trên lược đồ chưa
// có 087 (như cloud tới khi Mạnh áp); hai ca sau nạp 087 trong giao dịch rồi ROLLBACK.
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { after, before, test } from "node:test"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { DoHangNgay } from "../src/components/ops/quality/do-hang-ngay"
import { getDataFlow, type FlowRecord } from "../src/lib/data-flow-queries"
import { levelOf } from "../src/lib/data-level"
import { loadDo1, type Do1 } from "../src/lib/do-hang-ngay"

const GOC = join(import.meta.dirname, "../..")
const SQL_087 = readFileSync(join(GOC, "db/migrations/087_thang_bac_moi.sql"), "utf8")
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
const ve = (data: Do1 | null) =>
  renderToStaticMarkup(<AppRouterContext.Provider value={ROUTER as never}><DoHangNgay data={data} lat="tong" /></AppRouterContext.Provider>)

let c: pg.Client
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua config:executors.test.tb_app_db (DB của riêng lượt)")
  c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  const { rows: [r] } = await c.query("SELECT current_database() AS db")
  if (r.db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử")
})
after(async () => {
  await c?.end()
})
const q = (text: string, values?: unknown[]) => c.query(text, values as unknown[])
const docBanGhi = async (): Promise<FlowRecord[]> => (await getDataFlow("7d", { query: q, mode: "local" })).records

// ---- E12 · AC-11: lược đồ chưa có 087 (cloud) — trang Dòng chảy và khối DO1 chạy, tin ở B0/B1, không dòng đổi thang ----
test("TB-AC-11 lược đồ chưa có 087: truy vấn bản ghi và DO1 của app không lỗi, bậc ⊆ {B0, B1} (kèm chiều đỏ)", async () => {
  const { rows: [m] } = await c.query("SELECT to_regprocedure('offer_located(text)') IS NULL AS chua")
  if (!m.chua) return assert.fail("tiền đề: DB của lượt phải là lược đồ chưa áp 087 — chạy qua tb_app_db, không trên DB đã áp")
  const recs = await docBanGhi()
  assert.ok(recs.length > 0, "đối chứng: bản chép phải có tin để đọc")
  const bac = new Set(recs.map((r) => levelOf(r)))
  for (const b of bac) assert.ok(b === "B0" || b === "B1", `TB-AC-11 bậc ${b} trên lược đồ chưa có 087`)
  const do1 = await loadDo1(c)
  assert.equal(do1?.chuyenBac?.thang, undefined, "TB-AC-11 dòng DO1 đời trước mà có thang")
  assert.ok(!ve(do1).includes("data-do1-thang"), "TB-AC-11 hiện dòng đổi thang khi chưa áp 087")
  // chiều đỏ: câu bản ghi gọi hàm của 087 → lỗi 42883 trên lược đồ cũ
  await assert.rejects(c.query("SELECT offer_located(o.offer_id) FROM sale_offers o LIMIT 1"), (e: { code?: string }) => e.code === "42883",
    "TB-AC-11 app gọi hàm của 087")
})

async function trongGiaoDich(fn: () => Promise<void>) {
  await c.query("BEGIN")
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)")
    const { rows: [r] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co")
    if (!r.co) await c.query(SQL_087)
    await fn()
  } finally {
    await c.query("ROLLBACK")
  }
}

// ---- E7b · AC-7: DO1 thật ghi dòng đổi thang → loadDo1 của app đọc → khối DO1 hiện dòng thang ----
test("TB-AC-7 bên ghi thật → bên đọc thật: dòng đổi thang lên khối Đo hằng ngày (kèm chiều đỏ)", { timeout: 900_000 }, async () => {
  await trongGiaoDich(async () => {
    const { doHangNgay } = await import("../../pipeline/do-hang-ngay.mjs")
    await c.query("DELETE FROM data_level_unit; DELETE FROM data_level_change")
    await c.query(`INSERT INTO data_level_unit (unit_key, unit, source, data_level, ke_thieu, core, seen_on, scale)
      VALUES ('can:999999002', 'can', 'S06', 'B2', 'so-do', '{"tin": []}', '2026-11-08', 'thang-2310')`)
    await c.query(`INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)
      VALUES ('2026-11-10', 'chua-ro', 'unknown', 'tin_le', 'B1', 1, 'thang-0811')
      ON CONFLICT (snap_date, market_id, property_type, unit, data_level) DO UPDATE SET scale = 'thang-0811'`)
    await doHangNgay(c, { ngay: "2026-11-12", write: true })
    const do1 = await loadDo1(c)
    assert.equal(do1?.chuyenBac?.ly_do, "doi-thang")
    assert.equal(do1?.chuyenBac?.thang?.ma, "thang-0811")
    const h = ve(do1)
    assert.match(h, /data-do1-thang/, "TB-AC-7 bên đọc không thấy thang")
    assert.match(h, /Thang bậc 08\/11/)
    assert.match(h, /lần hạ một lần/)
    assert.match(h, /áp từ \d{4}-\d{2}-\d{2} —/, "TB-AC-7 ngày áp không hiện")
    // chiều đỏ: cùng DB, bỏ khoá thang khỏi dòng vừa ghi → không còn dòng thang
    await c.query(`UPDATE dq_check_results SET detail = (detail::jsonb - 'thang')::text
      WHERE check_name = 'do1-chuyen-bac' AND id = (SELECT max(id) FROM dq_check_results WHERE check_name = 'do1-chuyen-bac')`)
    const h2 = ve(await loadDo1(c))
    assert.ok(!h2.includes("data-do1-thang"), "đối chứng đỏ: bỏ thang mà dòng vẫn hiện — thước không phân biệt")
  })
})

// ---- E8b · AC-8: truy vấn bản ghi thật của Dòng chảy trên DB có 087 — tin trong cụm ở B1, lọc B2 rỗng ----
test("TB-AC-8 truy vấn bản ghi thật: tin S06 trong cụm ở B1, tin thiếu giá ở B0, lọc B2 rỗng (kèm chiều đỏ)", async () => {
  await trongGiaoDich(async () => {
    const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1")
    const T = `tb8-${process.pid}`
    const ids = [`${T}-1`, `${T}-2`, `${T}-3`, `${T}-4`]
    for (const [i, id] of ids.entries()) {
      await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
          originating_system_key, first_seen, last_seen) VALUES ($1, 'sale', 'apartment', $2, 60, $3, $4, $1, now(), now())`,
      [id, i === 3 ? null : 2e9, w.id, i === 3 ? "S03" : "S06"])
    }
    const { rows: [p] } = await c.query(
      "INSERT INTO properties (area_id, property_type, verification) VALUES ($1, 'apartment', 'pending') RETURNING id", [w.id])
    for (const id of ids.slice(0, 3)) await c.query("INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)", [p.id, id])
    const recs = (await docBanGhi()).filter((r) => r.offerId.startsWith(T))
    assert.deepEqual(recs.map((r) => [r.offerId, levelOf(r)]).sort(),
      [[ids[0], "B1"], [ids[1], "B1"], [ids[2], "B1"], [ids[3], "B0"]], "TB-AC-8 bậc của bản ghi lệch")
    assert.deepEqual(recs.filter((r) => levelOf(r) === "B2"), [], "TB-AC-8 lọc B2 phải rỗng")
    // chiều đỏ: bản sao câu truy vấn truyền cờ cụm (EXISTS property_offers, luật 056) vào tham số cuối → tin trong cụm lên B2
    const { rows: lech } = await c.query(`SELECT o.offer_id, l.data_level FROM sale_offers o
      CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id,
        EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id)) l WHERE o.offer_id = ANY ($1)`, [ids])
    assert.ok(lech.some((r) => r.data_level === "B2"), "TB-AC-8 cụm cho B2 ở truy vấn app — đối chứng đỏ không đỏ")
  })
})

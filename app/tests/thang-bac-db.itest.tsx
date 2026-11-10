// thang-bac-db.itest.tsx — thang-bac-moi-b0-b5 E12 (AC-11), E7b (AC-7), E8b (AC-8): bên ghi thật → bên đọc thật của app trên
// DB của riêng lượt (config:executors.test.tb_app_db, bản chép DB máy thu chưa áp 087). Ca E12 chạy TRƯỚC, trên lược đồ chưa
// có 087 (như cloud tới khi Mạnh áp); hai ca sau nạp 087 trong giao dịch rồi ROLLBACK.
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
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

// ---- E12 · AC-11 (do1-giu-dau-doi-thang E7 · AC-7): lược đồ chưa có 087 (cloud) — dựng trong giao dịch trên bản chép (máy thu
// nay đã áp 087): bỏ mọi hàm 087 tạo mà migration trước không tạo + cột 087 thêm, tập suy từ tệp migration ----
const MIG = join(GOC, "db/migrations")
/** Đối tượng 087 tạo mới: hàm CREATE … FUNCTION mà không tệp số nhỏ hơn nào tạo, cột ADD COLUMN. */
function doiTuong087(): string[] {
  const truoc = readdirSync(MIG).filter((f) => /^\d{3}_/.test(f) && f < "087").map((f) => readFileSync(join(MIG, f), "utf8")).join("\n")
  const ham = [...SQL_087.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\(/gi)].map((m) => m[1])
    .filter((f, i, a) => a.indexOf(f) === i && !new RegExp(`FUNCTION\\s+${f}\\s*\\(`, "i").test(truoc)).map((f) => `fn ${f}`)
  const cot = [...SQL_087.matchAll(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/gi)].map((m) => `col ${m[1]}.${m[2]}`)
  return [...ham, ...cot].sort()
}
const DO1_DOI = (thang: boolean) => c.query(`INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail)
  VALUES (clock_timestamp(), 'do1-chuyen-bac', 'tat-ca', 'skip', $1)`,
  [JSON.stringify({ ngay: "2030-02-01", ly_do: "doi-thang", don_vi: 1, ...(thang ? { thang: { ma: "thang-0811", tu_ngay: "2030-02-01" } } : {}) })])
/** Đột biến câu truy vấn của app: lần đầu `o.offer_id` trong câu SQL thành `offer_located(o.offer_id)`. */
let daDotBien = 0
const qDotBien = (text: string, values?: unknown[]) => {
  if (text.includes("o.offer_id")) { daDotBien++; return c.query(text.replace("o.offer_id", "offer_located(o.offer_id)"), values as unknown[]) }
  return c.query(text, values as unknown[])
}

async function luocDoCu(fn: () => Promise<void>, { donDong = true } = {}) {
  await c.query("BEGIN")
  try {
    const { rows: [goc] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co")
    const { rows: [coThang] } = await c.query(`SELECT count(*)::int AS n FROM dq_check_results
      WHERE check_name = 'do1-chuyen-bac' AND detail::jsonb ? 'thang'`)
    console.log(`TB-AC-11 tiền đề: lược đồ gốc ${goc.co ? "có" : "không có"} 087; bản chép có ${coThang.n} dòng DO1 mang thang`)
    for (const d of doiTuong087()) {
      const [loai, ten] = d.split(" ")
      if (loai === "fn") await c.query(`DROP FUNCTION IF EXISTS ${ten} CASCADE`)
      else { const [b, col] = ten.split("."); await c.query(`ALTER TABLE ${b} DROP COLUMN IF EXISTS ${col} CASCADE`) }
    }
    await DO1_DOI(true)                        // đối chứng dương: dòng mang thang hiện dòng thang
    assert.match(ve(await loadDo1(c)), /data-do1-thang/, "đối chứng: dòng DO1 mang thang mà khối không hiện — thước không phân biệt")
    if (donDong) await DO1_DOI(false)          // dòng đời trước, mới hơn
    await fn()
  } finally {
    await c.query("ROLLBACK")
  }
}

test("TB-AC-11 lược đồ chưa có 087: truy vấn bản ghi và DO1 của app không lỗi, bậc ⊆ {B0, B1} (kèm chiều đỏ)", { timeout: 900_000 }, async () => {
  assert.deepEqual(doiTuong087(), ["col data_level_snapshot.scale", "col data_level_unit.scale", "fn data_level_units", "fn offer_located",
    "fn offer_unit_key", "fn unit_data_level"], "TB-AC-11 tập đối tượng 087 lệch tập viết trước")
  await luocDoCu(async () => {
    const { rows: [m] } = await c.query("SELECT to_regprocedure('offer_located(text)') IS NULL AS chua")
    assert.ok(m.chua, "tiền đề: giả lập lược đồ chưa áp 087 mà offer_located còn")
    const recs = await docBanGhi()
    assert.ok(recs.length > 0, "đối chứng: bản chép phải có tin để đọc")
    const bac = new Set(recs.map((r) => levelOf(r)))
    for (const b of bac) assert.ok(b === "B0" || b === "B1", `TB-AC-11 bậc ${b} trên lược đồ chưa có 087`)
    const do1 = await loadDo1(c)
    assert.equal(do1?.chuyenBac?.thang, undefined, "TB-AC-11 dòng DO1 đời trước mà có thang")
    assert.ok(!ve(do1).includes("data-do1-thang"), "TB-AC-11 hiện dòng đổi thang khi chưa áp 087")
    // chiều đỏ: chính câu truy vấn bản ghi của app bị đột biến gọi hàm của 087 → 42883 trên lược đồ cũ
    daDotBien = 0
    await assert.rejects((async () => (await getDataFlow("7d", { query: qDotBien, mode: "local" })).records)(),
      (e: { code?: string }) => { assert.ok(daDotBien > 0, "đột biến không áp được"); return e.code === "42883" }, "TB-AC-11 app gọi hàm của 087")
  })
  await luocDoCu(async () => {   // chiều đỏ thứ hai: không chèn dòng đời trước → dòng mang thang còn là dòng mới nhất
    const do1 = await loadDo1(c)
    assert.ok(do1?.chuyenBac?.thang, "đối chứng đỏ: bỏ dòng đời trước mà không còn thang — thước không phân biệt")
    assert.throws(() => assert.equal(do1?.chuyenBac?.thang, undefined, "TB-AC-11 dòng DO1 đời trước mà có thang"),
      /TB-AC-11 dòng DO1 đời trước mà có thang/)
  }, { donDong: false })
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

// ---- do1-giu-dau-doi-thang E6 · AC-6: DO1 thật hai lượt cùng ngày đổi thang → loadDo1 → khối DO1 vẫn hiện dòng thang ----
test("DD-AC-6 hai lượt cùng ngày đổi thang lên khối DO1: dòng thang còn (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  const doHangNgay = (await import("../../pipeline/do-hang-ngay.mjs")).doHangNgay as
    (c: pg.Client, o: { ngay: string; write: boolean; dotBien?: string }) => Promise<unknown>
  const D = "2030-03-10"
  const haiLuot = async (dotBien?: string) => {
    await c.query(`DELETE FROM data_level_unit; DELETE FROM data_level_change; DELETE FROM dq_check_results WHERE check_name = 'do1-chuyen-bac';
      DELETE FROM data_level_snapshot WHERE scale = 'thang-0811'`)
    await c.query(`INSERT INTO data_level_unit (unit_key, unit, source, data_level, ke_thieu, core, seen_on, scale)
      VALUES ('can:999999003', 'can', 'S06', 'B2', 'so-do', '{"tin": []}', '2030-03-01', 'thang-2310')`)
    await c.query(`INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)
      VALUES ($1, 'chua-ro', 'unknown', 'tin_le', 'B1', 1, 'thang-0811')`, [D])
    const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1")
    const id = `dd6-${process.pid}`
    await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
        originating_system_key, first_seen, last_seen, field_provenance, offer_status)
      VALUES ($1, 'sale', 'apartment', 2000000000, 60, $2, 'S03', $1, now() - interval '1 day', now(), '{}', 'unknown')`, [id, w.id])
    await doHangNgay(c, { ngay: D, write: true })
    await c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id = $1", [id])
    await doHangNgay(c, { ngay: D, write: true, dotBien })
    return ve(await loadDo1(c))
  }
  await trongGiaoDich(async () => {
    const h = await haiLuot()
    assert.match(h, /data-do1-thang/, "DD-AC-6 lượt hai mất dòng thang trên khối DO1")
    assert.match(h, /Thang bậc 08\/11/)
    assert.match(h, /lần hạ một lần/)
    assert.match(h, new RegExp(`áp từ ${D} —`), "DD-AC-6 ngày áp không hiện")
  })
  await trongGiaoDich(async () => {   // chiều đỏ: bỏ giữ mốc ở lượt hai → dòng pass mang thang nhưng không còn câu lập mốc
    const h = await haiLuot("bo-giu-moc")
    assert.doesNotMatch(h, /lần hạ một lần/, "đối chứng đỏ: bỏ giữ mốc mà câu lập mốc còn — thước không phân biệt")
    assert.throws(() => assert.match(h, /lần hạ một lần/, "DD-AC-6 lượt hai mất dòng thang trên khối DO1"), /DD-AC-6 lượt hai mất dòng thang trên khối DO1/)
  })
})

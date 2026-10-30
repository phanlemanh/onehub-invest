// PL16 AC-1 (E1): bậc tin tính bằng SQL `offer_data_level` (056) phải trùng `levelOf` của app trên mọi ô — ma trận đủ 2⁵
// tổ hợp có/thiếu của năm trường lõi × gắn/chưa gắn, cộng năm ô biên × gắn/chưa = 74 ô. Cần DB đã áp 056 (DB thử
// oneinvest_p2_bac trước gộp); tên .itest để `npm test` không chạy nó khi không có DB.
import assert from "node:assert/strict"
import { after, before, test } from "node:test"
import pg from "pg"
import { levelOf, type LevelInput } from "../src/lib/data-level"

type O = { ten: string; r: LevelInput }

const DU: Omit<LevelInput, "linked"> = { kind: "sale", propertyType: "house", priceVnd: 2e9, areaM2: 60, ward: "vn-hanoi-x" }
const KHOA = ["kind", "propertyType", "priceVnd", "areaM2", "ward"] as const

function maTran(): O[] {
  const o: O[] = []
  for (const linked of [false, true]) {
    for (let m = 0; m < 32; m++) {
      const r: LevelInput = { ...DU, linked }
      KHOA.forEach((k, i) => {
        if (m & (1 << i)) (r as Record<string, unknown>)[k] = null
      })
      o.push({ ten: `thiếu ${KHOA.filter((_, i) => m & (1 << i)).join("+") || "không"}${linked ? " · gắn" : ""}`, r })
    }
    const bien: [string, Partial<LevelInput>][] = [
      ["giá 0", { priceVnd: 0 }],
      ["diện tích 0", { areaM2: 0 }],
      ["loại hình unknown", { propertyType: "unknown" }],
      ["loại hình rỗng", { propertyType: "" }],
      ["loại tin rỗng", { kind: "" }],
    ]
    for (const [ten, d] of bien) o.push({ ten: `${ten}${linked ? " · gắn" : ""}`, r: { ...DU, ...d, linked } })
  }
  return o
}

let c: pg.Client
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB đã áp 056 (bash db/db-thu.sh oneinvest_p2_bac)")
  c = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await c.connect()
  const { rows: [r] } = await c.query("SELECT to_regproc('offer_data_level')::text AS f")
  if (!r.f) throw new Error("DB chưa có offer_data_level — áp db/migrations/056_data_level.sql lên DB thử")
})
after(async () => {
  await c?.end()
})

/** Đối chiếu từng ô; ô đầu tiên lệch ném lỗi mang tên ô. */
async function doiChieu(fn: string, o: O[]): Promise<number> {
  let khop = 0
  for (const { ten, r } of o) {
    const { rows: [s] } = await c.query(`SELECT data_level FROM ${fn}($1, $2, $3, $4, $5, $6)`,
      [r.kind, r.propertyType, r.priceVnd, r.areaM2, r.ward, r.linked])
    assert.equal(s.data_level, levelOf(r), `ô lệch: ${ten}`)
    khop++
  }
  return khop
}

test("AC-1 SQL offer_data_level trùng levelOf trên 74 ô", async () => {
  const o = maTran()
  assert.equal(o.length, 74, "ma trận viết trước phải đủ 74 ô")
  const khop = await doiChieu("offer_data_level", o)
  console.log(`# AC-1: ${khop}/74 ô khớp`)
  assert.equal(khop, 74)
})

test("AC-1 chiều đỏ: vị từ giá viết `IS NOT NULL` lệch ở ô giá 0", async () => {
  const def = async (sig: string) =>
    (await c.query("SELECT pg_get_functiondef($1::regprocedure) AS d", [sig])).rows[0].d as string
  const loi = await def("offer_core_complete(text,text,numeric,numeric,text)")
  assert.ok(loi.includes("coalesce(p_price_vnd > 0, false)"), "bản lệch: thân offer_core_complete đã đổi — sửa ca đỏ")
  await c.query(loi.replace("public.offer_core_complete(", "pg_temp.offer_core_complete_lech(")
    .replace("coalesce(p_price_vnd > 0, false)", "p_price_vnd IS NOT NULL"))
  const bac = await def("offer_data_level(text,text,numeric,numeric,text,boolean)")
  await c.query(bac.replace("public.offer_data_level(", "pg_temp.offer_data_level_lech(")
    .replace("offer_core_complete(p_kind", "pg_temp.offer_core_complete_lech(p_kind"))
  await assert.rejects(doiChieu("pg_temp.offer_data_level_lech", maTran()), /ô lệch: giá 0/)
})

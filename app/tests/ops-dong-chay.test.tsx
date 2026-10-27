// ops-dong-chay.test.tsx — hồ sơ _acceptance/ops-dong-chay-df0: trang Ops «Dòng chảy dữ liệu» (/ops/data-flow).
// Tên ca mở đầu bằng mã AC (DF-AC-n). Ca DB dựng lược đồ tạm `df0_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối
// lượt; ca «DB thật» chỉ SELECT trên public. Mỗi phép đo có chiều đỏ: một bản đột biến trên CÙNG fixture, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactNode } from "react"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { IN, NOW, OFFERS, fragment, makeFlowSchema, refreshFlow, vn, type Offer } from "./ops-dong-chay-fixture"

const S = `df0_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động

// ---------- jsdom (cùng khuôn review-queue.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/ops/data-flow" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(node))
  return document.getElementById("root")!
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react")
  await React.act(async () => {
    await fn()
    await new Promise((r) => setTimeout(r, 20))
  })
}
const click = async (el: Element | null | undefined, what: string) => {
  assert.ok(el, `không tìm thấy ${what} để bấm`)
  await act(() => (el as HTMLElement).click())
}
const dialogs = () => document.querySelectorAll("[role=dialog]")
async function closeSheets() {
  for (const d of dialogs()) {
    await act(() => {
      d.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
  }
  await act(() => new Promise((r) => setTimeout(r, 30)))
}

// ---------- lược đồ tạm (fixture dùng chung với DF1 — tests/ops-dong-chay-fixture.ts) ----------
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
/** DF1: số tổng hợp đọc bảng tính sẵn — dựng lược đồ, áp 051, làm tươi bằng 600 THẬT (hay bản đột biến `sql`). */
async function makeSchema(schema: string, offers: Offer[], ads: number, sql?: string) {
  await makeFlowSchema(admin, schema, { offers, ads })
  await refreshFlow(schema, { now: NOW, sql })
}

before(async () => {
  try {
    await admin.connect()
    await makeSchema(S, OFFERS, 4)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await closeSheets().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}_min" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---------- AC-1: đường ống bảo toàn ----------
type SF = import("../src/lib/data-flow-queries").SourceFlow
const sf = (source: "S03" | "S05" | "S06", received: number, readable: number, offers: number, linked: number): SF => ({
  source, received, readable, offers, linked, testRejected: 0, withWard: 0, withType: 0, withPriceArea: 0, complete: 0,
  highConfidence: 0, latestAt: null, approx: source === "S06",
})

describe("DF-AC-1 bảo toàn", () => {
  const BO = [
    { ten: "ba nguồn đủ chặng", src: [sf("S03", 100, 40, 10, 2), sf("S05", 10, 5, 3, 0), sf("S06", 50, 45, 45, 44)], ids: ["S03", "S05", "S06", "received", "readable", "unreadable", "offers", "merged", "linked", "unlinked"] },
    { ten: "không tin nào gắn căn", src: [sf("S03", 20, 8, 4, 0)], ids: ["S03", "received", "readable", "unreadable", "offers", "merged", "unlinked"] },
    { ten: "đọc được bằng 0", src: [sf("S03", 7, 0, 0, 0)], ids: ["S03", "received", "unreadable"] },
    { ten: "mọi tin gắn căn", src: [sf("S06", 9, 9, 9, 9)], ids: ["S06", "received", "readable", "offers", "linked"] },
  ]
  const kiem = (build: typeof import("../src/components/ops/data-flow/flow-sankey-data").buildFlow, src: SF[]) => {
    const { nodes, links } = build(src, {})
    const loi: string[] = []
    nodes.forEach((n, i) => {
      const ra = links.filter((l) => l.source === i).reduce((a, l) => a + l.value, 0)
      const vao = links.filter((l) => l.target === i).reduce((a, l) => a + l.value, 0)
      if (n.stage === "channel" && ra !== n.amount) loi.push(`nguồn ${n.id} chảy ${ra} ≠ ${n.amount}`)
      const giua = links.some((l) => l.source === i) && n.stage !== "channel"
      if (giua && ra !== n.amount) loi.push(`nút ${n.name} không bảo toàn (ra ${ra} ≠ ${n.amount})`)
      if (n.id === "received" && vao !== n.amount) loi.push(`nút Bài nhận không bảo toàn (vào ${vao} ≠ ${n.amount})`)
      if (n.amount <= 0) loi.push(`nút 0 còn hiện: ${n.id}`)
    })
    return { nodes, loi }
  }
  test("DF-AC-1 bảo toàn — ma trận bốn bộ số viết trước", async () => {
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    for (const b of BO) {
      const { nodes, loi } = kiem(buildFlow, b.src)
      assert.deepEqual(loi, [], `${b.ten}: ${loi.join("; ")}`)
      assert.deepEqual(nodes.map((n) => n.id), b.ids, `${b.ten}: tập nút`)
    }
    const h1 = buildFlow(BO[0].src, {}).headers
    assert.equal(h1.linked.value, (await import("../src/lib/format")).fmtPct(46 / 58))
    assert.equal(h1.linked.weak, true)
    const h2 = buildFlow(BO[1].src, {}).headers
    assert.equal(h2.unlinked?.title, "Gắn căn", "không tin gắn căn → chú thích đứng trên «Chưa gắn căn»")
    assert.equal(h2.unlinked?.value, "0,0%")
    assert.equal(h2.unlinked?.weak, true)
    assert.equal(buildFlow(BO[3].src, {}).headers.linked.weak, false)
  })
  test("DF-AC-1 chiều đỏ — cạnh Bài nhận → Đọc được mang số của Bài nhận", async () => {
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const dotBien: typeof buildFlow = (src, roles) => {
      const out = buildFlow(src, roles)
      const iRec = out.nodes.findIndex((n) => n.id === "received")
      const iRead = out.nodes.findIndex((n) => n.id === "readable")
      return { ...out, links: out.links.map((l) => (l.source === iRec && l.target === iRead ? { ...l, value: out.nodes[iRec].amount } : l)) }
    }
    const { loi } = kiem(dotBien, BO[0].src)
    assert.ok(loi.some((m) => m.startsWith("nút Bài nhận không bảo toàn")), `phép đo phải bắt đột biến; được: ${loi.join("; ")}`)
  })
})

// ---------- AC-2 / AC-3: số chặng theo nguồn, đủ trường lõi ----------
describe("DF-AC-2 số chặng theo nguồn", () => {
  test("DF-AC-2 số chặng theo nguồn — lược đồ tạm, Toàn kho và 7 ngày", async () => {
    ready()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    const all = await getDataFlow("all", { now: NOW })
    const by = Object.fromEntries(all.sources.map((s) => [s.source, s]))
    const pick = (s: SF) => ({ received: s.received, testRejected: s.testRejected, readable: s.readable, offers: s.offers, complete: s.complete, withWard: s.withWard, linked: s.linked, approx: s.approx })
    assert.deepEqual(pick(by.S03), { received: 6, testRejected: 3, readable: 4, offers: 2, complete: 1, withWard: 1, linked: 1, approx: false })
    assert.deepEqual(pick(by.S05), { received: 2, testRejected: 0, readable: 1, offers: 1, complete: 0, withWard: 0, linked: 0, approx: false })
    assert.deepEqual(pick(by.S06), { received: 4, testRejected: 0, readable: 3, offers: 3, complete: 3, withWard: 3, linked: 1, approx: true })
    assert.deepEqual([all.shortStay.received, all.shortStay.stored], [2, 3])
    const w7 = await getDataFlow("7d", { now: NOW })
    const s03 = w7.sources.find((s) => s.source === "S03")!
    assert.deepEqual([s03.received, s03.readable, s03.offers], [4, 3, 1], "7 ngày chỉ đếm bài/tin trong khoảng")
    assert.equal(w7.shortStay.stored, 2, "listing 19/10 nằm ngoài 7 ngày VN")
    // Câu cũ `last_seen >= $1::date` lấy phần ngày của mốc theo múi của tiến trình gửi: tiến trình chạy UTC (Vercel) gửi
    // 19/10 17:00Z → ngày 19/10 → đếm thừa listing ngày 19. Mô phỏng bằng mốc dạng chuỗi UTC.
    const sinceUtc = new Date(vn("2026-10-20T00:00:00")).toISOString()
    const cu = (await admin.query(`SELECT count(*)::int n FROM "${S}".listings WHERE last_seen >= $1::date`, [sinceUtc])).rows[0].n
    const moi = (await admin.query(`SELECT count(*)::int n FROM "${S}".listings WHERE last_seen >= ($1::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`, [sinceUtc])).rows[0].n
    assert.equal(moi, 2, "câu mới đúng cả khi mốc gửi dạng UTC")
    assert.notEqual(cu, 2, `đột biến ép ngày theo múi phiên DB phải đỏ: S01 7 ngày ${cu} ≠ 2`)
    const { rows } = await admin.query(`SELECT count(*)::int n FROM "${S}".stg_zalo_posts WHERE post_id IN ('t1','t2','t3')`)
    assert.equal(rows[0].n, 3, "đối chứng: bài thử vẫn nằm trong bảng nạp")
  })
  test("DF-AC-2 chiều đỏ — bỏ điều kiện bài thử", async () => {
    ready()
    // DF1: định nghĩa bài thử là đoạn ghim IS_TEST của pipeline/sql/600_data_flow.sql (bên tính số thật).
    const IS_TEST_SQL = `(${fragment("IS_TEST")})`
    const dem = async (pred: string) =>
      (await admin.query(`SELECT count(*)::int n FROM "${S}".stg_zalo_posts WHERE coalesce(agent_id,'') <> 'apify-facebook' AND ${pred}`)).rows[0].n
    assert.equal(await dem(`NOT ${IS_TEST_SQL}`), 6)
    const sai = await dem("true")
    assert.notEqual(sai, 6, `đột biến phải đỏ: S03 received ${sai} ≠ 6`)
    assert.equal(sai, 9)
  })
  test("DF-AC-2 S06 min — tin S06 nhiều hơn quảng cáo", async () => {
    ready()
    const { getDataFlow } = await import("../src/lib/data-flow-queries")
    const extra: Offer[] = [1, 2, 3, 4, 5].map((i) => [`m${i}`, "S06", "sale", "house", 1e9, 50, "vn-hcmc-x", IN, [], false])
    await makeSchema(`${S}_min`, extra, 2)
    const c = new pg.Client({ connectionString: schemaUrl(`${S}_min`) })
    await c.connect()
    try {
      const query = (text: string, values?: unknown[]) => c.query(text, values)
      const s06 = (await getDataFlow("all", { now: NOW, query })).sources.find((x) => x.source === "S06")!
      assert.deepEqual([s06.offers, s06.received, s06.readable], [5, 2, 2], "S06 readable = min(tin, quảng cáo)")
      // Chiều đỏ: cùng đường đọc getDataFlow, 600 đột biến luật «luôn lấy số tin» thay cho min (DF1: luật nằm ở 600).
      const goc = "least(coalesce(f.offers, 0), coalesce(r.received, 0))"
      const { flowSql } = await import("./ops-dong-chay-fixture")
      assert.ok(flowSql().includes(goc), "khuôn đột biến lệch 600: không thấy luật min của S06")
      await refreshFlow(`${S}_min`, { sql: flowSql().replace(goc, "coalesce(f.offers, 0)") })
      const sai = (await getDataFlow("all", { now: NOW, query })).sources.find((x) => x.source === "S06")!
      assert.notEqual(sai.readable, 2, `đột biến phải đỏ: S06 readable ${sai.readable} ≠ 2`)
    } finally {
      await c.end()
    }
  })
})

describe("DF-AC-3 SQL khớp levelOf", () => {
  // 1 tin đủ + mỗi tin thiếu đúng một ô theo dạng bên ghi thật sinh ra + 3 ô đủ có/không gắn căn.
  const BASE: Omit<Offer, 0 | 8 | 9> = ["S03", "sale", "apartment", 1e9, 70, "vn-hanoi-a", IN] as unknown as Omit<Offer, 0 | 8 | 9>
  const cell = (id: string, patch: Partial<Record<"kind" | "type" | "price" | "area" | "ward", unknown>>, linked = false): Offer => {
    const [source, kind, type, price, area, ward, seen] = BASE as unknown as [string, string, string, number, number, string, string]
    return [id, source, (("kind" in patch ? patch.kind : kind) as string | null), (("type" in patch ? patch.type : type) as string | null),
      (("price" in patch ? patch.price : price) as number | null), (("area" in patch ? patch.area : area) as number | null),
      (("ward" in patch ? patch.ward : ward) as string | null), seen, [], linked]
  }
  const MA_TRAN: Offer[] = [
    cell("x-du", {}),
    cell("x-type-null", { type: null }),
    cell("x-type-null-gan", { type: null }, true),
    cell("x-type-unknown", { type: "unknown" }),
    cell("x-price-null", { price: null }),
    cell("x-price-0", { price: 0 }),
    cell("x-area-null", { area: null }),
    cell("x-area-0", { area: 0 }),
    cell("x-ward-null", { ward: null }),
    cell("x-du-gan", {}, true),
    cell("x-du-2", {}),
    cell("x-thieu-gan", { type: "unknown" }, true),
  ]
  test("DF-AC-3 SQL khớp levelOf — ma trận ô thiếu trên lược đồ tạm", async () => {
    ready()
    const COMPLETE_SQL = fragment("COMPLETE")
    const { levelOf } = await import("../src/lib/data-level")
    const sch = `${S}_mt`
    await makeSchema(sch, MA_TRAN, 0)
    try {
      const { rows } = await admin.query(
        `SELECT o.offer_id, o.kind, o.property_type, o.price_vnd::float8 AS price, o.area_m2::float8 AS area, o.area_id,
                EXISTS (SELECT 1 FROM "${sch}".property_offers p WHERE p.offer_id = o.offer_id) AS linked,
                (${COMPLETE_SQL}) AS sql_du
         FROM "${sch}".sale_offers o ORDER BY 1`,
      )
      const lech = rows
        .map((r) => {
          const lv = levelOf({ kind: r.kind, propertyType: r.property_type, priceVnd: r.price, areaM2: r.area, ward: r.area_id, linked: r.linked })
          return { id: r.offer_id, sql: Boolean(r.sql_du), ts: lv !== "B0" }
        })
        .filter((x) => x.sql !== x.ts)
      assert.deepEqual(lech, [], `ô lệch SQL ↔ levelOf: ${JSON.stringify(lech)}`)
      assert.deepEqual(rows.filter((r) => r.sql_du).map((r) => r.offer_id), ["x-du", "x-du-2", "x-du-gan"], "đủ trường: đúng ba ô đủ, không ô thiếu nào")
      // Chiều đỏ: bỏ lần lượt từng vế của COMPLETE_SQL → ma trận phải bắt từng đột biến. `kind` là NOT NULL của bảng nên
      // vế «loại tin» không có dòng nào để phá — không đưa vào danh sách đột biến (giới hạn khai trong evals E3).
      const VE = ["o.property_type <> 'unknown'", "o.price_vnd > 0", "o.area_m2 > 0", "o.area_id IS NOT NULL"]
      for (const ve of VE) {
        const sai = COMPLETE_SQL.replace(ve, "true")
        assert.notEqual(sai, COMPLETE_SQL, `đột biến phải bỏ được vế ${ve}`)
        const n = (await admin.query(`SELECT count(*) FILTER (WHERE ${sai})::int n FROM "${sch}".sale_offers o`)).rows[0].n
        assert.notEqual(n, 3, `đột biến bỏ vế «${ve}» phải đỏ`)
      }
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${sch}" CASCADE`)
    }
  })
  test("DF-AC-3 DB thật — đủ trường lõi theo nguồn = levelOf", async () => {
    const COMPLETE_SQL = fragment("COMPLETE")
    const { levelOf } = await import("../src/lib/data-level")
    const { rows } = await admin.query(
      `SELECT o.source, o.kind, o.property_type, o.price_vnd::float8 AS price, o.area_m2::float8 AS area, o.area_id, (${COMPLETE_SQL}) AS sql_du
       FROM public.sale_offers o`,
    )
    const by = new Map<string, { sql: number; ts: number }>()
    for (const r of rows) {
      const x = by.get(r.source) ?? { sql: 0, ts: 0 }
      if (r.sql_du) x.sql++
      if (levelOf({ kind: r.kind, propertyType: r.property_type, priceVnd: r.price, areaM2: r.area, ward: r.area_id, linked: false }) !== "B0") x.ts++
      by.set(r.source, x)
    }
    console.log(`# DF-AC-3 DB thật ${JSON.stringify(Object.fromEntries(by))}`)
    assert.ok(rows.length > 0, "đối chứng: DB thật phải có tin để so (bảng rỗng = phép đo xanh rỗng)")
    for (const [src, x] of by) assert.equal(x.sql, x.ts, `nguồn ${src}: SQL ${x.sql} ≠ levelOf ${x.ts}`)
  })
})

// ---------- AC-5: nút thắt ----------
describe("DF-AC-5 nút thắt", () => {
  type Row = Parameters<typeof import("../src/components/ops/data-flow/quality-rows").healthOf>[0]
  const H = 3600000
  const at = (h: number) => new Date(NOW - h * H).toISOString()
  const row = (p: Partial<Row>): Row => ({
    id: "x", name: "x", meta: "", received: 100, readable: 90, offers: 50, complete: 45, withWard: 45, linked: 45, latestAt: at(1), approx: false, ...p,
  })
  const MA: [string, Row, string][] = [
    ["1 đọc 26%", row({ readable: 26 }), "Kẹt · đọc"],
    ["2 trường lõi 0%", row({ readable: 96, complete: 0 }), "Kẹt · trường lõi"],
    ["3 phường 40%", row({ readable: 70, complete: 45, withWard: 20 }), "Kẹt · phường"],
    ["4 gắn căn 10%", row({ linked: 5 }), "Kẹt · gắn căn"],
    ["5 kẹt thắng im", row({ readable: 26, latestAt: at(72) }), "Kẹt · đọc"],
    ["6 im 3 ngày", row({ latestAt: at(72) }), "Im 3 ngày"],
    ["7 đọc 55%", row({ readable: 55 }), "Theo dõi · đọc"],
    ["8 khoẻ", row({}), "Khoẻ"],
    ["9 nhóm thu", row({ complete: null, withWard: null, linked: null }), "Khoẻ"],
  ]
  test("DF-AC-5 nút thắt — ma trận chín hàng", async () => {
    const { healthOf } = await import("../src/components/ops/data-flow/quality-rows")
    const lech = MA.filter(([, r, want]) => healthOf(r, NOW).label !== want).map(([ten, r, want]) => `${ten}: ${healthOf(r, NOW).label} ≠ ${want}`)
    assert.deepEqual(lech, [])
  })
  test("DF-AC-5 chiều đỏ — đổi thứ tự luật (gắn căn trước đọc)", async () => {
    const { healthOf, NUT_THAT_CHECKS } = await import("../src/components/ops/data-flow/quality-rows")
    const nguoc = [...NUT_THAT_CHECKS].reverse()
    const r1 = row({ readable: 26, linked: 5 })
    assert.equal(healthOf(r1, NOW).label, "Kẹt · đọc")
    assert.notEqual(healthOf(r1, NOW, nguoc).label, "Kẹt · đọc", "đột biến phải đỏ ở hàng 1")
  })
})

// ---------- AC-6, AC-8, AC-10: bảng tin, hồ sơ tin, trạng thái, ảnh ----------
type Rec = import("../src/lib/data-flow-queries").FlowRecord
const rec = (p: Partial<Rec>): Rec => ({
  offerId: "r", source: "S03", kind: "sale", propertyType: "unknown", priceVnd: 3_200_000_000, areaM2: 81, bedrooms: 3,
  ward: null, market: null, confidence: "medium", nPosts: 1, linked: false, firstSeen: "2026-10-25 09:00:00+00",
  lastSeen: "2026-10-25 09:00:00+00", postText: "3pn 81m2 có sổ 3,2 tỷ", postGroup: "Nhóm A", ...p,
})
const RECS: Rec[] = [
  rec({ offerId: "a", source: "S03" }),
  rec({ offerId: "b", source: "S03", kind: "rent_lt", propertyType: "apartment", ward: "Bảy Hiền", market: "Thành phố Hồ Chí Minh" }),
  rec({ offerId: "c", source: "S05", kind: "rent_lt", propertyType: "apartment", ward: "Láng", market: "Thành phố Hà Nội" }),
  rec({ offerId: "d", source: "S06", propertyType: "house", ward: "Tân Định", market: "Thành phố Hồ Chí Minh", linked: true, postText: null, postGroup: null }),
  rec({ offerId: "e", source: "S06", kind: "rent_lt", propertyType: "apartment", ward: "Bến Nghé", market: "Thành phố Hồ Chí Minh", linked: false, postText: null }),
  rec({ offerId: "f", source: "S06", propertyType: "apartment", ward: "Láng", market: "Thành phố Hà Nội", linked: true, postText: null }),
]

describe("DF-AC-6 bộ lọc và hồ sơ tin", () => {
  type Q = import("../src/components/reui/filters/filters-types").FilterQuery
  const q = async (rules: { field: string; op: string; values: string[] }[]): Promise<Q> => {
    const { createFilterQuery, createFilterRule } = await import("../src/components/reui/filters/filters-query")
    return createFilterQuery(rules.map((r, i) => createFilterRule({ id: `r${i}`, path: [r.field], operator: r.op, value: r.values }))) as Q
  }
  const CAU: [string, { field: string; op: string; values: string[] }[], string[]][] = [
    ["Nguồn là S03", [{ field: "source", op: "is_any_of", values: ["S03"] }], ["a", "b"]],
    ["Nguồn không phải S06", [{ field: "source", op: "is_none_of", values: ["S06"] }], ["a", "b", "c"]],
    ["Loại tin là Cho thuê", [{ field: "kind", op: "is_any_of", values: ["rent_lt"] }], ["b", "c", "e"]],
    ["Loại hình là Căn hộ", [{ field: "type", op: "is_any_of", values: ["apartment"] }], ["b", "c", "e", "f"]],
    ["Thị trường là Hồ Chí Minh", [{ field: "market", op: "is_any_of", values: ["Thành phố Hồ Chí Minh"] }], ["b", "d", "e"]],
    ["Bậc là B0", [{ field: "level", op: "is_any_of", values: ["B0"] }], ["a"]],
    ["Bậc là B2", [{ field: "level", op: "is_any_of", values: ["B2"] }], ["d", "f"]],
    ["Nguồn là S03 VÀ Bậc là B0", [{ field: "source", op: "is_any_of", values: ["S03"] }, { field: "level", op: "is_any_of", values: ["B0"] }], ["a"]],
  ]
  test("DF-AC-6 bộ lọc — 6 tin × 8 câu lọc", async () => {
    const { compileRecordFilter } = await import("../src/components/ops/data-flow/records-filter")
    for (const [ten, rules, want] of CAU) assert.deepEqual(RECS.filter(compileRecordFilter(await q(rules))).map((r) => r.offerId), want, ten)
  })
  test("DF-AC-6 chiều đỏ — bộ lọc bỏ đảo is_none_of", async () => {
    const { compileRecordFilter } = await import("../src/components/ops/data-flow/records-filter")
    const dotBien = (query: Q) => (r: Rec) =>
      compileRecordFilter({ ...query, rules: query.rules.map((c) => ({ ...c, operator: "is_any_of" })) } as Q)(r)
    const [ten, rules, want] = CAU[1]
    assert.notDeepEqual(RECS.filter(dotBien(await q(rules))).map((r) => r.offerId), want, `đột biến phải đỏ: ${ten}`)
  })
  test("DF-AC-6 hàng bảng — bậc và x/5 trường lõi", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const root = await render(<RecordsGrid records={[RECS[0]]} roles={{}} />)
    const tr = root.querySelector("tbody tr")!
    assert.match(tr.textContent ?? "", /B0 · Có lời khai/)
    assert.match(tr.textContent ?? "", /3\/5 trường lõi/)
  })
  test("DF-AC-6 hồ sơ tin — điều kiện lên bậc kế", async () => {
    const { RecordSheet } = await import("../src/components/ops/data-flow/record-sheet")
    await render(<RecordSheet record={RECS[0]} roles={{}} onOpenChange={() => {}} />)
    let d = dialogs()[0]
    assert.match(d.textContent ?? "", /Trường lõi 3\/5/)
    assert.match(d.textContent ?? "", /Lên B1 cần đủ năm trường lõi — còn thiếu loại hình, phường\./)
    assert.match(d.querySelector("blockquote")?.textContent ?? "", /3pn 81m2/)
    await render(<RecordSheet record={RECS[3]} roles={{}} onOpenChange={() => {}} />)
    d = dialogs()[0]
    assert.match(d.textContent ?? "", /Trường lõi 5\/5/)
    assert.match(d.textContent ?? "", /Lên B3 cần số đo trên nhãn cho các trường lõi \(PL7, PL9\)\./)
    assert.match(d.textContent ?? "", /S06 chưa lưu khoá nối ngược tin → bài \(TV10\)\./)
    await render(<RecordSheet record={RECS[4]} roles={{}} onOpenChange={() => {}} />)
    assert.match(dialogs()[0].textContent ?? "", /Lên B2 cần gắn được tin về một căn\./)
  })
  test("DF-AC-6 bấm nút tiêu đề — hồ sơ mở và ở lại", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const root = await render(<RecordsGrid records={RECS} roles={{}} />)
    const nut = [...root.querySelectorAll("tbody button")].find((b) => b.textContent?.includes("3,2 tỷ"))
    await click(nut, "nút tiêu đề")
    await act(() => new Promise((r) => setTimeout(r, 60)))
    assert.equal(dialogs().length, 1, "bấm nút tiêu đề: hồ sơ phải mở và còn sau một nhịp")
    await closeSheets()
    const o = root.querySelector("tbody tr td:nth-child(2)")
    await click(o, "ô Nguồn")
    assert.equal(dialogs().length, 1, "bấm ô khác của hàng: hồ sơ mở")
    await closeSheets()
  })
})

describe("DF-AC-8 trống", () => {
  test("DF-AC-8 trống — đường ống, bảng tin, lưới", async () => {
    const { FlowSankey } = await import("../src/components/ops/data-flow/flow-sankey")
    let root = await render(<FlowSankey sources={[sf("S03", 0, 0, 0, 0), sf("S06", 0, 0, 0, 0)]} roles={{}} />)
    assert.match(root.textContent ?? "", /Chưa có bài trong khoảng này/)
    assert.equal([...root.querySelectorAll("button")].filter((b) => b.textContent?.trim() === "Xem tất cả nguồn").length, 1)
    root = await render(<FlowSankey sources={[sf("S03", 10, 4, 2, 0)]} roles={{}} />)
    assert.doesNotMatch(root.textContent ?? "", /Chưa có bài trong khoảng này/)
    const dong = [...root.querySelectorAll("ul.sr-only li")].map((li) => li.textContent ?? "")
    assert.ok(dong.some((t) => t.includes("tới Bài nhận: 10")), `đối chứng dương: có bài thì đường ống vẽ dòng chảy (${dong.join(" | ")})`)
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    root = await render(<RecordsGrid records={[]} roles={{}} />)
    assert.match(root.textContent ?? "", /Không có tin nào khớp bộ lọc/)
    const { QualityGrid } = await import("../src/components/ops/data-flow/quality-grid")
    root = await render(<QualityGrid bySource={[]} byGroup={[]} />)
    assert.match(root.textContent ?? "", /Chưa có nguồn nào có bài trong khoảng này/)
  })
})

describe("DF-AC-10 ảnh tin", () => {
  type User = import("../src/lib/auth").User
  const ADMIN: User = { id: "1", email: "a@local.test", plan: "free", role: "admin" }
  const OPS: User = { id: "2", email: "o@local.test", plan: "free", role: "ops" }
  test("DF-AC-10 nạp ảnh theo quyền", async () => {
    ready()
    const { loadFlowMedia } = await import("../src/lib/data-flow-queries")
    const { buildOfferImages } = await import("../src/lib/ops/review-media")
    const records = [{ offerId: "o1", source: "S03" }, { offerId: "o2", source: "S03" }, { offerId: "o3", source: "S05" }, { offerId: "c1", source: "S06" }]
    const got = await loadFlowMedia(records, ADMIN)
    const posts = async (id: string) =>
      (
        await admin.query(
          `SELECT o.offer_id, p.snapshot_id, p.media, p.media_files FROM "${S}".sale_offers o
           CROSS JOIN LATERAL unnest(o.post_ids) WITH ORDINALITY AS u(post_id, ord) JOIN "${S}".stg_zalo_posts p ON p.post_id = u.post_id
           WHERE o.offer_id = $1 ORDER BY u.ord`,
          [id],
        )
      ).rows
    for (const id of ["o1", "o2", "o3"]) assert.deepEqual(got[id], buildOfferImages(await posts(id)), `tin ${id}`)
    assert.ok(got.o1.length >= 2, "tin gộp 2 bài có ảnh")
    assert.equal(new Set(got.o1.map((i) => i.src)).size, got.o1.length, "URL trùng chỉ một lần")
    assert.deepEqual(got.o2, [], "tin không ảnh → []")
    assert.equal("c1" in got, false, "S06 không truy vấn ảnh")
    const nguoc = buildOfferImages((await posts("o1")).reverse())
    assert.notDeepEqual(got.o1, nguoc, "đột biến thứ tự ngược post_ids phải đỏ ở tin o1")
    let goi = 0
    const dem: import("../src/lib/data-flow-queries").MediaQuery = async () => {
      goi++
      return { rows: [] }
    }
    assert.deepEqual(await loadFlowMedia(records, OPS, dem), {})
    assert.deepEqual(await loadFlowMedia(records, null, dem), {})
    assert.equal(goi, 0, "người không phải admin: 0 truy vấn ảnh")
    const boKiem: typeof loadFlowMedia = (r, u, qq) => loadFlowMedia(r, u ? { ...u, role: "admin" } : u, qq)
    assert.notDeepEqual(await boKiem(records, OPS), {}, "đột biến bỏ kiểm isAdmin phải đỏ: người không phải admin không được nhận ảnh")
    const vang: import("../src/lib/data-flow-queries").MediaQuery = async () => {
      throw Object.assign(new Error("relation does not exist"), { code: "42P01" })
    }
    assert.deepEqual(await loadFlowMedia(records, ADMIN, vang), {})
  })
  test("DF-AC-10 dải ảnh trong hồ sơ tin", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const img = (n: number) => ({ src: `https://photo-stal-1.zdn.vn/${n}.jpg`, origin: "remote" as const, expiring: true })
    const media = { a: [img(1), img(2)], b: [] }
    const root = await render(<RecordsGrid records={RECS} roles={{}} media={media} />)
    assert.equal(root.querySelectorAll("img").length, 0, "bảng không tải ảnh")
    const open = async (id: string) => {
      const tr = [...root.querySelectorAll("tbody tr")][RECS.findIndex((r) => r.offerId === id)]
      await click(tr?.querySelector("td:nth-child(2)"), `hàng ${id}`)
      return dialogs()[0]
    }
    let d = await open("a")
    const g = d.querySelector("[role=group][aria-label^='Ảnh']")
    assert.ok(g, "hồ sơ tin a có dải ảnh")
    assert.deepEqual([...g!.querySelectorAll("img")].map((i) => i.getAttribute("src")), [img(1).src, img(2).src], "ảnh phải thuộc đúng tin đang mở")
    await closeSheets()
    d = await open("b")
    assert.match(d.textContent ?? "", /không có ảnh/)
    assert.equal(d.querySelectorAll("img").length, 0)
    await closeSheets()
    d = await open("d")
    assert.match(d.textContent ?? "", /Chưa gắn được ảnh: S06 chưa lưu khoá nối ngược tin → quảng cáo \(TV10\)\./)
    await closeSheets()
    const root2 = await render(<RecordsGrid records={RECS} roles={{}} />)
    await click([...root2.querySelectorAll("tbody tr")][0]?.querySelector("td:nth-child(2)"), "hàng a (không admin)")
    d = dialogs()[0]
    assert.equal(d.querySelectorAll("[role=group][aria-label^='Ảnh'] img").length, 0, "không admin: 0 ảnh")
    assert.doesNotMatch(d.textContent ?? "", /không có ảnh/)
    await closeSheets()
  })
})

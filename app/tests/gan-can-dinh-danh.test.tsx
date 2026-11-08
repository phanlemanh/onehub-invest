// gan-can-dinh-danh.test.tsx — hồ sơ _acceptance/gan-can-dinh-danh-duy-nhat: «Gắn căn» = nhận diện duy nhất khớp danh bạ.
// Tên ca mở đầu bằng mã AC (GGC-AC-n). Ca DB dựng lược đồ tạm `ggc_*_<pid>` (khuôn ops-dong-chay-fixture + ma trận viết
// trước), làm tươi bằng pipeline/sql/600 THẬT, xoá cuối lượt. Mỗi phép đo có chiều đỏ trên CÙNG fixture, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { JSDOM } from "jsdom"
import pg from "pg"
import type { ReactNode } from "react"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { makeOpsSchema, schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { NOW, ROOT, flowSql, inSchema, makeFlowSchema, refreshFlow, vn } from "./ops-dong-chay-fixture"

const P = process.pid
const S_LOCAL = `ggc_local_${P}` // máy thu: bảng bản tin + bảng dòng chảy + ma trận
const S_CLOUD = `ggc_cloud_${P}` // máy chủ: chỉ bảng đã sync, KHÔNG cột unit_number, street_number
const SCHEMAS = [S_LOCAL, S_CLOUD]
process.env.DATABASE_URL = schemaUrl(S_CLOUD) // pool của app = máy chủ — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "ggc-thu"
delete process.env.VERCEL

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) ----------
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
const txt = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim()

// =====================================================================================================================
// AC-1, AC-2 — từ điển và FRAMING: bộ kiểm thuần trả danh sách lỗi; chiều đỏ chạy cùng bộ kiểm trên bản sao chữ đã phá.
// =====================================================================================================================

/** Khối thuật ngữ «**<nhãn>**: …» tới khối kế (dòng in đậm mới hay tiêu đề ##). */
function khoi(text: string, nhan: string): string | null {
  const lines = text.split("\n")
  const i = lines.findIndex((l) => l.startsWith(`**${nhan}**:`))
  if (i < 0) return null
  let j = i + 1
  while (j < lines.length && !/^\*\*[^*]+\*\*:/.test(lines[j]) && !/^#{1,3} /.test(lines[j])) j++
  return lines.slice(i, j).join("\n")
}
function mucCua(text: string, nhan: string): string | null {
  let muc: string | null = null
  for (const l of text.split("\n")) {
    if (/^## /.test(l)) muc = l.slice(3).trim()
    if (l.startsWith(`**${nhan}**:`)) return muc
  }
  return null
}

export function kiemContext(text: string): string[] {
  const loi: string[] = []
  const can: Record<string, string[]> = { "Gắn căn": ["danh bạ", "mã căn", "số nhà"], "Định vị": ["danh bạ", "trục"], "Gom cụm": ["không phải một bậc"] }
  for (const [nhan, chu] of Object.entries(can)) {
    const k = khoi(text, nhan)
    if (!k) {
      loi.push(`GGC-AC-1 thiếu khối: ${nhan}`)
      continue
    }
    if (mucCua(text, nhan) !== "Tài sản & tin") loi.push(`GGC-AC-1 sai mục: ${nhan}`)
    const dinhNghia = k.split("\n")[0].slice(`**${nhan}**:`.length).trim()
    if (!dinhNghia) loi.push(`GGC-AC-1 định nghĩa rỗng: ${nhan}`)
    for (const c of chu) if (!dinhNghia.includes(c)) loi.push(`GGC-AC-1 định nghĩa ${nhan} thiếu: ${c}`)
    if (!/^- Code:/m.test(k)) loi.push(`GGC-AC-1 thiếu Code: ${nhan}`)
    if (!/^- Slug URL:/m.test(k)) loi.push(`GGC-AC-1 thiếu Slug URL: ${nhan}`)
    if (!/^_Avoid_:/m.test(k)) loi.push(`GGC-AC-1 thiếu _Avoid_: ${nhan}`)
  }
  const can2 = khoi(text, "Căn nhà") ?? ""
  if (can2.includes("hiện là cụm tin S06")) loi.push("GGC-AC-1 Căn nhà còn gọi cụm S06 là căn")
  const dc = khoi(text, "Dòng chảy dữ liệu") ?? ""
  for (const c of ["Gom cụm", "Định vị", "Gắn căn"]) if (!dc.includes(c)) loi.push(`GGC-AC-1 Dòng chảy thiếu: ${c}`)
  if (dc.includes("Chưa gắn căn")) loi.push("GGC-AC-1 Dòng chảy còn nhánh Chưa gắn căn")
  return loi
}

const BAC_MOI = ["B0 Có lời khai", "B1 Tin", "B2 Định vị", "B3 Gắn căn", "B4 Làm giàu", "B5 Sống"]
export function kiemFraming(text: string): string[] {
  const loi: string[] = []
  const a = text.indexOf("### 3.4")
  const b = text.indexOf("\n### ", a + 1)
  const s34 = a < 0 ? "" : text.slice(a, b < 0 ? undefined : b)
  const bac = [...s34.matchAll(/^\| \*\*(B\d)\*\* \| ([^|]+?) \|/gm)].map((m) => `${m[1]} ${m[2].trim()}`)
  if (bac.length !== 6) loi.push(`GGC-AC-2 bảng bậc có ${bac.length} dòng`)
  BAC_MOI.forEach((want, i) => {
    if (bac[i] !== want) loi.push(`GGC-AC-2 bảng bậc lệch ở ${want.slice(0, 2)}`)
  })
  for (const c of ["Gắn căn = nhận diện duy nhất", "không phải một bậc", "Đổi thang 08/11 là lần hạ một lần", "nhà phố, đất có số nhà thật → B4"])
    if (!s34.includes(c)) loi.push(`GGC-AC-2 §3.4 thiếu: ${c}`)
  if (!/North star.*tách B2 «định vị» với B3–B5/.test(text)) loi.push("GGC-AC-2 North star chưa sửa")
  if (!/Độ tươi.*ba quãng/.test(text)) loi.push("GGC-AC-2 Độ tươi chưa sửa")
  if (!/^\| 2026-11-08 \| §3\.4 viết lại thang bậc/m.test(text)) loi.push("GGC-AC-2 thiếu dòng nhật ký 08/11")
  if (text.includes("Gắn căn (suy ra)") || /^\| \*\*B2\*\* \| Gắn căn \|/m.test(text)) loi.push("GGC-AC-2 còn B2 Gắn căn cũ")
  if (!text.includes("Viết lại 08/11: B2 Định vị")) loi.push("GGC-AC-2 dòng quyết định §8 chưa sửa")
  return loi
}

describe("từ điển và FRAMING", () => {
  const context = readFileSync(join(ROOT, "CONTEXT.md"), "utf8")
  const framing = readFileSync(join(ROOT, "docs/product/FRAMING.md"), "utf8")

  test("GGC-AC-1 CONTEXT.md có Gắn căn, Định vị, Gom cụm đủ bốn dòng; Căn nhà và Dòng chảy theo thang mới", () => {
    assert.deepEqual(kiemContext(context), [])
    // Chiều đỏ: bỏ dòng _Avoid_ của «Gom cụm»; định nghĩa «Gắn căn» thành cụm cũ.
    const k = khoi(context, "Gom cụm")!
    const boAvoid = context.replace(k, k.split("\n").filter((l) => !l.startsWith("_Avoid_:")).join("\n"))
    assert.ok(kiemContext(boAvoid).includes("GGC-AC-1 thiếu _Avoid_: Gom cụm"))
    const g = khoi(context, "Gắn căn")!
    const cu = context.replace(g.split("\n")[0], "**Gắn căn**: tin có dòng property_offers.")
    assert.ok(kiemContext(cu).includes("GGC-AC-1 định nghĩa Gắn căn thiếu: danh bạ"))
  })

  test("GGC-AC-2 FRAMING §3.4 đúng thang Mạnh duyệt 08/11, năm dòng nhắc thang cũ đã sửa, có nhật ký", () => {
    assert.deepEqual(kiemFraming(framing), [])
    const cu = framing.replace(/^\| \*\*B2\*\* \| Định vị \|/m, "| **B2** | Gắn căn |")
    assert.ok(kiemFraming(cu).includes("GGC-AC-2 bảng bậc lệch ở B2"))
  })
})

// =====================================================================================================================
// AC-3, AC-4 — 600 THẬT trên ma trận viết trước.
// =====================================================================================================================

const TODAY = "2026-10-26T09:00:00" // NOW = 12:00 VN 26/10
const D20 = "2026-10-06T09:00:00" // trong 30 ngày, ngoài 7 ngày
const D60 = "2026-08-27T09:00:00" // ngoài 30 ngày
type Win = "7d" | "30d" | "all"
const inWin = (seen: string, w: Win) => w === "all" || seen === TODAY || (w === "30d" && seen === D20)

// [id, nguồn, ngày, cụm, toà, mã căn, số nhà, đường, khu, kỳ vọng {cụm, chờ định vị, chờ định danh}]
type Tin = { id: string; src: "S03" | "S05" | "S06"; seen: string; cum: number | null; toa: string | null; ma: string | null; so: string | null; duong: string | null; khu: string | null; ky: { cum: boolean; toa: boolean; danh: boolean } }
const T = (id: string, src: Tin["src"], seen: string, cum: number | null, toa: string | null, ma: string | null, so: string | null, duong: string | null, khu: string | null, ky: Tin["ky"]): Tin => ({ id, src, seen, cum, toa, ma, so, duong, khu, ky })
const F = false
const MA_TRAN: Tin[] = [
  T("a1", "S06", TODAY, 101, null, null, null, null, "vn-hcmc-x", { cum: F, toa: F, danh: F }), // cụm một tin
  T("a2", "S06", TODAY, 102, null, null, null, null, "vn-hcmc-x", { cum: true, toa: F, danh: F }), // cụm hai tin sống
  T("a3", "S06", D20, 102, null, null, null, null, "vn-hcmc-x", { cum: true, toa: F, danh: F }),
  T("a10", "S06", D60, 102, null, null, null, null, "vn-hcmc-x", { cum: true, toa: F, danh: F }), // cụm ba tin
  T("a4", "S06", TODAY, 103, null, null, null, null, "vn-hcmc-x", { cum: F, toa: F, danh: F }), // cụm có một tin đã nghỉ
  T("a5", "S06", D20, null, "A1", "0", null, null, "vn-hcmc-x", { cum: F, toa: true, danh: F }), // mã «0» là cờ
  T("a6", "S06", D60, null, "A1", "1205", null, null, "vn-hcmc-x", { cum: F, toa: true, danh: true }),
  T("a7", "S06", TODAY, null, null, null, "12", "Lê Lợi", "vn-hcmc-x", { cum: F, toa: F, danh: true }),
  T("a8", "S06", TODAY, null, null, null, "1", "Lê Lợi", "vn-hcmc-x", { cum: F, toa: F, danh: F }), // số nhà «1» là cờ
  T("a9", "S06", D20, null, null, null, "12", "Lê Lợi", "vn-hcmc", { cum: F, toa: F, danh: F }), // khu là thị trường
  T("b1", "S03", TODAY, null, "S2", null, null, null, "vn-hanoi-a", { cum: F, toa: true, danh: F }),
  T("b2", "S03", TODAY, null, null, "LD2xx13", null, null, "vn-hanoi-a", { cum: F, toa: true, danh: F }), // trục, không toà
  T("b3", "S03", D60, null, "H2", "H2.1129", null, null, "vn-hanoi-a", { cum: F, toa: true, danh: true }),
  T("e1", "S05", TODAY, null, null, null, null, null, null, { cum: F, toa: F, danh: F }),
]
const SRC = ["S03", "S05", "S06"] as const
const KEYS = ["offers", "clustered", "located", "unitLinked", "locatedPending", "uniqueIdPending", "deepest.unitLinked", "deepest.located", "deepest.clustered"] as const

/** Bảng kỳ vọng RÚT TỪ ma trận (không viết tay số). Định vị, Gắn căn: chưa có bảng nối tin → nút danh bạ nên 0. */
function kyVong(w: Win, src: string): Record<(typeof KEYS)[number], number> {
  const r = MA_TRAN.filter((t) => t.src === src && inWin(t.seen, w))
  const n = (f: (t: Tin) => boolean) => r.filter(f).length
  return {
    offers: r.length,
    clustered: n((t) => t.ky.cum),
    located: 0,
    unitLinked: 0,
    locatedPending: n((t) => t.ky.toa),
    uniqueIdPending: n((t) => t.ky.danh),
    "deepest.unitLinked": 0,
    "deepest.located": 0,
    "deepest.clustered": n((t) => t.ky.cum),
  }
}
type Facts = { sources: Record<string, unknown>[]; days: Record<string, unknown>[] }
const lay = (s: Record<string, unknown>, k: string) =>
  k.includes(".") ? (s[k.split(".")[0]] as Record<string, unknown> | undefined)?.[k.split(".")[1]] : s[k]

/** So facts của ba cửa sổ với bảng kỳ vọng; trả lỗi dạng «GGC-AC-3 <nguồn> <cửa sổ> <khoá>». */
function soMuc(byWin: Record<Win, Facts>): string[] {
  const loi: string[] = []
  for (const w of ["7d", "30d", "all"] as const)
    for (const src of SRC) {
      const s = byWin[w].sources.find((x) => x.source === src) ?? {}
      const want = kyVong(w, src)
      for (const k of KEYS) if (lay(s, k) !== want[k]) loi.push(`GGC-AC-3 ${src} ${w} ${k}: ${String(lay(s, k))} ≠ ${want[k]}`)
    }
  return loi
}
function soDanhBa(byWin: Record<Win, Facts>): string[] {
  const loi: string[] = []
  for (const w of ["7d", "30d", "all"] as const) {
    for (const s of byWin[w].sources) {
      if (s.unitLinked !== 0) loi.push(`GGC-AC-4 chữ trên tin tính là gắn căn: ${String(s.source)} ${w}`)
      if (s.located !== 0) loi.push(`GGC-AC-4 chữ trên tin tính là định vị: ${String(s.source)} ${w}`)
    }
    for (const d of byWin[w].days) if (d.unitLinked !== 0) loi.push(`GGC-AC-4 chữ trên tin tính là gắn căn: ngày ${String(d.day)}`)
  }
  return loi
}

const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

/** Chèn ma trận vào lược đồ: tin rao (view sống = bảng ở lược đồ tạm), cụm qua property_offers, khu vực. «Tin đã nghỉ» =
 * dòng property_offers trỏ offer_id KHÔNG có trong sale_offers — đúng như view sống bỏ tin có retired_at. */
async function napMaTran(schema: string) {
  for (const [id, type, name] of [["vn-hcmc", "market", "TP HCM"], ["vn-hcmc-x", "submarket", "Phường X"], ["vn-hanoi-a", "submarket", "Phường A"]])
    await admin.query(`INSERT INTO "${schema}".areas (id, region_type, name, country_code) VALUES ($1, $2, $3, 'VN') ON CONFLICT DO NOTHING`, [id, type, name])
  for (const t of MA_TRAN) {
    await admin.query(
      `INSERT INTO "${schema}".sale_offers (offer_id, source, kind, property_type, price_vnd, area_m2, area_id, first_seen, last_seen,
         post_ids, confidence, n_reposts, block_raw, unit_number, street_number, street_raw)
       VALUES ($1,$2,'sale','apartment',3000000000,70,$3,$4,$4,'{}','medium',1,$5,$6,$7,$8)`,
      [t.id, t.src, t.khu, vn(t.seen), t.toa, t.ma, t.so, t.duong],
    )
    if (t.cum !== null) await admin.query(`INSERT INTO "${schema}".property_offers (property_id, offer_id) VALUES ($1, $2)`, [t.cum, t.id])
  }
  await admin.query(`INSERT INTO "${schema}".property_offers (property_id, offer_id) VALUES (103, 'r-da-nghi')`)
}
async function factsOf(schema: string): Promise<Record<Win, Facts>> {
  const { rows } = await admin.query(`SELECT time_window, facts FROM "${schema}".data_flow_snapshot`)
  return Object.fromEntries(rows.map((r) => [r.time_window, r.facts])) as Record<Win, Facts>
}
const lamTuoi = (sql?: string) => refreshFlow(S_LOCAL, { now: NOW, sql })
const doi = (sql: string, from: string, to: string) => {
  assert.equal(sql.split(from).length, 2, `bản đột biến không trúng đúng một chỗ: ${from}`)
  return sql.replace(from, to)
}

for (const [sig, ma] of [["SIGTERM", 143], ["SIGINT", 130]] as const)
  process.once(sig, () => {
    const c = new pg.Client({ connectionString: localDbUrl() })
    c.connect()
      .then(async () => {
        for (const s of SCHEMAS) await c.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
      })
      .catch(() => {})
      .finally(() => {
        c.end().catch(() => {})
        process.exit(ma)
      })
  })

before(async () => {
  try {
    await admin.connect()
    await makeOpsSchema(admin, S_LOCAL)
    await makeFlowSchema(admin, S_LOCAL, { fresh: false, offers: [], ads: 0 })
    await napMaTran(S_LOCAL)
    await lamTuoi()
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  currentRoot = null
  document.body.innerHTML = ""
  for (const s of SCHEMAS) await admin.query(`DROP SCHEMA IF EXISTS "${s}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

describe("600 đếm mức nhận diện", () => {
  test("GGC-AC-3 ba cửa sổ × ba nguồn đúng bảng rút từ ma trận; cụm một tin không vào Gom cụm; facts không còn linked", async () => {
    ready()
    await lamTuoi()
    const f = await factsOf(S_LOCAL)
    assert.deepEqual(soMuc(f), [])
    for (const w of ["7d", "30d", "all"] as const) {
      for (const s of f[w].sources) assert.ok(!("linked" in s), `sources ${w} còn khoá linked`)
      for (const d of f[w].days) assert.ok(!("linked" in d), `days ${w} còn khoá linked`)
    }
    // Chiều đỏ 1: đếm mọi tin có dòng property_offers là Gom cụm.
    const sql = flowSql()
    await lamTuoi(doi(sql, "WHERE po.offer_id = o.offer_id AND c.n >= 2", "WHERE po.offer_id = o.offer_id AND c.n >= 1"))
    const do1 = soMuc(await factsOf(S_LOCAL))
    assert.ok(do1.some((l) => l.startsWith("GGC-AC-3 S06 7d clustered")), `cụm một tin tính là gom cụm — thước phải đỏ: ${do1.join(" | ")}`)
    // Chiều đỏ 2: chờ định vị chỉ đọc toà (bỏ trục).
    await lamTuoi(doi(sql, "nullif(btrim(o.block_raw), '') IS NOT NULL OR o.unit_number ~* 'xx'/*LOCATED_PENDING", "nullif(btrim(o.block_raw), '') IS NOT NULL/*LOCATED_PENDING"))
    const do2 = soMuc(await factsOf(S_LOCAL))
    assert.ok(do2.some((l) => l.startsWith("GGC-AC-3 S03 7d locatedPending")), `bỏ trục — thước phải đỏ: ${do2.join(" | ")}`)
    await lamTuoi()
  })

  test("GGC-AC-4 Định vị và Gắn căn bằng 0 khi chưa có bảng nối danh bạ; chữ trên tin chỉ vào chờ khớp", async () => {
    ready()
    await lamTuoi()
    const f = await factsOf(S_LOCAL)
    assert.deepEqual(soDanhBa(f), [])
    // Đối chứng dương: có chữ toà và định danh mà vẫn không vào hai cột danh bạ.
    const all = (src: string) => f.all.sources.find((s) => s.source === src)!
    assert.ok((all("S03").locatedPending as number) > 0, "S03 phải có tin chờ định vị")
    assert.ok((all("S06").uniqueIdPending as number) > 0, "S06 phải có tin chờ định danh")
    const sql = flowSql()
    await lamTuoi(doi(sql, "count(*) FILTER (WHERE m.unit_linked) AS unit_linked", "count(*) FILTER (WHERE m.dinh_danh) AS unit_linked"))
    assert.ok(soDanhBa(await factsOf(S_LOCAL)).some((l) => l.startsWith("GGC-AC-4 chữ trên tin tính là gắn căn")))
    await lamTuoi(doi(sql, "count(*) FILTER (WHERE m.located) AS located", "count(*) FILTER (WHERE m.ghi_toa) AS located"))
    assert.ok(soDanhBa(await factsOf(S_LOCAL)).some((l) => l.startsWith("GGC-AC-4 chữ trên tin tính là định vị")))
    await lamTuoi()
  })
})

// =====================================================================================================================
// AC-5 … AC-8 — lưới, Sankey, luật nút thắt, biểu đồ ngày, ngăn tin.
// =====================================================================================================================

type DF = import("../src/lib/data-flow-queries").DataFlow
type SF = import("../src/lib/data-flow-queries").SourceFlow
type QR = import("../src/components/ops/data-flow/quality-rows").QualityRow

/** DataFlow máy thu của cửa sổ `w` — getDataFlow THẬT trên lược đồ máy thu (query gắn search_path). */
async function flowLocal(w: Win): Promise<DF> {
  const { getDataFlow } = await import("../src/lib/data-flow-queries")
  return inSchema(S_LOCAL, (c) => getDataFlow(w, { now: NOW, mode: "local", query: (t, v) => c.query(t, v) }))
}

/** Ô của ba cột mức nhận diện theo hàng (tên hàng → chữ ô), đọc từ bảng DOM thật. */
function oBaCot(root: Element): { thu: string[]; o: Record<string, string[]> } {
  const th = [...root.querySelectorAll("thead th")].map((e) => txt(e))
  const idx = ["Gom cụm", "Định vị", "Gắn căn"].map((t) => th.indexOf(t))
  const o: Record<string, string[]> = {}
  for (const tr of root.querySelectorAll("tbody tr")) {
    const td = [...tr.querySelectorAll("td")]
    if (td.length < th.length) continue
    o[txt(td[0])] = idx.map((i) => txt(td[i]))
  }
  return { thu: th, o }
}
async function luoi(rows: QR[]) {
  const { QualityGrid } = await import("../src/components/ops/data-flow/quality-grid")
  return render(<QualityGrid bySource={rows} byGroup={[]} />)
}
const pct = async (a: number, b: number) => (await import("../src/lib/format")).fmtPct(a / b, 0)

describe("lưới Chất lượng từng chặng", () => {
  test("GGC-AC-5 ba cột Gom cụm · Định vị · Gắn căn sau «Có phường», số và phần trăm trên Tin rao, chờ khớp, «—» cho S01 và nhóm thu", async () => {
    ready()
    const { sourceRows, groupRows } = await import("../src/components/ops/data-flow/quality-rows")
    const { fmtInt } = await import("../src/lib/format")
    const flow = await flowLocal("all")
    const rows = sourceRows(flow, {}, NOW)
    const root = await luoi(rows)
    const { thu, o } = oBaCot(root)
    const i = thu.indexOf("Có phường")
    assert.deepEqual(thu.slice(i, i + 4), ["Có phường", "Gom cụm", "Định vị", "Gắn căn"], `thứ tự cột: ${thu.join(" | ")}`)
    assert.equal(thu.filter((t) => t === "Gắn căn").length, 1)
    // Dò ô bằng textContent ghép: số + tỉ lệ + dòng phụ liền nhau (không khoảng trắng giữa span) — so bằng chuẩn hoá.
    for (const r of rows.filter((x) => x.id === "S03" || x.id === "S06")) {
      const ky = kyVong("all", r.id)
      const cells = Object.entries(o).find(([k]) => k.startsWith(r.name))![1]
      assert.ok(cells[0].startsWith(fmtInt(ky.clustered)) && cells[0].includes(await pct(ky.clustered, ky.offers)), `GGC-AC-5 ${r.id} Gom cụm: ${cells[0]}`)
      assert.ok(cells[1].includes(await pct(0, ky.offers)), `GGC-AC-5 ${r.id} Định vị: ${cells[1]}`)
      assert.equal(cells[1].includes(`${fmtInt(ky.locatedPending)} chờ khớp`), ky.locatedPending > 0, `GGC-AC-5 ${r.id} Định vị chờ khớp: ${cells[1]}`)
      assert.equal(cells[2].includes(`${fmtInt(ky.uniqueIdPending)} chờ khớp`), ky.uniqueIdPending > 0, `GGC-AC-5 ${r.id} Gắn căn chờ khớp: ${cells[2]}`)
    }
    const s01 = rows.find((r) => r.id === "S01")
    assert.ok(s01, "fixture phải có hàng S01")
    assert.deepEqual(Object.entries(o).find(([k]) => k.startsWith(s01.name))![1], ["—", "—", "—"])
    const g = groupRows(flow, {}, NOW)
    assert.ok(g.length > 0, "fixture phải có nhóm thu")
    const og = oBaCot(await luoi(g)).o
    for (const cells of Object.values(og)) assert.deepEqual(cells, ["—", "—", "—"])
    // Chiều đỏ: hàng S06 lấy nhầm Gom cụm từ chờ định vị.
    const sai = rows.map((r) => (r.id === "S06" ? { ...r, clustered: r.locatedPending } : r))
    const os = oBaCot(await luoi(sai)).o
    const s06 = sai.find((r) => r.id === "S06")!
    const ky = kyVong("all", "S06")
    assert.ok(!os[Object.keys(os).find((k) => k.startsWith(s06.name))!][0].startsWith(fmtInt(ky.clustered)), "GGC-AC-5 S06 Gom cụm — bản sai phải lệch")
  })
})

/** Nguồn tối giản cho buildFlow. */
function sf(source: "S03" | "S05" | "S06", offers: number, lv: Partial<SF>): SF {
  return {
    source, received: offers, readable: offers, offers, testRejected: 0, withWard: 0, withType: 0, withPriceArea: 0, complete: 0,
    highConfidence: 0, latestAt: null, approx: false,
    clustered: 0, located: 0, unitLinked: 0, locatedPending: 0, uniqueIdPending: 0, deepest: { unitLinked: 0, located: 0, clustered: 0 },
    ...lv,
  }
}
const LEVEL_IDS = ["unit", "located", "clustered", "unlocated"]
function baoToan(r: { nodes: { id: string; amount: number }[] }, offers: number, mau: string): string[] {
  const tong = r.nodes.filter((n) => LEVEL_IDS.includes(n.id) || n.id === "levels-pending").reduce((a, n) => a + n.amount, 0)
  return tong === offers ? [] : [`GGC-AC-6 không bảo toàn: ${mau} (${tong} ≠ ${offers})`]
}

describe("Sankey theo mức sâu nhất", () => {
  test("GGC-AC-6 nút mức nhận diện bảo toàn Tin rao, tiêu đề Gắn căn, gợi ý chờ khớp, không còn «Thiếu phường hoặc toạ độ»", async () => {
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const { fmtInt, fmtPct } = await import("../src/lib/format")
    const MAU: { ten: string; src: SF[]; ids: string[] }[] = [
      { ten: "mọi mức có số", src: [sf("S06", 10, { unitLinked: 1, located: 3, clustered: 4, deepest: { unitLinked: 1, located: 2, clustered: 3 }, uniqueIdPending: 2, locatedPending: 1 })], ids: ["unit", "located", "clustered", "unlocated"] },
      { ten: "chỉ cụm", src: [sf("S06", 10, { clustered: 4, deepest: { unitLinked: 0, located: 0, clustered: 4 } })], ids: ["clustered", "unlocated"] },
      { ten: "chỉ chờ khớp", src: [sf("S03", 8, { locatedPending: 5, uniqueIdPending: 1 })], ids: ["unlocated"] },
      { ten: "trống", src: [sf("S05", 0, {})], ids: [] },
    ]
    const texts: string[] = []
    for (const m of MAU) {
      const r = buildFlow(m.src, {})
      const offers = m.src.reduce((a, s) => a + s.offers, 0)
      assert.deepEqual(r.nodes.map((n) => n.id).filter((id) => LEVEL_IDS.includes(id)), m.ids, `mẫu ${m.ten}: nút`)
      if (offers > 0) {
        assert.deepEqual(baoToan(r, offers, m.ten), [])
        const top = m.ids[0]
        const unit = m.src.reduce((a, s) => a + (s.deepest?.unitLinked ?? 0), 0)
        assert.equal(r.headers[top]?.title, "Gắn căn", `mẫu ${m.ten}: tiêu đề`)
        assert.equal(r.headers[top]?.value, fmtPct(unit / offers), `mẫu ${m.ten}: giá trị`)
        const un = r.nodes.find((n) => n.id === "unlocated")
        const lp = m.src.reduce((a, s) => a + (s.locatedPending ?? 0), 0)
        const up = m.src.reduce((a, s) => a + (s.uniqueIdPending ?? 0), 0)
        if (un) assert.ok(un.hint?.includes(fmtInt(lp)) && un.hint.includes(fmtInt(up)), `mẫu ${m.ten}: gợi ý ${un.hint}`)
      }
      for (const n of r.nodes) texts.push(n.hint ?? "", n.name)
      for (const h of Object.values(r.headers)) texts.push(h.note ?? "", h.title, h.value)
      // Chiều đỏ: «Chưa định vị» tính bỏ gom cụm → không bảo toàn.
      if (m.ids.includes("clustered")) {
        const sai = { nodes: r.nodes.map((n) => (n.id === "unlocated" ? { ...n, amount: offers - (m.src[0].deepest?.located ?? 0) - (m.src[0].deepest?.unitLinked ?? 0) } : n)) }
        assert.ok(baoToan(sai, offers, m.ten)[0]?.startsWith(`GGC-AC-6 không bảo toàn: ${m.ten}`))
      }
    }
    const { FlowSankey } = await import("../src/components/ops/data-flow/flow-sankey")
    const root = await render(<FlowSankey sources={MAU[0].src} roles={{}} />)
    texts.push(txt(root))
    const nguon = ["flow-sankey-data.ts", "flow-sankey.tsx", "flow-journey.tsx", "stage-face.tsx", "quality-grid.tsx", "record-sheet.tsx"].map((f) =>
      readFileSync(join(ROOT, "app/src/components/ops/data-flow", f), "utf8"),
    )
    for (const t of [...texts, ...nguon]) assert.ok(!t.includes("Thiếu phường hoặc toạ độ"), "còn câu «Thiếu phường hoặc toạ độ»")
  })
})

describe("luật nút thắt", () => {
  test("GGC-AC-7 Gắn căn 0% không làm nguồn «Kẹt»; ba kiểm đọc · trường lõi · phường giữ ngưỡng", async () => {
    const { healthOf, NUT_THAT_CHECKS } = await import("../src/components/ops/data-flow/quality-rows")
    const at = new Date(NOW - 3600000).toISOString()
    const row = (p: Partial<QR>) => ({
      id: "x", name: "x", meta: "", received: 100, readable: 90, offers: 50, complete: 45, withWard: 45,
      clustered: 0, located: 0, unitLinked: 0, locatedPending: 0, uniqueIdPending: 0, levelsPending: false, latestAt: at, approx: false, ...p,
    })
    assert.deepEqual(NUT_THAT_CHECKS.map((c) => c.name), ["đọc", "trường lõi", "phường"])
    const MT: [string, Partial<QR>, string][] = [
      ["gắn căn 0", {}, "Khoẻ"],
      ["đọc 20%", { readable: 20 }, "Kẹt · đọc"],
      ["phường 40%", { withWard: 20 }, "Kẹt · phường"],
      ["lõi 70%", { complete: 35 }, "Theo dõi · trường lõi"],
    ]
    for (const [ten, p, want] of MT) assert.equal(healthOf(row(p), NOW).label, want, ten)
    // Chiều đỏ: thêm lại kiểm gắn căn → «Kẹt · gắn căn».
    const coGanCan = [...NUT_THAT_CHECKS, { name: "gắn căn", num: (r: Omit<QR, "health">) => r.unitLinked, den: (r: Omit<QR, "health">) => r.offers, stuck: 0.5, watch: 0.8 }]
    const nhan = healthOf(row({}), NOW, coGanCan).label
    assert.equal(nhan === "Kẹt · gắn căn" ? "GGC-AC-7 kẹt vì gắn căn" : nhan, "GGC-AC-7 kẹt vì gắn căn")
  })
})

/** Mức sâu nhất + cờ chờ khớp từ ma trận (máy thu). */
const mucTin = (t: Tin) => ({ level: t.ky.cum ? "clustered" : "none", locatedPending: t.ky.toa, uniqueIdPending: t.ky.danh })
/** Máy chủ không có cột unit_number, street_number: trục không toà và số nhà không đọc được — ô lệch có chủ đích. */
const mucTinCloud = (t: Tin) => ({ level: t.ky.cum ? "clustered" : "none", locatedPending: t.toa !== null, uniqueIdPending: false })

describe("biểu đồ ngày và ngăn tin", () => {
  test("GGC-AC-8 đường Gắn căn đọc unitLinked; ngăn tin có «Mức nhận diện» cùng luật 600 ở máy thu", async () => {
    ready()
    const { dailySeries } = await import("../src/components/ops/data-flow/stage-trend-data")
    const flow = await flowLocal("all")
    const pts = dailySeries(flow.days, NOW, 30)
    assert.ok(pts.length === 30 && pts.every((p) => p.unitLinked === 0 && !("linked" in p)), "điểm ngày phải có unitLinked = 0, không linked")
    const byId = Object.fromEntries(flow.records.map((r) => [r.offerId, r.identification]))
    for (const t of MA_TRAN) assert.deepEqual(byId[t.id], mucTin(t), `GGC-AC-8 máy thu ${t.id}`)
    const { RecordSheet, identificationLabel } = await import("../src/components/ops/data-flow/record-sheet")
    const rec = flow.records.find((r) => r.offerId === "b1")!
    await render(<RecordSheet record={rec} roles={{}} xemBaiGoc={false} onOpenChange={() => {}} />)
    const body = txt(document.body)
    assert.ok(body.includes("Mức nhận diện"), "ngăn tin thiếu dòng Mức nhận diện")
    assert.ok(body.includes(identificationLabel(rec.identification)), `ngăn tin: ${identificationLabel(rec.identification)}`)
    assert.ok(identificationLabel(rec.identification).includes("ghi toà/trục, chờ khớp"))
    assert.ok(!/Căn\s*(Đã gắn|Chưa gắn)/.test(body), "ngăn tin còn dòng Căn Đã gắn/Chưa gắn")
  })
})

// =====================================================================================================================
// AC-9 — lên cloud qua push-ops-facts + ingest THẬT; khối cloud đời trước.
// =====================================================================================================================

type Payload = Record<string, unknown> & { pushedAt: string; blocks: Record<string, Record<string, unknown>> }
async function lenCloud() {
  const r = (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(S_LOCAL) }, args: [] as never[] })) as { code: number; stderr: string; payload: Payload | null }
  assert.equal(r.code, 0, r.stderr.slice(0, 600))
  assert.ok(r.payload, "push-ops-facts không gửi bản tin")
  await makeFlowSchema(admin, S_CLOUD, { tables: ["sale_offers", "property_offers", "areas", "listings"], migrate: false, offers: [] })
  await admin.query(`CREATE TABLE "${S_CLOUD}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
  await admin.query(`CREATE TABLE "${S_CLOUD}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`)
  await napMaTran(S_CLOUD)
  // Máy chủ không có hai cột này (CLOUD_ALLOW của sync-cloud) — câu bản ghi tin phải chịu được.
  await admin.query(`ALTER TABLE "${S_CLOUD}".sale_offers DROP COLUMN unit_number, DROP COLUMN street_number`)
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const res = await POST(new Request("http://x/api/v1/ops/ingest", { method: "POST", headers: { authorization: "Bearer ggc-thu" }, body: JSON.stringify(r.payload) }))
  assert.equal(res.status, 200)
}
const KHOA = ["clustered", "located", "unitLinked", "locatedPending", "uniqueIdPending", "deepest"] as const

/** Khối cũ: không ô mức nhận diện nào mang số `linked`; không NaN trên Sankey. */
function soKhoiCu(rows: QR[], flow: { nodes: { id: string; amount: number; name: string; hint?: string }[]; headers: Record<string, { value: string; title: string }> }, offers: number): string[] {
  const loi: string[] = []
  for (const r of rows.filter((x) => ["S03", "S05", "S06"].includes(x.id)))
    for (const k of ["clustered", "located", "unitLinked"] as const) if (r[k] !== null) loi.push(`GGC-AC-9 số cũ dưới nhãn mới: ${r.id} ${k}`)
  for (const n of flow.nodes) {
    if (LEVEL_IDS.includes(n.id) && n.amount > 0) loi.push(`GGC-AC-9 Sankey khối cũ: nút ${n.id} = ${n.amount}/${offers}`)
    if (/NaN/.test(`${n.amount}${n.name}${n.hint ?? ""}`)) loi.push(`GGC-AC-9 Sankey khối cũ: NaN ở ${n.id}`)
  }
  for (const h of Object.values(flow.headers)) if (/NaN/.test(h.value)) loi.push("GGC-AC-9 Sankey khối cũ: NaN ở tiêu đề")
  return loi
}

describe("lên cloud", () => {
  test("GGC-AC-9 cloud hiện đúng số máy thu tính; khối đời trước hiện «—», không số cũ, không NaN", async () => {
    ready()
    await lamTuoi()
    await lenCloud()
    const { getDataFlow, normalizeFacts } = await import("../src/lib/data-flow-queries")
    const local = await flowLocal("all")
    const cloud = await getDataFlow("all", { now: NOW, mode: "cloud" })
    assert.equal(cloud.factsState === "error" ? cloud.factsError : null, null)
    for (const src of SRC) {
      const a = local.sources.find((s) => s.source === src)!
      const b = cloud.sources.find((s) => s.source === src)!
      for (const k of KHOA) assert.deepEqual(b[k], a[k], `GGC-AC-9 cloud ${src} ${k}`)
    }
    // Ngăn tin trên cloud: bảng kỳ vọng riêng (không cột mã căn, số nhà) — mọi ô khác bằng máy thu.
    const byId = Object.fromEntries(cloud.records.map((r) => [r.offerId, r.identification]))
    for (const t of MA_TRAN) assert.deepEqual(byId[t.id], mucTinCloud(t), `GGC-AC-8 máy chủ ${t.id}`)

    // Khối cloud đời trước: có linked, không sáu khoá mới.
    const { sourceRows } = await import("../src/components/ops/data-flow/quality-rows")
    const { buildFlow } = await import("../src/components/ops/data-flow/flow-sankey-data")
    const { dailySeries } = await import("../src/components/ops/data-flow/stage-trend-data")
    const raw = JSON.parse(JSON.stringify({ ...local, sources: local.sources, days: local.days })) as DF
    for (const s of raw.sources as unknown as Record<string, unknown>[]) {
      for (const k of KHOA) delete s[k]
      s.linked = 999
    }
    for (const d of raw.days as unknown as Record<string, unknown>[]) {
      delete d.unitLinked
      d.linked = 7
    }
    const cu = { ...raw, ...normalizeFacts(raw) } as DF
    const rows = sourceRows(cu, {}, NOW)
    const offers = cu.sources.reduce((a, s) => a + s.offers, 0)
    const sk = buildFlow(cu.sources, {})
    assert.deepEqual(soKhoiCu(rows, sk, offers), [])
    assert.ok(Object.values(sk.headers).some((h) => h.title === "Gắn căn" && h.value === "—"), "tiêu đề cột cuối phải «—»")
    assert.ok(dailySeries(cu.days, NOW, 30).every((p) => p.unitLinked === 0 && Number.isFinite(p.unitLinked)))
    const root = await luoi(rows)
    assert.ok(txt(root).includes("Số mức nhận diện có ở lượt làm tươi kế"), "thiếu dòng báo chờ làm tươi")
    for (const r of rows.filter((x) => ["S03", "S06"].includes(x.id))) {
      const cells = Object.entries(oBaCot(root).o).find(([k]) => k.startsWith(r.name))![1]
      assert.deepEqual(cells, ["—", "—", "—"], `GGC-AC-9 ${r.id} khối cũ`)
    }
    // Chiều đỏ 1: bộ đọc rơi về linked khi thiếu clustered.
    const roiVe = rows.map((r) => (r.id === "S06" ? { ...r, clustered: 999 } : r))
    assert.ok(soKhoiCu(roiVe, sk, offers).some((l) => l.startsWith("GGC-AC-9 số cũ dưới nhãn mới")))
    // Chiều đỏ 2: coi deepest vắng là 0 → «Chưa định vị» = Tin rao.
    const sk0 = buildFlow(cu.sources.map((s) => ({ ...s, deepest: { unitLinked: 0, located: 0, clustered: 0 } })), {})
    assert.ok(soKhoiCu(rows, sk0, offers).some((l) => l.startsWith("GGC-AC-9 Sankey khối cũ")))
  })
})

// the-duyet-phuong-lech-gia.test.tsx — hồ sơ _acceptance/the-duyet-phuong-lech-gia: hàng Phường của bảng so ghép căn so
// theo tên phường chuẩn (Ngoài-1 của PL3). Tên ca mở đầu bằng mã AC (TPL-AC-n). Hàm thuần + sheet ReviewCard thật trong
// jsdom; probe chỉ SELECT trên DB máy thu (bỏ qua có lời ở CI). Mỗi phép đo có chiều đỏ: bản chép tạm của
// review-can-cu.ts (tests/.tpl-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const NGUON = "src/lib/ops/review-can-cu.ts"

// ---------- bản chép tạm (đối chứng dương) ----------
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
})
type CanCuMod = typeof import("../src/lib/ops/review-can-cu")
/** Chép một tệp nguồn của app thành tests/.tpl-cu-<pid>-<n>.<ext>, đổi đúng một chỗ, đổi import tương đối sang tuyệt đối. */
function chepTep(rel: string, doi: (s: string) => string): string {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.tpl-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return f
}
const banChep = async (doi: (s: string) => string) => (await import(chepTep(NGUON, doi))) as CanCuMod
// Ba đột biến dùng chung cho các chiều đỏ.
const BO_TIEN_TO = (s: string) => s.replace('.replace(/^(?:(?:phường|xã|thị trấn)(?:\\s+|$)|p\\.\\s*)/u, "")', "")
const TIEN_TO_SAU_DAU = (s: string) =>
  BO_TIEN_TO(s).replace('.replace(/^-+|-+$/g, "");\n}', '.replace(/^-+|-+$/g, "").replace(/^(?:phuong|xa|thi-tran|p)-/, "");\n}')

let canCu: CanCuMod
before(async () => {
  canCu = (await import("../src/lib/ops/review-can-cu")) as CanCuMod
})

const soPhuong = (mod: CanCuMod, a: string | null, b: string | null) =>
  mod.soTruongGhepCan({ phuong: a }, { phuong: b }).find((h) => h.key === "phuong")!

// ---------- TPL-AC-1 ----------
// Ma trận viết trước: 15 cặp cùng phường (5 cặp đầu là dữ liệu thật đo 30/10).
const CUNG: [string, string][] = [
  ["binh-thanh", "Phường Bình Thạnh"],
  ["phu-nhuan", "Phường Phú Nhuận"],
  ["tan-son-nhi", "Phường Tân Sơn Nhì"],
  ["thong-tay-hoi", "Phường Thông Tây Hội"],
  ["binh-thanh", "P. Bình Thạnh"],
  ["binh-thanh", "P.Bình Thạnh"],
  ["binh-thanh", "phường bình thạnh"],
  ["binh-thanh", "Bình Thạnh"],
  ["binh-chanh", "Xã Bình Chánh"],
  ["cu-chi", "Thị trấn Củ Chi"],
  ["da-kao", "Phường Đa Kao"],
  ["ben-thanh", "PHƯỜNG BẾN THÀNH"],
  ["phuong-liet", "Phường Phương Liệt"],
  ["Phương Liệt", "Phường Phương Liệt"],
  ["phuong-duc", "Phường Phượng Dực"],
]
function kiemAc1(mod: CanCuMod) {
  for (const [a, b] of CUNG) assert.equal(soPhuong(mod, a, b).so, "khop", `TPL-AC-1: ${a} ↔ ${b} phải Khớp`)
  assert.equal(CUNG.length, 15)
}
test("TPL-AC-1 cùng phường khác cách viết → Khớp (15 cặp viết trước)", async () => {
  kiemAc1(canCu)
  await assert.rejects(async () => kiemAc1(await banChep(BO_TIEN_TO)), /TPL-AC-1: binh-thanh ↔ Phường Bình Thạnh phải Khớp/)
  await assert.rejects(async () => kiemAc1(await banChep(TIEN_TO_SAU_DAU)), /TPL-AC-1: phuong-liet ↔ Phường Phương Liệt phải Khớp/)
})

// ---------- TPL-AC-2 ----------
const KHAC: [string, string][] = [
  ["Bình Thạnh", "Bình Thạnh Đông"],
  ["binh-thanh", "Phường Phú Nhuận"],
  ["Phường 1", "Phường 12"],
  ["Tây Hồ", "Ba Đình"],
  ["P. Bến Nghé", "ben-thanh"],
]
function kiemAc2(mod: CanCuMod) {
  for (const [a, b] of KHAC) assert.equal(soPhuong(mod, a, b).so, "lech", `TPL-AC-2: ${a} ↔ ${b} phải Lệch`)
  assert.equal(KHAC.length, 5)
}
test("TPL-AC-2 khác phường → Lệch, kể cả tên này là phần đầu tên kia (5 cặp viết trước)", async () => {
  kiemAc2(canCu)
  const sai = await banChep((s) => s.replace('return ka === kb ? "khop" : "lech";', 'return ka.startsWith(kb) || kb.startsWith(ka) ? "khop" : "lech";'))
  assert.throws(() => kiemAc2(sai), /TPL-AC-2: Bình Thạnh ↔ Bình Thạnh Đông phải Lệch/)
})

// ---------- TPL-AC-3 ----------
// Khoá chỉ số giữ cách so trước vòng: so với nhãn ghim và với soGiaTri trên chuỗi gốc.
const SO: [string, string, "khop" | "lech"][] = [
  ["Phường 12", "phuong-12", "lech"],
  ["Phường 12", "P.12", "lech"],
  ["Phường 12", "Phường 21", "lech"],
  ["Phường 12", " phường 12 ", "khop"],
]
function kiemAc3(mod: CanCuMod) {
  for (const [a, b, nhan] of SO) {
    const so = soPhuong(mod, a, b).so
    const loi = nhan === "khop" ? "phải Khớp như trước vòng" : "không được Khớp chỉ vì cùng số"
    assert.equal(so, nhan, `TPL-AC-3: ${a} ↔ ${b} ${loi}`)
    assert.equal(so, mod.soGiaTri(a, b), `TPL-AC-3: ${a} ↔ ${b} khác cách so trước vòng`)
  }
}
test("TPL-AC-3 khoá chỉ số giữ cách so trước vòng (4 cặp viết trước)", async () => {
  kiemAc3(canCu)
  const sai = await banChep((s) => s.replace("if (/^\\d+$/.test(ka) || /^\\d+$/.test(kb)) return soGiaTri(a, b);\n", ""))
  assert.throws(() => kiemAc3(sai), /TPL-AC-3: Phường 12 ↔ P.12 không được Khớp chỉ vì cùng số/)
})

// ---------- TPL-AC-4 ----------
const CHI_TIEN_TO: [string, string][] = [
  ["P.", "Phường"],
  ["Xã", "Phường"],
  ["-", "Bình Thạnh"],
  ["Phường", "binh-thanh"],
]
function kiemAc4(mod: CanCuMod) {
  for (const [a, b] of [[null, "Phường Bình Thạnh"], ["  ", "Phường Bình Thạnh"]] as [string | null, string][]) {
    assert.equal(soPhuong(mod, a, b).so, "thieu", `TPL-AC-4: ${JSON.stringify(a)} ↔ ${b} phải Thiếu`)
    assert.equal(soPhuong(mod, b, a).so, "thieu", `TPL-AC-4: ${b} ↔ ${JSON.stringify(a)} phải Thiếu`)
  }
  for (const [a, b] of CHI_TIEN_TO) assert.equal(soPhuong(mod, a, b).so, "thieu", `TPL-AC-4: ${a} ↔ ${b} chỉ có tiền tố phải Thiếu`)
  const h = soPhuong(mod, "binh-thanh", "Phường Bình Thạnh")
  assert.deepEqual([h.a, h.b], ["binh-thanh", "Phường Bình Thạnh"], "TPL-AC-4: ô giá trị phải giữ nguyên chuỗi nguồn")
  const rows = mod.soTruongGhepCan({ street: "Đường Phan Văn Trị", block: "P. A1" }, { street: "Phan Văn Trị", block: "A1" })
  assert.equal(rows.find((r) => r.key === "street")!.so, "lech", "TPL-AC-4: chuẩn hoá phường lan sang hàng street")
  assert.equal(rows.find((r) => r.key === "block")!.so, "lech", "TPL-AC-4: chuẩn hoá phường lan sang hàng block")
}
test("TPL-AC-4 trống hay chỉ tiền tố → Thiếu; giá trị giữ nguyên; chín hàng khác không chuẩn hoá", async () => {
  kiemAc4(canCu)
  const lan = await banChep((s) => s.replace('so: key === "phuong" ? soPhuong(va, vb) : soGiaTri(va, vb),', "so: soPhuong(va, vb),"))
  assert.throws(() => kiemAc4(lan), /TPL-AC-4: chuẩn hoá phường lan sang hàng block/)
  const rong = await banChep((s) => s.replace('if (ka === "" || kb === "") return "thieu";\n', ""))
  assert.throws(() => kiemAc4(rong), /TPL-AC-4: P\. ↔ Phường chỉ có tiền tố phải Thiếu/)
})

// ---------- TPL-AC-5 (sheet ReviewCard thật) ----------
type CardMod = typeof import("../src/components/ops/review-card")
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }
const BEN_A = { offer_id: "offer_a1", source: "S05", price_vnd: 7e9, area_m2: 52, phuong: "binh-thanh", text: "Tin A" }
const BEN_B = { offer_id: "offer_b1", source: "S06", price_vnd: 8.5e9, area_m2: 60, phuong: "Phường Bình Thạnh", subject: "Tin B" }

async function hangPhuongTrenSheet(card: CardMod): Promise<Element> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const { toReviewItem } = await import("../src/lib/ops/review-queue")
  const ev = { offer_a: BEN_A, offer_b: BEN_B, stage_b_score: 0.8 }
  const item = toReviewItem(
    { id: 24, item_type: "entity_match", title: "Cùng căn? binh-thanh 52m² ↔ 60m²", evidence: ev, ai_suggestion: null,
      ai_reasoning: null, status: "pending", created_at: "2026-10-22T08:59:17Z" },
    ev,
  )
  const html = renderToStaticMarkup(
    (
      <AppRouterContext.Provider value={ROUTER as never}>
        <card.ReviewCard item={item} />
      </AppRouterContext.Provider>
    ) as ReactElement,
  )
  const row = new JSDOM(`<div>${html}</div>`).window.document.querySelector('[data-review-compare="phuong"]')
  assert.ok(row, "sheet không có hàng [data-review-compare=phuong]")
  return row
}
async function kiemAc5(card: CardMod) {
  const t = (await hangPhuongTrenSheet(card)).textContent ?? ""
  assert.ok(t.includes("Phường") && t.includes("binh-thanh") && t.includes("Phường Bình Thạnh"), "TPL-AC-5: thiếu giá trị nguyên văn")
  assert.ok(t.includes("Khớp") && !t.includes("Lệch"), "TPL-AC-5: hàng Phường của sheet phải hiện Khớp")
}
test("TPL-AC-5 sheet thẻ ghép căn thật: hàng Phường hiện «Khớp» cạnh hai giá trị nguyên văn", async () => {
  await kiemAc5((await import("../src/components/ops/review-card")) as CardMod)
  // Chiều đỏ trên cùng fixture: bản chép review-card dùng bản chép review-can-cu bỏ khoaPhuong (so khoá cũ).
  const libSai = chepTep(NGUON, (s) => s.replace('so: key === "phuong" ? soPhuong(va, vb) : soGiaTri(va, vb),', "so: soGiaTri(va, vb),"))
  const cardSai = (await import(
    chepTep("src/components/ops/review-card.tsx", (s) => s.replace('from "@/lib/ops/review-can-cu"', `from "${libSai}"`))
  )) as CardMod
  await assert.rejects(kiemAc5(cardSai), /TPL-AC-5: hàng Phường của sheet phải hiện Khớp/)
})

// ---------- TPL-AC-6 probe (DB máy thu, chỉ SELECT) ----------
type Area = { id: string; parent_id: string; name: string }
type The = { id: number; a: string | null; b: string | null }
async function docDb(): Promise<{ areas: Area[]; the: The[] }> {
  const c = new pg.Client({ connectionString: localDbUrl() })
  await c.connect()
  try {
    const areas = (await c.query<Area>("SELECT id, parent_id, name FROM areas WHERE region_type = 'submarket' AND parent_id IS NOT NULL")).rows
    const the = (
      await c.query<The>(
        "SELECT id, evidence->'offer_a'->>'phuong' AS a, evidence->'offer_b'->>'phuong' AS b FROM review_queue WHERE item_type = 'entity_match' ORDER BY id",
      )
    ).rows
    return { areas, the }
  } finally {
    await c.end()
  }
}
const duoi = (a: Area) => a.id.slice(a.parent_id.length + 1)
const nfc = (s: string) => s.normalize("NFC").trim().toLowerCase()

function kiemAc6(mod: CanCuMod, areas: Area[], the: The[]) {
  // Nhánh cùng phường: đuôi mã ↔ «Phường » + tên, đuôi mã ↔ tên trần.
  let cung = 0
  for (const a of areas) {
    for (const ten of [`Phường ${a.name}`, a.name]) {
      const so = soPhuong(mod, duoi(a), ten).so
      assert.equal(so, "khop", `TPL-AC-6 probe: ${duoi(a)} ↔ ${ten} cùng phường mà báo ${so}`)
      cung++
    }
  }
  assert.ok(cung >= 1, "TPL-AC-6 probe: không area nào — nhánh cùng phường xanh suông")
  // Nhánh khác phường: mọi cặp hai area khác nhau cùng thị trường.
  let khac = 0
  const theoTT = new Map<string, Area[]>()
  for (const a of areas) theoTT.set(a.parent_id, [...(theoTT.get(a.parent_id) ?? []), a])
  for (const ds of theoTT.values()) {
    for (const x of ds) {
      for (const y of ds) {
        if (x.id === y.id) continue
        const so = soPhuong(mod, duoi(x), `Phường ${y.name}`).so
        assert.equal(so, "lech", `TPL-AC-6 probe: ${duoi(x)} ↔ Phường ${y.name} khác phường mà báo Khớp`)
        khac++
      }
    }
  }
  assert.ok(khac >= 1, "TPL-AC-6 probe: không cặp area nào — nhánh khác phường xanh suông")
  // Thẻ thật: bên slug = đuôi mã; bên tên = area có «Phường » + name hoặc name bằng nguyên chuỗi (NFC, chữ thường).
  const giai = (v: string | null): string | null => {
    if (v === null) return null
    const hit = areas.filter((a) => duoi(a) === v || nfc(`Phường ${a.name}`) === nfc(v) || nfc(a.name) === nfc(v))
    const ids = new Set(hit.map(duoi))
    return ids.size === 1 ? [...ids][0] : null
  }
  let giaiDuoc = 0
  for (const t of the) {
    const ga = giai(t.a)
    const gb = giai(t.b)
    if (ga === null || gb === null || ga !== gb) continue
    giaiDuoc++
    const so = soPhuong(mod, t.a, t.b).so
    assert.equal(so, "khop", `TPL-AC-6 probe: thẻ #${t.id} ${t.a} ↔ ${t.b} cùng area ${ga} mà báo ${so}`)
  }
  assert.ok(giaiDuoc >= 1, "TPL-AC-6 probe: không thẻ nào giải được phường — phép đo xanh suông")
  return { cung, khac, giaiDuoc }
}
test("TPL-AC-6 probe DB máy thu: mọi phường OSM tự khớp hai cách ghi, mọi cặp khác phường Lệch, thẻ thật cùng phường Khớp", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có bảng areas và thẻ ghép căn thật — CI chỉ có lược đồ")
  const { areas, the } = await docDb()
  const dem = kiemAc6(canCu, areas, the)
  t.diagnostic(`TPL-AC-6: ${areas.length} phường · ${dem.cung} cặp cùng phường · ${dem.khac} cặp khác phường · ${dem.giaiDuoc}/${the.length} thẻ giải được`)
  const sai = await banChep(TIEN_TO_SAU_DAU)
  assert.throws(() => kiemAc6(sai, areas, the), /TPL-AC-6 probe: phuong-liet ↔ Phường Phương Liệt cùng phường mà báo lech/)
})

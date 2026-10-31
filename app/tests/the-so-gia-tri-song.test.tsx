// the-so-gia-tri-song.test.tsx — hồ sơ _acceptance/the-so-doc-gia-tri-song (HD6): bảng so thẻ ghép căn đọc giá trị sống
// từ sale_offers, «Chưa rõ» là Thiếu, tin rời kho hiện Alert và khoá nút quyết. Tên ca mở đầu bằng mã AC (GS-AC-n).
// Ca DB dựng lược đồ tạm `gs_<pid>` (bảng LIKE public.*, view sale_offers riêng, dữ liệu viết trước), xoá cuối lượt; probe
// trên DB máy thu chỉ SELECT. Chiều đỏ: bản chép tạm tests/.gs-cu-* của tệp nguồn đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
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

const S = `gs_${process.pid}`
const urlS = (() => {
  const u = new URL(localDbUrl())
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/review" })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

// ---------- bản chép tạm (chiều đỏ) ----------
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
})
async function banChepTam<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — chiều đỏ vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.gs-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- dựng thẻ ----------
type CardMod = typeof import("../src/components/ops/review-card")
type CompareMod = typeof import("../src/components/ops/review/review-compare")
type CanCuMod = typeof import("../src/lib/ops/review-can-cu")
type CtxMod = typeof import("../src/lib/ops/review-context")
type Item = import("../src/lib/ops/review-queue").ReviewItem
type Ctx = import("../src/lib/ops/review-context").ReviewContext
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }

async function dungThe(mod: CardMod, item: Item, context?: Ctx) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const html = renderToStaticMarkup(
    (
      <AppRouterContext.Provider value={ROUTER as never}>
        <mod.ReviewCard item={item} context={context} />
      </AppRouterContext.Provider>
    ) as ReactElement,
  )
  return new JSDOM(`<div id=r>${html}</div>`).window.document
}

/** Thẻ dựng thật (createRoot) rồi gõ lý do — nút quyết chỉ bật khi có lý do, nên khoá phải đo khi lý do đã có chữ. */
async function nutSauKhiGoLyDo(mod: CardMod, item: Item, context: Ctx | undefined, lyDo: string) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await React.act(async () =>
    root.render(
      <AppRouterContext.Provider value={ROUTER as never}>
        <mod.ReviewCard item={item} context={context} />
      </AppRouterContext.Provider>,
    ),
  )
  const el = document.querySelector("[data-review-reason]") as HTMLTextAreaElement
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!
  await React.act(async () => {
    set.call(el, lyDo)
    el.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
  })
  const nut = [...document.querySelectorAll("[data-review-actions] button")].map((b) => ({
    chu: b.textContent?.trim() ?? "",
    tat: (b as HTMLButtonElement).disabled,
  }))
  const alert = document.querySelector("[data-review-roi-kho]")?.textContent ?? null
  await React.act(async () => root.unmount())
  return { nut, alert }
}

let toReviewItem: typeof import("../src/lib/ops/review-queue").toReviewItem
let thatCard: CardMod
let thatCompare: CompareMod
let canCu: CanCuMod
let ctxMod: CtxMod
before(async () => {
  ;({ toReviewItem } = await import("../src/lib/ops/review-queue"))
  thatCard = (await import("../src/components/ops/review-card")) as CardMod
  thatCompare = (await import("../src/components/ops/review/review-compare")) as CompareMod
  canCu = (await import("../src/lib/ops/review-can-cu")) as CanCuMod
  ctxMod = (await import("../src/lib/ops/review-context")) as CtxMod
})

// ---------- fixture: ma trận viết trước, 10 trường × 2 bên ----------
const KHOA = ["price_vnd", "area_m2", "price_perm2", "phuong", "bedrooms", "bathrooms", "property_type", "street", "block", "floor"] as const
type Ben = Required<import("../src/lib/ops/review-can-cu").BenGhepCan>
// Lúc chấm (evidence) và giá trị sống — mọi ô khác nhau. Hàng area_m2: sống khớp (72 = 72) mà lúc chấm lệch (70 ↔ 75) → Khớp;
// hàng bedrooms: sống lệch (3 ↔ 4) mà lúc chấm khớp (2 = 2) → Lệch.
const CHAM_A: Ben = { price_vnd: 5e9, area_m2: 70, price_perm2: 7e7, phuong: "Tây Hồ", bedrooms: 2, bathrooms: 1, property_type: "apartment", street: "Âu Cơ", block: "A1", floor: "5" }
const CHAM_B: Ben = { price_vnd: 6e9, area_m2: 75, price_perm2: 8e7, phuong: "Ba Đình", bedrooms: 2, bathrooms: 2, property_type: "house", street: "Kim Mã", block: "B2", floor: "6" }
const SONG_A: Ben = { price_vnd: 5.5e9, area_m2: 72, price_perm2: 7.6e7, phuong: "Quảng An", bedrooms: 3, bathrooms: 2, property_type: "house", street: "Lạc Long Quân", block: "C3", floor: "7" }
const SONG_B: Ben = { price_vnd: 6.5e9, area_m2: 72, price_perm2: 9e7, phuong: "Ngọc Hà", bedrooms: 4, bathrooms: 3, property_type: "apartment", street: "Đội Cấn", block: "D4", floor: "8" }

const ghepCan = (id: number, a: string, b: string, cham: { a: Ben; b: Ben } = { a: CHAM_A, b: CHAM_B }, status = "pending"): Item => {
  const ev = {
    offer_a: { offer_id: a, source: "S05", text: "Tin A", ...cham.a },
    offer_b: { offer_id: b, source: "S06", subject: "Tin B", ...cham.b },
    stage_b_score: 0.5,
  }
  return toReviewItem(
    { id, item_type: "entity_match", title: `Cùng căn? #${id}`, evidence: ev, ai_suggestion: null, ai_reasoning: null, status, created_at: "2026-10-31T00:00:00Z" },
    ev,
  )
}

// ================= DB: lược đồ tạm gs_<pid> =================
const admin = new pg.Client({ connectionString: localDbUrl() })
const db = new pg.Client({ connectionString: urlS })
let setupErr: string | null = null
const BANG = ["sale_offer_records", "stg_zalo_posts", "stg_chotot_ads"]

async function tinSong(id: string, src: string, b: Ben) {
  await admin.query(
    `INSERT INTO "${S}".sale_offer_records (offer_id, source, kind, originating_system_key, post_ids, first_seen, last_seen,
       price_vnd, area_m2, price_perm2, phuong_raw, bedrooms, bathrooms, property_type, street_raw, block_raw, floor_raw)
     VALUES ($1,$2,'sale',$1,'{}', now(), now(), $3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [id, src, b.price_vnd, b.area_m2, b.price_perm2, b.phuong, b.bedrooms, b.bathrooms, b.property_type, b.street, b.block, b.floor],
  )
}

before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S}"`)
    for (const t of BANG) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING GENERATED)`)
    await admin.query(`CREATE VIEW "${S}".sale_offers AS SELECT * FROM "${S}".sale_offer_records WHERE retired_at IS NULL`)
    await tinSong("gs_a", "S05", SONG_A)
    await tinSong("gs_b", "S06", SONG_B)
    await tinSong("gs_y", "S05", CHAM_A) // «tin không đổi»: giá trị sống = lúc chấm
    await tinSong("gs_z", "S06", CHAM_B)
    await db.connect()
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await db.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)
const qDb = (t: string, v: unknown[]) => db.query(t, v)
const ngu = async (item: Item) => (await ctxMod.loadReviewContext([item], qDb))[item.id]

// ---------- GS-AC-1 ----------
const dinhDang = (k: (typeof KHOA)[number], v: string | number | null): string => {
  if (v === null) return "—"
  if (k === "price_vnd") return canCu.fmtGia(Number(v))
  if (k === "price_perm2") return canCu.fmtGiaM2(Number(v))
  if (k === "area_m2") return `${v} m²`
  return String(v)
}
/** Chữ chính của một ô: bỏ dòng căn cứ và dòng Lúc chấm. */
function chuChinh(td: Element): string {
  const c = td.cloneNode(true) as Element
  for (const x of c.querySelectorAll("[data-review-can-cu],[data-review-luc-cham]")) x.remove()
  return c.textContent?.trim() ?? ""
}

async function kiemAc1(mod: CardMod) {
  const item = ghepCan(1, "gs_a", "gs_b")
  const doc = await dungThe(mod, item, await ngu(item))
  let n = 0
  const LOAI: Record<string, string> = { apartment: "Căn hộ", house: "Nhà riêng" }
  for (const k of KHOA) {
    const tds = [...doc.querySelectorAll(`[data-review-compare=${k}] td`)]
    for (const [i, song, cham] of [[1, SONG_A, CHAM_A], [2, SONG_B, CHAM_B]] as const) {
      const chu = chuChinh(tds[i])
      const mong = k === "property_type" ? LOAI[String(song[k])] : dinhDang(k, song[k])
      assert.ok(chu.includes(mong), `GS-AC-1 ô đọc evidence thay giá trị sống: ${k} bên ${i} = «${chu}», mong «${mong}»`)
      const lc = tds[i].querySelector("[data-review-luc-cham]")?.textContent ?? ""
      const mongLc = k === "property_type" ? LOAI[String(cham[k])] : dinhDang(k, cham[k])
      assert.ok(lc.includes(mongLc), `GS-AC-1 dòng Lúc chấm của ${k} bên ${i} không mang giá trị evidence: «${lc}»`)
      n++
    }
  }
  assert.equal(n, 20, "ma trận 10 trường × 2 bên")
  const so = (k: string) => doc.querySelector(`[data-review-compare=${k}] td:last-child`)?.textContent?.trim()
  assert.equal(so("area_m2"), "Khớp", "GS-AC-1 nhãn So tính từ evidence: area_m2 sống 72 = 72")
  assert.equal(so("bedrooms"), "Lệch", "GS-AC-1 nhãn So tính từ evidence: bedrooms sống 3 ↔ 4")
}

describe("GS-AC-1/2 bảng so đọc giá trị sống", () => {
  test("GS-AC-1 bảng so đọc giá trị sống", async () => {
    ready()
    await kiemAc1(thatCard)
    const docEv = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
      s.replace("benA ?? ev.offer_a ?? {}", "ev.offer_a ?? {}").replace("benB ?? ev.offer_b ?? {}", "ev.offer_b ?? {}"),
    )
    await assert.rejects(kiemAc1(docEv), /GS-AC-1 ô đọc evidence thay giá trị sống/)
    // Bản chép bảng so tính So từ giá trị lúc chấm, ô vẫn hiện giá trị sống.
    const soCham = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) =>
      s.replace('(SO_RIENG[key] ?? soGiaTri)(va, vb),', '(SO_RIENG[key] ?? soGiaTri)(hien(lc.a?.[key]) ?? va, hien(lc.b?.[key]) ?? vb),'),
    )
    const rows = soCham.soTruongGhepCan(SONG_A, SONG_B, {}, {}, { a: CHAM_A, b: CHAM_B })
    const doc = new JSDOM(`<div>${renderToStaticMarkup(<thatCompare.ReviewCompare rows={rows} />)}</div>`).window.document
    const so = (k: string) => doc.querySelector(`[data-review-compare=${k}] td:last-child`)?.textContent?.trim()
    assert.throws(() => assert.equal(so("area_m2"), "Khớp", "GS-AC-1 nhãn So tính từ evidence"), /GS-AC-1 nhãn So tính từ evidence/)
  })

  async function kiemAc2(dung: (rows: ReturnType<CanCuMod["soTruongGhepCan"]>) => string) {
    const rows = canCu.soTruongGhepCan({ ...CHAM_A, area_m2: 72 }, CHAM_B, {}, {}, { a: CHAM_A, b: CHAM_B })
    const doc = new JSDOM(`<div>${dung(rows)}</div>`).window.document
    const o = (k: string) => doc.querySelectorAll(`[data-review-compare=${k}] td`)[1]
    assert.equal(o("area_m2").querySelector("[data-review-luc-cham]")?.textContent, "Lúc chấm: 70 m²", "GS-AC-2 ô đổi thiếu dòng Lúc chấm")
    assert.equal(o("price_vnd").querySelector("[data-review-luc-cham]"), null, "GS-AC-2 ô không đổi có dòng Lúc chấm")
  }

  test("GS-AC-2 dòng Lúc chấm", async () => {
    ready()
    await kiemAc2((rows) => renderToStaticMarkup(<thatCompare.ReviewCompare rows={rows} />))
    // Tin không đổi: evidence = chính dòng sale_offers (số JSON), pg trả numeric dạng chuỗi → 0 dòng Lúc chấm.
    const item = ghepCan(2, "gs_y", "gs_z")
    const ctx = await ngu(item)
    assert.equal(typeof ctx.offer_a?.ben?.price_vnd, "number", "bộ nạp không đổi numeric về số")
    const doc = await dungThe(thatCard, item, ctx)
    assert.equal(doc.querySelectorAll("[data-review-luc-cham]").length, 0, "GS-AC-2 tin không đổi mà có dòng Lúc chấm")
    const bo = await banChepTam<CompareMod>("src/components/ops/review/review-compare.tsx", (s) =>
      s.replace("{lucCham !== null && (", "{false && lucCham !== null && ("),
    )
    await assert.rejects(kiemAc2((rows) => renderToStaticMarkup(<bo.ReviewCompare rows={rows} />)), /GS-AC-2 ô đổi thiếu dòng Lúc chấm/)
  })
})

// ---------- GS-AC-3 ----------
function kiemAc3(mod: CanCuMod) {
  // Ma trận viết trước: 5 cặp loại hình → nhãn So.
  const MA_TRAN: [string | null, string | null, string][] = [
    ["unknown", "house", "thieu"],
    ["unknown", "unknown", "thieu"],
    [null, "house", "thieu"],
    ["house", "house", "khop"],
    ["house", "apartment", "lech"],
  ]
  let n = 0
  for (const [a, b, mong] of MA_TRAN) {
    const h = mod.soTruongGhepCan({ property_type: a }, { property_type: b }).find((x) => x.key === "property_type")!
    assert.equal(h.so, mong, mong === "thieu" && a === "unknown" ? `GS-AC-3 Chưa rõ so ra Lệch: ${a} ↔ ${b}` : `GS-AC-3 ${a} ↔ ${b}`)
    n++
  }
  assert.equal(n, 5)
}

test("GS-AC-3 Chưa rõ là Thiếu", async () => {
  kiemAc3(canCu)
  const rows = canCu.soTruongGhepCan({ property_type: "unknown" }, { property_type: "house" })
  const doc = new JSDOM(`<div>${renderToStaticMarkup(<thatCompare.ReviewCompare rows={rows} />)}</div>`).window.document
  const tds = doc.querySelectorAll("[data-review-compare=property_type] td")
  assert.ok(tds[1].textContent?.includes("Chưa rõ"), `ô A phải hiện «Chưa rõ»: ${tds[1].textContent}`)
  assert.equal(tds[3].textContent?.trim(), "Thiếu")
  const sai = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace(' || v.trim().toLowerCase() === "unknown"', ""))
  assert.throws(() => kiemAc3(sai), /GS-AC-3 Chưa rõ so ra Lệch/)
})

// ---------- GS-AC-4 / GS-AC-5 / GS-AC-8 ----------
const NUT = ["Cùng căn", "Khác căn", "Không chắc"]

async function kiemAc4(mod: CardMod) {
  const roiA = ghepCan(4, "gs_vang", "gs_b")
  const ctxA = await ngu(roiA)
  assert.equal(ctxA.offer_a?.ben, null, "bộ nạp: Tin A vắng phải ra ben null")
  const a = await nutSauKhiGoLyDo(mod, roiA, ctxA, "đủ căn cứ")
  assert.deepEqual(a.nut.map((x) => x.chu), NUT)
  assert.ok(a.nut.every((x) => x.tat), `GS-AC-4 nút quyết không khoá khi tin rời kho: ${JSON.stringify(a.nut)}`)
  assert.equal(a.alert, "Tin A không còn trong kho", "GS-AC-4 chữ Alert bên A")
  const roiB = ghepCan(5, "gs_a", "gs_vang")
  const b = await nutSauKhiGoLyDo(mod, roiB, await ngu(roiB), "đủ căn cứ")
  assert.ok(b.nut.every((x) => x.tat), "GS-AC-4 nút quyết không khoá khi tin rời kho: Tin B")
  assert.equal(b.alert, "Tin B không còn trong kho", "GS-AC-4 chữ Alert bên B")
  const ca2 = ghepCan(6, "gs_vang1", "gs_vang2")
  const doc = await dungThe(mod, ca2, await ngu(ca2))
  const dong = [...doc.querySelectorAll("[data-review-roi-kho-ben]")].map((x) => x.textContent)
  assert.deepEqual(dong, ["Tin A không còn trong kho", "Tin B không còn trong kho"], "GS-AC-4 cả hai rời kho")
  assert.equal(doc.querySelector("[data-review-roi-kho]")?.textContent, dong.join(""), "GS-AC-4 Alert có chữ ngoài hai câu")
}

async function kiemAc5(mod: CardMod) {
  const song = ghepCan(7, "gs_a", "gs_b")
  const ctx = await ngu(song)
  const trong = await nutSauKhiGoLyDo(mod, song, ctx, "")
  assert.ok(trong.nut.every((x) => x.tat), "lý do trống: nút tắt")
  const co = await nutSauKhiGoLyDo(mod, song, ctx, "đủ căn cứ")
  assert.equal(co.alert, null, "GS-AC-5 Alert rời kho trên thẻ không rời kho: hai bên sống")
  assert.ok(co.nut.every((x) => !x.tat), "có lý do: nút bật")
  // Không ngữ cảnh (thẻ đứng riêng): đọc evidence, không Alert.
  const doc = await dungThe(mod, song)
  assert.equal(doc.querySelector("[data-review-roi-kho]"), null, "GS-AC-5 Alert rời kho trên thẻ không rời kho: không ngữ cảnh")
  assert.ok(chuChinh(doc.querySelectorAll("[data-review-compare=area_m2] td")[1]).includes("70 m²"), "không ngữ cảnh phải đọc evidence")
}

async function kiemAc8(mod: CardMod) {
  const item = ghepCan(8, "gs_vang", "gs_b", undefined, "rejected")
  const doc = await dungThe(mod, item, await ngu(item))
  assert.equal(doc.querySelector("[data-review-roi-kho]")?.textContent, "Tin A không còn trong kho", "GS-AC-8 thẻ đã quyết không báo tin rời kho")
  const chu = [...doc.querySelectorAll("button")].map((b) => b.textContent?.trim())
  for (const n of NUT) assert.ok(!chu.includes(n), `thẻ đã quyết còn nút ${n}`)
}

describe("GS-AC-4/5/8 tin rời kho", () => {
  test("GS-AC-4 tin rời kho khoá nút", async () => {
    ready()
    await kiemAc4(thatCard)
    const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) => s.replace("const khoa = roiKho.length > 0;", "const khoa = false;"))
    await assert.rejects(kiemAc4(sai), /GS-AC-4 nút quyết không khoá khi tin rời kho/)
  })
  test("GS-AC-5 hai bên sống không Alert", async () => {
    ready()
    await kiemAc5(thatCard)
    const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
      s.replace("benA === null && \"Tin A\"", "benA == null && \"Tin A\""),
    )
    await assert.rejects(kiemAc5(sai), /GS-AC-5 Alert rời kho trên thẻ không rời kho/)
  })
  test("GS-AC-8 thẻ đã quyết có tin rời kho", async () => {
    ready()
    await kiemAc8(thatCard)
    const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) => s.replace("{khoa && (", "{khoa && item.status === \"pending\" && ("))
    await assert.rejects(kiemAc8(sai), /GS-AC-8 thẻ đã quyết không báo tin rời kho/)
  })
})

// ---------- GS-AC-6: probe DB máy thu (chỉ SELECT) ----------
test("GS-AC-6 probe DB máy thu: tập thẻ có Alert bên A bằng tập Tin A rời kho", async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có thẻ ghép căn thật — CI chỉ có lược đồ")
  const that = new pg.Client({ connectionString: localDbUrl() })
  await that.connect()
  try {
    const { rows } = await that.query(
      `SELECT id::int AS id, item_type, title, evidence, ai_suggestion, ai_reasoning, status, decision_note, created_at
       FROM review_queue WHERE item_type = 'entity_match' ORDER BY id`,
    )
    const roi = (
      await that.query(
        `SELECT id::int AS id FROM review_queue r WHERE item_type = 'entity_match'
           AND NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.offer_id = r.evidence->'offer_a'->>'offer_id') ORDER BY id`,
      )
    ).rows.map((r) => r.id as number)
    if (roi.length === 0) return t.skip("máy thu không có thẻ ghép căn nào có Tin A rời kho — bàn đo rỗng")
    const ctx = await ctxMod.loadReviewContext(rows, (q, v) => that.query(q, v))
    const coAlertA: number[] = []
    const coAlert: number[] = []
    for (const r of rows) {
      const doc = await dungThe(thatCard, toReviewItem(r, r.evidence), ctx[r.id])
      const dong = [...doc.querySelectorAll("[data-review-roi-kho-ben]")].map((x) => x.textContent)
      if (dong.length) coAlert.push(r.id)
      if (dong.includes("Tin A không còn trong kho")) coAlertA.push(r.id)
    }
    assert.deepEqual(coAlertA, roi, "GS-AC-6 tập thẻ có Alert bên A lệch tập Tin A rời kho")
    const roiB = (
      await that.query(
        `SELECT id::int AS id FROM review_queue r WHERE item_type = 'entity_match'
           AND NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.offer_id = r.evidence->'offer_b'->>'offer_id') ORDER BY id`,
      )
    ).rows.map((r) => r.id as number)
    assert.deepEqual(coAlert, [...new Set([...roi, ...roiB])].sort((x, y) => x - y), "GS-AC-6 thẻ hai tin sống có Alert")
  } finally {
    await that.end()
  }
})

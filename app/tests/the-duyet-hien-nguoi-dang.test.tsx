// the-duyet-hien-nguoi-dang.test.tsx — hồ sơ _acceptance/the-duyet-hien-nguoi-dang (HD7): hàng «Người đăng» của thẻ ghép căn.
// Tên ca mở đầu bằng mã AC (ND-AC-n). Ca DB dựng lược đồ tạm `nd_<pid>` (danh bạ dựng bằng dungNguoi thật), xoá cuối lượt; probe
// trên DB máy thu chỉ SELECT. Chiều đỏ: bản chép tạm tests/.nd-cu-* của tệp nguồn đổi đúng một chỗ, thông điệp ghim.
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
import { dungNguoi } from "../../pipeline/lib/danh-ba-nguoi.mjs"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const S = `nd_${process.pid}`
const urlS = (() => {
  const u = new URL(localDbUrl())
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/ops/review" })
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
  const f = path.join(APP, "tests", `.nd-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
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
type NguoiDang = import("../src/lib/ops/review-can-cu").NguoiDang
type BenNguoi = import("../src/lib/ops/review-can-cu").BenNguoi
type HangNguoi = import("../src/lib/ops/review-can-cu").HangNguoi
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

/** Thẻ dựng thật rồi gõ lý do (hay không) — nút quyết chỉ bật khi có lý do. */
async function nutCuaThe(mod: CardMod, item: Item, context: Ctx | undefined, lyDo: string) {
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
  if (lyDo) {
    const el = document.querySelector("[data-review-reason]") as HTMLTextAreaElement
    const set = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, "value")!.set!
    await React.act(async () => {
      set.call(el, lyDo)
      el.dispatchEvent(new dom.window.Event("input", { bubbles: true }))
    })
  }
  const nut = [...document.querySelectorAll("[data-review-actions] button")].map((b) => (b as HTMLButtonElement).disabled)
  await React.act(async () => root.unmount())
  return nut
}

let toReviewItem: typeof import("../src/lib/ops/review-queue").toReviewItem
let thatCard: CardMod
let thatCompare: CompareMod
let canCu: CanCuMod
let ctxMod: CtxMod

function theGhep(id: number, a: string, b: string): Item {
  const ev = { offer_a: { offer_id: a, source: "S05", text: "Tin A" }, offer_b: { offer_id: b, source: "S06", subject: "Tin B" }, stage_b_score: 0.5 }
  return toReviewItem(
    { id, item_type: "entity_match", title: `Cùng căn? #${id}`, evidence: ev, ai_suggestion: null, ai_reasoning: null, status: "pending", created_at: "2026-11-02T00:00:00Z" },
    ev,
  )
}

// ================= DB: lược đồ tạm nd_<pid> =================
const admin = new pg.Client({ connectionString: localDbUrl() })
const db = new pg.Client({ connectionString: urlS })
let setupErr: string | null = null
// Mọi bảng bộ dựng danh bạ ghi đều nằm trong lược đồ tạm — search_path có public phía sau chỉ để đọc kiểu và hàm.
const BANG_GHI = ["sale_offer_records", "stg_zalo_posts", "stg_chotot_ads", "parties", "party_roles", "registry_events", "review_queue"]
const qDb = (t: string, v: unknown[]) => db.query(t, v)
let snap: unknown

async function bai(pid: string, agent: string, sender: string | null, ten: string | null, text = "bài thử HD7") {
  await admin.query(
    `INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, agent_id, text, sender_id, sender_name, captured_at)
     VALUES ($1,$2,$3,$4,$5,$6, now())`,
    [pid, snap, agent, text, sender, ten],
  )
}
type Tin = { src: string; ref?: string | null; ten?: string | null; sdt?: string | null; posts?: string[]; roi?: boolean }
async function tin(id: string, t: Tin) {
  await admin.query(
    `INSERT INTO "${S}".sale_offer_records (offer_id, source, kind, originating_system_key, post_ids, first_seen, last_seen, price_vnd, area_m2,
       seller_ref, seller_name, seller_phone, retired_at)
     VALUES ($1,$2,'sale',$1,$3, now(), now(), 3000000000, 60, $4,$5,$6, CASE WHEN $7 THEN now() END)`,
    [id, t.src, t.posts ?? [], t.ref ?? null, t.ten ?? null, t.sdt ?? null, t.roi ?? false],
  )
}
const vai = (subject: string, party: string, rut = false, method = "source_field", tier = "fact") =>
  admin.query(
    `INSERT INTO "${S}".party_roles (subject_key, party_key, role, method, evidence_tier, evidence, run_id, retracted_at)
     VALUES ($1,$2,'nguoi_dang',$3,$4,'{}'::jsonb,'itest-hd7', CASE WHEN $5 THEN now() END)`,
    [subject, party, method, tier, rut],
  )
const biDanh = (party: string, source: string, kind: string, value: string) =>
  admin.query(`INSERT INTO "${S}".registry_aliases (object_key, source, kind, value) VALUES ($1,$2,$3,$4)`, [party, source, kind, value])

const P = { u1: "+84900000001", p2: "+84900000002", p3: "+84900000003", p4: "+84900000004", z: "+84900000009" }

before(async () => {
  try {
    await admin.connect()
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
    await admin.query(`CREATE SCHEMA "${S}"`)
    for (const t of BANG_GHI) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING GENERATED INCLUDING IDENTITY)`)
    // Bí danh cần chỉ mục thật: bộ dựng dùng ON CONFLICT trên registry_aliases_ten_uq.
    await admin.query(`CREATE TABLE "${S}".registry_aliases (LIKE public.registry_aliases INCLUDING ALL)`)
    await admin.query(`CREATE VIEW "${S}".sale_offers AS SELECT * FROM "${S}".sale_offer_records WHERE retired_at IS NULL`)
    snap = (await admin.query("SELECT snapshot_id FROM public.stg_zalo_posts LIMIT 1")).rows[0]?.snapshot_id ?? 1
    await db.connect()

    await bai("nd-p-a1", "openclaw-hook", "u1", "Nguyễn Văn Minh")
    await bai("nd-p-a2", "openclaw-hook", "u1", "Nguyễn Văn Minh")
    await tin("nd_a1", { src: "S03", ten: "Nguyễn Văn Minh", sdt: P.u1, posts: ["nd-p-a1"], ref: "u1" })
    await tin("nd_a2", { src: "S03", ten: "Nguyễn Văn Minh", posts: ["nd-p-a2"], ref: "u1" })
    await bai("nd-p-b1", "openclaw-hook", "u2", "Trần Thị Hoa")
    await bai("nd-p-b2", "openclaw-hook", "u3", "Lê Văn Nam")
    await tin("nd_b1", { src: "S03", ten: "Trần Thị Hoa", sdt: P.p2, posts: ["nd-p-b1"], ref: "u2" })
    await tin("nd_b2", { src: "S03", ten: "Lê Văn Nam", sdt: P.p3, posts: ["nd-p-b2"], ref: "u3" })
    await bai("nd-p-c1", "apify-facebook", "f1", "Đỗ Thu")
    await tin("nd_c1", { src: "S05", ten: "Đỗ Thu", sdt: P.p4, posts: ["nd-p-c1"], ref: "f1" })
    await tin("nd_c2", { src: "S03", ten: "Phạm Lan", sdt: P.p4 }) // không người gửi: bộ dựng lập người theo SĐT, số nằm ở bí danh `sdt`
    await tin("nd_d1", { src: "S06", ten: "Trần Văn Đức", ref: "ct:111" })
    await bai("nd-p-e1", "apify-facebook", "f2", "Bùi Hà", "Bán căn góc, LH ANH ĐỨC")
    await tin("nd_e1", { src: "S05", ten: "Bùi Hà", posts: ["nd-p-e1"], ref: "f2" })
    for (const [i, s] of ["u5", "u6", "u7"].entries()) await bai(`nd-p-m${i}`, "openclaw-hook", s, `Người ${s}`)
    await tin("nd_m1", { src: "S03", posts: ["nd-p-m0", "nd-p-m1", "nd-p-m2"], ref: "openclaw-hook" })
    await tin("nd_n1", { src: "S06", ten: "Sàn Lớn", ref: "ct:222" })

    await dungNguoi(db, { gop: false, runId: "itest-hd7", out: () => {} } as Parameters<typeof dungNguoi>[1])

    // Sau khi dựng: Tin B không còn SĐT trên tin, số chỉ còn ở bí danh của người.
    await admin.query(`UPDATE "${S}".sale_offer_records SET seller_phone = NULL WHERE offer_id = 'nd_c2'`)
    // Tin S06 có thêm một người khoá nhỏ hơn: neo phải theo `ct:<số>`, không rơi về khoá nhỏ nhất.
    await vai("S06:nd_n1", "pty_0000000000")
    // Lát đếm số tin (AC-2) và ngưỡng: viết tay, không qua bộ dựng.
    for (const id of ["nd_e2_1", "nd_e2_2", "nd_e2_rut"]) await tin(id, { src: "S03" })
    await tin("nd_e2_roi", { src: "S03", roi: true })
    await vai("S03:nd_e2_1", "pty_e2")
    await vai("S03:nd_e2_1", "pty_e2") // hai dòng vai một tin (lược đồ tạm không ràng buộc): vẫn là một tin
    await vai("S03:nd_e2_2", "pty_e2")
    await vai("S03:nd_e2_2", "pty_e2_khac")
    await vai("S03:nd_e2_roi", "pty_e2")
    await vai("S03:nd_e2_rut", "pty_e2", true)
    // Hai tin cùng hai người, chèn vai theo hai thứ tự đảo.
    for (const id of ["nd_o1", "nd_o2"]) await tin(id, { src: "S03", ref: "openclaw-hook" })
    for (const [s, ds] of [["S03:nd_o1", ["pty_oa", "pty_ob"]], ["S03:nd_o2", ["pty_ob", "pty_oa"]]] as const) for (const p of ds) await vai(s, p)
    // Tin chưa có trong danh bạ; tên «unknown» trên tin và ở bí danh.
    await tin("nd_z1", { src: "S03", ten: "Khách Lạ", sdt: P.z })
    await tin("nd_u1", { src: "S05", ten: "unknown", sdt: P.z })
    await tin("nd_u2", { src: "S05", ten: "unknown" })
    const ptyU2 = `pty_${"0".repeat(25)}2` // registry_aliases giữ CHECK khuôn ULID
    await vai("S05:nd_u2", ptyU2)
    await biDanh(ptyU2, "S05", "ten", "unknown")
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
const ngu = async (item: Item, mod: CtxMod = ctxMod) => (await mod.loadReviewContext([item], qDb))[item.id]

// ---------- đọc hàng trên DOM ----------
const hang = (doc: Document) => doc.querySelector("[data-review-compare=nguoi_dang]")
const oCua = (doc: Document, cot: number) => hang(doc)!.querySelectorAll("td")[cot]
const chuO = (o: Element | undefined, sel: string) => o?.querySelector(sel)?.textContent?.trim() ?? null
const nhan = (doc: Document) => oCua(doc, 3).querySelector('[data-slot="badge"]')?.textContent?.trim() ?? oCua(doc, 3).textContent?.trim()

const nd = (partyKey: string, ten: string | null, sdts: string[] = [], soTin = 1, taiKhoan: string[] = []): NguoiDang => ({
  partyKey,
  ten,
  sdts,
  taiKhoan,
  soTin,
  canCu: { lop: "fact", phuongPhap: "source_field" },
})
const ben = (source: string, ds: NguoiDang[], sdt: string | null = null, ten: string | null = null): BenNguoi => ({ source, ten, sdt, ds })

before(async () => {
  ;({ toReviewItem } = await import("../src/lib/ops/review-queue"))
  thatCard = await import("../src/components/ops/review-card")
  thatCompare = await import("../src/components/ops/review/review-compare")
  canCu = await import("../src/lib/ops/review-can-cu")
  ctxMod = await import("../src/lib/ops/review-context")
})

describe("the-duyet-hien-nguoi-dang", () => {
  // ---------- ND-AC-1 ----------
  function kiemAc1Hang(doc: Document) {
    const a = oCua(doc, 1)
    assert.equal(chuO(a, "[data-review-nguoi-ten]"), "Nguyễn Văn Minh", "ND-AC-1 THIEU TEN NGUOI DANG")
    assert.equal(chuO(a, "[data-review-nguoi-sdt]"), P.u1, "ND-AC-1 thiếu SĐT")
    assert.ok(chuO(a, "[data-review-can-cu]"), "ND-AC-1 thiếu căn cứ của vai")
    assert.equal(chuO(oCua(doc, 2), "[data-review-nguoi-sdt]"), "Chưa có SĐT", "ND-AC-1 nguồn giấu SĐT")
  }

  test("ND-AC-1 hàng Người đăng đứng đầu", async () => {
    ready()
    const item = theGhep(1, "nd_a1", "nd_d1")
    const ctx = await ngu(item)
    const doc = await dungThe(thatCard, item, ctx)
    const ten = [...doc.querySelectorAll("[data-review-compare]")].map((r) => r.getAttribute("data-review-compare"))
    assert.equal(ten[0], "nguoi_dang", "ND-AC-1 hàng không đứng đầu")
    assert.equal(ten.filter((k) => k === "nguoi_dang").length, 1, "ND-AC-1 không đúng một hàng")
    assert.deepEqual(ten.slice(1), canCu.TRUONG_GHEP_CAN.map((t) => t.key), "ND-AC-1 đổi thứ tự mười hàng")
    kiemAc1Hang(doc)
    // Mười hàng giữ nguyên giá trị và nhãn: so với thẻ dựng khi ngữ cảnh không có khoá người.
    const boNguoi = { offer_a: { ...ctx.offer_a!, nguoiDang: undefined }, offer_b: { ...ctx.offer_b!, nguoiDang: undefined } }
    const docCu = await dungThe(thatCard, item, boNguoi)
    assert.equal(hang(docCu), null)
    const noiDung = (d: Document) => [...d.querySelectorAll("[data-review-compare]")].filter((r) => r.getAttribute("data-review-compare") !== "nguoi_dang").map((r) => r.textContent)
    assert.equal(noiDung(doc).length, 10)
    assert.deepEqual(noiDung(doc), noiDung(docCu), "ND-AC-1 mười hàng đổi khi có hàng người")
    // Chiều đỏ: bản chép bỏ tên.
    const bo = await banChepTam<CompareMod>("src/components/ops/review/review-compare.tsx", (s) => s.replace('{ten ?? "—"}', '{"—"}'))
    const nguoi = canCu.soNguoiDang(ctx.offer_a!.nguoiDang!, ctx.offer_b!.nguoiDang!, null)
    const docDo = new JSDOM(`<div>${renderToStaticMarkup(<bo.ReviewCompare rows={[nguoi]} />)}</div>`).window.document
    assert.throws(() => kiemAc1Hang(docDo), /ND-AC-1 THIEU TEN NGUOI DANG/)
  })

  // ---------- ND-AC-2 ----------
  async function kiemAc2(mod: CtxMod, thongBao: string) {
    const item = theGhep(2, "nd_e2_1", "nd_e2_2")
    const ctx = await ngu(item, mod)
    const nguoi = ctx.offer_a!.nguoiDang!.ds.find((n) => n.partyKey === "pty_e2")
    assert.equal(nguoi?.soTin, 2, thongBao)
  }

  test("ND-AC-2 số tin chỉ đếm tin sống", async () => {
    ready()
    await kiemAc2(ctxMod, "ND-AC-2 sai số tin")
    const roi = await banChepTam<CtxMod>("src/lib/ops/review-context.ts", (s) =>
      s.replace(
        "FROM party_roles r\n    JOIN sale_offers o ON r.subject_key = o.source || ':' || o.originating_system_key\n    WHERE r.party_key IN",
        "FROM party_roles r\n    JOIN sale_offer_records o ON r.subject_key = o.source || ':' || o.originating_system_key\n    WHERE r.party_key IN",
      ),
    )
    await assert.rejects(kiemAc2(roi, "ND-AC-2 DEM CA TIN ROI KHO"), /ND-AC-2 DEM CA TIN ROI KHO/)
    const rut = await banChepTam<CtxMod>("src/lib/ops/review-context.ts", (s) =>
      s.replace("WHERE r.party_key IN (SELECT party_key FROM vai) AND r.role = 'nguoi_dang' AND r.retracted_at IS NULL", "WHERE r.party_key IN (SELECT party_key FROM vai) AND r.role = 'nguoi_dang'"),
    )
    await assert.rejects(kiemAc2(rut, "ND-AC-2 DEM CA VAI DA RUT"), /ND-AC-2 DEM CA VAI DA RUT/)
    const trung = await banChepTam<CtxMod>("src/lib/ops/review-context.ts", (s) => s.replace("count(DISTINCT r.subject_key)", "count(r.subject_key)"))
    await assert.rejects(kiemAc2(trung, "ND-AC-2 DEM TRUNG TIN"), /ND-AC-2 DEM TRUNG TIN/)
  })

  // ---------- ND-AC-3 ----------
  const MA_TRAN: { nhan: string; a: BenNguoi | null; b: BenNguoi | null; so: string; phu: string | null }[] = [
    { nhan: "chung nguoi", a: ben("S03", [nd("p1", "Minh")]), b: ben("S03", [nd("p1", "Minh")]), so: "khop", phu: "Cùng người trong danh bạ: Minh" },
    { nhan: "SDT RA KHOP cung nguon", a: ben("S03", [nd("p1", "A")], "+841"), b: ben("S03", [nd("p2", "B")], "+841"), so: "khong_so", phu: "Cùng SĐT +841" },
    { nhan: "SDT RA KHOP khac nguon", a: ben("S05", [nd("p1", "A")], "+841"), b: ben("S03", [nd("p2", "B", ["+841"])]), so: "khong_so", phu: "Cùng SĐT +841" },
    { nhan: "cung nguon khac nguoi", a: ben("S03", [nd("p1", "A")]), b: ben("S03", [nd("p2", "B")]), so: "lech", phu: null },
    { nhan: "cung nguon mot ben chi SDT", a: ben("S03", [], "+841"), b: ben("S03", [nd("p2", "B")]), so: "thieu", phu: null },
    { nhan: "KHAC NGUON RA LECH", a: ben("S05", [nd("p1", "A")]), b: ben("S06", [nd("p2", "B")]), so: "khong_so", phu: null },
    { nhan: "roi kho", a: null, b: ben("S06", [nd("p2", "B")]), so: "thieu", phu: null },
    { nhan: "khong dinh danh", a: ben("S03", [], null, "Chỉ tên"), b: ben("S06", [nd("p2", "B")]), so: "thieu", phu: null },
    { nhan: "KHONG NEU NGUOI CHUNG", a: ben("S03", [nd("p1", "A"), nd("p9", "Chung")]), b: ben("S03", [nd("p2", "B"), nd("p9", "Chung")]), so: "khop", phu: "Cùng người trong danh bạ: Chung" },
  ]
  function kiemAc3(so: CanCuMod["soNguoiDang"]) {
    assert.equal(MA_TRAN.length, 9)
    for (const c of MA_TRAN) {
      const h = so(c.a, c.b, null)
      assert.equal(h.so, c.so, `ND-AC-3 ${c.nhan} (nhãn)`)
      assert.equal(h.phu, c.phu, `ND-AC-3 ${c.nhan} (dòng phụ)`)
    }
  }

  test("ND-AC-3 ma trận luật so", async () => {
    kiemAc3(canCu.soNguoiDang)
    const khac = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace('if (a.source !== b.source) return { so: "khong_so", phu: null };\n', ""))
    assert.throws(() => kiemAc3(khac.soNguoiDang), /ND-AC-3 KHAC NGUON RA LECH/)
    const sdt = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace('return { so: "khong_so", phu: `Cùng SĐT ${so}` };', 'return { so: "khop", phu: `Cùng SĐT ${so}` };'))
    assert.throws(() => kiemAc3(sdt.soNguoiDang), /ND-AC-3 SDT RA KHOP/)
    const ten = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace('`Cùng người trong danh bạ${chung.ten ? `: ${chung.ten}` : ""}`', "`Cùng người trong danh bạ`"))
    assert.throws(() => kiemAc3(ten.soNguoiDang), /ND-AC-3 chung nguoi|ND-AC-3 KHONG NEU NGUOI CHUNG/)
    assert.throws(() => assert.equal(ten.soNguoiDang(MA_TRAN[8].a, MA_TRAN[8].b, null).phu, MA_TRAN[8].phu, "ND-AC-3 KHONG NEU NGUOI CHUNG"), /ND-AC-3 KHONG NEU NGUOI CHUNG/)
  })

  test("ND-AC-3 đầu-cuối: danh bạ thật tới thẻ thật", async () => {
    ready()
    const the = async (id: number, a: string, b: string) => {
      const item = theGhep(id, a, b)
      return dungThe(thatCard, item, await ngu(item))
    }
    const khop = await the(31, "nd_a1", "nd_a2")
    assert.equal(nhan(khop), "Khớp", "ND-AC-3 đầu-cuối: cùng người không ra Khớp")
    assert.match(chuO(oCua(khop, 3), "[data-review-so-phu]") ?? "", /Cùng người trong danh bạ/)
    assert.equal(nhan(await the(32, "nd_b1", "nd_b2")), "Lệch", "ND-AC-3 đầu-cuối: cùng nguồn khác người")
    const sdt = await the(33, "nd_c1", "nd_c2")
    assert.equal(nhan(sdt), "Không so được")
    // Tin A mang số trên tin, Tin B (nd_c2) đã bỏ số trên tin: số chung đến từ bí danh `sdt` do bộ dựng ghi.
    assert.equal(chuO(oCua(sdt, 3), "[data-review-so-phu]"), `Cùng SĐT ${P.p4}`, "ND-AC-3 đầu-cuối: SĐT tin đối bí danh")
  })

  // ---------- ND-AC-4 ----------
  const CO_TEN: [string, string | null, string | null][] = [
    ["Nguyễn Văn Minh", "LH anh Minh", "Minh"],
    ["Trần Văn Đức", "LH ANH ĐỨC", "Đức"],
    ["Lê Nam", "hướng Nam", "Nam"], // dương giả đã biết, ghi ở Notes của hợp đồng
    ["Minh", "nhà mình bán", null],
    ["An", "an ninh", null],
    ["An", "Thanh", null],
    ["Hoa", "chị Hoan", null],
    ["A", "LH A", null],
    ["Nguyễn Văn Minh", null, null],
  ]
  function kiemAc4(so: CanCuMod["soNguoiDang"]) {
    for (const [ten, van, mong] of CO_TEN) {
      const h = so(ben("S05", [nd("p1", "X")]), ben("S06", [nd("p2", ten)]), van)
      const loi = van === "chị Hoan" ? "ND-AC-4 KHOP GIUA TU" : van === "an ninh" ? "ND-AC-4 KHOP TU THUONG" : `ND-AC-4 ${ten}+${van}`
      assert.equal(h.tenGoi, mong, loi)
    }
    // Nhãn Lệch cùng nguồn: không cờ dù tên có trong văn bản.
    assert.equal(so(ben("S03", [nd("p1", "X")]), ben("S03", [nd("p2", "Lê Minh")]), "LH anh Minh").tenGoi, null, "ND-AC-4 cờ trên nhãn Lệch")
  }

  test("ND-AC-4 cờ tên gọi", async () => {
    ready()
    kiemAc4(canCu.soNguoiDang)
    const item = theGhep(41, "nd_e1", "nd_d1")
    const doc = await dungThe(thatCard, item, await ngu(item))
    assert.equal(nhan(doc), "Không so được")
    assert.equal(chuO(oCua(doc, 3), "[data-review-ten-goi]"), "Tên gọi «Đức» có trong văn bản Tin A", "ND-AC-4 toàn văn không tới cờ")
    const giua = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) =>
      s.replace("(?<![\\\\p{L}\\\\p{M}\\\\p{N}])", "").replace("(?![\\\\p{L}\\\\p{M}\\\\p{N}])", ""),
    )
    assert.throws(() => kiemAc4(giua.soNguoiDang), /ND-AC-4 KHOP GIUA TU/)
    const thuong = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace('(?![\\\\p{L}\\\\p{M}\\\\p{N}])`, "u");', '(?![\\\\p{L}\\\\p{M}\\\\p{N}])`, "iu");'))
    assert.throws(() => kiemAc4(thuong.soNguoiDang), /ND-AC-4 KHOP TU THUONG/)
  })

  // ---------- ND-AC-5 ----------
  function oBadge(so: CanCuMod["soNguoiDang"], a: BenNguoi, b: BenNguoi) {
    const h: HangNguoi = so(a, b, null)
    return new JSDOM(`<div>${renderToStaticMarkup(<thatCompare.ReviewCompare rows={[h]} />)}</div>`).window.document
  }
  function kiemAc5(so: CanCuMod["soNguoiDang"]) {
    const bangBen = (cot: 1 | 2, n: number) => {
      const x = ben("S03", [nd("px", "X", [], n)])
      const y = ben("S06", [nd("py", "Y", [], 1)])
      return oCua(cot === 1 ? oBadge(so, x, y) : oBadge(so, y, x), cot)
    }
    const coBadge = (cot: 1 | 2) => bangBen(cot, 10).querySelector("[data-review-dang-nhieu]") != null
    // Mốc 10 sai thì cả hai bên cùng mất Badge; chỉ Tin A mất thì là thiếu bên A.
    assert.ok(coBadge(2), "ND-AC-5 SAI NGUONG")
    assert.ok(coBadge(1), "ND-AC-5 THIEU BEN A")
    for (const [cot, tenBen] of [[1, "A"], [2, "B"]] as const) {
      const bang = (n: number) => bangBen(cot, n)
      const o9 = bang(9)
      assert.equal(o9.querySelector("[data-review-dang-nhieu]"), null, "ND-AC-5 SAI NGUONG 9 có Badge")
      assert.equal(chuO(o9, "[data-review-so-tin]"), "9 tin đang rao", `ND-AC-5 chữ phụ bên ${tenBen}`)
      const o10 = bang(10)
      assert.equal(chuO(o10, "[data-review-dang-nhieu]"), "Đăng 10 tin", "ND-AC-5 chữ Badge")
      assert.equal(o10.querySelector("[data-review-so-tin]"), null, "ND-AC-5 Badge không thay chữ phụ")
      const lon = bang(2872)
      assert.equal(chuO(lon, "[data-review-dang-nhieu]"), "Đăng 2.872 tin", "ND-AC-5 số không ngăn nghìn")
      assert.equal(lon.querySelector("[data-review-so-tin]"), null)
    }
    // Người neo 1 tin, người kia 40 tin: Badge của người kia, chữ phụ của người neo, Badge đứng sau «+n người khác».
    const hai = oCua(oBadge(so, ben("S03", [nd("p1", "Neo", [], 1), nd("p2", "Kia", [], 40)]), ben("S06", [nd("py", "Y")])), 1)
    assert.equal(chuO(hai, "[data-review-dang-nhieu]"), "Đăng 40 tin", "ND-AC-5 GIAU NGUOI NHIEU TIN")
    assert.equal(chuO(hai, "[data-review-so-tin]"), "1 tin đang rao", "ND-AC-5 mất chữ phụ của người neo")
    const thuTu = [...hai.querySelectorAll("[data-review-nguoi-khac],[data-review-dang-nhieu]")].map((e) => e.hasAttribute("data-review-nguoi-khac"))
    assert.deepEqual(thuTu, [true, false], "ND-AC-5 Badge người khác đứng dưới tên người neo")
    // Người neo từ 10 tin, người kia nhiều hơn: chỉ Badge, không chữ phụ.
    const neoLon = oCua(oBadge(so, ben("S03", [nd("p1", "Neo", [], 15), nd("p2", "Kia", [], 40)]), ben("S06", [nd("py", "Y")])), 1)
    assert.equal(neoLon.querySelector("[data-review-so-tin]"), null, "ND-AC-5 người neo từ 10 tin vẫn có chữ phụ")
  }

  test("ND-AC-5 badge Đăng n tin", async () => {
    kiemAc5(canCu.soNguoiDang)
    const nguong = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace("return max >= NGUONG_DANG_NHIEU ? max : null;", "return max > NGUONG_DANG_NHIEU ? max : null;"))
    assert.throws(() => kiemAc5(nguong.soNguoiDang), /ND-AC-5 SAI NGUONG/)
    const neo = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace("...(b?.ds ?? []).map((n) => n.soTin)", "...(b?.ds ?? []).slice(0, 1).map((n) => n.soTin)"))
    assert.throws(() => kiemAc5(neo.soNguoiDang), /ND-AC-5 GIAU NGUOI NHIEU TIN/)
    const benB = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) => s.replace("dangNhieuA: dangNhieu(a),", "dangNhieuA: null,"))
    assert.throws(() => kiemAc5(benB.soNguoiDang), /ND-AC-5 THIEU BEN A/)
  })

  // ---------- ND-AC-6 ----------
  async function kiemAc6(mod: CtxMod) {
    // Người có party_key lớn nhất của tin ba người: gán seller_ref bằng tài khoản của họ (bí danh do bộ dựng ghi).
    const { rows } = await db.query(
      `SELECT r.party_key, a.value FROM party_roles r JOIN registry_aliases a ON a.object_key = r.party_key AND a.kind = 'tai_khoan_nguon'
       WHERE r.subject_key = 'S03:nd_m1' AND r.retracted_at IS NULL ORDER BY r.party_key DESC`,
    )
    assert.equal(rows.length, 3, "ND-AC-6 tin thử phải có ba người từ bộ dựng")
    await admin.query(`UPDATE "${S}".sale_offer_records SET seller_ref = $1 WHERE offer_id = 'nd_m1'`, [rows[0].value])
    const m = (await ngu(theGhep(61, "nd_m1", "nd_d1"), mod)).offer_a!.nguoiDang!
    assert.equal(m.ds[0].partyKey, rows[0].party_key, "ND-AC-6 KHONG THEO NEO")
    const doc = await dungThe(thatCard, theGhep(61, "nd_m1", "nd_d1"), await ngu(theGhep(61, "nd_m1", "nd_d1"), mod))
    assert.equal(chuO(oCua(doc, 1), "[data-review-nguoi-khac]"), "+2 người khác", "ND-AC-6 thiếu +n người khác")
    // S06: `ct:<số>` khớp tài khoản `<số>`, dù có người khoá nhỏ hơn trên tin.
    const n = (await ngu(theGhep(62, "nd_a1", "nd_n1"), mod)).offer_b!.nguoiDang!
    assert.equal(n.ds.length, 2)
    assert.ok(n.ds[0].taiKhoan.includes("222"), "ND-AC-6 KHONG THEO NEO S06")
    // seller_ref hằng: party_key nhỏ nhất, không phụ thuộc thứ tự chèn vai.
    const o = (await ngu(theGhep(63, "nd_o1", "nd_o2"), mod))
    assert.equal(o.offer_a!.nguoiDang!.ds[0].partyKey, "pty_oa", "ND-AC-6 KHONG THEO NEO dự phòng")
    assert.deepEqual(o.offer_a!.nguoiDang!.ds.map((x) => x.partyKey), o.offer_b!.nguoiDang!.ds.map((x) => x.partyKey), "ND-AC-6 phụ thuộc thứ tự chèn")
  }

  test("ND-AC-6 người neo theo seller_ref", async () => {
    ready()
    await kiemAc6(ctxMod)
    const sai = await banChepTam<CtxMod>("src/lib/ops/review-context.ts", (s) =>
      s.replace("ds: chonNguoiNeo(nguoiTheoTin.get(s.offerId) ?? [], r.seller_ref),", "ds: chonNguoiNeo(nguoiTheoTin.get(s.offerId) ?? [], null),"),
    )
    await assert.rejects(kiemAc6(sai), /ND-AC-6 KHONG THEO NEO/)
  })

  // ---------- ND-AC-7 ----------
  const bam = async () =>
    (
      await db.query(
        `SELECT (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM review_queue t) AS q,
                (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM sale_offer_records t) AS o,
                (SELECT md5(coalesce(string_agg(t::text, '|' ORDER BY t::text), '')) FROM party_roles t) AS r`,
      )
    ).rows[0]

  test("ND-AC-7 không người, rời kho, đứng riêng", async () => {
    ready()
    const truoc = await bam()
    // Tin chưa có trong danh bạ.
    const itemZ = theGhep(71, "nd_z1", "nd_d1")
    const ctxZ = await ngu(itemZ)
    const docZ = await dungThe(thatCard, itemZ, ctxZ)
    const z = oCua(docZ, 1)
    assert.equal(chuO(z, "[data-review-ngoai-danh-ba]"), "Chưa có trong danh bạ", "ND-AC-7 thiếu chữ ngoài danh bạ")
    assert.equal(chuO(z, "[data-review-nguoi-ten]"), "Khách Lạ", "ND-AC-7 thiếu tên trên tin")
    assert.equal(chuO(z, "[data-review-nguoi-sdt]"), P.z, "ND-AC-7 thiếu SĐT trên tin")
    // Bên rời kho.
    const itemR = theGhep(72, "nd_a1", "nd_khong_co")
    const ctxR = await ngu(itemR)
    assert.equal(ctxR.offer_b!.ben, null)
    assert.equal(ctxR.offer_b!.nguoiDang, undefined, "ND-AC-7 tin rời kho không có khoá người (ca PL3 ghim hình ngữ cảnh)")
    const docR = await dungThe(thatCard, itemR, ctxR)
    assert.equal(oCua(docR, 2).textContent?.trim(), "—", "ND-AC-7 ô rời kho")
    assert.equal(nhan(docR), "Thiếu", "ND-AC-7 So của bên rời kho")
    // «unknown» không phải tên: trên tin và ở bí danh.
    const docU = await dungThe(thatCard, theGhep(73, "nd_u1", "nd_u2"), await ngu(theGhep(73, "nd_u1", "nd_u2")))
    assert.equal(chuO(oCua(docU, 1), "[data-review-nguoi-ten]"), "—", "ND-AC-7 tên unknown trên tin")
    assert.equal(chuO(oCua(docU, 2), "[data-review-nguoi-ten]"), "—", "ND-AC-7 tên unknown ở bí danh")
    // Thẻ đứng riêng.
    async function kiemDungRieng(mod: CardMod) {
      assert.equal(hang(await dungThe(mod, itemZ)), null, "ND-AC-7 HANG KHI KHONG BIET")
    }
    await kiemDungRieng(thatCard)
    const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) => s.replace("nguoiA === undefined && nguoiB === undefined ? hangSo : ", ""))
    await assert.rejects(kiemDungRieng(sai), /ND-AC-7 HANG KHI KHONG BIET/)
    // Nút quyết chỉ phụ thuộc lý do và tin rời kho.
    assert.ok((await nutCuaThe(thatCard, itemZ, ctxZ, "")).slice(0, 2).every(Boolean), "ND-AC-7 nút bật khi chưa có lý do")
    assert.ok((await nutCuaThe(thatCard, itemZ, ctxZ, "cùng người đăng")).slice(0, 2).every((t) => !t), "ND-AC-7 nút tắt khi đã có lý do")
    assert.deepEqual(await bam(), truoc, "ND-AC-7 đọc thẻ làm đổi dữ liệu")
  })

  // ---------- ND-AC-8: DB máy thu, chỉ SELECT ----------
  test("ND-AC-8 DB máy thu", async (t) => {
    if (process.env.CI) return t.skip("cần DB máy thu có danh bạ thật — CI chỉ có lược đồ")
    const q = (text: string, values: unknown[]) => admin.query(text, values)
    const { rows: cho } = await admin.query(
      `SELECT id, evidence->'offer_a'->>'offer_id' a, evidence->'offer_b'->>'offer_id' b FROM public.review_queue WHERE item_type = 'entity_match' AND status = 'pending'`,
    )
    const { rows: s05 } = await admin.query(`SELECT offer_id FROM public.sale_offers WHERE source = 'S05' ORDER BY offer_id LIMIT 20`)
    const { rows: lon } = await admin.query(
      `SELECT o.offer_id FROM public.sale_offers o WHERE o.source = 'S06' AND o.seller_ref = (
         SELECT seller_ref FROM public.sale_offers WHERE source = 'S06' AND seller_ref IS NOT NULL GROUP BY 1 ORDER BY count(*) DESC, 1 LIMIT 1
       ) ORDER BY o.offer_id LIMIT 20`,
    )
    const dung = s05.map((r, i) => ({ id: -1 - i, a: r.offer_id, b: lon[i]?.offer_id })).filter((c) => c.b)
    const cap = [...cho, ...dung].filter((c) => c.a && c.b)
    const items = cap.map((c) => ({ id: Number(c.id), item_type: "entity_match", evidence: { offer_a: { offer_id: c.a }, offer_b: { offer_id: c.b } } }))
    const bat = Date.now()
    // Truy vấn đi qua `public`: lược đồ tạm chỉ phục vụ các ca trên.
    const ctx = await ctxMod.loadReviewContext(items, async (text, values) => {
      await admin.query("SET search_path = public")
      return q(text, values)
    })
    const ms = Date.now() - bat
    const offers = [...new Set(cap.flatMap((c) => [c.a, c.b]))]
    // Đếm độc lập: viết khác NGUOI_SQL, từ bảng tin gốc tới vai, mỗi tin một số lớn nhất.
    const { rows: dem } = await admin.query(
      `WITH song AS (SELECT source || ':' || originating_system_key AS sk, offer_id FROM public.sale_offer_records WHERE retired_at IS NULL),
            nguoi AS (SELECT r.party_key, count(DISTINCT s.sk)::int AS n FROM public.party_roles r JOIN song s ON s.sk = r.subject_key
                      WHERE r.retracted_at IS NULL AND r.role = 'nguoi_dang' GROUP BY 1)
       SELECT s.offer_id, max(n.n)::int AS n FROM song s
       JOIN public.party_roles r ON r.subject_key = s.sk AND r.retracted_at IS NULL AND r.role = 'nguoi_dang'
       JOIN nguoi n USING (party_key) WHERE s.offer_id = ANY ($1::text[]) GROUP BY 1`,
      [offers],
    )
    const soDem = new Map(dem.map((r) => [r.offer_id as string, r.n as number]))
    const { rows: ref } = await admin.query(`SELECT offer_id, seller_ref FROM public.sale_offers WHERE offer_id = ANY ($1::text[])`, [offers])
    const refCua = new Map(ref.map((r) => [r.offer_id as string, r.seller_ref as string | null]))
    const nhanDem: Record<string, number> = {}
    const co: number[] = []
    let duPhong = 0
    let khacNguon = 0
    let tuNghin = 0
    const mong = (id: string) => ((soDem.get(id) ?? 0) >= 10 ? soDem.get(id)! : null)
    for (const c of cap) {
      const x = ctx[Number(c.id)]
      const h = canCu.soNguoiDang(x.offer_a!.nguoiDang ?? null, x.offer_b!.nguoiDang ?? null, x.offer_a!.toanVan)
      nhanDem[h.so] = (nhanDem[h.so] ?? 0) + 1
      if (h.tenGoi) co.push(Number(c.id))
      const sr = new Set([h.a?.source, h.b?.source])
      if (sr.has("S05") && sr.has("S06")) {
        khacNguon++
        assert.notEqual(h.so, "lech", `ND-AC-8 cặp S05↔S06 ra Lệch #${c.id}`)
      }
      assert.equal(h.dangNhieuA, mong(c.a), `ND-AC-8 Badge Tin A lệch phép đếm độc lập #${c.id}`)
      assert.equal(h.dangNhieuB, mong(c.b), `ND-AC-8 Badge Tin B lệch phép đếm độc lập #${c.id}`)
      if ((h.dangNhieuA ?? 0) >= 1000 || (h.dangNhieuB ?? 0) >= 1000) tuNghin++
      for (const [b, id] of [[h.a, c.a], [h.b, c.b]] as const) {
        const r = refCua.get(id)?.replace(/^ct:/, "")
        if (b && b.ds.length > 1 && !(r && b.ds[0].taiKhoan.includes(r))) duPhong++
      }
    }
    assert.ok(khacNguon > 0, "ND-AC-8 KHONG DU MAU")
    assert.ok(tuNghin > 0, "ND-AC-8 không có cặp nào từ 1.000 tin")
    console.log(`ND-AC-8 đo: ${cap.length} cặp (${cho.length} thẻ chờ, ${dung.length} dựng), ${khacNguon} cặp S05↔S06, nhãn ${JSON.stringify(nhanDem)}, ${tuNghin} cặp từ 1.000 tin, cờ tên gọi ${co.length} [${co.join(",")}], tin nhiều người đi nhánh dự phòng ${duPhong}, truy vấn ${ms} ms`)
  })
})

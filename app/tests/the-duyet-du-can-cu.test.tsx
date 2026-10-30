// the-duyet-du-can-cu.test.tsx — hồ sơ _acceptance/the-duyet-du-can-cu (PL3): thẻ /ops/review đủ căn cứ, toàn văn, ảnh theo
// vai, không độ tự tin, không gợi ý mặc định, quyết kèm lý do ghi audit cùng transaction. Tên ca mở đầu bằng mã AC (TD-AC-n).
// Ca DB dựng lược đồ tạm `td_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt; probe trên DB local thật chỉ
// SELECT. Mỗi phép đo có chiều đỏ: bản chép tạm của tệp nguồn (tests/.td-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// ---------- jsdom (cùng khuôn review-card.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3460/ops/review" })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
})
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

// ---------- bản chép tạm (đối chứng dương) ----------
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
})
/** Chép một tệp nguồn của app thành tests/.td-cu-<pid>-<n>.<ext>, đổi đúng một chỗ, đổi mọi import tương đối sang tuyệt đối. */
async function banChepTam<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.td-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, rel.endsWith(".tsx") ? `import React from "react"\n${tuyet}` : tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- dựng thẻ ----------
type CardMod = typeof import("../src/components/ops/review-card")
type Item = import("../src/lib/ops/review-queue").ReviewItem
const ROUTER = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} }

/** Markup tĩnh của thẻ (SSR) trong AppRouterContext, kèm document để truy vấn. */
async function dungThe(mod: CardMod, item: Item, extra: Record<string, unknown> = {}) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime")
  const html = renderToStaticMarkup(
    (
      <AppRouterContext.Provider value={ROUTER as never}>
        <mod.ReviewCard item={item} {...extra} />
      </AppRouterContext.Provider>
    ) as ReactElement,
  )
  return { html, doc: new JSDOM(`<div id=r>${html}</div>`).window.document }
}

/** Chữ + giá trị thuộc tính (bỏ `class` — tên lớp Tailwind mang số bất kỳ) của một đoạn markup. */
const chuVaThuocTinh = (html: string) => html.replace(/\sclass="[^"]*"/g, "")

type QueueMod = typeof import("../src/lib/ops/review-queue")
type CanCuMod = typeof import("../src/lib/ops/review-can-cu")
type VocabMod = typeof import("../src/lib/vocab.generated")
let toReviewItem: QueueMod["toReviewItem"]
let thatCard: CardMod
let canCu: CanCuMod
let VOCAB: VocabMod["VOCAB"]
let LABELS_VI: VocabMod["LABELS_VI"]
before(async () => {
  ;({ toReviewItem } = await import("../src/lib/ops/review-queue"))
  thatCard = (await import("../src/components/ops/review-card")) as CardMod
  canCu = (await import("../src/lib/ops/review-can-cu")) as CanCuMod
  ;({ VOCAB, LABELS_VI } = await import("../src/lib/vocab.generated"))
})

// ---------- fixture ----------
const BEN_A = {
  offer_id: "offer_a1", source: "S03", price_vnd: 5e9, area_m2: 70, price_perm2: 7e7, bedrooms: 2, bathrooms: 1,
  phuong: "Tây Hồ", property_type: "apartment", street: "Lạc Long Quân", block: "A1", floor: null, text: "Tin A đoạn đầu",
}
const BEN_B = {
  offer_id: "offer_b1", source: "S06", price_vnd: 6e9, area_m2: 70, price_perm2: 8.6e7, bedrooms: 2, bathrooms: null,
  phuong: "Tây Hồ", property_type: "house", street: null, block: "A1", floor: null, subject: "Tin B tiêu đề",
}
const ghepCan = (over: Partial<{ ai_suggestion: string | null; ai_reasoning: string | null }> = {}): Item =>
  toReviewItem(
    {
      id: 3, item_type: "entity_match", title: "Cùng căn? Tây Hồ 70m²",
      evidence: { offer_a: BEN_A, offer_b: BEN_B, stage_b_score: 0.873 },
      ai_suggestion: "yes", ai_reasoning: null, status: "pending", created_at: "2026-10-30T05:00:00Z",
      ...over,
    },
    { offer_a: BEN_A, offer_b: BEN_B, stage_b_score: 0.873 },
  )
const ENRICH_EV = {
  offer_id: "offer_e1", text: "Bán căn hộ 2 ngủ, sổ hồng", group_name: "Nhóm thử", run_id: "r1", model: "m",
  fields: [
    { proposal_id: 31, field: "property_type", value: "apartment", source: "e1_rule", basis: "luật E1: «căn hộ»", conflict: true, confidence: 0.5 },
    { proposal_id: 32, field: "property_type", value: "house", source: "e2_llm", basis: "LLM m · tự tin 92% · trace t", conflict: true, confidence: 0.92 },
    { proposal_id: 33, field: "bathrooms", value: "2", source: "e2_llm", basis: "LLM m · tự tin 92% · trace t2", confidence: 0.92 },
    { proposal_id: 34, field: "street_raw", value: "Âu Cơ", source: "e1_rule", basis: null, confidence: 0.6 },
  ],
}
const boSung = (ai_suggestion: string | null = "apply"): Item =>
  toReviewItem(
    {
      id: 7, item_type: "agent_output", title: "Bổ sung dữ liệu: offer_e1 (3 trường)", evidence: ENRICH_EV,
      ai_suggestion, ai_reasoning: null, status: "pending", created_at: "2026-10-30T05:00:00Z",
    },
    ENRICH_EV,
  )

// ---------- TD-AC-1 ----------
async function kiemAc1(mod: CardMod) {
  const { doc } = await dungThe(mod, boSung())
  const rows = [...doc.querySelectorAll("[data-review-field]")]
  assert.deepEqual(rows.map((r) => r.getAttribute("data-review-field")), ["property_type", "bathrooms", "street_raw"])
  for (const r of rows) {
    const f = r.getAttribute("data-review-field")
    assert.ok(r.querySelector("[data-review-can-cu]"), `TD-AC-1: trường ${f} thiếu ô căn cứ`)
    assert.ok(/Theo luật|Theo AI/.test(r.textContent ?? ""), `TD-AC-1: trường ${f} thiếu phương pháp`)
  }
  const street = rows[2].querySelector("[data-review-can-cu]")!.textContent
  assert.equal(street, "Chưa ghi căn cứ")
  const bath = rows[1].querySelector("[data-review-can-cu]")!.textContent ?? ""
  assert.ok(bath.includes("LLM m") && bath.includes("trace t2"), "căn cứ còn lại nguyên văn sau khi gọt độ tự tin")
  const text = doc.body.textContent ?? ""
  assert.ok(!text.includes("92") && !text.includes("tự tin"), "TD-AC-1: độ tự tin lọt lên thẻ")
}
test("TD-AC-1 mọi trường đề xuất kèm phương pháp + căn cứ; không basis → «Chưa ghi căn cứ»", async () => {
  await kiemAc1(thatCard)
  const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
    s.replace("<ItemTitle>{fieldValue(f.field, f.value)}</ItemTitle>\n                <ProposalBasis o={f} />", "<ItemTitle>{fieldValue(f.field, f.value)}</ItemTitle>"),
  )
  await assert.rejects(kiemAc1(sai), /TD-AC-1: trường bathrooms thiếu ô căn cứ/)
})

// ---------- TD-AC-2 (hàm thuần + bảng) ----------

// Ma trận viết trước: mỗi trường một cặp giá trị khác nhau; ba ca khớp / lệch / thiếu một bên.
const GIA_TRI: Record<string, [string | number, string | number]> = {
  price_vnd: [5e9, 6e9], area_m2: [70, 80], price_perm2: [7e7, 8e7], phuong: ["Tây Hồ", "Ba Đình"], bedrooms: [2, 3],
  bathrooms: [1, 2], property_type: ["apartment", "house"], street: ["Lạc Long Quân", "Âu Cơ"], block: ["A1", "B2"],
  floor: ["12", "8"],
}
async function kiemSo(mod: CanCuMod) {
  let n = 0
  for (const [k, [x, y]] of Object.entries(GIA_TRI)) {
    const hang = (a: unknown, b: unknown) => mod.soTruongGhepCan({ [k]: a }, { [k]: b }).find((h) => h.key === k)!
    assert.equal(hang(x, x).so, "khop", `${k}: cùng giá trị phải Khớp`)
    assert.equal(hang(x, y).so, "lech", `${k}: khác giá trị phải Lệch`)
    assert.equal(hang(x, null).so, "thieu", `${k}: thiếu một bên phải Thiếu`)
    n += 3
  }
  assert.equal(n, 30)
  assert.equal(mod.soTruongGhepCan({}, {}).find((h) => h.key === "floor")!.so, "thieu", "TD-AC-2: tầng thiếu cả hai bên phải là Thiếu")
}
test("TD-AC-2 bảng so: ma trận 10 trường × khớp/lệch/thiếu, 10 hàng, trường ngoài trục ghi «chưa ghi căn cứ»", async () => {
  await kiemSo(canCu)
  const rows = canCu.soTruongGhepCan(BEN_A, BEN_B)
  assert.equal(rows.length, 10)
  const ngoaiTruc = rows.filter((h) => !h.truc).map((h) => h.key)
  assert.deepEqual(ngoaiTruc, ["price_vnd", "area_m2", "price_perm2", "phuong", "floor"])
  for (const h of rows.filter((x) => !x.truc)) assert.equal(h.canCuA, "Chưa ghi căn cứ — đọc từ tin")
  const { doc } = await dungThe(thatCard, ghepCan())
  assert.equal(doc.querySelectorAll("[data-review-compare]").length, 10)
  for (const k of ngoaiTruc) {
    const o = doc.querySelector(`[data-review-compare="${k}"] td:first-child [data-review-can-cu]`)
    assert.equal(o?.textContent, "Chưa ghi căn cứ — đọc từ tin", `ô Trường của ${k}`)
  }
  const sai = await banChepTam<CanCuMod>("src/lib/ops/review-can-cu.ts", (s) =>
    s.replace('if (trong(a) || trong(b)) return "thieu";', 'if (trong(a) && trong(b)) return "khop";\n  if (trong(a) || trong(b)) return "thieu";'),
  )
  await assert.rejects(kiemSo(sai), /TD-AC-2: tầng thiếu cả hai bên phải là Thiếu/)
})

test("TD-AC-2 nhãn căn cứ: ma trận viết trước 3 lớp × 6 phương pháp = 18 ô theo sổ từ vựng", () => {
  let n = 0
  for (const lop of VOCAB.evidence_tier) {
    for (const pp of VOCAB.assertion_method) {
      const s = canCu.nhanCanCu({ lop, phuongPhap: pp })
      assert.ok(s.includes(LABELS_VI.assertion_method[pp]), `${lop}·${pp}: thiếu nhãn phương pháp`)
      if (pp === "legacy") assert.equal(s, "Giá trị có trước — chưa có căn cứ")
      else assert.ok(s.includes(LABELS_VI.evidence_tier[lop]), `${lop}·${pp}: thiếu nhãn lớp`)
      n++
    }
  }
  assert.equal(n, 18)
  assert.equal(canCu.nhanCanCu(undefined), "Chưa ghi căn cứ — đọc từ tin")
})

test("TD-AC-2 field_provenance hỏng → không căn cứ, không ném", () => {
  for (const hong of [null, "x", [], { bedrooms: "2" }, { bedrooms: { tier: "fact", method: "ma_la" } }, { bedrooms: { tier: 1, method: "parser" } }]) {
    assert.deepEqual(canCu.docCanCu(hong), {}, JSON.stringify(hong))
  }
  assert.deepEqual(canCu.docCanCu({ bedrooms: { v: "2", tier: "fact", method: "source_field", ids: [1] } }), {
    bedrooms: { lop: "fact", phuongPhap: "source_field" },
  })
})

// ---------- TD-AC-5 ----------
async function kiemAc5(mod: CardMod) {
  const ghep = chuVaThuocTinh((await dungThe(mod, ghepCan({ ai_reasoning: "giá chênh 5%" }))).html)
  const bo = chuVaThuocTinh((await dungThe(mod, boSung())).html)
  for (const [ten, h] of [["ghép căn", ghep], ["bổ sung tin", bo]] as const) {
    assert.ok(!h.includes("Điểm B"), `TD-AC-5: còn điểm Stage B trên thẻ (${ten})`)
    for (const cam of ["tự tin", "0.873", "87", "0.91", "91", "0.92", "92"]) {
      assert.ok(!h.includes(cam), `TD-AC-5: thẻ ${ten} chứa «${cam}»`)
    }
  }
}
test("TD-AC-5 không điểm Stage B, không độ tự tin trên thẻ", async () => {
  await kiemAc5(thatCard)
  const sai = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
    s.replace("<ReviewCompare rows={rows} />", "<Badge variant=\"outline\">Điểm B: {ev.stage_b_score}</Badge>\n      <ReviewCompare rows={rows} />"),
  )
  await assert.rejects(kiemAc5(sai), /TD-AC-5: còn điểm Stage B trên thẻ/)
})

test("TD-AC-5 hàng chờ (ReviewQueue) không mang số độ tự tin", async () => {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { ReviewQueue } = await import("../src/components/ops/review/review-queue")
  const html = chuVaThuocTinh(renderToStaticMarkup(<ReviewQueue items={[ghepCan(), boSung()]} media={{}} />))
  for (const cam of ["Điểm B", "tự tin", "0.873", "0.91", "0.92"]) assert.ok(!html.includes(cam), `hàng chờ chứa «${cam}»`)
})

// ---------- TD-AC-6 (UI) ----------
async function kiemAc6(mod: CardMod) {
  const vung = async (item: Item) => (await dungThe(mod, item)).doc.querySelector("[data-review-actions]")!.outerHTML
  const ghep = await Promise.all(["yes", "no", "unsure", null].map((g) => vung(ghepCan({ ai_suggestion: g }))))
  for (const h of ghep) assert.equal(h, ghep[0], "TD-AC-6: vùng nút đổi theo gợi ý AI")
  const bo = await Promise.all(["apply", null].map((g) => vung(boSung(g))))
  assert.equal(bo[1], bo[0], "TD-AC-6: nút Áp đổi theo gợi ý apply")
}
test("TD-AC-6 vùng nút không đổi theo ai_suggestion; suy luận AI tách sau bảng so", async () => {
  await kiemAc6(thatCard)
  const coAi = (await dungThe(thatCard, ghepCan({ ai_suggestion: "unsure", ai_reasoning: "lý do của máy" }))).doc
  const ai = coAi.querySelector("[data-review-ai]")
  const bang = coAi.querySelector("[data-review-compare-table]")
  assert.ok(ai && bang, "thiếu khối AI hoặc bảng so")
  assert.ok(ai.textContent?.includes("Suy luận của AI — không phải căn cứ"))
  assert.ok(bang.compareDocumentPosition(ai) & 4, "khối suy luận AI phải đứng sau bảng so")
  const khongAi = (await dungThe(thatCard, ghepCan({ ai_suggestion: null, ai_reasoning: null }))).doc
  assert.equal(khongAi.querySelector("[data-review-ai]"), null, "không có suy luận thì không có khối AI")
  assert.ok(!((await dungThe(thatCard, boSung("apply"))).doc.body.textContent ?? "").includes("nên áp"))

  const saiGhep = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
    s.replace(
      '<Button size="sm" onClick={() => d.decide("approved")}',
      '<Button size="sm" variant={item.ai_suggestion === "yes" ? "default" : "outline"} onClick={() => d.decide("approved")}',
    ),
  )
  await assert.rejects(kiemAc6(saiGhep), /TD-AC-6: vùng nút đổi theo gợi ý AI/)
  const saiBo = await banChepTam<CardMod>("src/components/ops/review-card.tsx", (s) =>
    s.replace('<Button size="sm" onClick={approve}', '<Button size="sm" variant={item.ai_suggestion === "apply" ? "default" : "outline"} onClick={approve}'),
  )
  await assert.rejects(kiemAc6(saiBo), /TD-AC-6: nút Áp đổi theo gợi ý apply/)
})

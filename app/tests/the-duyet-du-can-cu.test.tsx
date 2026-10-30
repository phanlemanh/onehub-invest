// the-duyet-du-can-cu.test.tsx — hồ sơ _acceptance/the-duyet-du-can-cu (PL3): thẻ /ops/review đủ căn cứ, toàn văn, ảnh theo
// vai, không độ tự tin, không gợi ý mặc định, quyết kèm lý do ghi audit cùng transaction. Tên ca mở đầu bằng mã AC (TD-AC-n).
// Ca DB dựng lược đồ tạm `td_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt; probe trên DB local thật chỉ
// SELECT. Mỗi phép đo có chiều đỏ: bản chép tạm của tệp nguồn (tests/.td-cu-*) đổi đúng một chỗ, thông điệp ghim.
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

// Lược đồ tạm: search_path = td_<pid>, public — bảng tạm che bảng public, hàm của 045 (resolve_offer_fields…) tìm ở public.
const S = `td_${process.pid}`
const urlS = (() => {
  const u = new URL(localDbUrl())
  u.searchParams.set("options", `-c search_path=${S},public`)
  return u.toString()
})()
process.env.DATABASE_URL = urlS // pool của app đọc lúc import — đặt TRƯỚC mọi import động

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

// ================= DB: lược đồ tạm td_<pid> =================
const admin = new pg.Client({ connectionString: localDbUrl() })
const db = new pg.Client({ connectionString: urlS })
let setupErr: string | null = null
const BANG = ["review_queue", "sale_offer_records", "stg_zalo_posts", "stg_chotot_ads", "field_assertions", "ops_audit", "media", "property_candidates", "enrichment_proposals"]

const VAN_S03 = Array.from({ length: 30 }, (_, i) => `Dòng ${String(i).padStart(2, "0")} của bài S03: căn hộ 2 ngủ, sổ hồng, tầng trung, giá thương lượng.`).join("\n").slice(0, 1200)
const VAN_S03_CU = "Bản cũ của bài S03 — không được hiện."
const VAN_S05 = "Bài S05 rất dài. ".repeat(750).slice(0, 12000)
const BODY_S06 = "Mô tả S06: nhà phố 4 tầng, hẻm xe hơi. ".repeat(30).slice(0, 800)
const NHOM_S03 = "Nhóm thử td"

async function dungLuocDo() {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${S}"`)
  for (const t of BANG) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING GENERATED)`)
  await admin.query(`CREATE VIEW "${S}".sale_offers AS SELECT * FROM "${S}".sale_offer_records WHERE retired_at IS NULL`)
  // Cột serial mang default nextval(public…) — đổi sang sequence riêng của lược đồ để không đụng sequence của public.
  const { rows } = await admin.query(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1 AND column_default LIKE 'nextval(%'`,
    [S],
  )
  for (const r of rows) {
    const seq = `"${S}"."${r.table_name}_${r.column_name}_seq"`
    await admin.query(`CREATE SEQUENCE ${seq} START 1000`)
    await admin.query(`ALTER TABLE "${S}".${r.table_name} ALTER COLUMN ${r.column_name} SET DEFAULT nextval('${seq}')`)
  }
}

async function napTin() {
  const q = (t: string, v: unknown[]) => admin.query(t, v)
  const tin: [string, string, string | null, string[]][] = [
    ["td_s03", "S03", null, ["tp0", "tp1"]],
    ["td_s05", "S05", null, ["tf1"]],
    ["td_s06", "S06", "9001", []],
    ["td_s06b", "S06", "9002", []],
    ["td_np", "S06", "9003", []],
  ]
  for (const [id, src, osk, posts] of tin)
    await q(
      `INSERT INTO "${S}".sale_offer_records (offer_id, source, kind, originating_system_key, post_ids, first_seen, last_seen)
       VALUES ($1,$2,'sale',$3,$4, now(), now())`,
      [id, src, osk, posts],
    )
  await q(`INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, group_name, text, captured_at) VALUES ('tp0','hanoi__zalo-agent__a',$1,$2, now() - interval '2 days')`, [NHOM_S03, VAN_S03_CU])
  await q(`INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, group_name, text, captured_at) VALUES ('tp1','hanoi__zalo-agent__b',$1,$2, now())`, [NHOM_S03, VAN_S03])
  await q(`INSERT INTO "${S}".stg_zalo_posts (post_id, snapshot_id, group_name, text, captured_at) VALUES ('tf1','hanoi__apify-facebook__c','nhóm FB thử',$1, now())`, [VAN_S05])
  await q(
    `INSERT INTO "${S}".stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id)
     VALUES (9001, 1, 'HN', 1000, 's', $1, 'hanoi__chotot__d')`,
    [JSON.stringify({ body: BODY_S06, subject: "S06 tiêu đề" })],
  )
  // Phát biểu → resolve_offer_fields thật của 045 ghi field_provenance (không viết tay jsonb).
  const pb: [string, string, string, string, string, Record<string, unknown>][] = [
    ["S03:tp1", "bedrooms", "2", "fact", "source_field", {}],
    ["S03:tp1", "property_type", "apartment", "observed", "parser", {}],
    ["S06:9001", "bathrooms", "3", "fact", "source_field", {}],
    ["S05:tf1", "street_raw", "Âu Cơ", "observed", "legacy", { offer_id: "td_s05" }],
  ]
  for (const [subj, f, v, tier, m, ev] of pb)
    await q(
      `INSERT INTO "${S}".field_assertions (subject_key, field, value, evidence_tier, method, evidence) VALUES ($1,$2,$3,$4,$5,$6)`,
      [subj, f, v, tier, m, JSON.stringify(ev)],
    )
  await q(`INSERT INTO "${S}".ops_audit (actor, action, env, detail) VALUES ('machine:td', 'phat-bieu:cat-chuyen', 'local', '{}')`, [])
}

before(async () => {
  try {
    await admin.connect()
    await dungLuocDo()
    await napTin()
    await db.connect()
    await db.query(`SELECT resolve_offer_fields(ARRAY['td_s03','td_s05','td_s06','td_s06b','td_np'])`)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await db.end().catch(() => {})
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

type CtxMod = typeof import("../src/lib/ops/review-context")
const THE_DB = [
  { id: 1, item_type: "entity_match", evidence: { offer_a: { offer_id: "td_s05" }, offer_b: { offer_id: "td_s06" } } },
  { id: 2, item_type: "agent_output", evidence: { offer_id: "td_s03" } },
  { id: 3, item_type: "entity_match", evidence: { offer_a: { offer_id: "td_np" }, offer_b: { offer_id: "td_vang" } } },
  { id: 4, item_type: "agent_output", evidence: { offer_id: "td_s06b" } },
]
const qDb = (t: string, v: unknown[]) => db.query(t, v)

describe("TD-AC-2 DB căn cứ đọc từ field_provenance do bên ghi 045 dựng", () => {
  test("TD-AC-2 DB căn cứ loader khớp field_provenance từng ô; tin không phát biểu / vắng → không căn cứ, không ném", async () => {
    ready()
    const { loadReviewContext } = (await import("../src/lib/ops/review-context")) as CtxMod
    const ctx = await loadReviewContext(THE_DB, qDb)
    const { rows } = await db.query(`SELECT offer_id, field_provenance FROM sale_offers`)
    const fp = Object.fromEntries(rows.map((r) => [r.offer_id, r.field_provenance]))
    assert.deepEqual(ctx[2].offer!.canCu, canCu.docCanCu(fp.td_s03), "căn cứ td_s03 lệch field_provenance")
    assert.deepEqual(ctx[2].offer!.canCu, {
      bedrooms: { lop: "fact", phuongPhap: "source_field" },
      property_type: { lop: "observed", phuongPhap: "parser" },
    })
    assert.deepEqual(ctx[1].offer_b!.canCu, { bathrooms: { lop: "fact", phuongPhap: "source_field" } })
    assert.deepEqual(ctx[1].offer_a!.canCu, { street_raw: { lop: "observed", phuongPhap: "legacy" } })
    assert.deepEqual(ctx[3].offer_a!.canCu, {}, "tin không phát biểu")
    assert.deepEqual(ctx[3].offer_b, { toanVan: null, nhom: null, canCu: {} }, "tin vắng khỏi sale_offers")
    const rowsSo = canCu.soTruongGhepCan({}, {}, ctx[3].offer_a!.canCu, ctx[3].offer_b!.canCu).filter((h) => h.truc)
    for (const h of rowsSo) assert.equal(h.canCuA, "Chưa ghi căn cứ — đọc từ tin", `${h.key}`)
  })
})

async function kiemAc3(mod: CtxMod) {
  const ctx = await mod.loadReviewContext(THE_DB, qDb)
  const s03 = ctx[2].offer!.toanVan ?? ""
  assert.equal(s03.length, VAN_S03.length, `TD-AC-3: toàn văn S03 dài ${s03.length}, kỳ vọng ${VAN_S03.length}`)
  assert.equal(s03, VAN_S03, "toàn văn S03 phải là bản mới nhất, từng ký tự")
  assert.equal(ctx[2].offer!.nhom, NHOM_S03)
  assert.equal(ctx[1].offer_a!.toanVan, VAN_S05, "toàn văn S05 (12.000 ký tự) phải trọn")
  assert.equal(ctx[1].offer_a!.nhom, null, "tên nhóm chỉ hiện cho S03")
  assert.equal(ctx[1].offer_b!.toanVan, BODY_S06)
  assert.equal(ctx[4].offer!.toanVan, null, "S06 không có bài ở stg → null")
}
describe("TD-AC-3 toàn văn đọc ở máy thu", () => {
  test("TD-AC-3 S03 bản mới nhất 1.200 ký tự, S05 12.000 ký tự, S06 body; không cắt, không line-clamp; nhóm tách riêng", async () => {
    ready()
    const mod = (await import("../src/lib/ops/review-context")) as CtxMod
    await kiemAc3(mod)
    const ctx = await mod.loadReviewContext(THE_DB, qDb)
    const React = await import("react")
    Object.assign(globalThis, { React })
    const { ReviewFullText } = await import("../src/components/ops/review/review-full-text")
    const html = renderToStaticMarkup(<ReviewFullText label="Tin" ctx={ctx[2].offer} doanDau="đoạn đầu" />)
    const doc = new JSDOM(`<div>${html}</div>`).window.document
    assert.equal(doc.querySelector("[data-review-fulltext]")!.textContent, VAN_S03, "khối toàn văn phải giữ nguyên văn và xuống dòng")
    assert.equal(doc.querySelectorAll("[class*=line-clamp]").length, 0, "không line-clamp")
    assert.equal(doc.querySelector("[data-review-group]")!.textContent, `Nhóm: ${NHOM_S03}`)
    assert.ok(!doc.querySelector("[data-review-fulltext]")!.textContent!.startsWith(NHOM_S03), "tên nhóm không đứng đầu đoạn tin")
    assert.ok(!html.includes("đoạn đầu"), "có toàn văn thì không hiện đoạn đầu evidence")
    const thieu = renderToStaticMarkup(<ReviewFullText label="Tin" ctx={ctx[4].offer} doanDau="đoạn đầu lưu" />)
    assert.ok(thieu.includes("Không có toàn văn ở máy thu") && thieu.includes("đoạn đầu lưu"))
    const sai = await banChepTam<CtxMod>("src/lib/ops/review-context.ts", (s) => s.replace("ELSE z.text END", "ELSE left(z.text, 300) END"))
    await assert.rejects(kiemAc3(sai), /TD-AC-3: toàn văn S03 dài 300, kỳ vọng 1200/)
  })
})

// ---------- Probe chỉ đọc trên DB local thật (dữ liệu importer + transform thật ghi) ----------
describe("TD-AC-2/3 probe DB local thật (chỉ SELECT)", () => {
  const that = new pg.Client({ connectionString: localDbUrl() })
  before(async () => that.connect())
  after(async () => that.end())
  const qThat = (t: string, v: unknown[]) => that.query(t, v)

  test("TD-AC-2 probe: mọi cặp lớp × phương pháp đang sống ở field_assertions có nhãn", async () => {
    const { rows } = await that.query(`SELECT DISTINCT evidence_tier, method FROM field_assertions WHERE retracted_at IS NULL`)
    assert.ok(rows.length > 0, "DB local không có phát biểu nào — probe không đo được")
    for (const r of rows) {
      const nhan = canCu.nhanCanCu({ lop: r.evidence_tier, phuongPhap: r.method })
      assert.ok(nhan && nhan !== r.method && !nhan.includes(r.evidence_tier), `cặp ${r.evidence_tier}·${r.method} không có nhãn: «${nhan}»`)
    }
  })

  test("TD-AC-3 probe: thẻ chờ có bài gốc ở stg → loader trả toàn văn (100%); căn cứ khớp field_provenance", async () => {
    const { loadReviewContext } = (await import("../src/lib/ops/review-context")) as CtxMod
    const { rows: the } = await that.query(`SELECT id::int AS id, item_type, evidence FROM review_queue WHERE status = 'pending'`)
    const ctx = await loadReviewContext(the, qThat)
    let soBen = 0
    for (const t of the) {
      for (const k of ["offer_a", "offer_b", "offer"] as const) {
        const id = k === "offer" ? t.evidence?.offer_id : t.evidence?.[k]?.offer_id
        if (typeof id !== "string") continue
        const { rows } = await that.query(
          `SELECT o.field_provenance,
                  EXISTS (SELECT 1 FROM stg_zalo_posts p WHERE p.post_id = ANY (o.post_ids))
                  OR EXISTS (SELECT 1 FROM stg_chotot_ads a WHERE o.source = 'S06' AND a.list_id::text = o.originating_system_key) AS co_bai
             FROM sale_offers o WHERE o.offer_id = $1`,
          [id],
        )
        if (rows.length === 0) continue
        soBen++
        if (rows[0].co_bai) assert.ok(ctx[t.id]?.[k]?.toanVan, `TD-AC-3 probe: thẻ #${t.id} có bài gốc ở stg mà loader trả null`)
        assert.deepEqual(ctx[t.id]?.[k]?.canCu, canCu.docCanCu(rows[0].field_provenance), `thẻ #${t.id} ${k}: căn cứ lệch field_provenance`)
      }
    }
    assert.ok(soBen > 0, "không thẻ chờ nào có tin trong sale_offers — probe không đo được")
  })
})

// ---------- TD-AC-4 ảnh tin theo vai ----------
type MediaMod = typeof import("../src/lib/ops/review-media")
type Vai = "user" | "viewer" | "ops" | "admin" | "owner"
const nguoi = (role: Vai) => ({ id: `td-${role}`, email: `td-${role}@local.test`, plan: "free" as const, role })
const SNAP = "hanoi__zalo-agent__2026-10-30T000000"
const THE_ANH = [{ id: 1, item_type: "entity_match", evidence: { offer_a: { offer_id: "td_s05" }, offer_b: { offer_id: "td_s06" } } }]

async function napAnh() {
  const rows: [string, string, string | null, string | null, number][] = [
    ["mk1", "td_s05", null, `${SNAP}/media/a.jpg`, 1],
    ["mk2", "td_s05", "https://scontent.fbcdn.net/x/1.jpg", null, 2],
    ["mk3", "td_s06", "https://cdn.nguon-thu.example/2.jpg", null, 1],
  ]
  for (const [k, offer, url, file, order] of rows)
    await admin.query(
      `INSERT INTO "${S}".media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key,
                                 media_order, media_url, local_file)
       VALUES ($1,$2,'S0x',$1,$3,$4,$5)`,
      [k, offer, order, url, file],
    )
}

async function kiemAc4(mod: MediaMod) {
  // Ma trận viết trước: 5 vai × {ảnh đã tải, chỉ URL gốc} = 10 ô — kỳ vọng [đã tải, URL gốc].
  const KY_VONG: Record<Vai, [boolean, boolean]> = {
    user: [false, false], viewer: [false, false], ops: [true, false], admin: [true, true], owner: [true, true],
  }
  let n = 0
  for (const [vai, [taiVe, goc]] of Object.entries(KY_VONG) as [Vai, [boolean, boolean]][]) {
    const m = (await mod.loadReviewMedia(THE_ANH, nguoi(vai), qDb))[1]
    const anh = [...(m?.offer_a ?? []), ...(m?.offer_b ?? [])]
    if (vai === "ops" && anh.some((i) => i.origin !== "local")) assert.fail("TD-AC-4: vai ops nhận URL gốc")
    assert.equal(anh.some((i) => i.origin === "local"), taiVe, `${vai}: ảnh đã tải`)
    assert.equal(anh.some((i) => i.origin === "remote"), goc, `${vai}: URL gốc`)
    n += 2
  }
  assert.equal(n, 10)
}

describe("TD-AC-4 ảnh tin theo vai", () => {
  let tmp = ""
  let snapPrev: string | undefined
  before(async () => {
    const { mkdtempSync, mkdirSync } = await import("node:fs")
    const { tmpdir } = await import("node:os")
    tmp = mkdtempSync(path.join(tmpdir(), "td-anh-"))
    mkdirSync(path.join(tmp, "hanoi", SNAP, "media"), { recursive: true })
    writeFileSync(path.join(tmp, "hanoi", SNAP, "media", "a.jpg"), Buffer.from([0xff, 0xd8, 0xff, 0xd9]))
    snapPrev = process.env.SNAPSHOTS_DIR
    process.env.SNAPSHOTS_DIR = tmp
    if (!setupErr) await napAnh().catch((e) => (setupErr = (e as Error).message))
  })
  after(() => {
    if (snapPrev === undefined) delete process.env.SNAPSHOTS_DIR
    else process.env.SNAPSHOTS_DIR = snapPrev
    rmSync(tmp, { recursive: true, force: true })
  })

  test("TD-AC-4 loader: ma trận 5 vai × 2 loại ảnh; vai ops chỉ ảnh đã tải + số ảnh bị giữ", async () => {
    ready()
    const mod = (await import("../src/lib/ops/review-media")) as MediaMod
    await kiemAc4(mod)
    const ops = (await mod.loadReviewMedia(THE_ANH, nguoi("ops"), qDb))[1]
    assert.deepEqual(ops.chiGoc, { offer_a: 1, offer_b: 1 }, "vai ops: số ảnh chỉ có URL gốc theo bên")
    const sai = await banChepTam<MediaMod>("src/lib/ops/review-media.ts", (s) => s.replace("media[s.key] = local;", "media[s.key] = all;"))
    await assert.rejects(kiemAc4(sai), /TD-AC-4: vai ops nhận URL gốc/)
  })

  test("TD-AC-4 route ảnh: snapshot 200 cho ops/admin/owner, 404 cho user/viewer/khách; ?path= 404 cho ops", async () => {
    const { serveZaloMedia, snapshotMediaUrl } = await import("../src/lib/ops/zalo-media")
    const url = snapshotMediaUrl(SNAP, "media/a.jpg")!
    const get = (u: ReturnType<typeof nguoi> | null, qs = url.split("?")[1]) =>
      serveZaloMedia(new Request(`http://localhost:3460/api/zalo-media?${qs}`), u)
    for (const vai of ["ops", "admin", "owner"] as const) assert.equal((await get(nguoi(vai))).status, 200, `${vai} snapshot`)
    for (const u of [null, nguoi("user"), nguoi("viewer")]) assert.equal((await get(u)).status, 404, `${u?.role ?? "khách"} snapshot`)
    const p = `path=${encodeURIComponent(path.join(tmp, "x.png"))}`
    assert.equal((await get(nguoi("ops"), p)).status, 404, "ops ?path=")
  })

  test("TD-AC-4 sheet vai ops: tin chỉ có URL gốc → không <img> ngoài /api/zalo-media, câu «chỉ có ở nguồn»", async () => {
    ready()
    const { loadReviewMedia } = (await import("../src/lib/ops/review-media")) as MediaMod
    const media = (await loadReviewMedia(THE_ANH, nguoi("ops"), qDb))[1]
    const { html, doc } = await dungThe(thatCard, ghepCan(), { media })
    for (const img of doc.querySelectorAll("img")) {
      assert.ok(img.getAttribute("src")!.startsWith("/api/zalo-media?"), `ảnh ngoài route nội bộ: ${img.getAttribute("src")}`)
    }
    assert.ok(!html.includes("fbcdn") && !html.includes("nguon-thu.example"), "URL gốc lọt vào trang vai ops")
    const cau = [...doc.querySelectorAll("[data-review-photos-chi-goc]")].map((e) => e.textContent)
    assert.deepEqual(cau, ["Tin A: 1 ảnh chỉ có ở nguồn — quản trị viên xem được", "Tin B: 1 ảnh chỉ có ở nguồn — quản trị viên xem được"])
  })

  test("TD-AC-4 probe DB local thật: ảnh local_file của tin trên thẻ chờ = số ảnh vai ops nhận", async () => {
    const that = new pg.Client({ connectionString: localDbUrl() })
    await that.connect()
    try {
      const { loadReviewMedia, MAX_IMAGES_PER_OFFER } = (await import("../src/lib/ops/review-media")) as MediaMod
      const { rows: the } = await that.query(`SELECT id::int AS id, item_type, evidence FROM review_queue WHERE status = 'pending'`)
      const media = await loadReviewMedia(the, nguoi("ops"), (t, v) => that.query(t, v))
      let so = 0
      for (const t of the) {
        for (const k of ["offer_a", "offer_b", "offer"] as const) {
          const id = k === "offer" ? t.evidence?.offer_id : t.evidence?.[k]?.offer_id
          if (typeof id !== "string") continue
          const { rows } = await that.query(
            `SELECT count(DISTINCT local_file)::int AS n FROM media WHERE resource_record_key = $1 AND local_file ~ '^[^/]+/media/[A-Za-z0-9][A-Za-z0-9_.-]*$'`,
            [id],
          )
          const nhan = (media[t.id]?.[k] ?? []).filter((i) => i.origin === "local").length
          assert.equal(nhan, Math.min(rows[0].n, MAX_IMAGES_PER_OFFER), `thẻ #${t.id} ${k}: ảnh local lệch`)
          so++
        }
      }
      assert.ok(so > 0, "không thẻ chờ nào có tin — probe không đo được")
    } finally {
      await that.end()
    }
  })
})

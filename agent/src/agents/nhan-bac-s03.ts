// nhan-bac-s03.ts — KC1 `nhan-bac-model-lon-s03`: nhãn bạc cho một bài S03 — ý định tin (offer · inquiry · not_listing ·
// unknown), bán/thuê, xác suất, câu trích. Ba backend qua lớp model có sẵn (runtime/models.ts): Qwen local (MTPLX),
// Claude Haiku 5.5 và OpenAI Decisions qua Vercel AI Gateway (Mạnh 01/11). Mỗi lần gọi ghi một dòng ai_calls (PL29).
// Luật 7: chỉ ra đề xuất — người gọi ghi vào bảng silver_labels, không đụng canonical.
// stripPII, prompt và parseReply chép từ nhánh ZCode `zcode/classify-s03` @ce75ba2e (pipeline/classify-s03.mjs).
import { generateText, experimental_evaluate as evaluate, type LanguageModel } from "ai";
import { KIND, LISTING_INTENT } from "../vocab.generated.js";
import { getDecisionModel, getModel, GATEWAY_MODEL } from "../runtime/models.js";
import { recordCallDb, soToken, tenLop, type RecordCall } from "../runtime/ai-call-log.js";

export const PROMPT_VERSION = "nb-s03-v1";
export const VIEC = "nhan-bac-s03";
export type Backend = "qwen" | "haiku" | "decisions";
export const BACKENDS: readonly Backend[] = ["qwen", "haiku", "decisions"];

/** Tên model ghi vào silver_labels.model và ai_calls.model. */
export const TEN_MODEL: Record<Backend, string> = {
  qwen: "mtplx:qwen3.8-27b-local",
  haiku: `gateway:${GATEWAY_MODEL.haiku}`,
  decisions: `gateway:${GATEWAY_MODEL.luna}`,
};

// ==== gạt tầng A khỏi chữ bài trước khi gửi (ZCode) ====
const PHONE_RE = /(?:\+84|0)\s?\d[\d\s.\-]{7,12}\d/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const ZALO_ID_RE = /\bzalo\.me\/[\w/]+/gi;
export function stripPII(text: string): string {
  return String(text ?? "")
    .replace(PHONE_RE, "[phone]")
    .replace(EMAIL_RE, "[email]")
    .replace(ZALO_ID_RE, "[link]");
}

// ==== prompt (ZCode) ====
export const SYSTEM = `Bạn phân loại tin đăng nhóm chat BĐS Việt Nam. Với MỖI bài, trả JSON đúng một object:
{"intent":"offer|inquiry|not_listing","kind":"sale|rent_lt|null","confidence":0.0-1.0,"quote":"<chuỗi con nguyên văn từ chữ bài làm căn cứ>"}
- offer: tin RAO bán/cho thuê (kể cả viết gọn: "S9.03 3PN FULL 14tr" = thuê vì 14tr/tháng; "cắt lỗ … 2,62 tỷ" = bán; "chuyển nhượng" = bán)
- inquiry: khách ĐI TÌM nhà ("khách e tìm 1pn 5,5tr", "cần mua 2PN")
- not_listing: không phải tin BĐS (tin tức, chat, quảng cáo khác)
- kind: sale=bán/mua-bán/chuyển nhượng/cắt lỗ; rent_lt=cho thuê/thuê (đơn vị triệu/tháng); null=khi intent≠offer
- confidence: độ tin 0-1
- quote: CHÍNH XÁC chuỗi con có trong chữ bài (sẽ được kiểm bằng so chuỗi — câu bịa bị loại)
Trả MỘT dòng JSON, không giải thích.`;

/** Một nhãn — đúng hình một dòng silver_labels (trừ khoá bài/run). */
export type Nhan = {
  model: string;
  listing_intent: (typeof LISTING_INTENT)[keyof typeof LISTING_INTENT];
  kind: (typeof KIND)[keyof typeof KIND] | null;
  probability: number | null;
  probabilities: Record<string, unknown> | null;
  quote: string | null;
  quote_ok: boolean | null;
  json_ok: boolean;
  error_kind: string | null;
  latency_ms: number;
  cost_usd: number | null;
};

const LA_INTENT = new Set<string>([LISTING_INTENT.offer, LISTING_INTENT.inquiry, LISTING_INTENT.not_listing]);
const LA_KIND = new Set<string>([KIND.sale, KIND.rent_lt]);

/** Đọc trả lời chữ (Qwen, Haiku) — JSON hỏng / giá trị lạ → unknown; trích so với chữ ĐÃ GẠT (ZCode). */
export function parseReply(raw: string, originalText: string) {
  let obj: Record<string, unknown> | null = null;
  try {
    const m = String(raw).match(/\{[\s\S]*\}/);
    obj = m ? JSON.parse(m[0]) : null;
  } catch {
    obj = null;
  }
  if (!obj || typeof obj !== "object") {
    return { listing_intent: LISTING_INTENT.unknown, kind: null, probability: null, quote: null, quote_ok: null, json_ok: false } as const;
  }
  const intent = LA_INTENT.has(String(obj.intent)) ? (obj.intent as Nhan["listing_intent"]) : LISTING_INTENT.unknown;
  const kind = intent === LISTING_INTENT.offer && LA_KIND.has(String(obj.kind)) ? (obj.kind as Nhan["kind"]) : null;
  const quote = typeof obj.quote === "string" && obj.quote.length > 0 ? obj.quote : null;
  const c = Number(obj.confidence);
  return {
    listing_intent: intent,
    kind,
    probability: Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : null,
    quote,
    quote_ok: quote === null ? null : stripPII(originalText).includes(quote),
    json_ok: true,
  };
}

/** Câu hỏi Decisions — hai câu choice trên cùng chữ bài. */
export const CAU_HOI_DECISIONS = {
  intent: {
    type: "choice",
    instructions: "Bài đăng trong nhóm chat BĐS Việt Nam này là gì?",
    criteria: {
      offer: "Tin rao bán hoặc cho thuê một căn/nhà/đất (kể cả viết gọn chỉ có giá và số phòng)",
      inquiry: "Người đi tìm mua hoặc tìm thuê (khách cần mua, cần thuê, tìm căn)",
      not_listing: "Không phải tin bất động sản (chat, tin tức, quảng cáo khác)",
    },
  },
  kind: {
    type: "choice",
    instructions: "Nếu là tin rao: bán hay cho thuê?",
    criteria: {
      sale: "Bán, chuyển nhượng, cắt lỗ — giá thường tính bằng tỷ",
      rent_lt: "Cho thuê dài hạn — giá thường tính bằng triệu mỗi tháng",
      none: "Không phải tin rao",
    },
  },
} as const;

/** Chi phí thật Gateway trả (providerMetadata.gateway.cost), null khi không có (Qwen local). */
export function chiPhi(meta: unknown): number | null {
  const v = Number((meta as { gateway?: { cost?: unknown } } | undefined)?.gateway?.cost);
  return Number.isFinite(v) && v >= 0 ? v : null;
}

export type HoiOpts = {
  recordCall?: RecordCall;
  /** Model thay cho getModel/getDecisionModel — test truyền model giả. */
  languageModel?: LanguageModel;
  decisionModel?: Parameters<typeof evaluate>[0]["model"];
  trace?: string | null;
};

/** Hỏi một backend về một bài. Không ném lỗi: lỗi → nhãn unknown + error_kind, vẫn ghi ai_calls. */
export async function hoiBai(backend: Backend, text: string, opts: HoiOpts = {}): Promise<Nhan> {
  const record = opts.recordCall ?? recordCallDb;
  const sach = stripPII(text);
  const t0 = Date.now();
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  let nhan: Nhan;
  try {
    if (backend === "decisions") {
      const r = await evaluate({ model: opts.decisionModel ?? getDecisionModel(), state: sach, questions: CAU_HOI_DECISIONS });
      usage = r.usage;
      const a = r.answers.intent;
      const k = r.answers.kind;
      const intent = LA_INTENT.has(a.choice) ? (a.choice as Nhan["listing_intent"]) : LISTING_INTENT.unknown;
      nhan = {
        model: TEN_MODEL.decisions,
        listing_intent: intent,
        kind: intent === LISTING_INTENT.offer && LA_KIND.has(k.choice) ? (k.choice as Nhan["kind"]) : null,
        probability: a.probabilities?.[a.choice] ?? null,
        probabilities: { intent: a.probabilities ?? null, kind: k.probabilities ?? null },
        quote: null,
        quote_ok: null,
        json_ok: true,
        error_kind: null,
        latency_ms: Date.now() - t0,
        cost_usd: chiPhi(r.providerMetadata),
      };
    } else {
      const r = await generateText({
        model: opts.languageModel ?? getModel(backend === "qwen" ? "qwen27b-khong-nghi" : "haiku"),
        system: SYSTEM,
        prompt: sach,
        temperature: 0,
        maxOutputTokens: 400,
      });
      usage = r.usage;
      const p = parseReply(r.text, text);
      nhan = {
        model: TEN_MODEL[backend],
        ...p,
        probabilities: null,
        error_kind: p.json_ok ? null : "json-hong",
        latency_ms: Date.now() - t0,
        cost_usd: chiPhi(r.providerMetadata),
      };
    }
  } catch (e) {
    nhan = {
      model: TEN_MODEL[backend],
      listing_intent: LISTING_INTENT.unknown,
      kind: null,
      probability: null,
      probabilities: null,
      quote: null,
      quote_ok: null,
      json_ok: false,
      error_kind: tenLop(e),
      latency_ms: Date.now() - t0,
      cost_usd: null,
    };
  }
  await record({
    viec: VIEC,
    model: nhan.model,
    inputTokens: soToken(usage?.inputTokens),
    outputTokens: soToken(usage?.outputTokens),
    latencyMs: nhan.latency_ms,
    ok: nhan.error_kind === null,
    loi: nhan.error_kind,
    trace: opts.trace ?? null,
    khach: "pipeline",
  }).catch(() => {});
  return nhan;
}

// ==== chạy một lô (lệnh agent/scripts/nhan-bac-run.ts) ====

/** Giá token 31/10/2026 (USD / 1 triệu token) — chỉ để ƯỚC trước khi gửi; tổng thật cộng chi phí Gateway trả về. */
export const GIA = { haiku: { vao: 0.1, ra: 0.5 }, decisions: { vao: 0.1, ra: 0 }, qwen: { vao: 0, ra: 0 } } as const;
/** Ước chi phí một bài (USD): ~3,5 ký tự/token, ~80 token ra. */
export function uocChiPhi(backend: Backend, text: string): number {
  const vao = (SYSTEM.length + stripPII(text).length) / 3.5;
  return (vao * GIA[backend].vao + 80 * GIA[backend].ra) / 1e6;
}

export type Bai = { post_id: string; text: string; text_hash: string };
export type DongNhan = Nhan & { source_code: "S03"; post_id: string; text_hash: string; prompt_version: string; run_id: string };
export type KetQuaLo = { nhan: DongNhan[]; daGhi: number; tongUsd: number; dungTran: boolean; loi: Record<string, number>; yDinh: Record<string, number> };

/**
 * Chạy một lô: hỏi từng bài, cộng chi phí, dừng TRƯỚC bài làm tổng vượt `tranUsd` (AC-9), ghi qua `ghi` (null = --thu).
 * Lỗi một bài không dừng lô (hoiBai không ném — AC-6).
 */
export async function chayLo(o: {
  backend: Backend;
  bai: Bai[];
  runId: string;
  tranUsd: number;
  hoi?: (b: Backend, text: string) => Promise<Nhan>;
  ghi: ((d: DongNhan) => Promise<number>) | null;
}): Promise<KetQuaLo> {
  const hoi = o.hoi ?? ((b, t) => hoiBai(b, t, { trace: o.runId }));
  const kq: KetQuaLo = { nhan: [], daGhi: 0, tongUsd: 0, dungTran: false, loi: {}, yDinh: {} };
  for (const b of o.bai) {
    // Ước bài kế: trung bình chi phí thật đã gặp trong lượt; chưa có bài nào thì ước theo token.
    const uoc = kq.nhan.length ? kq.tongUsd / kq.nhan.length : uocChiPhi(o.backend, b.text);
    if (kq.tongUsd + uoc > o.tranUsd) { kq.dungTran = true; break; }
    const n = await hoi(o.backend, b.text);
    kq.tongUsd += n.cost_usd ?? uocChiPhi(o.backend, b.text);
    const d: DongNhan = { ...n, source_code: "S03", post_id: b.post_id, text_hash: b.text_hash, prompt_version: PROMPT_VERSION, run_id: o.runId };
    kq.nhan.push(d);
    if (n.error_kind) kq.loi[n.error_kind] = (kq.loi[n.error_kind] ?? 0) + 1;
    kq.yDinh[n.listing_intent] = (kq.yDinh[n.listing_intent] ?? 0) + 1;
    if (o.ghi) kq.daGhi += await o.ghi(d);
  }
  return kq;
}

/** Câu ghi một nhãn — chỉ bảng silver_labels, bài đã có nhãn (cùng chữ, model, prompt) thì bỏ qua. */
export const SQL_GHI = `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind,
  probability, probabilities, quote, quote_ok, json_ok, error_kind, latency_ms, cost_usd, run_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  ON CONFLICT ON CONSTRAINT silver_labels_mot_nhan DO NOTHING`;
export const thamSoGhi = (d: DongNhan) => [d.source_code, d.post_id, d.text_hash, d.model, d.prompt_version, d.listing_intent, d.kind,
  d.probability, d.probabilities === null ? null : JSON.stringify(d.probabilities), d.quote, d.quote_ok, d.json_ok, d.error_kind,
  Math.max(0, Math.round(d.latency_ms)), d.cost_usd, d.run_id];

// ==== đo trên tập vàng (AC-8) ====
export type Vang = { post_id: string; listing_intent: string; kind: string | null };
export type BangDo = {
  n: number; yDinhDung: number; offer: number; banThueDung: number; yeuCau: number; yeuCauBat: number;
  jsonHong: number; trichGia: number; p50Ms: number | null; tongUsd: number;
};
/** Bảng đo một backend trên tập vàng — chỉ số, không chữ bài. Bán/thuê tính trên bài vàng là offer. */
export function doTapVang(nhan: Pick<DongNhan, "post_id" | "listing_intent" | "kind" | "json_ok" | "quote_ok" | "latency_ms" | "cost_usd">[], vang: Vang[]): BangDo {
  const theo = new Map(nhan.map((x) => [x.post_id, x]));
  const co = vang.filter((v) => theo.has(v.post_id));
  const offer = co.filter((v) => v.listing_intent === LISTING_INTENT.offer);
  const yeu = co.filter((v) => v.listing_intent === LISTING_INTENT.inquiry);
  const ms = nhan.map((x) => x.latency_ms).sort((a, b) => a - b);
  return {
    n: co.length,
    yDinhDung: co.filter((v) => theo.get(v.post_id)!.listing_intent === v.listing_intent).length,
    offer: offer.length,
    banThueDung: offer.filter((v) => { const x = theo.get(v.post_id)!; return x.listing_intent === LISTING_INTENT.offer && x.kind === v.kind; }).length,
    yeuCau: yeu.length,
    yeuCauBat: yeu.filter((v) => theo.get(v.post_id)!.listing_intent === LISTING_INTENT.inquiry).length,
    jsonHong: nhan.filter((x) => !x.json_ok).length,
    trichGia: nhan.filter((x) => x.quote_ok === false).length,
    p50Ms: ms.length ? ms[Math.floor((ms.length - 1) / 2)] : null,
    tongUsd: nhan.reduce((s, x) => s + (x.cost_usd ?? 0), 0),
  };
}

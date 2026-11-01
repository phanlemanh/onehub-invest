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
        model: opts.languageModel ?? getModel(backend === "qwen" ? "qwen27b" : "haiku"),
        system: SYSTEM,
        prompt: sach,
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

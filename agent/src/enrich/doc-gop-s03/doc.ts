// doc.ts — PL30: một lời gọi đọc gộp qua Vercel AI Gateway và gộp kết quả theo bảng chọn. Không ném lỗi: lỗi gọi thành
// error_kind (tên lớp), JSON hỏng thành json_ok=false. Mỗi lời gọi một dòng ai_calls (viec «doc-gop-s03»). Luật 7: chỉ
// trả kết quả cho người gọi ghi nhãn bạc — không ghi gì ở đây.
import { createGateway, generateText, type LanguageModel } from "ai";
import { recordCallDb, soToken, tenLop, type RecordCall } from "../../runtime/ai-call-log.js";
import { trichCoThat } from "../luat-trich-dan.js";
import { tuyChonGui, type KeHoach } from "./cau-hinh.js";
import { FIELDS, type Field } from "./o.js";
import { HUONG_DAN, tinNhan } from "./prompt.js";
import type { The } from "./the.js";

export const VIEC = "doc-gop-s03";
export const MAX_TOKEN_RA = 8000;

export type O = { v: string | number | null; cc: string | null; trich: string; trich_ok: boolean | null };
export type KetQuaGoi = {
  gateway: string; json: Partial<Record<Field, O>> | null; json_ok: boolean; error_kind: string | null; raw?: string;
  vao: number | null; ra: number | null; usd: number; usd_gateway: number | null; ms: number; finish?: string;
};
export type TaoModel = (gateway: string) => LanguageModel;
export type OGop = (O & { gateway: string }) | { nguoi: true };

/** Model thật qua Gateway; khoá đọc lúc gọi (AI_GATEWAY_API_KEY), test truyền TaoModel giả. */
export const taoModelGateway: TaoModel = (gateway) =>
  createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY })(gateway);

const chiPhiGateway = (meta: unknown): number | null => {
  const v = Number((meta as { gateway?: { cost?: unknown } } | undefined)?.gateway?.cost);
  return Number.isFinite(v) && v >= 0 ? v : null;
};

/** Lấy object JSON đầu tiên trong chữ trả về (bỏ rào markdown); không phải object thì null. */
export function tachJson(raw: string): Record<string, unknown> | null {
  const s = raw.replace(/```(?:json)?/g, "");
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try {
    const o = JSON.parse(s.slice(a, b + 1));
    return o && typeof o === "object" && !Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

/** Ô từ JSON model: object {v, cc, trich}; `null` hay giá trị trần (model hay trả gọn cho ô trống, như bài không phải tin
 * rao) nhận như ô có giá trị đó, không trích. Mảng hay object khác khuôn thì null. trich_ok điền ở gop. */
function docO(x: unknown): O | null {
  if (x === null) return { v: null, cc: null, trich: "", trich_ok: null };
  if (typeof x === "string" || typeof x === "number") return { v: x, cc: null, trich: "", trich_ok: null };
  if (typeof x !== "object" || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const v = typeof o.v === "string" || typeof o.v === "number" ? o.v : null;
  return { v, cc: typeof o.cc === "string" ? o.cc : null, trich: typeof o.trich === "string" ? o.trich : "", trich_ok: null };
}

/** Một lời gọi đọc gộp. JSON đủ 17 ô (mỗi ô đúng khuôn) mới là json_ok; ô thiếu là null. */
export async function hoiGop(o: {
  gateway: string; gia: { vao: number; ra: number }; the: The; taoModel?: TaoModel; recordCall?: RecordCall; trace?: string | null;
}): Promise<KetQuaGoi> {
  const t0 = Date.now();
  let kq: KetQuaGoi;
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  try {
    const r = await generateText({
      model: (o.taoModel ?? taoModelGateway)(o.gateway), system: HUONG_DAN, messages: tinNhan(o.the), temperature: 0,
      maxOutputTokens: MAX_TOKEN_RA, maxRetries: 0, abortSignal: AbortSignal.timeout(240_000), providerOptions: tuyChonGui(o.gateway),
    });
    usage = r.usage;
    const vao = soToken(r.usage?.inputTokens), ra = soToken(r.usage?.outputTokens);
    const that = chiPhiGateway(r.providerMetadata);
    const goc = tachJson(r.text);
    const json = goc ? Object.fromEntries(FIELDS.flatMap((f) => { const x = docO(goc[f]); return x ? [[f, x]] : []; })) as Partial<Record<Field, O>> : null;
    const json_ok = !!json && FIELDS.every((f) => json[f]);
    kq = {
      gateway: o.gateway, json, json_ok, error_kind: json_ok ? null : "json-hong", raw: json_ok ? undefined : r.text.slice(0, 2000),
      vao, ra, usd: that ?? (vao !== null && ra !== null ? (vao * o.gia.vao + ra * o.gia.ra) / 1e6 : 0), usd_gateway: that,
      ms: Date.now() - t0, finish: r.finishReason,
    };
  } catch (e) {
    kq = { gateway: o.gateway, json: null, json_ok: false, error_kind: tenLop(e), vao: null, ra: null, usd: 0, usd_gateway: null, ms: Date.now() - t0 };
  }
  await (o.recordCall ?? recordCallDb)({
    viec: VIEC, model: `gateway:${o.gateway}`, inputTokens: soToken(usage?.inputTokens), outputTokens: soToken(usage?.outputTokens),
    latencyMs: kq.ms, ok: kq.error_kind === null, loi: kq.error_kind, trace: o.trace ?? null, khach: "pipeline",
  }).catch(() => {});
  return kq;
}

/** Ô căn cứ chữ bài: câu trích phải có thật trong chữ (so chuỗi); căn cứ khác không kiểm (null). */
export function kiemTrich(o: O, chu: string): O {
  return { ...o, trich_ok: o.v === null || o.cc !== "chu_bai" ? null : trichCoThat(o.trich, chu) };
}

/** Gộp theo kế hoạch: mỗi ô lấy từ đúng model được giao; ô người duyệt không lấy giá trị máy. Model lỗi → ô của nó null. */
export function gop(kq: Map<string, KetQuaGoi>, kh: KeHoach, chu: string): Record<Field, OGop> {
  const ra = {} as Record<Field, OGop>;
  for (const f of kh.nguoi) ra[f] = { nguoi: true };
  for (const n of kh.nhom) {
    const k = kq.get(n.gateway);
    for (const f of n.o) {
      const x = k?.json?.[f];
      ra[f] = { ...(x ? kiemTrich(x, chu) : { v: null, cc: null, trich: "", trich_ok: null }), gateway: n.gateway };
    }
  }
  return ra;
}

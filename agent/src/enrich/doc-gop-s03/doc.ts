// doc.ts — PL30: một lời gọi đọc gộp và gộp kết quả theo bảng chọn. Đường gọi theo nhóm (goi-thang-anthropic 15/11):
// "gateway" qua Vercel AI Gateway (AI SDK), "anthropic" thẳng API Anthropic (SDK chính chủ @anthropic-ai/sdk). Không ném lỗi:
// lỗi gọi thành error_kind `<lớp>:<http>:<kiểu>:<tên lớp>` (loi-nha-cung-cap.ts), JSON hỏng thành json_ok=false. Mỗi lời gọi một
// dòng ai_calls (viec «doc-gop-s03»), model ghi `<đường>:<mã gọi>` (gateway:anthropic/claude-haiku-5.5, anthropic:claude-haiku-5-5).
// Luật 7: chỉ trả kết quả cho người gọi ghi nhãn bạc.
import Anthropic from "@anthropic-ai/sdk";
import { createGateway, generateText, type LanguageModel } from "ai";
import { recordCallDb, soToken, type RecordCall } from "../../runtime/ai-call-log.js";
import { chuoiLoi, phanLoaiLoi, type LopLoi } from "../../runtime/loi-nha-cung-cap.js";
import { trichCoThat } from "../luat-trich-dan.js";
import { DUONG_ANTHROPIC, modelSo, tuyChonGui, type Duong, type KeHoach } from "./cau-hinh.js";
import { FIELDS, type Field } from "./o.js";
import { HUONG_DAN, tinNhan } from "./prompt.js";
import type { The } from "./the.js";

export const VIEC = "doc-gop-s03";
export const MAX_TOKEN_RA = 8000;

export type O = { v: string | number | null; cc: string | null; trich: string; trich_ok: boolean | null };
export type KetQuaGoi = {
  gateway: string; duong?: Duong; json: Partial<Record<Field, O>> | null; json_ok: boolean; error_kind: string | null; lop?: LopLoi | null; raw?: string;
  vao: number | null; ra: number | null; usd: number; usd_gateway: number | null; ms: number; finish?: string;
};
export type TaoModel = (gateway: string) => LanguageModel;
/** Client API Anthropic; test truyền client trỏ máy chủ giả. */
export type TaoAnthropic = () => Anthropic;
export type OGop = (O & { gateway: string }) | { nguoi: true };

/** Model thật qua Gateway; khoá đọc lúc gọi (AI_GATEWAY_API_KEY), test truyền TaoModel giả. */
export const taoModelGateway: TaoModel = (gateway) =>
  createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY })(gateway);

/** Client thật: khoá ANTHROPIC_API_KEY đọc lúc gọi và truyền TƯỜNG MINH (không để SDK rơi về hồ sơ `ant auth login` trên đĩa);
 * SDK tự thử lại 429/5xx/lỗi kết nối 2 lần; trần 240 giây mỗi lần như đường Gateway. */
export const taoAnthropicMacDinh: TaoAnthropic = () =>
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", authToken: null, maxRetries: 2, timeout: 240_000 });

type PhanNoiDung = { type: "text"; text: string } | { type: "file"; data: Uint8Array; mediaType: string };
/** Tin nhắn PL30 (khuôn AI SDK) → nội dung người dùng của API Anthropic, giữ thứ tự: chữ thành text, ảnh thành image base64. */
export function noiDungAnthropic(the: The): Anthropic.ContentBlockParam[] {
  const msg = tinNhan(the)[0];
  const phan = (Array.isArray(msg.content) ? msg.content : [{ type: "text", text: String(msg.content) }]) as PhanNoiDung[];
  return phan.map((p): Anthropic.ContentBlockParam => p.type === "text"
    ? { type: "text", text: p.text }
    : { type: "image", source: { type: "base64", media_type: p.mediaType as Anthropic.Base64ImageSource["media_type"], data: Buffer.from(p.data).toString("base64") } });
}

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

/** Dựng kết quả từ chữ model trả về (chung hai đường). */
function ketQuaTuChu(o: { gateway: string; duong: Duong; gia: { vao: number; ra: number } }, text: string, vao: number | null, ra: number | null,
  that: number | null, ms: number, finish: string | undefined): KetQuaGoi {
  const goc = tachJson(text);
  const json = goc ? Object.fromEntries(FIELDS.flatMap((f) => { const x = docO(goc[f]); return x ? [[f, x]] : []; })) as Partial<Record<Field, O>> : null;
  const json_ok = !!json && FIELDS.every((f) => json[f]);
  return {
    gateway: o.gateway, duong: o.duong, json, json_ok, error_kind: json_ok ? null : "json-hong", lop: null, raw: json_ok ? undefined : text.slice(0, 2000),
    vao, ra, usd: that ?? (vao !== null && ra !== null ? (vao * o.gia.vao + ra * o.gia.ra) / 1e6 : 0), usd_gateway: that, ms, finish,
  };
}

/** Một lời gọi đọc gộp. JSON đủ 17 ô (mỗi ô đúng khuôn) mới là json_ok; ô thiếu là null. */
export async function hoiGop(o: {
  gateway: string; duong: Duong; gia: { vao: number; ra: number }; the: The; taoModel?: TaoModel; taoAnthropic?: TaoAnthropic;
  recordCall?: RecordCall; trace?: string | null;
}): Promise<KetQuaGoi> {
  const t0 = Date.now();
  const duong: Duong = o.duong; // bắt buộc — không lặng lẽ rơi về gateway (gap-probe P1)
  let kq: KetQuaGoi;
  try {
    if (duong === "anthropic") {
      const ma = DUONG_ANTHROPIC[o.gateway];
      if (!ma) throw new Error(`không có đường anthropic cho ${o.gateway}`);
      // Không gửi temperature (Haiku 5.5 trả 400 với giá trị lấy mẫu khác mặc định) và không gửi thinking (giữ mặc định như đường
      // Gateway) — skill claude-api, mục Thinking & Effort.
      const r = await (o.taoAnthropic ?? taoAnthropicMacDinh)().messages.create({
        model: ma, max_tokens: MAX_TOKEN_RA, system: HUONG_DAN, messages: [{ role: "user", content: noiDungAnthropic(o.the) }],
      });
      const text = r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
      kq = ketQuaTuChu({ gateway: o.gateway, duong, gia: o.gia }, text, soToken(r.usage?.input_tokens), soToken(r.usage?.output_tokens),
        null, Date.now() - t0, r.stop_reason ?? undefined);
    } else {
      const r = await generateText({
        model: (o.taoModel ?? taoModelGateway)(o.gateway), system: HUONG_DAN, messages: tinNhan(o.the), temperature: 0,
        maxOutputTokens: MAX_TOKEN_RA, maxRetries: 0, abortSignal: AbortSignal.timeout(240_000), providerOptions: tuyChonGui(o.gateway),
      });
      kq = ketQuaTuChu({ gateway: o.gateway, duong, gia: o.gia }, r.text, soToken(r.usage?.inputTokens), soToken(r.usage?.outputTokens),
        chiPhiGateway(r.providerMetadata), Date.now() - t0, r.finishReason);
    }
  } catch (e) {
    const p = phanLoaiLoi(e);
    kq = { gateway: o.gateway, duong, json: null, json_ok: false, error_kind: chuoiLoi(p), lop: p.lop, vao: null, ra: null, usd: 0, usd_gateway: null, ms: Date.now() - t0 };
  }
  await (o.recordCall ?? recordCallDb)({
    viec: VIEC, model: modelSo(o.gateway, duong), inputTokens: kq.vao, outputTokens: kq.ra,
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

// doc.ts — NB1 cham-bong-bo-sung-tin: một lần đọc = một lời gọi một model cho một thẻ (đọc mọi ô có đề xuất trên thẻ). Đường gọi và
// cờ gửi dùng lại doc-gop-s03 (gateway: không giữ dữ liệu, không huấn luyện, DeepSeek chỉ Baseten; Haiku được đi API Anthropic thẳng).
// Mỗi lời gọi đúng một dòng sổ gọi (ok hay lỗi, AC-6). Kết quả thô được kiểm bằng luật xác định (AC-3): trích phải có thật trong bài,
// loại hình trong từ vựng, số phòng là số nguyên; sai thì ô thành rỗng kèm lý do. Lời gọi lỗi không sinh ô nào (AC-4).
import { generateText } from "ai";
import { soToken, type RecordCall } from "../../runtime/ai-call-log.js";
import { chuoiLoi, phanLoaiLoi } from "../../runtime/loi-nha-cung-cap.js";
import { DUONG_ANTHROPIC, KHOA_DUONG, modelSo, tuyChonGui, type Duong } from "../doc-gop-s03/cau-hinh.js";
import { tachJson, taoAnthropicMacDinh, taoModelGateway } from "../doc-gop-s03/doc.js";
import { ENRICH_FIELD } from "../../vocab.generated.js";
import { trichCoThat } from "../luat-trich-dan.js";
import type { ModelCham } from "./cau-hinh.js";
import type { Doc, OCham } from "./ket-cuc.js";
import { LOAI_HINH, loiNhac, type DauVao } from "./prompt.js";

export const VIEC = "cham-bong-bo-sung-tin";
/** Trần token ra theo số ô hỏi trên thẻ (hàng cham-bong-cau-tra-loi-khong-bi-cat, AC-1): lượt thử 1 đo token ra tăng theo số ô
 * (trung vị 1 ô 160, 3 ô 932), hằng 1.000 cắt 3/60 câu trả lời. 1 ô 1.000 · 2 ô 1.600 · 3 ô 2.200 · 4 ô 2.800 · 5 ô 3.400. */
export const TOKEN_RA_GOC = 400;
export const TOKEN_RA_MOI_O = 600;
export const tranTokenRa = (soO: number): number => TOKEN_RA_GOC + TOKEN_RA_MOI_O * soO;
export const LOI_BI_CAT = "bi-cat";
export const LOI_JSON_HONG = "json-hong";

export type OKetQua = Doc & { trich: string; can_cu: string };
type ChungLanDoc = { gateway: string; duong: Duong; vao: number | null; ra: number | null; usd: number; ms: number; sha_loi_nhac: string };
export type LanDoc = (ChungLanDoc & { ok: true; o: Record<string, OKetQua> }) | (ChungLanDoc & { ok: false; loi: string });

/** Một lời gọi model: `maxRa` là trần token ra của lời gọi; `cat` = model dừng vì hết token (AC-2). */
export type GoiModel = (m: ModelCham, duong: Duong, p: { system: string; user: string }, maxRa: number) =>
  Promise<{ text: string; vao: number | null; ra: number | null; cat?: boolean }>;

/** Hai lớp gọi thô (tách ra để test truyền lớp giả, không gọi mạng). */
export type LopGoi = {
  anthropic: (q: { model: string; max_tokens: number; system: string; messages: { role: "user"; content: string }[] }) =>
    Promise<{ content: { type: string; text?: string }[]; usage?: { input_tokens?: number | null; output_tokens?: number | null }; stop_reason?: string | null }>;
  gateway: (q: { gateway: string; system: string; prompt: string; maxOutputTokens: number }) =>
    Promise<{ text: string; usage?: { inputTokens?: number; outputTokens?: number }; finishReason?: string }>;
};

/** Lời gọi theo đường. Không gửi temperature ở đường anthropic (Haiku 5.5 trả 400 với giá trị khác mặc định). Hết token: Anthropic
 * `stop_reason = "max_tokens"`, AI SDK `finishReason = "length"`. */
export function taoGoiModel(lop: LopGoi): GoiModel {
  return async (m, duong, p, maxRa) => {
    if (duong === "anthropic") {
      const ma = DUONG_ANTHROPIC[m.gateway];
      if (!ma) throw new Error(`không có đường anthropic cho ${m.gateway}`);
      const r = await lop.anthropic({ model: ma, max_tokens: maxRa, system: p.system, messages: [{ role: "user", content: p.user }] });
      return {
        text: r.content.flatMap((b) => (b.type === "text" && typeof b.text === "string" ? [b.text] : [])).join(""),
        vao: soToken(r.usage?.input_tokens), ra: soToken(r.usage?.output_tokens), cat: r.stop_reason === "max_tokens",
      };
    }
    const r = await lop.gateway({ gateway: m.gateway, system: p.system, prompt: p.user, maxOutputTokens: maxRa });
    return { text: r.text, vao: soToken(r.usage?.inputTokens), ra: soToken(r.usage?.outputTokens), cat: r.finishReason === "length" };
  };
}

export const LOP_THAT: LopGoi = {
  anthropic: (q) => taoAnthropicMacDinh().messages.create(q) as ReturnType<LopGoi["anthropic"]>,
  gateway: (q) => generateText({
    model: taoModelGateway(q.gateway), system: q.system, prompt: q.prompt, temperature: 0, maxOutputTokens: q.maxOutputTokens, maxRetries: 0,
    abortSignal: AbortSignal.timeout(120_000), providerOptions: tuyChonGui(q.gateway),
  }),
};

/** Lời gọi thật. */
export const goiModelThat: GoiModel = taoGoiModel(LOP_THAT);

const RONG = (ly_do: Doc["ly_do"]): OKetQua => ({ v: null, ly_do, trich: "", can_cu: "" });

/** Kiểm một ô thô từ JSON model theo luật xác định (AC-3). */
export function kiemO(f: OCham, raw: unknown, chu: string): OKetQua {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : { v: raw };
  const v0 = o.v;
  if (v0 === null || v0 === undefined || (typeof v0 === "string" && !v0.trim())) return RONG("khong-suy-ra");
  if (typeof v0 !== "string" && typeof v0 !== "number") return RONG("khong-suy-ra");
  const v = String(v0).trim();
  const trich = typeof o.trich === "string" ? o.trich : "";
  const can_cu = typeof o.can_cu === "string" ? o.can_cu : "";
  if (f === "property_type" && !LOAI_HINH.includes(v)) return { ...RONG("ngoai-tu-vung"), trich, can_cu };
  if ((f === ENRICH_FIELD.bathrooms || f === ENRICH_FIELD.bedrooms) && !/^\d+$/.test(v)) return { ...RONG("khong-phai-so"), trich, can_cu };
  if (!trichCoThat(trich, chu)) return { ...RONG("trich-gia"), trich, can_cu };
  return { v, ly_do: null, trich, can_cu };
}

/** Đường thử theo thứ tự: các đường có khoá trong môi trường; không đường nào có khoá thì đường đầu (lời gọi sẽ lỗi và vào sổ). */
export function duongThu(m: ModelCham, env: NodeJS.ProcessEnv = process.env): Duong[] {
  const co = m.duong.filter((d) => !!env[KHOA_DUONG[d]]);
  return co.length ? co : [m.duong[0]];
}

/** Một lần đọc của một model trên một thẻ. Đường gặp lớp dừng (hết tiền, khoá sai) thì thử đường kế; mỗi lần thử một dòng sổ. */
export async function docMot(o: {
  model: ModelCham; dauVao: DauVao; goi: GoiModel; recordCall: RecordCall; trace: string; env?: NodeJS.ProcessEnv;
}): Promise<LanDoc> {
  const p = loiNhac(o.dauVao);
  const ds = duongThu(o.model, o.env);
  let kq: LanDoc | null = null;
  for (let i = 0; i < ds.length; i++) {
    const duong = ds[i];
    const t0 = Date.now();
    try {
      const r = await o.goi(o.model, duong, p, tranTokenRa(o.dauVao.o.length));
      const usd = r.vao !== null && r.ra !== null ? (r.vao * o.model.gia_vao + r.ra * o.model.gia_ra) / 1e6 : 0;
      const chung = { gateway: o.model.gateway, duong, vao: r.vao, ra: r.ra, usd, ms: Date.now() - t0, sha_loi_nhac: p.sha };
      // Bị cắt thì không tin phần chữ đã có, kể cả khi nó tách được JSON (AC-2); không bị cắt mà JSON hỏng là json-hong (AC-3).
      const json = r.cat ? null : tachJson(r.text);
      kq = r.cat
        ? { ...chung, ok: false, loi: LOI_BI_CAT }
        : json
          ? { ...chung, ok: true, o: Object.fromEntries(o.dauVao.o.map((f) => [f, kiemO(f, json[f] ?? null, o.dauVao.text)])) }
          : { ...chung, ok: false, loi: LOI_JSON_HONG };
    } catch (e) {
      const pl = phanLoaiLoi(e);
      kq = { gateway: o.model.gateway, duong, vao: null, ra: null, usd: 0, ms: Date.now() - t0, sha_loi_nhac: p.sha, ok: false, loi: chuoiLoi(pl) };
      await o.recordCall(dongSo(o.model, kq, o.trace));
      if ((pl.lop === "het-tien" || pl.lop === "khoa") && i < ds.length - 1) continue;
      return kq;
    }
    await o.recordCall(dongSo(o.model, kq, o.trace));
    return kq;
  }
  return kq!;
}

function dongSo(m: ModelCham, k: LanDoc, trace: string) {
  return {
    viec: VIEC, model: modelSo(m.gateway, k.duong), inputTokens: k.vao, outputTokens: k.ra, latencyMs: k.ms,
    ok: k.ok, loi: k.ok ? null : k.loi, trace, khach: "pipeline" as const,
  };
}

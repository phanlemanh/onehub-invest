// doc.ts — NB1 cham-bong-bo-sung-tin: một lần đọc = một lời gọi một model cho một thẻ (đọc mọi ô có đề xuất trên thẻ). Đường gọi và
// cờ gửi dùng lại doc-gop-s03 (gateway: không giữ dữ liệu, không huấn luyện, DeepSeek chỉ Baseten; Haiku được đi API Anthropic thẳng).
// Mỗi lời gọi đúng một dòng sổ gọi (ok hay lỗi, AC-6). Kết quả thô được kiểm bằng luật xác định (AC-3): trích phải có thật trong bài,
// loại hình trong từ vựng, số phòng là số nguyên; sai thì ô thành rỗng kèm lý do. Lời gọi lỗi không sinh ô nào (AC-4).
import { generateText } from "ai";
import { soToken, type RecordCall } from "../../runtime/ai-call-log.js";
import { chuoiLoi, phanLoaiLoi } from "../../runtime/loi-nha-cung-cap.js";
import { DUONG_ANTHROPIC, KHOA_DUONG, modelSo, tuyChonGui, type Duong } from "../doc-gop-s03/cau-hinh.js";
import { tachJson, taoAnthropicMacDinh, taoModelGateway } from "../doc-gop-s03/doc.js";
import { trichCoThat } from "../luat-trich-dan.js";
import type { ModelCham } from "./cau-hinh.js";
import type { Doc, OCham } from "./ket-cuc.js";
import { LOAI_HINH, loiNhac, type DauVao } from "./prompt.js";

export const VIEC = "cham-bong-bo-sung-tin";
export const MAX_TOKEN_RA = 1000;

export type OKetQua = Doc & { trich: string; can_cu: string };
type ChungLanDoc = { gateway: string; duong: Duong; vao: number | null; ra: number | null; usd: number; ms: number; sha_loi_nhac: string };
export type LanDoc = (ChungLanDoc & { ok: true; o: Record<string, OKetQua> }) | (ChungLanDoc & { ok: false; loi: string });

export type GoiModel = (m: ModelCham, duong: Duong, p: { system: string; user: string }) =>
  Promise<{ text: string; vao: number | null; ra: number | null }>;

/** Lời gọi thật. Không gửi temperature ở đường anthropic (Haiku 5.5 trả 400 với giá trị khác mặc định). */
export const goiModelThat: GoiModel = async (m, duong, p) => {
  if (duong === "anthropic") {
    const ma = DUONG_ANTHROPIC[m.gateway];
    if (!ma) throw new Error(`không có đường anthropic cho ${m.gateway}`);
    const r = await taoAnthropicMacDinh().messages.create({ model: ma, max_tokens: MAX_TOKEN_RA, system: p.system, messages: [{ role: "user", content: p.user }] });
    return { text: r.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""), vao: soToken(r.usage?.input_tokens), ra: soToken(r.usage?.output_tokens) };
  }
  const r = await generateText({
    model: taoModelGateway(m.gateway), system: p.system, prompt: p.user, temperature: 0, maxOutputTokens: MAX_TOKEN_RA, maxRetries: 0,
    abortSignal: AbortSignal.timeout(120_000), providerOptions: tuyChonGui(m.gateway),
  });
  return { text: r.text, vao: soToken(r.usage?.inputTokens), ra: soToken(r.usage?.outputTokens) };
};

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
  if ((f === "bathrooms" || f === "bedrooms") && !/^\d+$/.test(v)) return { ...RONG("khong-phai-so"), trich, can_cu };
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
      const r = await o.goi(o.model, duong, p);
      const usd = r.vao !== null && r.ra !== null ? (r.vao * o.model.gia_vao + r.ra * o.model.gia_ra) / 1e6 : 0;
      const chung = { gateway: o.model.gateway, duong, vao: r.vao, ra: r.ra, usd, ms: Date.now() - t0, sha_loi_nhac: p.sha };
      const json = tachJson(r.text);
      kq = json
        ? { ...chung, ok: true, o: Object.fromEntries(o.dauVao.o.map((f) => [f, kiemO(f, json[f] ?? null, o.dauVao.text)])) }
        : { ...chung, ok: false, loi: "json-hong" };
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

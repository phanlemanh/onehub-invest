// vlm-anh-s03.ts — KC3 `vlm-anh-tin-s03`: đọc từng ảnh của bài S03 mà chữ không đủ, gộp thành một nhãn bạc nguồn «ảnh» cho mỗi bài,
// và chấm trên phiếu gắn tay. Ba model: Qwen local (MTPLX), Claude Haiku 5.5 và DeepSeek V4.1 Flash 1017 qua Vercel AI Gateway.
// Mỗi yêu cầu chỉ có câu hỏi cố định và đúng một ảnh; chữ bài, URL, SĐT, tên nhóm, định danh snapshot, tên tệp không đi theo (luật 6).
// Ảnh tự in tên nguồn thì máy không gạt được: vòng này gắn nhãn `lo_nguon` và đếm, không chặn (Mạnh 02/11).
// Luật 7: chỉ ra đề xuất — người gọi ghi vào bảng silver_labels, không đụng canonical. Mỗi lần gọi một dòng ai_calls.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createGateway, generateText, type LanguageModel } from "ai";
import { LISTING_INTENT, PROPERTY_TYPE } from "../vocab.generated.js";
import { getModel, GATEWAY_MODEL } from "../runtime/models.js";
import { recordCallDb, soToken, tenLop, type RecordCall } from "../runtime/ai-call-log.js";
import { chiPhi, stripPII } from "./nhan-bac-s03.js";

export const PROMPT_VERSION = "vlm-s03-v1";
export const VIEC = "vlm-anh-s03";
export type VlmModel = "qwen" | "haiku" | "deepseek";
export const VLM_MODELS: readonly VlmModel[] = ["qwen", "haiku", "deepseek"];
export const DEEPSEEK_MODEL = "deepseek/deepseek-v4.1-flash-1017";

/** Tên model ghi vào silver_labels.model và ai_calls.model. */
export const TEN_MODEL: Record<VlmModel, string> = {
  qwen: "mtplx:qwen3.8-27b-local",
  haiku: `gateway:${GATEWAY_MODEL.haiku}`,
  deepseek: `gateway:${DEEPSEEK_MODEL}`,
};

export const LOAI_ANH = ["bang-gia", "chup-man-hinh", "so-do", "noi-that", "qr-quang-cao", "khac"] as const;
const LOAI_HINH = Object.values(PROPERTY_TYPE).filter((v) => v !== PROPERTY_TYPE.unknown) as string[];

export const CAU_HOI = `Ảnh này đi kèm một tin rao bất động sản Việt Nam. Chỉ đọc những gì nhìn thấy trong ảnh, không đoán. Trả đúng một object JSON trên một dòng, không giải thích:
{"loai_anh":"${LOAI_ANH.join("|")}","lo_nguon":true|false,"price_vnd":số|null,"property_type":"${LOAI_HINH.join("|")}"|null,"bedrooms_total":số|null,"living_area_m2":số|null,"unit_number":chuỗi|null,"building_name":chuỗi|null,"subdivision_name":chuỗi|null,"quote":chuỗi}
- loai_anh: bang-gia = bảng hoặc tờ ghi giá, thông số căn; chup-man-hinh = ảnh chụp màn hình bài đăng hay tin nhắn; so-do = sơ đồ mặt bằng, sổ đỏ, bản vẽ; noi-that = ảnh chụp trong nhà hoặc phối cảnh; qr-quang-cao = mã QR, thẻ giới thiệu, quảng cáo; khac = còn lại.
- lo_nguon: true khi ảnh in logo hay tên của một ứng dụng chat, mạng xã hội hoặc trang rao tin. Tên dự án, chủ đầu tư, sàn môi giới không tính.
- price_vnd: giá của đúng một căn ghi trong ảnh, đổi ra đồng (3,2 tỷ = 3200000000; 14 triệu = 14000000). Null khi không có giá, khi bảng có nhiều giá, hoặc chỉ có giá theo m².
- property_type: chỉ khi ảnh thể hiện rõ; apartment = căn hộ chung cư, house = nhà riêng, biệt thự, liền kề; land = đất; room = phòng trọ; commercial = mặt bằng kinh doanh, văn phòng.
- bedrooms_total: số phòng ngủ. living_area_m2: diện tích theo m². unit_number: mã căn. building_name: tên toà. subdivision_name: tên dự án.
- quote: chép nguyên văn đoạn chữ ngắn trong ảnh làm căn cứ; ảnh không có chữ thì "".
Trường không thấy trong ảnh thì để null.`;
export const PROMPT_SHA = createHash("sha256").update(CAU_HOI).digest("hex");

/** Cờ gửi kèm qua Gateway: không giữ dữ liệu, không dùng huấn luyện; DeepSeek chỉ qua Baseten (Hỏi-3 đã chốt). */
export function tuyChonGateway(m: VlmModel) {
  if (m === "qwen") return undefined;
  const chung = { zeroDataRetention: true, disallowPromptTraining: true };
  return { gateway: m === "deepseek" ? { ...chung, only: ["baseten"] } : chung };
}

/** Giá token đo 02/11 (USD / 1 triệu token) — để ước trước khi gửi và tính khi trả lời không kèm chi phí. */
export const GIA: Record<VlmModel, { vao: number; ra: number }> = { qwen: { vao: 0, ra: 0 }, haiku: { vao: 0.1, ra: 0.5 }, deepseek: { vao: 0.3, ra: 1.2 } };
const USD = (m: VlmModel, vao: number, ra: number) => (vao * GIA[m].vao + ra * GIA[m].ra) / 1e6;
/** Ước một ảnh: ~1600 token vào, ~200 token ra. */
export const uocMotAnh = (m: VlmModel) => USD(m, 1600, 200);

const CO_URL = /https?:|www\.|zdn\.vn/i;
/** Chốt cuối trước khi gửi: phần chữ còn URL thì không có yêu cầu nào đi. */
export const coUrl = (chu: string) => CO_URL.test(chu);

const TRUONG_SO = ["price_vnd", "bedrooms_total", "living_area_m2"] as const;
const TRUONG_CHU = ["unit_number", "building_name", "subdivision_name"] as const;
export type NoiDungAnh = {
  loai_anh: string | null; lo_nguon: boolean; price_vnd: number | null; property_type: string | null; bedrooms_total: number | null;
  living_area_m2: number | null; unit_number: string | null; building_name: string | null; subdivision_name: string | null; quote: string | null; truong_la: string[];
};
const NOI_DUNG_RONG: NoiDungAnh = { loai_anh: null, lo_nguon: false, price_vnd: null, property_type: null, bedrooms_total: null, living_area_m2: null, unit_number: null, building_name: null, subdivision_name: null, quote: null, truong_la: [] };

/** Đọc trả lời: JSON hỏng → json_ok false; giá trị lạ chỉ làm trường đó rỗng và vào truong_la, ảnh vẫn đọc tốt. Quote đã gạt SĐT. */
export function docTraLoi(raw: string): NoiDungAnh & { json_ok: boolean } {
  let o: Record<string, unknown> | null = null;
  try {
    const m = String(raw).match(/\{[\s\S]*\}/);
    o = m ? JSON.parse(m[0]) : null;
  } catch {
    o = null;
  }
  if (!o || typeof o !== "object") return { ...NOI_DUNG_RONG, truong_la: [], json_ok: false };
  const la: string[] = [];
  const so = (k: string, dk: (v: number) => boolean) => {
    const v = o![k];
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v) && dk(v)) return v;
    la.push(k);
    return null;
  };
  const chu = (k: string) => {
    const v = o![k];
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "string") return v.trim() || null;
    la.push(k);
    return null;
  };
  const trongSo = (k: string, ds: readonly string[]) => {
    const v = chu(k);
    if (v === null || ds.includes(v)) return v;
    la.push(k);
    return null;
  };
  const loai = o.property_type === PROPERTY_TYPE.unknown ? null : trongSo("property_type", LOAI_HINH);
  if (o.lo_nguon !== undefined && o.lo_nguon !== null && typeof o.lo_nguon !== "boolean") la.push("lo_nguon");
  const quote = chu("quote");
  const kq = {
    loai_anh: trongSo("loai_anh", LOAI_ANH),
    lo_nguon: o.lo_nguon === true,
    price_vnd: so("price_vnd", (v) => v > 0),
    property_type: loai,
    bedrooms_total: so("bedrooms_total", (v) => Number.isInteger(v) && v >= 0),
    living_area_m2: so("living_area_m2", (v) => v > 0),
    unit_number: chu("unit_number"),
    building_name: chu("building_name"),
    subdivision_name: chu("subdivision_name"),
    quote: quote === null ? null : stripPII(quote),
  };
  return { ...kq, truong_la: la, json_ok: true };
}

export type KetQuaAnh = NoiDungAnh & { sha256?: string; json_ok: boolean; error_kind: string | null; latency_ms: number; cost_usd: number | null; chi_usd: number };
export type HoiOpts = { recordCall?: RecordCall; languageModel?: LanguageModel; cauHoi?: string; trace?: string | null };

/** @ai-sdk/openai 2 chưa hiểu dạng tệp của ai 7 ({type:"data",data}), chèn "[object Object]" vào thân yêu cầu; gỡ vỏ trước khi tới provider. */
function qwenCoAnh(): LanguageModel {
  type Goi = { prompt: { content: unknown }[] };
  const goc = getModel("qwen27b-khong-nghi") as unknown as { doGenerate(o: Goi): unknown };
  const goVo = (p: { type?: string; data?: { type?: string; data?: unknown } }) => (p.type === "file" && p.data?.type === "data" ? { ...p, data: p.data.data } : p);
  return new Proxy(goc, {
    get(t, k) {
      if (k !== "doGenerate") return Reflect.get(t, k);
      return (o: Goi) => t.doGenerate({ ...o, prompt: o.prompt.map((m) => (Array.isArray(m.content) ? { ...m, content: m.content.map(goVo) } : m)) });
    },
  }) as unknown as LanguageModel;
}

function moHinh(m: VlmModel): LanguageModel {
  if (m === "qwen") return qwenCoAnh();
  if (m === "haiku") return getModel("haiku");
  return createGateway({ baseURL: process.env.AI_GATEWAY_BASE_URL || undefined, apiKey: process.env.AI_GATEWAY_API_KEY })(DEEPSEEK_MODEL);
}

/** Hỏi một model về một ảnh. Không ném lỗi: lỗi → error_kind là tên lớp, vẫn ghi ai_calls; còn URL → không gọi gì. */
export async function hoiAnh(m: VlmModel, anh: { bytes: Uint8Array; mime: string }, opts: HoiOpts = {}): Promise<KetQuaAnh> {
  const cauHoi = opts.cauHoi ?? CAU_HOI;
  const rong = (error_kind: string, latency_ms: number, json_ok = false): KetQuaAnh => ({ ...NOI_DUNG_RONG, truong_la: [], json_ok, error_kind, latency_ms, cost_usd: null, chi_usd: 0 });
  if (coUrl(cauHoi)) return rong("lo-url", 0);
  const record = opts.recordCall ?? recordCallDb;
  const t0 = Date.now();
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  let kq: KetQuaAnh;
  try {
    const r = await generateText({
      model: opts.languageModel ?? moHinh(m),
      messages: [{ role: "user", content: [{ type: "text", text: cauHoi }, { type: "file", data: anh.bytes, mediaType: anh.mime }] }],
      temperature: 0,
      maxOutputTokens: 500,
      maxRetries: 0, // lỗi để lại error_kind, lượt sau gọi lại đúng ảnh đó; thử lại ngầm làm sai số yêu cầu và chi phí
      abortSignal: AbortSignal.timeout(170_000),
      ...(m === "deepseek" ? { reasoning: "none" as const } : {}),
      ...(tuyChonGateway(m) ? { providerOptions: tuyChonGateway(m) } : {}),
    });
    usage = r.usage;
    const d = docTraLoi(r.text);
    const that = chiPhi(r.providerMetadata);
    const vao = soToken(usage?.inputTokens), ra = soToken(usage?.outputTokens);
    kq = { ...d, error_kind: d.json_ok ? null : "json-hong", latency_ms: Date.now() - t0, cost_usd: that, chi_usd: that ?? (vao !== null && ra !== null ? USD(m, vao, ra) : uocMotAnh(m)) };
  } catch (e) {
    kq = rong(tenLop(e), Date.now() - t0);
  }
  await record({ viec: VIEC, model: TEN_MODEL[m], inputTokens: soToken(usage?.inputTokens), outputTokens: soToken(usage?.outputTokens), latencyMs: kq.latency_ms, ok: kq.error_kind === null, loi: kq.error_kind, trace: opts.trace ?? null, khach: "pipeline" }).catch(() => {});
  return kq;
}

// ==== gộp theo bài ====
export type AnhDoc = { sha256: string; tep: string; mime: string; nguon: string; so_bai_dung_chung: number };
export type BaiDoc = { post_id: string; text_hash: string; ly_do: string[]; anh: AnhDoc[] };
const CAP_BAI = ["price_vnd", "property_type", "bedrooms_total", "living_area_m2", "unit_number", "building_name", "subdivision_name"] as const;
const chuanHoa = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v);

/** Các ảnh của một bài → probabilities: trường cấp bài lấy giá trị khác rỗng duy nhất, hai giá trị khác nhau thì rỗng kèm xung_dot. */
export function gopNhan(b: BaiDoc, kqs: KetQuaAnh[], prompt: { sha: string }): { probabilities: Record<string, unknown>; quote: string | null; error_kind: string | null; json_ok: boolean } {
  const xung_dot: string[] = [];
  const cap: Record<string, unknown> = {};
  for (const t of CAP_BAI) {
    const co = kqs.map((k) => k[t]).filter((v) => v !== null && v !== undefined);
    if (new Set(co.map(chuanHoa)).size > 1) xung_dot.push(t);
    cap[t] = new Set(co.map(chuanHoa)).size === 1 ? co[0] : null;
  }
  const anh = b.anh.map((a, i) => {
    const k = kqs[i];
    const { loai_anh, lo_nguon, quote, truong_la, price_vnd, property_type, bedrooms_total, living_area_m2, unit_number, building_name, subdivision_name, error_kind } = k;
    const chung = { sha256: a.sha256, nguon: a.nguon, so_bai_dung_chung: a.so_bai_dung_chung };
    return error_kind ? { ...chung, error_kind } : { ...chung, loai_anh, lo_nguon, price_vnd, property_type, bedrooms_total, living_area_m2, unit_number, building_name, subdivision_name, quote, truong_la };
  });
  const quotes = [...new Set(kqs.map((k) => k.quote).filter((q): q is string => !!q))];
  const truong_la = [...new Set(kqs.flatMap((k) => k.truong_la))];
  return {
    probabilities: {
      nguon: "anh", prompt_sha: prompt.sha, ...cap,
      so_anh: b.anh.filter((a) => a.nguon !== "ghep").length, so_anh_ghep: b.anh.filter((a) => a.nguon === "ghep").length,
      so_anh_lo_nguon: kqs.filter((k) => k.lo_nguon).length, xung_dot, ly_do: b.ly_do, truong_la, anh,
    },
    quote: quotes.length ? quotes.join(" | ") : null,
    error_kind: kqs.find((k) => k.error_kind)?.error_kind ?? null,
    json_ok: kqs.every((k) => k.json_ok),
  };
}

export type DongAnh = {
  source_code: "S03"; post_id: string; text_hash: string; model: string; prompt_version: string; listing_intent: typeof LISTING_INTENT.unknown; kind: null;
  probability: null; probabilities: Record<string, unknown>; quote: string | null; quote_ok: null; json_ok: boolean; error_kind: string | null; latency_ms: number; cost_usd: number | null; run_id: string;
};

/** Hỏi ảnh của lệnh thật: đọc byte trên đĩa rồi hỏi; không đọc được tệp là lỗi của riêng ảnh đó. */
export const hoiTuTep = (m: VlmModel, opts: HoiOpts) => async (a: { tep: string; mime: string }): Promise<KetQuaAnh> => {
  let bytes: Uint8Array;
  try {
    bytes = await readFile(a.tep);
  } catch (e) {
    return { ...NOI_DUNG_RONG, truong_la: [], json_ok: false, error_kind: tenLop(e), latency_ms: 0, cost_usd: null, chi_usd: 0 };
  }
  return hoiAnh(m, { bytes, mime: a.mime }, opts);
};

export type KetQuaLo = { dong: DongAnh[]; daGhi: number; soGoi: number; tongUsd: number; dungTran: boolean; loi: Record<string, number> };

/**
 * Chạy một lô: mỗi sha256 hỏi tối đa một lần (lấy kết quả tốt đã có cùng model và bản prompt trước), dừng TRƯỚC ảnh làm tổng vượt trần.
 * Bài chỉ có dòng khi đã xử đủ ảnh. Lỗi một ảnh không dừng lô.
 */
export async function chayLo(o: {
  model: VlmModel; bai: BaiDoc[]; runId: string; tranUsd: number; daDoc?: Map<string, KetQuaAnh>;
  hoi: (a: AnhDoc) => Promise<KetQuaAnh>; ghi: ((d: DongAnh) => Promise<number>) | null; prompt?: { version: string; sha: string };
}): Promise<KetQuaLo> {
  const prompt = o.prompt ?? { version: PROMPT_VERSION, sha: PROMPT_SHA };
  const daHoi = new Map<string, KetQuaAnh>();
  const kq: KetQuaLo = { dong: [], daGhi: 0, soGoi: 0, tongUsd: 0, dungTran: false, loi: {} };
  for (const b of o.bai) {
    const kqs: KetQuaAnh[] = [];
    let goi = 0, ms = 0, cost: number | null = null;
    for (const a of b.anh) {
      let k = o.daDoc?.get(a.sha256) ?? daHoi.get(a.sha256);
      if (!k) {
        const uoc = kq.soGoi ? kq.tongUsd / kq.soGoi : uocMotAnh(o.model);
        if (kq.tongUsd + uoc > o.tranUsd) { kq.dungTran = true; break; }
        k = await o.hoi(a);
        daHoi.set(a.sha256, k);
        kq.soGoi += 1;
        kq.tongUsd += k.chi_usd;
        goi += 1;
        ms += k.latency_ms;
        if (k.cost_usd !== null) cost = (cost ?? 0) + k.cost_usd;
      }
      kqs.push(k);
    }
    if (kq.dungTran) break;
    const g = gopNhan(b, kqs, prompt);
    const d: DongAnh = {
      source_code: "S03", post_id: b.post_id, text_hash: b.text_hash, model: TEN_MODEL[o.model], prompt_version: prompt.version, listing_intent: LISTING_INTENT.unknown, kind: null,
      probability: null, probabilities: { ...g.probabilities, so_anh_goi: goi }, quote: g.quote, quote_ok: null, json_ok: g.json_ok, error_kind: g.error_kind, latency_ms: ms, cost_usd: cost, run_id: o.runId,
    };
    kq.dong.push(d);
    if (g.error_kind) kq.loi[g.error_kind] = (kq.loi[g.error_kind] ?? 0) + 1;
    if (o.ghi) kq.daGhi += await o.ghi(d);
  }
  return kq;
}

/** Kết quả ảnh đọc tốt đã lưu của một model và bản prompt — chính là `anh` trong dòng đã ghi, không có bảng đệm riêng. */
export function daDocTuDong(rows: { probabilities: { anh?: Record<string, unknown>[] } | null }[]): Map<string, KetQuaAnh> {
  const m = new Map<string, KetQuaAnh>();
  for (const r of rows) {
    for (const a of r.probabilities?.anh ?? []) {
      if (a.error_kind || typeof a.sha256 !== "string") continue;
      m.set(a.sha256, { ...NOI_DUNG_RONG, ...(a as Partial<NoiDungAnh>), truong_la: (a.truong_la as string[]) ?? [], sha256: a.sha256, json_ok: true, error_kind: null, latency_ms: 0, cost_usd: null, chi_usd: 0 });
    }
  }
  return m;
}

/** Ghi nhãn ảnh — chỉ bảng silver_labels. Dòng tốt giữ nguyên; dòng lỗi được thay. */
export const SQL_GHI_ANH = `INSERT INTO silver_labels (source_code, post_id, text_hash, model, prompt_version, listing_intent, kind,
  probability, probabilities, quote, quote_ok, json_ok, error_kind, latency_ms, cost_usd, run_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
  ON CONFLICT ON CONSTRAINT silver_labels_mot_nhan DO UPDATE SET
    probabilities = EXCLUDED.probabilities, quote = EXCLUDED.quote, json_ok = EXCLUDED.json_ok, error_kind = EXCLUDED.error_kind,
    latency_ms = EXCLUDED.latency_ms, cost_usd = EXCLUDED.cost_usd, run_id = EXCLUDED.run_id, labeled_at = now()
  WHERE silver_labels.error_kind IS NOT NULL`;
export const thamSoGhiAnh = (d: DongAnh) => [d.source_code, d.post_id, d.text_hash, d.model, d.prompt_version, d.listing_intent, d.kind, d.probability,
  JSON.stringify(d.probabilities), d.quote, d.quote_ok, d.json_ok, d.error_kind, Math.max(0, Math.round(d.latency_ms)), d.cost_usd, d.run_id];

// ==== chấm phiếu gắn tay ====
export const MAU_TOI_THIEU = 30;
export const MAU_GHEP_TOI_THIEU = 15;
export const NGUONG_DAT = 0.9;
export type NhanPhieu = {
  gia: number | "khong-co-gia" | "khong-co-mot-gia" | null; loai_hinh: string | "khong-the-hien" | null; thuoc_bai?: boolean | null; lo_nguon?: boolean | null;
  bedrooms_total?: number | null; living_area_m2?: number | null; unit_number?: string | null; building_name?: string | null; subdivision_name?: string | null; loai_anh?: string | null;
};
export type HangPhieu = { sha256: string; tep: string; mime: string; so_luot_ghep: number; so_bai_dung_chung: number; nhan: NhanPhieu };
export type Thuoc = { n: number; dung: number; tile: number | null; tileTrongSo: number | null };
export type KetLuan = "dat" | "khong-dat" | "chua-du-mau";
export type BangCham = {
  daGan: number; oTrong: number; khongThuocBai: number; soGoi: number; tongUsd: number; dungTran: boolean; loi: Record<string, number>;
  gia: Thuoc & { ketLuan: KetLuan; khongCoGia: number; khongGiaMaDocRa: number; khongCoMotGia: number }; loaiHinh: Thuoc & { ketLuan: KetLuan; khongTheHien: number };
  ketLuan: KetLuan; them: Record<string, Thuoc>; loNguon: { nguoiDanh: number; modelGanDung: number };
  nhom: { rieng: { n: number; gia: Thuoc; loaiHinh: Thuoc }; ghep: { n: number; gia: Thuoc; loaiHinh: Thuoc; ketLuan: "du-mau" | "chua-du-mau" } };
};

const lechToiDa = (a: number, b: number) => Math.abs(a - b) <= 0.01 * Math.abs(b);
const thuoc = (ds: { dung: boolean; w: number }[]): Thuoc => {
  const n = ds.length, dung = ds.filter((x) => x.dung).length, w = ds.reduce((s, x) => s + x.w, 0);
  return { n, dung, tile: n ? dung / n : null, tileTrongSo: w ? ds.filter((x) => x.dung).reduce((s, x) => s + x.w, 0) / w : null };
};
const ketLuanThuoc = (t: Thuoc): KetLuan => (t.n < MAU_TOI_THIEU ? "chua-du-mau" : (t.tile ?? 0) >= NGUONG_DAT ? "dat" : "khong-dat");

/** Phiếu + đọc từng ảnh đã gắn → bảng chấm. Ô trống (giá và loại hình đều chưa điền) không gửi đi. Không ghi silver_labels, không mang chữ bài. */
export async function chamPhieu(o: { model: VlmModel; hang: HangPhieu[]; tranUsd: number; hoi: (a: { tep: string; mime: string }) => Promise<KetQuaAnh> }): Promise<BangCham> {
  const gan = o.hang.filter((h) => h.nhan?.gia != null || h.nhan?.loai_hinh != null);
  const doc: { h: HangPhieu; k: KetQuaAnh }[] = [];
  let tongUsd = 0, dungTran = false;
  const loi: Record<string, number> = {};
  for (const h of gan) {
    const uoc = doc.length ? tongUsd / doc.length : uocMotAnh(o.model);
    if (tongUsd + uoc > o.tranUsd) { dungTran = true; break; }
    const k = await o.hoi(h);
    tongUsd += k.chi_usd;
    if (k.error_kind) loi[k.error_kind] = (loi[k.error_kind] ?? 0) + 1;
    doc.push({ h, k });
  }
  const w = (h: HangPhieu) => Math.max(1, h.so_bai_dung_chung ?? 1);
  const coGia = (ds: typeof doc) => ds.filter((x) => typeof x.h.nhan.gia === "number").map((x) => ({ dung: x.k.price_vnd !== null && lechToiDa(x.k.price_vnd, x.h.nhan.gia as number), w: w(x.h) }));
  const coLoai = (ds: typeof doc) => ds.filter((x) => x.h.nhan.loai_hinh != null && x.h.nhan.loai_hinh !== "khong-the-hien").map((x) => ({ dung: x.k.property_type === x.h.nhan.loai_hinh, w: w(x.h) }));
  const giaT = thuoc(coGia(doc)), loaiT = thuoc(coLoai(doc));
  const lgia = ketLuanThuoc(giaT), lloai = ketLuanThuoc(loaiT);
  const them: Record<string, Thuoc> = {};
  for (const t of ["bedrooms_total", "living_area_m2", "unit_number", "building_name", "subdivision_name", "loai_anh"] as const) {
    them[t] = thuoc(doc.filter((x) => x.h.nhan[t] != null).map((x) => {
      const dn = x.h.nhan[t], m = x.k[t];
      const dung = typeof dn === "number" ? typeof m === "number" && (t === "living_area_m2" ? lechToiDa(m, dn) : m === dn) : chuanHoa(m) === chuanHoa(dn);
      return { dung, w: w(x.h) };
    }));
  }
  const rieng = doc.filter((x) => !(x.h.so_luot_ghep > 0)), ghep = doc.filter((x) => x.h.so_luot_ghep > 0);
  return {
    daGan: gan.length, oTrong: o.hang.length - gan.length, khongThuocBai: o.hang.filter((h) => h.nhan?.thuoc_bai === false).length, soGoi: doc.length, tongUsd, dungTran, loi,
    gia: { ...giaT, ketLuan: lgia, khongCoGia: doc.filter((x) => x.h.nhan.gia === "khong-co-gia").length, khongGiaMaDocRa: doc.filter((x) => x.h.nhan.gia === "khong-co-gia" && x.k.price_vnd !== null).length, khongCoMotGia: doc.filter((x) => x.h.nhan.gia === "khong-co-mot-gia").length },
    loaiHinh: { ...loaiT, ketLuan: lloai, khongTheHien: doc.filter((x) => x.h.nhan.loai_hinh === "khong-the-hien").length },
    ketLuan: lgia === "chua-du-mau" || lloai === "chua-du-mau" ? "chua-du-mau" : lgia === "dat" && lloai === "dat" ? "dat" : "khong-dat",
    them,
    loNguon: { nguoiDanh: doc.filter((x) => x.h.nhan.lo_nguon === true).length, modelGanDung: doc.filter((x) => x.h.nhan.lo_nguon === true && x.k.lo_nguon).length },
    nhom: {
      rieng: { n: rieng.length, gia: thuoc(coGia(rieng)), loaiHinh: thuoc(coLoai(rieng)) },
      ghep: { n: ghep.length, gia: thuoc(coGia(ghep)), loaiHinh: thuoc(coLoai(ghep)), ketLuan: ghep.length < MAU_GHEP_TOI_THIEU ? "chua-du-mau" : "du-mau" },
    },
  };
}

// doc-toan-bo.ts — hồ sơ s03-llm-doc-toan-bo: LLM đọc toàn bộ chữ S03 ở lớp đề xuất. Hai pha: đọc (tốn tiền, có trần, nhãn vào
// silver_labels) rồi quyết (0 USD, luật xác định cho từng tin). File này KHÔNG có câu UPDATE sale_offers nào; mọi áp qua
// apply_enrichment; giá, diện tích chỉ so, không bao giờ ghi (luật 7).
import { generateText, type LanguageModel } from "ai";
import type pg from "pg";
import type { ContextResult } from "../agents/context-resolver.js";
import { chayLo, chiPhi, GIA, parseReply, SQL_GHI, stripPII, TEN_MODEL, thamSoGhi, type Bai, type DongNhan, type Nhan } from "../agents/nhan-bac-s03.js";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { textHash } from "../../../pipeline/lib/eval-labels.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { testMarker } from "../../../pipeline/lib/test-posts.mjs";
import { recordCallDb, soToken, tenLop, type RecordCall } from "../runtime/ai-call-log.js";
import { getModel } from "../runtime/models.js";
import { KIND, LISTING_INTENT, PROPERTY_TYPE } from "../vocab.generated.js";
import { kiemTrichLoai, trichCoThat } from "./luat-trich-dan.js";
import { routeFields, type EnrichField, type Routed } from "./route.js";
import { giaoDichSavepoint, heldFields, syncReview, type GiaoDich, type ResolveFn } from "./run.js";

export const PROMPT_VERSION = "dtb-s03-v1";
/** Model mặc định của lượt; không có cờ đổi (Hỏi-2). */
export const modelMacDinh = () => getModel("haiku");
export const VIEC = "doc-toan-bo-s03";

// ==== gạt chữ trước khi gửi ====
const URL_RE = /\b(?:https?:\/\/|www\.)\S+/gi;
const TEN_MIEN_RE = /\b[\w-]+\.(?:com|vn|net|org|me|io|info|asia)(?:\.vn)?(?:\/\S*)?/gi;
const canThoat = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Chữ được gửi cho model: bỏ SĐT, email, mọi link, và từng tên trong `cam` (tên nguồn thật, tên nhóm — tầng A không rời máy,
 * tên đọc lúc chạy từ source_registry, không viết trong mã). Không cắt độ dài.
 */
export function gatChu(text: string, cam: string[]): string {
  let s = stripPII(String(text ?? "").normalize("NFC"));
  for (const ten of [...cam].sort((a, b) => b.length - a.length)) {
    const t = ten.normalize("NFC").trim();
    if (t.length >= 3) s = s.replace(new RegExp(canThoat(t), "giu"), "[ten]");
  }
  return s.replace(URL_RE, "[link]").replace(TEN_MIEN_RE, "[link]");
}

// ==== prompt ====
export const SYSTEM = `Bạn đọc tin đăng nhóm chat BĐS Việt Nam. Trả JSON đúng một object trên một dòng, không giải thích:
{"intent":"${LISTING_INTENT.offer}|${LISTING_INTENT.inquiry}|${LISTING_INTENT.not_listing}","kind":"${KIND.sale}|${KIND.rent_lt}|null","confidence":0.0-1.0,"quote":"...",
"property_type":"${PROPERTY_TYPE.apartment}|${PROPERTY_TYPE.house}|${PROPERTY_TYPE.land}|${PROPERTY_TYPE.room}|${PROPERTY_TYPE.commercial}|null","quote_loai":"...",
"price_vnd":số|null,"quote_gia":"...","area_m2":số|null,"quote_dt":"...","bedrooms":số|null,"bathrooms":số|null,"street":"..."|null,"block":"..."|null}
- intent: offer = tin RAO bán hoặc cho thuê; inquiry = khách ĐI TÌM mua, thuê; not_listing = không phải tin BĐS, kể cả bài không có chữ đọc được.
- kind: sale = bán, chuyển nhượng, cắt lỗ; rent_lt = cho thuê (giá theo tháng); null khi intent khác offer.
- property_type: chỉ loại của chính thứ đang rao; «gần chung cư X» không phải căn hộ; không rõ thì null.
- price_vnd: giá viết thành số đồng («2,62 tỷ» = 2620000000, «14tr» = 14000000); area_m2: số mét vuông; không có thì null.
- quote, quote_loai, quote_gia, quote_dt: CHÍNH XÁC chuỗi con của chữ bài làm căn cứ cho ý định, loại hình, giá, diện tích (sẽ được so chuỗi, câu bịa bị loại); không có thì "".`;

/** Phần thêm của nhãn, lưu ở silver_labels.probabilities (không migration). PN, WC, đường, toà chỉ lưu, không sinh đề xuất (Hỏi-4). */
export type DocThem = {
  property_type: string | null; quote_loai: string | null;
  price_vnd: number | null; quote_gia: string | null;
  area_m2: number | null; quote_dt: string | null;
  bedrooms: number | null; bathrooms: number | null; street: string | null; block: string | null;
};

const soDuong = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
const chuoi = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const LOAI = new Set<string>(Object.values(PROPERTY_TYPE).filter((x) => x !== PROPERTY_TYPE.unknown));

/** Đọc trả lời của model. Giá, diện tích chỉ nhận số dương: chuỗi như «2,62 tỷ» thành null, không đoán. */
export function docTraLoi(raw: string, chuDaGat: string) {
  const p = parseReply(raw, chuDaGat);
  if (!p.json_ok) return { ...p, probabilities: null as DocThem | null };
  const o = JSON.parse(String(raw).match(/\{[\s\S]*\}/)![0]) as Record<string, unknown>;
  const loai = typeof o.property_type === "string" && LOAI.has(o.property_type) ? o.property_type : null;
  const them: DocThem = {
    property_type: loai, quote_loai: chuoi(o.quote_loai),
    price_vnd: soDuong(o.price_vnd), quote_gia: chuoi(o.quote_gia),
    area_m2: soDuong(o.area_m2), quote_dt: chuoi(o.quote_dt),
    bedrooms: soDuong(o.bedrooms), bathrooms: soDuong(o.bathrooms), street: chuoi(o.street), block: chuoi(o.block),
  };
  return { ...p, quote_ok: p.quote === null ? null : trichCoThat(p.quote, chuDaGat), probabilities: them as DocThem | null };
}

/** Hỏi Haiku về một chữ ĐÃ GẠT. Không ném lỗi: lỗi thành nhãn unknown + error_kind, vẫn ghi ai_calls. */
export async function hoiDoc(
  chuDaGat: string,
  o: { languageModel?: LanguageModel; recordCall?: RecordCall; trace?: string | null } = {},
): Promise<Nhan> {
  const t0 = Date.now();
  let usage: { inputTokens?: number; outputTokens?: number } | undefined;
  let nhan: Nhan;
  try {
    const r = await generateText({
      model: o.languageModel ?? modelMacDinh(), system: SYSTEM, prompt: chuDaGat, temperature: 0, maxOutputTokens: 600,
    });
    usage = r.usage;
    const p = docTraLoi(r.text, chuDaGat);
    nhan = {
      model: TEN_MODEL.haiku, ...p, error_kind: p.json_ok ? null : "json-hong",
      latency_ms: Date.now() - t0, cost_usd: chiPhi(r.providerMetadata),
    };
  } catch (e) {
    nhan = {
      model: TEN_MODEL.haiku, listing_intent: LISTING_INTENT.unknown, kind: null, probability: null, probabilities: null,
      quote: null, quote_ok: null, json_ok: false, error_kind: tenLop(e), latency_ms: Date.now() - t0, cost_usd: null,
    };
  }
  await (o.recordCall ?? recordCallDb)({
    viec: VIEC, model: nhan.model, inputTokens: soToken(usage?.inputTokens), outputTokens: soToken(usage?.outputTokens),
    latencyMs: nhan.latency_ms, ok: nhan.error_kind === null, loi: nhan.error_kind, trace: o.trace ?? null, khach: "pipeline",
  }).catch(() => {});
  return nhan;
}

/** Ước một bài (USD): ~3,5 ký tự/token, ~150 token ra vì hỏi nhiều trường hơn nhãn bạc. Chỉ để chặn trần trước bài đầu. */
export function uocChiPhiDoc(chuDaGat: string): number {
  return (((SYSTEM.length + chuDaGat.length) / 3.5) * GIA.haiku.vao + 150 * GIA.haiku.ra) / 1e6;
}

// ==== quyết một tin (thuần) ====
export const NGUONG_GIA = 0.1;
export const NGUONG_DIEN_TICH = 0.03;

/** Một bất đồng chỉ đối chiếu: duyệt hay bác đều không đổi tin (Hỏi-1, AC-5, AC-6). */
export type DoiChieu = { loai: "y_dinh" | "gia" | "dien_tich"; trich: string; ai: string | number; bo_doc: string | number };
export type DeXuatTin = Routed & { status: "queued" | "skipped"; lyDo?: string };
export type QuyetTin = { de_xuat: DeXuatTin[]; doi_chieu: DoiChieu[] };

const lech = (ai: number, boDoc: number, nguong: number) => Math.abs(ai - boDoc) > nguong * boDoc;

/**
 * Thứ tự luật theo hình đã duyệt ở Cổng Phạm vi: tin đã có loại hình thì thôi; E1 có giá trị thì routeFields quyết (E1 trái AI lên
 * thẻ kể cả khi trích dẫn không đạt); AI một mình thì theo trích dẫn. AI nói không phải tin rao thì không cột nào của tin đổi (AC-5).
 */
export function quyetTin(i: {
  hienTai: { property_type: string | null; price_vnd: number | null; area_m2: number | null; loai_suy?: boolean };
  e1Loai: string | null;
  intent: string;
  quoteOk: boolean | null;
  quoteYDinh: string | null;
  them: DocThem | null;
  chuDaGat: string;
  /** Bài có từ hai tin: giá, diện tích của model không biết thuộc tin nào, nên không so. */
  chungBai: boolean;
  held: ReadonlySet<EnrichField>;
}): QuyetTin {
  const laTinRao = i.intent === LISTING_INTENT.offer;
  const rs = routeFields({
    current: { property_type: i.hienTai.property_type },
    e1: { property_type: i.e1Loai },
    llm: i.them ? { property_type: i.them.property_type } : null,
    buildings: [],
    held: i.held,
    // Loại hình suy từ nhóm (s03-len-cong AC-11): coi là trống cho LLM, E1 không áp thẳng lên ô này.
    inferredFields: i.hienTai.loai_suy ? new Set<EnrichField>(["property_type"]) : undefined,
  });
  const de_xuat: DeXuatTin[] = rs.map((r): DeXuatTin => {
    if (r.conflict) return { ...r, status: "queued" };
    if (!laTinRao && (r.route === "direct" || r.route === "corroborated")) return { ...r, route: "review", corroboratedBy: null, status: "skipped", lyDo: "y-dinh-khac" };
    if (r.source !== "e2_llm" || r.route !== "review") return { ...r, status: "queued" };
    if (!laTinRao) return { ...r, status: "skipped", lyDo: "y-dinh-khac" };
    const kq = kiemTrichLoai(r.value, i.them?.quote_loai ?? null, i.chuDaGat);
    if (kq.ok) return { ...r, route: "corroborated", corroboratedBy: kq.ma, status: "queued" };
    // Loại khác căn hộ: trích dẫn có thật vẫn không tự điền, lên thẻ cho người (AC-4).
    if (r.value !== PROPERTY_TYPE.apartment && kq.lyDo === "tu-khoa-loai-khac") return { ...r, status: "queued" };
    return { ...r, status: "skipped", lyDo: kq.lyDo };
  });

  const doi_chieu: DoiChieu[] = [];
  if ((i.intent === LISTING_INTENT.inquiry || i.intent === LISTING_INTENT.not_listing) && i.quoteOk === true && i.quoteYDinh) {
    doi_chieu.push({ loai: "y_dinh", trich: i.quoteYDinh, ai: i.intent, bo_doc: LISTING_INTENT.offer });
  }
  const t = i.them;
  if (t && !i.chungBai) {
    const { price_vnd: gia, area_m2: dt } = i.hienTai;
    if (t.price_vnd && gia && gia > 0 && t.quote_gia && trichCoThat(t.quote_gia, i.chuDaGat) && lech(t.price_vnd, gia, NGUONG_GIA)) {
      doi_chieu.push({ loai: "gia", trich: t.quote_gia, ai: t.price_vnd, bo_doc: gia });
    }
    if (t.area_m2 && dt && dt > 0 && t.quote_dt && trichCoThat(t.quote_dt, i.chuDaGat) && lech(t.area_m2, dt, NGUONG_DIEN_TICH)) {
      doi_chieu.push({ loai: "dien_tich", trich: t.quote_dt, ai: t.area_m2, bo_doc: dt });
    }
  }
  return { de_xuat, doi_chieu };
}

// ==== một lượt trên DB ====
export type TinDoc = {
  offer_id: string; property_type: string | null; loai_suy: boolean; price_vnd: number | null; area_m2: number | null;
  post_id: string | null; text: string | null; group_name: string | null; snapshot_id: string | null; agent_id: string | null;
};
export type TomTat = {
  tin: number; khongChu: number; daDoc: number; conLai: number; tongUsd: number; dungTran: boolean;
  deXuat: number; daAp: number; theMoi: number; tinChoThe: number; loi: Record<string, number>; loiGhi: string[];
};

/** Mọi tin S03 sống, kèm bài mới nhất — không lọc kind, độ tin, trường thiếu, dấu đã thử (AC-1). */
export async function chonTin(c: pg.Client): Promise<TinDoc[]> {
  const { rows } = await c.query(
    `SELECT o.offer_id, o.property_type, o.price_vnd::float8 AS price_vnd, o.area_m2::float8 AS area_m2,
            coalesce(o.field_provenance #>> '{property_type,tier}' = 'inferred', false) AS loai_suy,
            z.post_id, z.text, z.group_name, z.snapshot_id, z.agent_id
     FROM sale_offers o
     LEFT JOIN LATERAL (
       SELECT s.post_id, s.text, s.group_name, s.snapshot_id, s.agent_id FROM stg_zalo_posts s
       WHERE s.post_id = ANY (o.post_ids) ORDER BY s.captured_at DESC NULLS LAST LIMIT 1
     ) z ON true
     WHERE o.source = 'S03' AND o.retired_at IS NULL
     ORDER BY o.offer_id`,
  );
  return rows;
}

/** Tên phải gạt khỏi chữ gửi đi — tầng A, đọc lúc chạy, không in và không viết vào mã. */
export async function docTenCam(c: pg.Client): Promise<string[]> {
  const { rows } = await c.query(`SELECT real_name, source_ids FROM source_registry`);
  return rows.flatMap((r) => [r.real_name, ...(r.source_ids ?? [])]).filter((x): x is string => typeof x === "string");
}

const coChu = (t: string | null) => (t ?? "").length > 20;
const khoaNhan = (postId: string, hash: string) => `${postId}|${hash}`;
const khoaDaXu = (offerId: string, hash: string) => `${offerId}|${hash}`;

type NhanDoc = Pick<Nhan, "listing_intent" | "quote" | "quote_ok" | "json_ok" | "error_kind"> & { probabilities: unknown };

export async function chayLuot(o: {
  client: pg.Client;
  runId: string;
  tranUsd: number;
  tranThe: number;
  thu: boolean;
  /** Tên nguồn thật phải gạt; vắng thì đọc source_registry. */
  cam?: string[];
  /** Giới hạn tập tin — chỉ test dùng để không đọc tin thật của DB chung; dòng lệnh không có cờ này (AC-1). */
  chiTin?: string[];
  hoi?: (chuDaGat: string) => Promise<Nhan>;
  /** Thay model thật trong test; đi qua hoiDoc nên phủ cả đường ghi ai_calls. */
  languageModel?: LanguageModel;
  resolve: ResolveFn;
  giaoDich?: GiaoDich;
}): Promise<TomTat> {
  const c = o.client;
  const giaoDich = o.giaoDich ?? giaoDichSavepoint(c);
  const cam = o.cam ?? (await docTenCam(c));
  const moi = (await chonTin(c)).filter((t) => !testMarker(t) && (!o.chiTin || o.chiTin.includes(t.offer_id)));
  const tins = moi.filter((t) => t.post_id && coChu(t.text));
  const kq: TomTat = {
    tin: tins.length, khongChu: moi.length - tins.length, daDoc: 0, conLai: 0, tongUsd: 0, dungTran: false,
    deXuat: 0, daAp: 0, theMoi: 0, tinChoThe: 0, loi: {}, loiGhi: [],
  };
  const soTinCuaBai = new Map<string, number>();
  for (const t of tins) soTinCuaBai.set(t.post_id!, (soTinCuaBai.get(t.post_id!) ?? 0) + 1);
  const chuGat = (t: TinDoc) => gatChu(t.text!, [...cam, ...(t.group_name ? [t.group_name] : [])]);

  // Pha đọc: mỗi bài một lời gọi, bài đã có nhãn cùng chữ + model + prompt không gọi lại (AC-7, AC-8).
  const nhan = new Map<string, NhanDoc>();
  for (const r of (await c.query(
    `SELECT post_id, text_hash, listing_intent, probabilities, quote, quote_ok, json_ok, error_kind FROM silver_labels
     WHERE source_code = 'S03' AND model = $1 AND prompt_version = $2`, [TEN_MODEL.haiku, PROMPT_VERSION])).rows) {
    nhan.set(khoaNhan(r.post_id, r.text_hash), r);
  }
  const bai = new Map<string, Bai>();
  for (const t of tins) {
    const h = textHash(t.text!);
    if (!nhan.has(khoaNhan(t.post_id!, h))) bai.set(khoaNhan(t.post_id!, h), { post_id: t.post_id!, text: chuGat(t), text_hash: h });
  }
  const hoi = o.hoi ?? ((chu: string) => hoiDoc(chu, { trace: o.runId, languageModel: o.languageModel, recordCall: o.thu ? async () => {} : undefined }));
  const lo = await chayLo({
    backend: "haiku", bai: [...bai.values()], runId: o.runId, tranUsd: o.tranUsd, promptVersion: PROMPT_VERSION, uoc: uocChiPhiDoc,
    hoi: (_b, chu) => hoi(chu),
    // Lỗi gọi (mạng, Gateway) không lưu: lượt sau đọc lại; JSON hỏng thì lưu, đọc lại cũng tốn tiền như vậy.
    ghi: o.thu ? null : async (d: DongNhan) => (d.error_kind && d.error_kind !== "json-hong" ? 0 : (await c.query(SQL_GHI, thamSoGhi(d))).rowCount ?? 0),
  });
  kq.daDoc = lo.nhan.length; kq.conLai = bai.size - lo.nhan.length; kq.tongUsd = lo.tongUsd; kq.dungTran = lo.dungTran; kq.loi = lo.loi;
  for (const d of lo.nhan) if (!d.error_kind || d.error_kind === "json-hong") nhan.set(khoaNhan(d.post_id, d.text_hash), d);

  // Pha quyết: 0 USD. Tin đã xử với cùng chữ thì bỏ qua: thẻ đã duyệt không mọc lại (Focus 1).
  const daXu = new Set((await c.query(
    `SELECT detail->>'offer_id' AS offer_id, detail->>'text_hash' AS text_hash FROM ops_audit
     WHERE action = 'doc-toan-bo:da-xu' AND detail->>'prompt_version' = $1`, [PROMPT_VERSION])).rows.map((r) => khoaDaXu(r.offer_id, r.text_hash)));
  for (const t of tins) {
    const h = textHash(t.text!);
    const n = nhan.get(khoaNhan(t.post_id!, h));
    if (!n || daXu.has(khoaDaXu(t.offer_id, h))) continue;
    const chu = chuGat(t);
    const ctx: ContextResult = await o.resolve(t.group_name, t.text!);
    const q = quyetTin({
      hienTai: t, e1Loai: ctx.propertyType, intent: n.listing_intent, quoteOk: n.quote_ok, quoteYDinh: n.quote,
      them: n.json_ok ? (n.probabilities as DocThem | null) : null, chuDaGat: chu,
      chungBai: (soTinCuaBai.get(t.post_id!) ?? 0) > 1, held: await heldFields(c, t.offer_id),
    });
    const canThe = q.doi_chieu.length > 0 || q.de_xuat.some((d) => d.status === "queued" && d.route === "review");
    const coThe = canThe && (await c.query(
      `SELECT 1 FROM review_queue WHERE item_type = 'agent_output' AND item_id = $1 AND status = 'pending'`, [`enrich:${t.offer_id}`])).rows.length > 0;
    if (canThe && !coThe && kq.theMoi >= o.tranThe) { kq.tinChoThe++; continue; }
    if (o.thu) {
      kq.deXuat += q.de_xuat.length;
      kq.daAp += q.de_xuat.filter((d) => d.status === "queued" && d.route !== "review").length;
      if (canThe && !coThe) kq.theMoi++;
      continue;
    }
    const ghi = async () => {
      const dem = { deXuat: 0, daAp: 0 };
      const ap: number[] = [];
      for (const d of q.de_xuat) {
        const { rows } = await c.query(
          `INSERT INTO enrichment_proposals
             (run_id, offer_id, field, value, value_key, source, route, corroborated_by, model, evidence, status)
           VALUES ($1, $2, $3, $4, lower($4), $5, $6, $7, $8, $9, $10)
           ON CONFLICT (offer_id, field, value_key, source) DO NOTHING
           RETURNING id`,
          [
            o.runId, t.offer_id, d.field, d.value, d.source, d.route, d.corroboratedBy,
            d.source === "e2_llm" ? TEN_MODEL.haiku : "context-resolver",
            {
              text: chu.slice(0, 300), group_name: t.group_name, prompt_version: PROMPT_VERSION,
              trich: d.source === "e2_llm" ? ((n.probabilities as DocThem | null)?.quote_loai ?? null) : null,
              ...(d.lyDo ? { ly_do: d.lyDo } : {}),
              basis: d.source === "e2_llm" ? `AI ${TEN_MODEL.haiku} · trích dẫn` : (ctx.typeBasis ?? "luật E1"),
            },
            d.status,
          ],
        );
        if (!rows[0]) continue;
        dem.deXuat++;
        if (d.status === "queued" && d.route !== "review") ap.push(Number(rows[0].id));
      }
      if (ap.length > 0) {
        const { rows } = await c.query(`SELECT apply_enrichment($1, $2) AS n`, [ap, `doc-toan-bo:${o.runId}`]);
        dem.daAp = Number(rows[0].n ?? 0);
      }
      await syncReview(c, { offer_id: t.offer_id, text: chu, group_name: t.group_name },
        { runId: o.runId, model: TEN_MODEL.haiku, tracePath: null }, q.doi_chieu);
      await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ($1, 'doc-toan-bo:da-xu', $2)`,
        [`doc-toan-bo:${o.runId}`, { offer_id: t.offer_id, text_hash: h, prompt_version: PROMPT_VERSION, run_id: o.runId }]);
      return dem;
    };
    try {
      const dem = await giaoDich(ghi);
      kq.deXuat += dem.deXuat; kq.daAp += dem.daAp;
      if (canThe && !coThe) kq.theMoi++;
    } catch (e) {
      const err = e as { code?: string; name?: string };
      kq.loiGhi.push(`${t.offer_id}:${err.code ?? err.name ?? "Error"}`);
    }
  }
  return kq;
}

// ==== đếm (AC-9) ====
export const CO_DO_USD_NGAY = 5;
export type SoDem = {
  mau: number; coDeXuat: number; coDeXuatKeSkipped: number; aiDaAp: number; daDoc: number;
  goi: number; goiOk: number; theCho: number; chiTheoNgay: { ngay: string; usd: number; do: boolean }[]; runIds: string[];
};
/** Mẫu là mọi tin S03 sống lúc đếm; tử chỉ đếm tin trong mẫu, nên S05 và tin đã nghỉ không vào số. */
export async function demLuot(c: pg.Client): Promise<SoDem> {
  const { rows: [a] } = await c.query(
    `WITH song AS (SELECT offer_id FROM sale_offers WHERE source = 'S03' AND retired_at IS NULL)
     SELECT (SELECT count(*)::int FROM song) AS mau,
       (SELECT count(DISTINCT ep.offer_id)::int FROM enrichment_proposals ep JOIN song USING (offer_id) WHERE ep.status <> 'skipped') AS co_de_xuat,
       (SELECT count(DISTINCT ep.offer_id)::int FROM enrichment_proposals ep JOIN song USING (offer_id)) AS ke_skipped,
       (SELECT count(DISTINCT ep.offer_id)::int FROM enrichment_proposals ep JOIN song USING (offer_id) WHERE ep.source = 'e2_llm' AND ep.status = 'applied') AS ai_da_ap,
       (SELECT count(*)::int FROM review_queue rq JOIN song s ON rq.item_id = 'enrich:' || s.offer_id WHERE rq.item_type = 'agent_output' AND rq.status = 'pending') AS the_cho,
       (SELECT count(*)::int FROM silver_labels WHERE source_code = 'S03' AND prompt_version = $1) AS da_doc,
       (SELECT count(*)::int FROM ai_calls WHERE viec = $2) AS goi,
       (SELECT count(*)::int FROM ai_calls WHERE viec = $2 AND ok) AS goi_ok`,
    [PROMPT_VERSION, VIEC]);
  const { rows: ngay } = await c.query(
    `SELECT to_char(labeled_at, 'YYYY-MM-DD') AS ngay, coalesce(sum(cost_usd), 0)::float8 AS usd FROM silver_labels
     WHERE source_code = 'S03' AND prompt_version = $1 GROUP BY 1 ORDER BY 1`, [PROMPT_VERSION]);
  const { rows: run } = await c.query(
    `SELECT DISTINCT run_id FROM enrichment_proposals WHERE run_id LIKE 'doc-toan-bo-%' ORDER BY run_id`);
  return {
    mau: a.mau, coDeXuat: a.co_de_xuat, coDeXuatKeSkipped: a.ke_skipped, aiDaAp: a.ai_da_ap, daDoc: a.da_doc,
    goi: a.goi, goiOk: a.goi_ok, theCho: a.the_cho,
    chiTheoNgay: ngay.map((n) => ({ ngay: n.ngay, usd: n.usd, do: n.usd > CO_DO_USD_NGAY })),
    runIds: run.map((r) => r.run_id),
  };
}

// ==== mẫu đo độ đúng (AC-10) ====
export const NGUONG_DUNG_MAC_DINH = 0.85;
export const SO_CA_TOI_THIEU = 100;
export type NhanMau = { post_id: string; property_type: string | null };
export type KetMau = { n: number; ap: number; dung: number; canDuoi: number | null; tiLeAp: number; the: number; usd: number; dat: boolean; thieuChu: number };

/** Đọc tệp nhãn dạng [[post_id, {property_type, …}], …] — chỉ giữ khoá bài và loại hình. */
export function docTepNhan(noiDung: string): NhanMau[] {
  const j = JSON.parse(noiDung) as [string, { property_type?: string | null }][];
  return j.map(([post_id, l]) => ({ post_id, property_type: l.property_type ?? null }));
}

/**
 * Đo độ đúng các ca MÁY ÁP trên nhãn có sẵn: dùng đúng luật của lượt thật, không ghi canonical. Nhãn của model lưu vào silver_labels
 * để lượt thật dùng lại, không trả tiền hai lần. Kết quả ghi ops_audit `doc-toan-bo:mau`, lượt thật đọc dòng này.
 */
export async function doMau(o: {
  client: pg.Client; runId: string; nhan: NhanMau[]; n: number; nguong: number; tranUsd: number; thu: boolean; cam?: string[];
  hoi?: (chuDaGat: string) => Promise<Nhan>; languageModel?: LanguageModel; resolve: ResolveFn;
  wilson: (dung: number, n: number) => number | null;
}): Promise<KetMau> {
  const c = o.client;
  const cam = o.cam ?? (await docTenCam(c));
  const chon = o.nhan.slice(0, o.n);
  const { rows } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, text, group_name FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC NULLS LAST`,
    [chon.map((x) => x.post_id)]);
  const chuBai = new Map<string, { text: string; group_name: string | null }>(rows.map((r) => [r.post_id, r]));
  const coBai = chon.filter((x) => (chuBai.get(x.post_id)?.text ?? "").length > 0);
  const gat = (x: NhanMau) => { const b = chuBai.get(x.post_id)!; return gatChu(b.text, [...cam, ...(b.group_name ? [b.group_name] : [])]); };
  const daCo = new Map<string, NhanDoc>();
  for (const r of (await c.query(
    `SELECT post_id, text_hash, listing_intent, probabilities, quote, quote_ok, json_ok, error_kind FROM silver_labels
     WHERE source_code = 'S03' AND model = $1 AND prompt_version = $2 AND post_id = ANY ($3)`,
    [TEN_MODEL.haiku, PROMPT_VERSION, coBai.map((x) => x.post_id)])).rows) daCo.set(khoaNhan(r.post_id, r.text_hash), r);
  const hoi = o.hoi ?? ((chu: string) => hoiDoc(chu, { trace: o.runId, languageModel: o.languageModel, recordCall: o.thu ? async () => {} : undefined }));
  const bai: Bai[] = coBai.map((x) => ({ post_id: x.post_id, text: gat(x), text_hash: textHash(chuBai.get(x.post_id)!.text) }))
    .filter((b) => !daCo.has(khoaNhan(b.post_id, b.text_hash)));
  const lo = await chayLo({
    backend: "haiku", bai, runId: o.runId, tranUsd: o.tranUsd, promptVersion: PROMPT_VERSION, uoc: uocChiPhiDoc,
    hoi: (_b, chu) => hoi(chu),
    ghi: o.thu ? null : async (d: DongNhan) => (d.error_kind && d.error_kind !== "json-hong" ? 0 : (await c.query(SQL_GHI, thamSoGhi(d))).rowCount ?? 0),
  });
  for (const d of lo.nhan) if (!d.error_kind || d.error_kind === "json-hong") daCo.set(khoaNhan(d.post_id, d.text_hash), d);

  let ap = 0, dung = 0, the = 0;
  for (const x of coBai) {
    const b = chuBai.get(x.post_id)!;
    const l = daCo.get(khoaNhan(x.post_id, textHash(b.text)));
    if (!l) continue;
    const ctx = await o.resolve(b.group_name, b.text);
    const q = quyetTin({
      hienTai: { property_type: "unknown", price_vnd: null, area_m2: null }, e1Loai: ctx.propertyType, intent: l.listing_intent,
      quoteOk: l.quote_ok, quoteYDinh: l.quote, them: l.json_ok ? (l.probabilities as DocThem | null) : null, chuDaGat: gat(x),
      chungBai: false, held: new Set(),
    });
    const mayAp = q.de_xuat.filter((d) => d.status === "queued" && d.route !== "review");
    if (mayAp.length > 0) { ap++; if (mayAp[0].value === x.property_type) dung++; }
    if (q.doi_chieu.length > 0 || q.de_xuat.some((d) => d.status === "queued" && d.route === "review")) the++;
  }
  const canDuoi = o.wilson(dung, ap);
  const dat = !lo.dungTran && ap >= SO_CA_TOI_THIEU && canDuoi !== null && canDuoi >= o.nguong;
  const kq: KetMau = {
    n: coBai.length, ap, dung, canDuoi, tiLeAp: coBai.length ? ap / coBai.length : 0, the, usd: lo.tongUsd, dat, thieuChu: chon.length - coBai.length,
  };
  if (!o.thu) {
    await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ($1, 'doc-toan-bo:mau', $2)`,
      [`doc-toan-bo:${o.runId}`, { prompt_version: PROMPT_VERSION, nguong: o.nguong, ...kq }]);
  }
  return kq;
}

/** Có dòng mẫu đạt ngưỡng cho prompt này chưa: lượt thật từ chối chạy khi chưa có (AC-10). */
export async function coMauDat(c: pg.Client, promptVersion: string = PROMPT_VERSION): Promise<boolean> {
  const { rows } = await c.query(
    `SELECT 1 FROM ops_audit WHERE action = 'doc-toan-bo:mau' AND detail->>'prompt_version' = $1 AND detail->>'dat' = 'true' LIMIT 1`, [promptVersion]);
  return rows.length > 0;
}

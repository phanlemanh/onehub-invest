import { pool } from "./db";
import {
  type DealChiTiet,
  type DealHang,
  cauChungMinh,
  lyDoRoi,
  NGAY_TOI_DA,
  NGHI_NGO_PCT,
  NGUONG_LOAI_PCT,
  NGUONG_VAO_PCT,
  repostLabel,
  tenCan,
  thieuGi,
} from "./deals-chi-tiet";
import { maskSourceNames, type SourceNameEntry } from "./mask-source-names";
import { fmtPhone, telHref } from "./ops/people";
import { tenTin } from "./ten-tin";
import { buildMediaImages, loadOfferMedia } from "./ops/review-media";
import { docSourceNameEntries } from "./source-roles";

export { NGHI_NGO_PCT, repostLabel };

/** Số căn trang danh sách tải; căn ngoài số này mở bằng trang một căn (phân trang: CG2). */
export const SO_CAN_DANH_SACH = 30;

/**
 * G2/P4 — Deals v2: căn giá tốt từ tín hiệu riêng P1 (Zalo S03 + Facebook
 * S05), đo bằng THƯỚC VẢI CÔNG KHAI P2 (median price/m² theo phường từ
 * Chợ Tốt S06, n≥5). Đây là hiện thực hoá "bait gap" của kiến trúc 3 tầng:
 * discount = % dưới giá rao công khai cùng phường (docs/research/
 * investment-pipeline-4-stages.md).
 *
 * Người bán trên tin rao là tầng C (ADR-0007 mục 9), tên và SĐT đã lên cloud (02/11). Bản cloud (`dealsSql({ cloud: true })`)
 * chỉ đọc cột trong CLOUD_ALLOW; ảnh và chữ bài ở lại máy thu (hồ sơ can-gia-tot-biet-can, Hỏi-2, Hỏi-6).
 */
export type DealRow = DealChiTiet;

/**
 * Bỏ trường theo vai trước khi đưa vào trang, để trường cấm không có mặt trong dữ liệu trang: `lienHe` = tên, nhóm, số;
 * `noiDung` = ảnh, chữ bài và địa chỉ dưới phường. Cả hai từ vai Vận hành trở lên (`xemNoiDungTin`; Hỏi-4, Hỏi-5).
 */
export function dealTheoVai(d: DealRow, vai: { lienHe: boolean; noiDung: boolean }): DealRow {
  const lienHe = vai.lienHe ? {} : { sellerName: null, sellerPhone: null, groupName: null, brokerNAds: null, brokerMedianGap: null };
  const noiDung = vai.noiDung
    ? {}
    : { images: [], postTextFull: null, block: null, floor: null, unit: null, streetNumber: null, street: null, district: null };
  return { ...d, ...lienHe, ...noiDung };
}

/** Một hàng của bảng: các chữ cần `lib/ops/people` (mang pg) tính ở đây; `d` đã qua `dealTheoVai`. */
export function dealHang(d: DealRow, vai: { xemNoiDung: boolean; mayThu: boolean }): DealHang {
  return {
    ...d,
    ten: tenCan(d),
    thieu: thieuGi(d, vai),
    cau: cauChungMinh(d),
    xemAnh: vai.xemNoiDung && vai.mayThu,
    sdt: d.sellerPhone ? fmtPhone(d.sellerPhone) : null,
    tel: d.sellerPhone ? telHref("sdt", d.sellerPhone, vai.xemNoiDung) : null,
  };
}

/**
 * Thước của Căn giá tốt (CG8): trung vị giá/m² theo phường × loại hình (`v_ruler_p2`), đúng thước `refresh-bait-gap` dùng tính
 * `bait_gap_pct` — trung vị và số căn in trên thẻ là của chính thước đó. Loại chưa rõ không có thước.
 */
export const THUOC_CUNG_LOAI = `SELECT area_id, property_type, m, n FROM v_ruler_p2
  WHERE property_type IS NOT NULL AND property_type <> 'unknown'`;

/** Cột của một tin. `cloud`: không đọc cột ngoài CLOUD_ALLOW; `unit_number`, `street_number` ở lại máy thu. */
const cotTin = (cloud: boolean) => `o.offer_id, o.source, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
              o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
              o.area_id, o.post_ids, o.seller_name, o.seller_phone,
              o.property_type, o.block_raw, o.floor_raw, o.street_raw, o.district_raw,
              ${cloud ? "NULL AS unit_number, NULL AS street_number" : "o.unit_number, o.street_number"},
              a.name AS phuong,
              r.m AS median_perm2, r.n AS ruler_n,
              o.bait_gap_pct AS discount_pct,
              o.bait_gap_pct > ${NGHI_NGO_PCT} AS suspect,
              o.last_seen < now() - interval '${NGAY_TOI_DA} days' AS qua_han,
              sel.n_ads AS broker_n_ads,
              sel.flags->>'median_gap_pct' AS broker_med_gap`;

/** Bài gốc mới nhất của tin; bản cloud không có `stg_zalo_posts` (Hỏi-6). */
const noiBai = (cloud: boolean) => (cloud
  ? { cot: "NULL AS sender_name, NULL AS group_name, NULL AS post_text_full", join: "/* cloud: không có stg_zalo_posts */" }
  : {
      cot: "z.sender_name, z.group_name, z.text AS post_text_full",
      join: `LEFT JOIN LATERAL (
       SELECT sender_name, group_name, text
       FROM stg_zalo_posts z
       WHERE z.post_id = ANY(b.post_ids)
       ORDER BY z.captured_at DESC
       LIMIT 1
     ) z ON TRUE`,
    });

/**
 * Câu SQL của danh sách Căn giá tốt. Số giảm là `bait_gap_pct` pipeline đã tính sẵn (refresh-bait-gap, luật 10) —
 * tin phi lý đã bị pipeline gạt số giảm về NULL (ON11) nên không lọt vào đây. Thứ tự: tin thường trước tin cần xác
 * minh, mỗi nhóm giảm dần — sắp TRƯỚC LIMIT, không thì 30 thẻ vẫn toàn tin sát trần.
 */
export function dealsSql({ cloud = false }: { cloud?: boolean } = {}): string {
  const bai = noiBai(cloud);
  return `WITH ruler AS (${THUOC_CUNG_LOAI}), base AS (
       SELECT ${cotTin(cloud)}
       FROM sale_offers o
       JOIN ruler r ON r.area_id = o.area_id AND r.property_type = o.property_type
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
       WHERE o.price_tier = 'P1'
         AND o.kind = 'sale'
         AND o.bait_gap_pct IS NOT NULL
         AND o.last_seen >= now() - interval '${NGAY_TOI_DA} days'
         AND o.bait_gap_pct >= $1
         AND o.bait_gap_pct <= ${NGUONG_LOAI_PCT} -- guard thước mỏng
       ORDER BY suspect, discount_pct DESC, o.offer_id
       LIMIT $2
     )
     SELECT b.*, ${bai.cot}
     FROM base b
     ${bai.join}
     ORDER BY b.suspect, b.discount_pct DESC, b.offer_id`;
}

/** Một tin P1 bán theo mã, không lọc theo mức giảm: căn rời danh sách vẫn mở, kèm lý do (Hỏi-1). */
export function dealSql({ cloud = false }: { cloud?: boolean } = {}): string {
  const bai = noiBai(cloud);
  return `WITH b AS (
       SELECT ${cotTin(cloud)}
       FROM sale_offers o
       LEFT JOIN (${THUOC_CUNG_LOAI}) r ON r.area_id = o.area_id AND r.property_type = o.property_type
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
       WHERE o.offer_id = $1 AND o.price_tier = 'P1' AND o.kind = 'sale'
     )
     SELECT b.*, ${bai.cot}
     FROM b
     ${bai.join}`;
}

type DealSqlRow = Record<string, unknown>;

/** Hàng SQL → DealRow (dùng chung cho trang và test). */
export function toDealRow(r: DealSqlRow): DealRow {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  const ten = (v: unknown) => tenTin((v as string | null) ?? null);
  const areaId = (r.area_id as string | null) ?? null;
  return {
    offerId: r.offer_id as string,
    source: r.source as string,
    priceVnd: num(r.price_vnd),
    areaM2: num(r.area_m2),
    pricePerm2: num(r.price_perm2),
    bedrooms: (r.bedrooms as number | null) ?? null,
    phuong: (r.phuong as string | null) ?? null,
    areaPath: areaId ? `/${areaId.split("-")[0]}/${areaId.split("-").slice(1).join("-")}` : null,
    medianPerm2: num(r.median_perm2),
    rulerN: num(r.ruler_n),
    discountPct: num(r.discount_pct),
    suspect: r.suspect === true,
    confidence: r.confidence as string,
    firstSeen: r.first_seen as string,
    lastSeen: r.last_seen as string,
    nReposts: Number(r.n_reposts ?? 1),
    sellerName: ten(r.seller_name) ?? ten(r.sender_name),
    sellerPhone: (r.seller_phone as string | null) ?? null,
    groupName: (r.group_name as string | null) ?? null,
    propertyType: (r.property_type as string | null) ?? null,
    block: (r.block_raw as string | null) ?? null,
    floor: (r.floor_raw as string | null) ?? null,
    unit: (r.unit_number as string | null) ?? null,
    streetNumber: (r.street_number as string | null) ?? null,
    street: (r.street_raw as string | null) ?? null,
    district: (r.district_raw as string | null) ?? null,
    images: [],
    postTextFull: (r.post_text_full as string | null) ?? null,
    roiDanhSach: null,
    brokerNAds: num(r.broker_n_ads),
    brokerMedianGap: num(r.broker_med_gap),
  };
}

// Mã Postgres khi DB không có lược đồ riêng của máy thu: 42P01 thiếu bảng, 42703 thiếu cột.
const THIEU_LUOC_DO_MAY_THU = new Set(["42P01", "42703"]);
const thieuLuocDo = (e: unknown) => THIEU_LUOC_DO_MAY_THU.has((e as { code?: string }).code ?? "");

/**
 * Cloud không có `stg_zalo_posts`, `unit_number` (nơi chạy, không phải lỗi): chỉ hai mã thiếu lược đồ mới rơi về bản
 * cloud. Lỗi khác (deadlock, khoá, mất kết nối) ở máy thu ném tiếp cho khối lỗi có Thử lại: nuốt nó thì trang vẫn đủ căn
 * nhưng nói sai «chỉ có ở máy thu» (S4 r1 E12 của people-hien-so-goc).
 */
async function truyVan(sql: (o: { cloud?: boolean }) => string, values: unknown[]): Promise<{ rows: DealSqlRow[]; mayThu: boolean }> {
  try {
    const { rows } = await pool.query(sql({}), values);
    return { rows, mayThu: true };
  } catch (e) {
    if (!thieuLuocDo(e)) throw e;
    const { rows } = await pool.query(sql({ cloud: true }), values);
    return { rows, mayThu: false };
  }
}

/** Ở máy thu: gắn ảnh qua khoá (URL gốc không xuống trình duyệt) và che tên nguồn thật trong chữ của người đăng. */
async function hoanTat(rows: DealRow[], mayThu: boolean): Promise<{ rows: DealRow[]; mayThu: boolean }> {
  if (!mayThu || rows.length === 0) return { rows, mayThu };
  // Lỗi hạ tầng ném tiếp cho khối lỗi: nuốt nó thì bộ che trả null và trang báo sai là căn thiếu tên, thiếu chữ bài.
  let entries: SourceNameEntry[] = [];
  try {
    entries = await docSourceNameEntries();
  } catch (e) {
    if (!thieuLuocDo(e)) throw e;
  }
  let media = null;
  try {
    media = await loadOfferMedia(rows.map((d) => d.offerId));
  } catch (e) {
    if (!thieuLuocDo(e)) throw e;
  }
  return {
    // Thiếu bảng media: coi như bản cloud, chữ bài không được đi tiếp vì trang nói máy chủ không giữ nó.
    mayThu: media !== null,
    rows: rows.map((d) => ({
      ...d,
      images: media ? buildMediaImages(media.get(d.offerId) ?? []) : [],
      sellerName: maskSourceNames(d.sellerName, entries),
      groupName: maskSourceNames(d.groupName, entries),
      postTextFull: media ? maskSourceNames(d.postTextFull, entries) : null,
    })),
  };
}

export async function getDeals(limit = SO_CAN_DANH_SACH, minDiscountPct = NGUONG_VAO_PCT): Promise<{ rows: DealRow[]; mayThu: boolean }> {
  const { rows, mayThu } = await truyVan(dealsSql, [minDiscountPct, limit]);
  return hoanTat(rows.map(toDealRow), mayThu);
}

/**
 * Căn có trong danh sách trang đang tải không, để crumb biết `?can=` mở được sheet hay sẽ chuyển về trang một căn.
 * Bọc chính `dealsSql` để thứ tự và giới hạn một nguồn; bản cloud không đọc bài gốc nên chạy được ở cả hai nơi.
 */
export async function dealTrongDanhSach(offerId: string): Promise<boolean> {
  const { rows } = await pool.query(`SELECT 1 FROM (${dealsSql({ cloud: true })}) ds WHERE ds.offer_id = $3`, [NGUONG_VAO_PCT, SO_CAN_DANH_SACH, offerId]);
  return rows.length > 0;
}

/** Một căn theo mã; mã lạ, hay tin không phải P1 bán, trả `deal: null`. */
export async function getDeal(offerId: string): Promise<{ deal: DealRow | null; mayThu: boolean }> {
  const { rows, mayThu } = await truyVan(dealSql, [offerId]);
  if (!rows[0]) return { deal: null, mayThu };
  const d = toDealRow(rows[0]);
  const xong = await hoanTat([{ ...d, roiDanhSach: lyDoRoi(d, rows[0].qua_han === true) }], mayThu);
  return { deal: xong.rows[0], mayThu: xong.mayThu };
}

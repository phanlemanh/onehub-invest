import { pool } from "./db";
import {
  type DealChiTiet,
  type DealHang,
  type MatBang,
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

/**
 * Cột của một tin. `cloud`: không đọc cột ngoài CLOUD_ALLOW; `unit_number`, `street_number` ở lại máy thu. `coBang` (CG9): số
 * chứng minh lấy từ hạng tính sẵn `offer_price_rank` (bí danh `h`) thay thước CG8 (bí danh `r`, `bait_gap_pct`).
 */
const cotTin = (cloud: boolean, coBang = false) => `o.offer_id, o.source, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
              o.confidence, o.first_seen::text, o.last_seen::text, o.n_reposts,
              o.area_id, o.post_ids, o.seller_name, o.seller_phone,
              o.property_type, o.block_raw, o.floor_raw, o.street_raw, o.district_raw,
              ${cloud ? "NULL AS unit_number, NULL AS street_number" : "o.unit_number, o.street_number"},
              a.name AS phuong,
              ${coBang ? COT_HANG : `r.m AS median_perm2, r.n AS ruler_n,
              o.bait_gap_pct AS discount_pct,
              o.bait_gap_pct > ${NGHI_NGO_PCT} AS suspect,`}
              o.last_seen < now() - interval '${NGAY_TOI_DA} days' AS qua_han,
              sel.n_ads AS broker_n_ads,
              sel.flags->>'median_gap_pct' AS broker_med_gap`;

/** Cột hạng giá (CG9) — trung vị in như «giá/m²» chỉ khi thước giá/m²; tin thuê theo tháng không có thước giá/m². */
const COT_HANG = `CASE WHEN h.thuoc = 'gia-m2' THEN h.trung_vi END AS median_perm2, h.n AS ruler_n,
              h.duoi_trung_vi_pct AS discount_pct,
              coalesce(h.can_xac_minh, false) AS suspect,
              h.n AS rank_n, h.trung_vi AS rank_median, h.p20 AS rank_p20, h.hang_pct AS rank_pct,
              h.duoi_trung_vi_pct AS rank_below, h.nhan AS rank_label, coalesce(h.can_xac_minh, false) AS rank_cxm,
              h.pn_nhom AS rank_pn, h.ly_do AS rank_reason, h.thuoc AS rank_metric, (h.offer_id IS NOT NULL) AS co_hang,
              h.cap AS rank_level, h.nut AS rank_node, pn.name AS rank_node_name,`;

/** Tên dự án của nhóm so sánh cấp dự án (CG10): asset_nodes đã sync cloud; không đọc view offer_project (chỉ máy thu). */
const NOI_TEN_DU_AN = "LEFT JOIN asset_nodes pn ON h.cap = 'du_an' AND pn.id::text = h.nut";

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
export function dealsSql({ cloud = false, coBang = false, duAn = false, chiXacMinh = false }:
  { cloud?: boolean; coBang?: boolean; duAn?: boolean; chiXacMinh?: boolean } = {}): string {
  const bai = noiBai(cloud);
  if (coBang) {
    // CG9: danh sách = tin bán có nhãn hạng (P1 và P2 — gánh CG2), xếp tin cần xác minh sau rồi % dưới trung vị giảm dần;
    // trần 50% và hạn 45 ngày giữ như cũ (Hỏi-2). CG10: mỗi căn một dòng (căn S06 nhỏ nhất trong property_offers, hay chính
    // tin) — tin thấy sau cùng làm đại diện, `so_tin` = số tin của căn qua điều kiện; `duAn` thêm $3 = id nút dự án, chỉ tin
    // cấp dự án của nút đó; `chiXacMinh` chỉ tin cần xác minh (tab đếm trên toàn tập, Hỏi-3) kèm `tong` = số căn của tập.
    return `WITH loc AS (
       SELECT ${cotTin(cloud, true)},
              coalesce((SELECT min(po.property_id)::text FROM property_offers po WHERE po.offer_id = o.offer_id), o.offer_id) AS can_key,
              o.last_seen AS thay_cuoi
       FROM offer_price_rank h
       JOIN sale_offers o ON o.offer_id = h.offer_id
       ${NOI_TEN_DU_AN}
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
       WHERE h.kind = 'sale'
         AND h.nhan IS NOT NULL
         AND o.last_seen >= now() - interval '${NGAY_TOI_DA} days'
         AND h.duoi_trung_vi_pct >= $1
         AND h.duoi_trung_vi_pct <= ${NGUONG_LOAI_PCT}${duAn ? `
         AND h.cap = 'du_an' AND h.nut = $3` : ""}
     ), gom AS (
       SELECT DISTINCT ON (l.can_key) l.*, count(*) OVER (PARTITION BY l.can_key) AS so_tin
       FROM loc l
       ORDER BY l.can_key, l.thay_cuoi DESC, l.offer_id
     ), base AS (
       SELECT g.*, count(*) OVER () AS tong
       FROM gom g${chiXacMinh ? `
       WHERE g.suspect` : ""}
       ORDER BY g.suspect, g.discount_pct DESC, g.offer_id
       LIMIT $2
     )
     SELECT b.*, ${bai.cot}
     FROM base b
     ${bai.join}
     ORDER BY b.suspect, b.discount_pct DESC, b.offer_id`;
  }
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

/**
 * Một tin bán theo mã, không lọc theo mức giảm: căn rời danh sách vẫn mở, kèm lý do (Hỏi-1). `coBang` (CG9): mọi tin bán
 * (P1 và P2) kèm hạng tính sẵn — và tin thuê (CG10: trang một căn thuê đọc hạng giá tháng × PN; danh sách vẫn chỉ tin bán, Hỏi-2);
 * không bảng thì chỉ tin bán P1 với thước CG8 như cũ.
 */
export function dealSql({ cloud = false, coBang = false }: { cloud?: boolean; coBang?: boolean } = {}): string {
  const bai = noiBai(cloud);
  const thuoc = coBang
    ? `LEFT JOIN offer_price_rank h ON h.offer_id = o.offer_id ${NOI_TEN_DU_AN}`
    : `LEFT JOIN (${THUOC_CUNG_LOAI}) r ON r.area_id = o.area_id AND r.property_type = o.property_type`;
  return `WITH b AS (
       SELECT ${cotTin(cloud, coBang)}
       FROM sale_offers o
       ${thuoc}
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
       WHERE o.offer_id = $1 AND ${coBang ? "o.kind IN ('sale', 'rent_lt')" : "o.kind = 'sale' AND o.price_tier = 'P1'"}
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
    soTin: Number(r.so_tin ?? 1),
    rank: r.co_hang === true
      ? {
          n: num(r.rank_n),
          median: num(r.rank_median),
          p20: num(r.rank_p20),
          pct: num(r.rank_pct),
          below: num(r.rank_below),
          label: (r.rank_label as string | null) ?? null,
          needsVerification: r.rank_cxm === true,
          bedroomsGroup: num(r.rank_pn),
          reason: (r.rank_reason as string | null) ?? null,
          metric: (r.rank_metric as string | null) ?? null,
          level: (r.rank_level as string | null) ?? null,
          node: (r.rank_node as string | null) ?? null,
          nodeName: (r.rank_node_name as string | null) ?? null,
        }
      : null,
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
async function truyVan(
  sql: (o: { cloud?: boolean; coBang?: boolean }) => string,
  values: unknown[],
): Promise<{ rows: DealSqlRow[]; mayThu: boolean }> {
  const coBang = await coBangHang();
  try {
    const { rows } = await pool.query(sql({ coBang }), values);
    return { rows, mayThu: true };
  } catch (e) {
    if (!thieuLuocDo(e)) throw e;
    const { rows } = await pool.query(sql({ cloud: true, coBang }), values);
    return { rows, mayThu: false };
  }
}

/**
 * CG9 Hỏi-5: bảng hạng giá có và đã có dòng chưa. Cloud trước khi Mạnh áp DDL, máy thu trước lượt chấm đầu → false, ba đường
 * đọc theo thước CG8 như cũ, không lỗi. Hai câu riêng: hỏi EXISTS trên bảng chưa có là lỗi phân tích câu.
 * Dò theo search_path (không ghi `public.`) — cùng chỗ câu đọc tìm bảng; lược đồ cloud trong test không có bảng thì phải ra false.
 */
export async function coBangHang(): Promise<boolean> {
  const { rows } = await pool.query(`SELECT to_regclass('offer_price_rank') IS NOT NULL AS co`);
  if (!rows[0]?.co) return false;
  const { rows: r2 } = await pool.query(`SELECT EXISTS (SELECT 1 FROM offer_price_rank) AS co`);
  return r2[0]?.co === true;
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

/**
 * Mặt bằng S03 so S06 (CG15, project_source_baseline — chỉ máy thu) của các tin S03 cấp dự án trong `ids`: một câu, khớp khoá
 * nhóm của dòng hạng. Bảng vắng (cloud, máy thu chưa áp 107) → `{}`, không lỗi; lỗi khác ném tiếp cho khối lỗi.
 */
export async function matBangCho(ids: string[]): Promise<Record<string, MatBang>> {
  if (ids.length === 0) return {};
  const { rows: co } = await pool.query(`SELECT to_regclass('project_source_baseline') IS NOT NULL AS co`);
  if (!co[0]?.co) return {};
  const { rows } = await pool.query(
    `SELECT h.offer_id, b.n_s03, b.trung_vi_s03, b.n_s06, b.trung_vi_s06, b.lech_pct, b.trang_thai
       FROM offer_price_rank h
       JOIN sale_offers o ON o.offer_id = h.offer_id AND o.source = 'S03'
       JOIN project_source_baseline b
         ON b.nut = h.nut AND b.kind = h.kind AND b.property_type = h.property_type AND b.thuoc = h.thuoc
        AND coalesce(b.pn_nhom, -1) = coalesce(h.pn_nhom, -1)
      WHERE h.cap = 'du_an' AND h.offer_id = ANY($1::text[])`, [ids]);
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return Object.fromEntries(rows.map((r) => [r.offer_id as string, {
    nS03: Number(r.n_s03), medianS03: num(r.trung_vi_s03), nS06: Number(r.n_s06), medianS06: num(r.trung_vi_s06),
    lechPct: num(r.lech_pct), trangThai: r.trang_thai as MatBang["trangThai"],
  }]));
}
/** Gắn `matBang` vào từng dòng (null khi tin không có mặt bằng). */
async function ganMatBang(rows: DealRow[]): Promise<DealRow[]> {
  const mb = await matBangCho(rows.filter((d) => d.source === "S03" && d.rank?.level === "du_an").map((d) => d.offerId));
  return rows.map((d) => ({ ...d, matBang: mb[d.offerId] ?? null }));
}

/** Giới hạn danh sách khi lọc một dự án (CG10): không cắt 30 — Ocean Park 1 có 140 căn. */
export const SO_CAN_DU_AN = 300;

/** `project` (id nút dự án, đã qua `parseProject`) → chỉ tin cấp dự án của nút đó, giới hạn mặc định SO_CAN_DU_AN. */
export async function getDeals(limit?: number, minDiscountPct = NGUONG_VAO_PCT, { project = null }: { project?: string | null } = {}):
  Promise<{ rows: DealRow[]; mayThu: boolean }> {
  const lim = limit ?? (project ? SO_CAN_DU_AN : SO_CAN_DANH_SACH);
  const sql = (o: { cloud?: boolean; coBang?: boolean }) => dealsSql({ ...o, duAn: Boolean(project) && o.coBang === true });
  // Không có bảng hạng thì không có cấp dự án: lọc dự án trả rỗng thay vì danh sách cả phường.
  if (project && !(await coBangHang())) return { rows: [], mayThu: true };
  const { rows, mayThu } = await truyVan(sql, project ? [minDiscountPct, lim, project] : [minDiscountPct, lim]);
  return hoanTat(await ganMatBang(rows.map(toDealRow)), mayThu);
}

/**
 * Tab «Cần xác minh» trên TOÀN tập (CG10 Hỏi-3): đếm và liệt kê tin cần xác minh qua cùng điều kiện danh sách, không chỉ trong
 * 30 dòng đã cắt. `null` khi chưa có bảng hạng (lối CG8: tab đếm trong danh sách như cũ).
 */
export async function getXacMinh({ project = null, limit = SO_CAN_DU_AN }: { project?: string | null; limit?: number } = {}):
  Promise<{ tong: number; rows: DealRow[]; mayThu: boolean } | null> {
  if (!(await coBangHang())) return null;
  const sql = (o: { cloud?: boolean; coBang?: boolean }) => dealsSql({ ...o, duAn: Boolean(project), chiXacMinh: true });
  const { rows, mayThu } = await truyVan(sql, project ? [NGUONG_VAO_PCT, limit, project] : [NGUONG_VAO_PCT, limit]);
  const xong = await hoanTat(await ganMatBang(rows.map(toDealRow)), mayThu);
  return { tong: Number(rows[0]?.tong ?? 0), rows: xong.rows, mayThu: xong.mayThu };
}

/** Id nút dự án từ tham số URL: chỉ chữ số, tối đa 18 ký tự (vừa bigint); sai khuôn → null. */
export function parseProject(v: string | string[] | undefined | null): string | null {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" && /^[0-9]{1,18}$/.test(s) ? s.replace(/^0+(?=\d)/, "") : null;
}

/** Nút dự án theo id (asset_nodes đã sync cloud); không có hay không phải dự án → null. */
export async function getDuAn(id: string): Promise<{ id: string; ten: string } | null> {
  const { rows } = await pool.query(`SELECT id::text AS id, name FROM asset_nodes WHERE id = $1::bigint AND node_type = 'project'`, [id]);
  return rows[0] ? { id: rows[0].id, ten: rows[0].name } : null;
}

/**
 * Căn có trong danh sách trang đang tải không, để crumb biết `?can=` mở được sheet hay sẽ chuyển về trang một căn.
 * Bọc chính `dealsSql` để thứ tự và giới hạn một nguồn; bản cloud không đọc bài gốc nên chạy được ở cả hai nơi.
 */
export async function dealTrongDanhSach(offerId: string): Promise<boolean> {
  const coBang = await coBangHang();
  const { rows } = await pool.query(`SELECT 1 FROM (${dealsSql({ cloud: true, coBang })}) ds WHERE ds.offer_id = $3`, [NGUONG_VAO_PCT, SO_CAN_DANH_SACH, offerId]);
  return rows.length > 0;
}

/**
 * Dải m² dự án × PN (CG10, project_area_band — chỉ máy thu) cho căn hộ cấp dự án thiếu diện tích có PN. Bảng vắng (cloud,
 * máy thu chưa áp 106) → null, không lỗi; lỗi khác ném tiếp cho khối lỗi.
 */
async function daiM2Cua(d: DealRow): Promise<{ p10: number; p90: number } | null> {
  if (d.rank?.level !== "du_an" || !d.rank.node || d.areaM2 || d.bedrooms == null || d.propertyType !== "apartment") return null;
  if (!/^\d+$/.test(d.rank.node)) return null;
  const { rows: co } = await pool.query(`SELECT to_regclass('project_area_band') IS NOT NULL AS co`);
  if (!co[0]?.co) return null;
  const { rows } = await pool.query(`SELECT p10, p90 FROM project_area_band WHERE project_node_id = $1 AND bedrooms = $2`,
    [d.rank.node, d.bedrooms]);
  return rows[0] ? { p10: Number(rows[0].p10), p90: Number(rows[0].p90) } : null;
}

/** Một căn theo mã; mã lạ hay tin không phải tin bán (không bảng hạng: không phải P1 bán) trả `deal: null`. */
export async function getDeal(offerId: string): Promise<{ deal: DealRow | null; mayThu: boolean }> {
  const { rows, mayThu } = await truyVan(dealSql, [offerId]);
  if (!rows[0]) return { deal: null, mayThu };
  const [d0] = await ganMatBang([toDealRow(rows[0])]);
  const d = { ...d0, daiM2: await daiM2Cua(d0) };
  const xong = await hoanTat([{ ...d, roiDanhSach: lyDoRoi(d, rows[0].qua_han === true) }], mayThu);
  return { deal: xong.rows[0], mayThu: xong.mayThu };
}

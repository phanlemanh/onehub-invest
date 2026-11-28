import { Hono } from "hono";
import type { Context } from "hono";
import { pool } from "../db/client.js";
import { giaiMaKhuVuc } from "../lib/ma-thi-truong.js";
import { listingKeySecret } from "../lib/listing-key.js";
import { LISTING_KEY_NAMES, loaiHinh } from "../contract/listing.js";
import { SOURCE_HIDDEN } from "../contract/vocab.generated.js";
import { kiemNguonAn, LOI_NGUON_AN } from "../lib/nguon-an.js";

/**
 * /v1/listings — Listing (tin rao) theo RESO DD 2.1 (PB2, `_acceptance/data-api-hop-dong-reso-dd-2-1`): MỘT tài nguyên có
 * `kind` (sale · rent_lt · rent_st) đọc hai bảng — `sale_offers` cho bán, thuê dài hạn; `listings` cho thuê ngắn hạn. Khoá
 * phần tử lấy từ `src/contract/listing.ts`; loại hình theo bảng design §3.
 *
 *   GET /v1/listings?kind=&market=&area=&bedroomsTotal=&limit=&offset=      sắp theo listingKey, phân trang trên tập ghép
 *   GET /v1/listings?minBelowMedianPct=<n>[&kind=&project=&market=&area=]  căn giá tốt — bộ lọc, không còn /v1/deals
 *   GET /v1/listings/:listingKey
 *
 * HT19: không đọc bảng bài thô (`stg_*`), không trả chữ bài, ảnh, tên nhóm, người gửi của bài S03; không đọc bảng S02.
 * `media` luôn null (ảnh tin bán/thuê mang tên nguồn; URL ảnh ngắn hạn có thể mang số phòng nguồn — PB4).
 */
export const KIND = ["sale", "rent_lt", "rent_st"] as const;
type Kind = (typeof KIND)[number];
type Dong = Record<string, unknown>;

const loi = (c: Context, status: 400 | 404 | 503, code: string, message: string) => c.json({ error: { code, message } }, status);
const so = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const chuoiNgay = (v: unknown) => (v === null || v === undefined ? null : new Date(String(v)).toISOString());

/** Bảng hạng giá có và đã có dòng chưa (CG9 Hỏi-5). Chưa → thước CG8 (view v_ruler_p2). */
export async function coBangHang(): Promise<boolean> {
  const { rows } = await pool.query(`SELECT to_regclass('offer_price_rank') IS NOT NULL AS co`);
  if (!rows[0]?.co) return false;
  const { rows: r2 } = await pool.query(`SELECT EXISTS (SELECT 1 FROM offer_price_rank) AS co`);
  return r2[0]?.co === true;
}

/** Mã khoá tin ngắn hạn trong SQL — $<p> là khoá bí mật. */
const KHOA_NGAN_HAN = (cot: string, p: number) => `substr(encode(hmac('S01|' || ${cot}, $${p}::text, 'sha256'), 'hex'), 1, 16)`;

/** Nguồn không bao giờ hiển thị công khai (PB7): điều kiện dựng từ danh sách ĐÃ KIỂM của sổ (PB10), không viết tay mã nào. */
const dieuKienNguon = (ds: readonly string[]) => `o.source <> ALL(ARRAY[${ds.map((s) => `'${s}'`).join(", ")}]::text[])`;

/** Hai nhánh của tập ghép, cùng tập cột. `dieuKien*` thêm điều kiện riêng từng bảng (vd tra theo khoá). */
function tapGhep(kinds: Kind[], pKhoa: number, NGUON_HIEN: string, dieuKienBan = "", dieuKienNgan = ""): string {
  const nhanh: string[] = [];
  const banThue = kinds.filter((k) => k !== "rent_st");
  if (banThue.length) {
    nhanh.push(`SELECT o.offer_id AS k, o.kind, o.source, o.property_type, o.price_vnd::numeric AS gia, o.area_m2, o.price_perm2,
              o.bedrooms, o.bathrooms::numeric AS wc, o.area_id, o.latitude, o.longitude, o.first_seen, o.last_seen,
              o.confidence, o.n_reposts, NULL::text AS ten, NULL::text AS loai_cho, NULL::int AS so_khach,
              NULL::int AS dem_toi_thieu, NULL::int AS so_danh_gia, NULL::text AS lid
         FROM sale_offers o WHERE o.kind IN (${banThue.map((k) => `'${k}'`).join(", ")}) AND ${NGUON_HIEN}${dieuKienBan}`);
  }
  if (kinds.includes("rent_st")) {
    nhanh.push(`SELECT ${KHOA_NGAN_HAN("l.id", pKhoa)} AS k, 'rent_st'::text AS kind, 'S01'::text AS source, l.property_type,
              l.price_listed::numeric AS gia, NULL::numeric AS area_m2, NULL::numeric AS price_perm2, l.bedrooms,
              l.bathrooms::numeric AS wc, l.area_id, l.latitude, l.longitude, NULL::timestamptz AS first_seen, l.last_seen,
              NULL::text AS confidence, NULL::int AS n_reposts, l.name AS ten, l.room_type AS loai_cho, l.accommodates AS so_khach,
              l.minimum_nights AS dem_toi_thieu, l.review_count AS so_danh_gia, l.id AS lid
         FROM listings l WHERE TRUE${dieuKienNgan}`);
  }
  return nhanh.join("\n UNION ALL \n");
}

const COT_KHU = `a.name AS phuong, a.id AS ma_phuong, CASE WHEN a.region_type = 'market' THEN a.id ELSE a.parent_id END AS ma_thi_truong`;

/** Phần tử Listing từ một dòng của tập ghép + số so giá + số lịch (khoá theo đúng tệp hợp đồng). */
export function phanTu(r: Dong, giaTot?: Dong, lich?: Dong): Record<string, unknown> {
  const kind = String(r.kind) as Kind;
  const gia = so(r.gia);
  const dienTich = so(r.area_m2);
  const giaM2 = so(r.price_perm2);
  const { propertyType, propertySubType } = loaiHinh(kind, (r.property_type as string | null) ?? null);
  const nguon = typeof r.source === "string" && /^S[0-9]{2}$/.test(r.source) ? r.source : null;
  const wc = so(r.wc);
  const v: Record<string, unknown> = {
    listingKey: String(r.k),
    kind,
    originatingSystemName: nguon,
    propertyType,
    propertySubType,
    listPrice: kind === "sale" ? gia : null,
    leaseAmount: kind === "sale" ? null : gia,
    leaseAmountFrequency: kind === "rent_lt" ? "Monthly" : kind === "rent_st" ? "Daily" : null,
    livingArea: dienTich,
    livingAreaUnits: dienTich === null ? null : "Square Meters",
    salePricePerArea: kind === "sale" ? giaM2 : null,
    leasePricePerArea: kind === "rent_lt" ? giaM2 : null,
    pricePerAreaUnit: giaM2 === null || kind === "rent_st" ? null : "Square Meters",
    bedroomsTotal: so(r.bedrooms),
    // Ngắn hạn: 1,5 WC = một đủ + một nửa → 2 phòng.
    bathroomsTotalInteger: wc === null ? null : kind === "rent_st" ? Math.ceil(wc) : Math.round(wc),
    city: (r.phuong as string | null) ?? null,
    mlsAreaMinor: (r.ma_phuong as string | null) ?? null,
    mlsAreaMajor: (r.ma_thi_truong as string | null) ?? null,
    latitude: so(r.latitude),
    longitude: so(r.longitude),
    onMarketTimestamp: chuoiNgay(r.first_seen),
    media: null,
    lastSeenTimestamp: chuoiNgay(r.last_seen),
    confidence: (r.confidence as string | null) ?? null,
    repostCount: so(r.n_reposts),
    listingTitle: (r.ten as string | null) ?? null,
    spaceType: (r.loai_cho as string | null) ?? null,
    accommodates: so(r.so_khach),
    minimumNights: so(r.dem_toi_thieu),
    reviewCount: so(r.so_danh_gia),
    occupancyRate: so(lich?.occupancy),
    averageDailyRevenue: so(lich?.revenue),
    belowMedianPct: so(giaTot?.below),
    comparableMedianPricePerArea: so(giaTot?.median),
    priceRank: giaTot?.rank ?? null,
  };
  return Object.fromEntries(LISTING_KEY_NAMES.map((n) => [n, v[n] ?? null]));
}

/** Khối priceRank của một dòng offer_price_rank — các khoá con của khối rank cũ. */
function khoiHang(r: Dong) {
  return {
    level: r.cap ?? null,
    node: r.nut ?? null,
    n: so(r.n),
    median: so(r.trung_vi),
    p20: so(r.p20),
    percentile: so(r.hang_pct),
    label: r.nhan ?? null,
    needsVerification: r.can_xac_minh === true,
    metric: r.thuoc ?? null,
    bedroomsGroup: so(r.pn_nhom),
    reason: r.ly_do ?? null,
  };
}

/** Số so giá cho các tin bán/thuê dài hạn của một trang: bảng hạng nếu có, không thì thước CG8 (chỉ tin bán). */
async function soGiaTot(dong: Dong[]): Promise<Map<string, Dong>> {
  const ra = new Map<string, Dong>();
  const ban = dong.filter((r) => r.kind !== "rent_st");
  if (!ban.length) return ra;
  if (await coBangHang()) {
    const { rows } = await pool.query(
      `SELECT offer_id, duoi_trung_vi_pct, CASE WHEN thuoc = 'gia-m2' THEN trung_vi END AS median,
              cap, nut, n, trung_vi, p20, hang_pct, nhan, can_xac_minh, thuoc, pn_nhom, ly_do
         FROM offer_price_rank WHERE offer_id = ANY($1)`,
      [ban.map((r) => String(r.k))],
    );
    for (const h of rows) ra.set(String(h.offer_id), { below: h.duoi_trung_vi_pct, median: h.median, rank: khoiHang(h) });
    return ra;
  }
  const can = ban.filter((r) => r.kind === "sale" && Number(r.price_perm2) > 0 && r.area_id && r.property_type && r.property_type !== "unknown");
  if (!can.length) return ra;
  const { rows } = await pool.query(
    `SELECT area_id, property_type, m::numeric AS m FROM v_ruler_p2 WHERE area_id = ANY($1) AND property_type = ANY($2)`,
    [[...new Set(can.map((r) => String(r.area_id)))], [...new Set(can.map((r) => String(r.property_type)))]],
  );
  const thuoc = new Map(rows.map((x) => [`${x.area_id}|${x.property_type}`, Number(x.m)]));
  for (const r of can) {
    const m = thuoc.get(`${r.area_id}|${r.property_type}`);
    if (!m || m <= 0) continue;
    ra.set(String(r.k), { below: Math.round((1 - Number(r.price_perm2) / m) * 1000) / 10, median: m, rank: null });
  }
  return ra;
}

/** Số lịch (tỉ lệ đêm không trống, giá trung bình đêm đã đặt) cho các tin ngắn hạn của một trang. */
async function soLich(dong: Dong[]): Promise<Map<string, Dong>> {
  const ids = dong.filter((r) => r.kind === "rent_st").map((r) => String(r.lid));
  if (!ids.length) return new Map();
  const { rows } = await pool.query(
    `SELECT listing_id,
            round(avg(CASE WHEN available THEN 0 ELSE 1 END::numeric) * 100, 1) AS occupancy,
            round(sum(CASE WHEN available THEN 0 ELSE price END)::numeric / nullif(count(*) FILTER (WHERE NOT available), 0)) AS revenue
       FROM nights WHERE listing_id = ANY($1) GROUP BY listing_id`,
    [ids],
  );
  return new Map(rows.map((x) => [String(x.listing_id), x]));
}

async function dungTrang(rows: Dong[]) {
  const [gt, lich] = await Promise.all([soGiaTot(rows), soLich(rows)]);
  return rows.map((r) => phanTu(r, gt.get(String(r.k)), r.lid ? lich.get(String(r.lid)) : undefined));
}

/**
 * Route /v1/listings dựng từ danh sách nguồn ẩn (PB10). Sổ hỏng (`kiemNguonAn` trả null) → mọi đường của route trả 503
 * HIDDEN_SOURCES_NOT_CONFIGURED TRƯỚC khi chạm DB: đóng khi không biết phải ẩn gì (fail-closed), không lặng lẽ mở S02, S08.
 */
export function taoListingsRoute(dsNguonAn: unknown): Hono {
  const r = new Hono();
  const nguon = kiemNguonAn(dsNguonAn);
  if (!nguon) {
    r.all("*", (c) => c.json({ error: { ...LOI_NGUON_AN } }, 503));
    return r;
  }
  const NGUON_HIEN = dieuKienNguon(nguon);

r.get("/", async (c) => {
  const secret = listingKeySecret();
  const rawKind = c.req.query("kind");
  if (rawKind !== undefined && !(KIND as readonly string[]).includes(rawKind)) {
    return loi(c, 400, "BAD_REQUEST", "kind phải là sale, rent_lt hoặc rent_st");
  }
  const rawProject = c.req.query("project");
  if (rawProject !== undefined && !/^[0-9]{1,18}$/.test(rawProject)) {
    return loi(c, 400, "BAD_REQUEST", "project phải là mã số nút dự án");
  }
  const rawMin = c.req.query("minBelowMedianPct");
  if (rawMin !== undefined && !Number.isFinite(Number(rawMin))) return loi(c, 400, "BAD_REQUEST", "minBelowMedianPct phải là số");
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) trả như gọi bằng mã mới.
  const rawMarket = c.req.query("market");
  const rawArea = c.req.query("area");
  const market = rawMarket ? await giaiMaKhuVuc(rawMarket) : undefined;
  const area = rawArea ? await giaiMaKhuVuc(rawArea) : undefined;
  const rawBed = c.req.query("bedroomsTotal");
  const limit = Math.min(200, Number(c.req.query("limit") ?? 50) || 50);
  const offset = Math.max(0, Number(c.req.query("offset") ?? 0) || 0);

  const kindsXem = (rawKind ? [rawKind] : [...KIND]) as Kind[];
  const giaTotMode = rawMin !== undefined || rawProject !== undefined;
  const coNganHan = !giaTotMode && kindsXem.includes("rent_st");
  // Khoá bí mật chỉ cần khi trả tin ngắn hạn (listingKey HMAC); căn giá tốt và tin bán/thuê dài hạn không cần.
  if (coNganHan && !secret) return loi(c, 503, "LISTING_KEY_NOT_CONFIGURED", "listingKey secret is not configured");
  // Khoá bí mật chỉ vào câu khi tập ghép có nhánh ngắn hạn (tham số không dùng là lỗi kiểu của Postgres).
  const params: unknown[] = coNganHan ? [secret] : [];
  const loc: string[] = [];
  if (area) {
    params.push(area);
    loc.push(`(t.area_id = $${params.length} OR a.parent_id = $${params.length})`);
  } else if (market) {
    params.push(market);
    loc.push(`(a.id = $${params.length} OR a.parent_id = $${params.length})`);
  }
  if (rawBed !== undefined) {
    params.push(Number(rawBed));
    loc.push(`t.bedrooms = $${params.length}`);
  }

  // Căn giá tốt: bộ lọc của Listing (thay /v1/deals). Chỉ tin bán, thuê dài hạn có số so giá.
  if (giaTotMode) {
    const minPct = Math.max(0, Math.min(50, rawMin === undefined ? 5 : Number(rawMin)));
    const kinds = (rawKind ? [rawKind] : [...KIND]).filter((k) => k !== "rent_st") as Kind[];
    if (!kinds.length) return c.json({ data: [], meta: { total: 0, limit, offset } });
    const coBang = await coBangHang();
    if (rawProject !== undefined && !coBang) return c.json({ data: [], meta: { total: 0, limit, offset } });
    let noi: string;
    let dk: string;
    if (coBang) {
      params.push(kinds);
      dk = `h.kind = ANY($${params.length}) AND h.nhan IS NOT NULL AND t.last_seen >= now() - interval '45 days'
            AND h.duoi_trung_vi_pct >= ${minPct} AND h.duoi_trung_vi_pct <= 50`;
      if (rawProject !== undefined) {
        params.push(rawProject);
        dk += ` AND h.cap = 'du_an' AND h.nut = $${params.length}`;
      }
      noi = `JOIN offer_price_rank h ON h.offer_id = t.k`;
    } else {
      if (!kinds.includes("sale")) return c.json({ data: [], meta: { total: 0, limit, offset } });
      dk = `t.kind = 'sale' AND t.price_perm2 > 0 AND s.m > 0 AND t.property_type IS NOT NULL AND t.property_type <> 'unknown'
            AND t.last_seen >= now() - interval '45 days'
            AND ROUND((1 - t.price_perm2::numeric / s.m) * 100, 1) BETWEEN ${minPct} AND 50`;
      noi = `JOIN (SELECT area_id, property_type, m::numeric AS m FROM v_ruler_p2) s ON s.area_id = t.area_id AND s.property_type = t.property_type`;
    }
    params.push(limit, offset);
    const xep = coBang ? "h.duoi_trung_vi_pct" : "ROUND((1 - t.price_perm2::numeric / s.m) * 100, 1)";
    const { rows } = await pool.query(
      `WITH t AS (${tapGhep(kinds, 0, NGUON_HIEN)})
       SELECT t.*, ${COT_KHU} FROM t LEFT JOIN areas a ON a.id = t.area_id ${noi}
        WHERE ${[dk, ...loc].join(" AND ")}
        ORDER BY ${xep} DESC, t.k
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return c.json({ data: await dungTrang(rows), meta: { total: rows.length, limit, offset } });
  }

  params.push(limit, offset);
  const { rows } = await pool.query(
    `WITH t AS (${tapGhep(kindsXem, 1, NGUON_HIEN)})
     SELECT t.*, ${COT_KHU} FROM t LEFT JOIN areas a ON a.id = t.area_id
      ${loc.length ? `WHERE ${loc.join(" AND ")}` : ""}
      ORDER BY t.k
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return c.json({ data: await dungTrang(rows), meta: { total: rows.length, limit, offset } });
});

r.get("/:listingKey", async (c) => {
  const secret = listingKeySecret();
  if (!secret) return loi(c, 503, "LISTING_KEY_NOT_CONFIGURED", "listingKey secret is not configured");
  const key = c.req.param("listingKey");
  const { rows } = await pool.query(
    `WITH t AS (${tapGhep([...KIND], 1, NGUON_HIEN, " AND o.offer_id = $2", ` AND ${KHOA_NGAN_HAN("l.id", 1)} = $2`)})
     SELECT t.*, ${COT_KHU} FROM t LEFT JOIN areas a ON a.id = t.area_id LIMIT 1`,
    [secret, key],
  );
  if (!rows[0]) return loi(c, 404, "NOT_FOUND", "Listing not found");
  return c.json({ data: (await dungTrang(rows))[0] });
});

  return r;
}

export const listingsRoute = taoListingsRoute(SOURCE_HIDDEN);

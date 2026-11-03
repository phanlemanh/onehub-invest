import { pool } from "./db";
import { VN_TZ } from "./format";
import { giaiMaKhuVuc } from "./ma-thi-truong";
import { findSourceNames, type SourceNameEntry } from "./mask-source-names";
import {
  OFFER_HIDDEN_SOURCES,
  OFFER_MANY_NAMES,
  OFFER_MAX_FRONTAGE_M,
  OFFER_MAX_STORIES,
  OFFER_RECENT_DAYS,
  OFFER_RENT_MAX_VND,
  OFFER_RENT_MIN_VND,
  OFFER_SALE_MIN_VND,
  type OfferFilters,
  type OfferSort,
  type OfferWard,
  type PublicOffer,
} from "./offers-filters";
import { KIND, PROPERTY_TYPE } from "./vocab.generated";

/**
 * Tin rao trên cổng Invest (hồ sơ tin-rao-tren-invest, ROADMAP §3 mục 25). Một chỗ quyết tin nào hiện, trường nào
 * rời máy chủ: danh sách không bao giờ mang SĐT, không mang mã nguồn, liên kết gốc hay định danh tài khoản; số chỉ đi
 * qua `getOfferPhone` từng tin một.
 */

export * from "./offers-filters";

/** Điều kiện hiện công khai: đủ năm trường lõi (bậc B1, lib/data-level.ts), còn mới, giá không phi lý; S02, S08 không bao giờ. */
const VISIBLE = `o.kind IN ('${KIND.sale}', '${KIND.rent_lt}')
  AND o.property_type IS NOT NULL AND o.property_type <> '${PROPERTY_TYPE.unknown}'
  AND o.price_vnd > 0 AND o.area_m2 > 0 AND o.area_id IS NOT NULL
  AND (o.kind <> '${KIND.sale}' OR o.price_vnd >= ${OFFER_SALE_MIN_VND})
  AND (o.kind <> '${KIND.rent_lt}' OR (o.price_vnd >= ${OFFER_RENT_MIN_VND} AND o.price_vnd < ${OFFER_RENT_MAX_VND}))
  AND o.source <> ALL(ARRAY[${OFFER_HIDDEN_SOURCES.map((s) => `'${s}'`).join(", ")}])
  AND o.last_seen >= now() - interval '${OFFER_RECENT_DAYS} days'`;

/**
 * Có số mà chưa xác minh (070). Đọc qua to_jsonb để cloud chưa có cột vẫn không lỗi: thiếu cột hay cột NULL đều coi là chưa
 * xác minh, vì thiếu bằng chứng thì kèm nhãn. Không số thì không có gì để gắn nhãn.
 */
const PHONE_INFERRED = `(o.seller_phone IS NOT NULL AND coalesce(to_jsonb(o) ->> 'seller_phone_inferred', 'true') <> 'false')`;

const ORDER: Record<OfferSort, string> = {
  newest: "o.last_seen DESC, o.offer_id",
  "price-asc": "o.price_vnd ASC, o.offer_id",
  "price-desc": "o.price_vnd DESC, o.offer_id",
  "perm2-asc": "o.price_perm2 ASC NULLS LAST, o.offer_id",
};

function whereOf(marketId: string | null, f: OfferFilters) {
  const params: unknown[] = [f.kind];
  const conds = [VISIBLE, "o.kind = $1"];
  const add = (sql: (n: number) => string, v: unknown) => {
    params.push(v);
    conds.push(sql(params.length));
  };
  if (marketId) add((n) => `(a.id = $${n} OR a.parent_id = $${n})`, marketId);
  if (f.wards.length) add((n) => `o.area_id = ANY($${n}::text[])`, f.wards);
  if (f.types.length) add((n) => `o.property_type = ANY($${n}::text[])`, f.types);
  if (f.priceMin !== null) add((n) => `o.price_vnd >= $${n}`, f.priceMin);
  if (f.priceMax !== null) add((n) => `o.price_vnd <= $${n}`, f.priceMax);
  if (f.areaMin !== null) add((n) => `o.area_m2 >= $${n}`, f.areaMin);
  if (f.areaMax !== null) add((n) => `o.area_m2 <= $${n}`, f.areaMax);
  if (f.bedroomsMin !== null) add((n) => `o.bedrooms >= $${n}`, f.bedroomsMin);
  if (f.hasPhone) conds.push("o.seller_phone IS NOT NULL");
  return { where: conds.join(" AND "), params };
}

/**
 * Định danh nguồn dùng để che ở bản chạy tại máy thu. Trên cloud không có `source_registry` (null): sync đã che giá trị
 * trước khi gửi. Có bảng mà rỗng thì không biết tên nào cần che, `mangDinhDanh` coi mọi giá trị là trúng.
 */
async function sourceEntries(): Promise<SourceNameEntry[] | null> {
  const { rows } = await pool.query<{ r: string | null }>(`SELECT to_regclass('source_registry')::text AS r`);
  if (rows[0]?.r == null) return null;
  const { rows: names } = await pool.query<{ code: string; x: string }>(
    `SELECT DISTINCT code, x FROM (SELECT code, real_name AS x FROM source_registry
       UNION ALL SELECT code, unnest(source_ids) FROM source_registry) t WHERE x IS NOT NULL AND x <> ''`,
  );
  return names.map((n) => ({ code: n.code, realName: n.x }));
}
const mangDinhDanh = (v: string, entries: SourceNameEntry[] | null) =>
  entries !== null && (entries.length === 0 || findSourceNames(v, entries).length > 0);

/** Bỏ số nhà ở đầu chuỗi đường: người đăng có thể đã giấu ở nơi khác (FRAMING §3.3). */
const streetOf = (raw: string | null) => raw?.replace(/^[\d\s/.,-]+/, "").trim() || null;

const frontage = (raw: string | null) => {
  const m = raw === null ? null : Number(raw);
  return m !== null && m > 0 && m <= OFFER_MAX_FRONTAGE_M ? m : null;
};

/** Một trang tin rao của thị trường (hoặc toàn bộ khi `marketId` null). `total`, `withPhone` tính trên cả tập lọc. */
export async function getPublicOffers(
  marketId: string | null,
  f: OfferFilters,
): Promise<{ rows: PublicOffer[]; total: number; withPhone: number }> {
  const { where, params } = whereOf(marketId, f);
  const from = `FROM sale_offers o JOIN areas a ON a.id = o.area_id`;
  const [entries, { rows }, { rows: counts }] = await Promise.all([
    sourceEntries(),
    pool.query(
      `WITH nhieu_ten AS (
         SELECT seller_ref FROM sale_offers WHERE seller_ref IS NOT NULL AND seller_ref <> ''
         GROUP BY seller_ref HAVING count(DISTINCT seller_name) >= ${OFFER_MANY_NAMES}
       )
       SELECT o.offer_id, o.kind, o.property_type, o.price_vnd, o.area_m2, o.price_perm2, o.bedrooms,
              o.bathrooms, o.stories, o.frontage_length,
              o.area_id, a.name AS area_name, o.street_raw, o.seller_name,
              n.seller_ref IS NOT NULL AS many_names, o.seller_phone IS NOT NULL AS has_phone,
              ${PHONE_INFERRED} AS phone_inferred,
              o.last_seen::text AS updated_at,
              GREATEST(0, (now() AT TIME ZONE '${VN_TZ}')::date - (o.first_seen AT TIME ZONE '${VN_TZ}')::date)::int AS first_seen_days
       ${from} LEFT JOIN nhieu_ten n ON n.seller_ref = o.seller_ref
       WHERE ${where}
       ORDER BY ${ORDER[f.sort]}
       LIMIT ${f.limit} OFFSET ${f.offset}`,
      params,
    ),
    pool.query(
      `SELECT count(*)::int AS total, count(o.seller_phone)::int AS with_phone ${from} WHERE ${where}`,
      params,
    ),
  ]);
  return {
    total: counts[0].total,
    withPhone: counts[0].with_phone,
    rows: rows.map((r) => ({
      offerId: r.offer_id,
      kind: r.kind,
      propertyType: r.property_type,
      priceVnd: Number(r.price_vnd),
      areaM2: Number(r.area_m2),
      pricePerm2: r.price_perm2 === null ? null : Number(r.price_perm2),
      bedrooms: r.bedrooms,
      bathrooms: r.bathrooms,
      stories: r.stories !== null && r.stories <= OFFER_MAX_STORIES ? r.stories : null,
      frontageLength: frontage(r.frontage_length),
      ward: { id: r.area_id, name: r.area_name },
      street: streetOf(r.street_raw),
      sellerName: r.many_names || (r.seller_name !== null && mangDinhDanh(r.seller_name, entries)) ? null : r.seller_name,
      sellerManyNames: r.many_names,
      hasPhone: r.has_phone,
      phoneInferred: r.phone_inferred,
      updatedAt: r.updated_at,
      firstSeenDays: r.first_seen_days,
    })),
  };
}

/** Phường của thị trường có tin rao hiện được — lựa chọn của bộ lọc Phường. */
export async function getOfferWards(marketId: string, kind: OfferFilters["kind"]): Promise<OfferWard[]> {
  const { rows } = await pool.query(
    `SELECT a.id, a.name, count(*)::int AS n
     FROM sale_offers o JOIN areas a ON a.id = o.area_id
     WHERE ${VISIBLE} AND o.kind = $1 AND (a.id = $2 OR a.parent_id = $2)
     GROUP BY a.id, a.name ORDER BY a.name`,
    [kind, marketId],
  );
  return rows;
}

/** Số của đúng một tin đang hiện công khai; null khi tin không hiện hoặc chưa có số. */
export async function getOfferPhone(offerId: string): Promise<{ phone: string; inferred: boolean } | null> {
  const { rows } = await pool.query(
    `SELECT o.seller_phone, ${PHONE_INFERRED} AS phone_inferred FROM sale_offers o WHERE o.offer_id = $1 AND ${VISIBLE}`,
    [offerId],
  );
  const phone: string | null = rows[0]?.seller_phone ?? null;
  if (phone === null || mangDinhDanh(phone, await sourceEntries())) return null;
  return { phone, inferred: rows[0].phone_inferred };
}

/** Mã thị trường đọc từ query (`market`), mã dài cũ đổi sang mã ngắn. */
export async function offerMarketOf(q: URLSearchParams): Promise<string | null> {
  const raw = q.get("market");
  return raw ? await giaiMaKhuVuc(raw) : null;
}

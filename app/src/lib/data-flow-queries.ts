import type { User } from "./auth";
import { pool } from "./db";
import { VN_TZ, vnDayKey, vnDayStart } from "./format";
import { isAdmin } from "./ops-access";
import { buildOfferImages, type PostMediaRow, type ReviewImage } from "./ops/review-media";

/**
 * Số cho /ops/data-flow «Dòng chảy dữ liệu» (proto 26/10): một tin đi từ bài nhận → đọc được → tin rao → gắn căn,
 * theo nguồn, theo ngày và theo nhóm thu. CHỈ ĐỌC; chỉ chạy ở máy thu (bảng stg_* không lên cloud).
 *
 * Hai đồng hồ, một luật: bài tính theo ngày đăng (`posted_at`, S06 `list_time`), tin theo `first_seen` (= giờ đăng bài
 * sớm nhất của tin). Bài «đọc được» = bài nằm trong `post_ids` của một tin cùng nguồn; tin mới ≤ bài đọc được nên
 * «gộp vào tin đã có» = đọc được − tin mới. S06 chưa có khoá nối ngược bài → tin (TV10), nên chặng đọc được của S06
 * là ước lượng bằng số tin (`approx`).
 *
 * Proto: tính lúc tải trang. Bản thật tính sẵn ở pipeline/sql (luật 10).
 */

export type FlowWindow = "7d" | "30d" | "all";
export const FLOW_WINDOWS: readonly FlowWindow[] = ["7d", "30d", "all"];
export type FlowSource = "S03" | "S05" | "S06";
export const FLOW_SOURCES: readonly FlowSource[] = ["S03", "S05", "S06"];

/** Số các chặng của một nguồn (hoặc một ngày, một nhóm thu). */
export type StageCounts = {
  /** Bài thật vào bảng nạp (đã gạt bài thử). */
  received: number;
  /** Bài thành (một phần của) tin rao. */
  readable: number;
  /** Tin rao mới (sau gộp trùng). */
  offers: number;
  /** Tin đã gắn về một căn. */
  linked: number;
};

export type SourceFlow = StageCounts & {
  source: FlowSource;
  testRejected: number;
  withWard: number;
  withType: number;
  withPriceArea: number;
  /** Tin đủ năm trường lõi (= bậc B1 trở lên, lib/data-level.ts). */
  complete: number;
  highConfidence: number;
  latestAt: string | null;
  approx: boolean;
};

export type FlowDay = StageCounts & { day: string; source: FlowSource };

export type GroupFlow = {
  /** Tên nhóm thu S03/S05 — tầng C (ADR-0007 sửa đổi 24/10), hiện được ở /ops. */
  group: string;
  source: FlowSource;
  received: number;
  readable: number;
  offers: number;
  latestAt: string | null;
};

export type ShortStay = { received: number; stored: number; withWard: number; latestAt: string | null };

export type KindMix = { sale: number; rentLt: number; shortStay: number };

export type FlowRecord = {
  offerId: string;
  source: string;
  kind: string;
  propertyType: string;
  priceVnd: number | null;
  areaM2: number | null;
  bedrooms: number | null;
  ward: string | null;
  market: string | null;
  confidence: string;
  nPosts: number;
  linked: boolean;
  firstSeen: string;
  lastSeen: string;
  /** Bài gốc sớm nhất (cắt 600 ký tự) — chỉ có ở S03/S05. */
  postText: string | null;
  postGroup: string | null;
};

export type DataFlow = {
  window: FlowWindow;
  since: string | null;
  sources: SourceFlow[];
  days: FlowDay[];
  groups: GroupFlow[];
  shortStay: ShortStay;
  mix: KindMix;
  records: FlowRecord[];
  enrichPending: number;
  reviewPending: number;
};

const WINDOW_DAYS: Record<FlowWindow, number | null> = { "7d": 7, "30d": 30, all: null };
/** Biểu đồ theo ngày luôn có mốc: «Toàn kho» vẽ 30 ngày gần nhất. */
const SERIES_DAYS = 30;

/** Ngày VN bắt đầu cửa sổ `n` ngày tính tới `now` (gồm hôm nay). */
function windowStart(n: number, now: number): Date {
  return vnDayStart(vnDayKey(now - (n - 1) * 86400000));
}

// Dấu bài thử — cùng ba dấu của pipeline/lib/test-posts.mjs (snapshot thử, tác tử thử, nhóm TEST).
/** Vế «bài thử» trên một dòng stg_zalo_posts (xuất cho phép đo). */
export const IS_TEST_SQL = `(split_part(snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(snapshot_id, '__', 2) = 'example'
  OR coalesce(agent_id, '') ~* '^(e2e|test|mock)' OR btrim(coalesce(group_name, '')) ~* '^test($|[^[:alpha:]])')`;

const POSTS_CTE = `
  p AS (
    SELECT DISTINCT ON (post_id) post_id, snapshot_id, agent_id, group_name, posted_at
    FROM stg_zalo_posts
    ORDER BY post_id, captured_at DESC
  ),
  t AS (
    SELECT post_id, posted_at, group_name,
           CASE WHEN agent_id = 'apify-facebook' THEN 'S05' ELSE 'S03' END AS src,
           ${IS_TEST_SQL} AS is_test
    FROM p WHERE posted_at >= $1
  ),
  used AS (
    SELECT DISTINCT unnest(post_ids) AS post_id, source FROM sale_offers WHERE source IN ('S03', 'S05')
  )`;

/** Năm trường lõi của bậc B1 trên một dòng sale_offers `o` — cùng điều kiện với lib/data-level.ts (xuất cho phép đo). */
export const COMPLETE_SQL = `o.kind IS NOT NULL AND o.property_type IS NOT NULL AND o.property_type <> 'unknown' AND o.price_vnd > 0
  AND o.area_m2 > 0 AND o.area_id IS NOT NULL`;

/** S06 chưa nối bài → tin: «đọc được» ước lượng bằng số tin, không vượt số quảng cáo. */
export const s06Readable = (offers: number, received: number) => Math.min(offers, received);

const DAY = (col: string) => `(${col} AT TIME ZONE '${VN_TZ}')::date::text`;

const num = (v: unknown) => Number(v ?? 0);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- hàng pg trả về động; mỗi chỗ đọc ép kiểu tường minh
type FlowQueryFn = (text: string, values?: unknown[]) => Promise<{ rows: any[] }>;

export async function getDataFlow(
  window: FlowWindow,
  opts: { now?: number; query?: FlowQueryFn; readableS06?: (offers: number, received: number) => number } = {},
): Promise<DataFlow> {
  const q: FlowQueryFn = opts.query ?? ((text, values) => pool.query(text, values));
  const readableS06 = opts.readableS06 ?? s06Readable;
  // Chạy ở server; trang truyền mốc request (requestTime) để mọi vùng cùng một «bây giờ».
  const now = opts.now ?? Date.now();
  const n = WINDOW_DAYS[window];
  const since = n ? windowStart(n, now) : null;
  // Một lần quét: cửa sổ dài nhất cần cho tổng (since) và cho chuỗi ngày (30 ngày).
  const seriesStart = windowStart(SERIES_DAYS, now);
  const scanStart = since ? (since < seriesStart ? since : seriesStart) : new Date(0);
  const totalsStart = since ?? new Date(0);

  const [posts, s06, offers, groups, shortStay, records, pending] = await Promise.all([
    q(
      `WITH ${POSTS_CTE}
       SELECT src, ${DAY("posted_at")} AS d,
              count(*) FILTER (WHERE NOT is_test) AS received,
              count(*) FILTER (WHERE is_test) AS test_rejected,
              count(*) FILTER (WHERE NOT is_test AND u.post_id IS NOT NULL) AS readable,
              max(posted_at) FILTER (WHERE NOT is_test)::text AS latest
       FROM t LEFT JOIN used u ON u.post_id = t.post_id AND u.source = t.src
       GROUP BY 1, 2`,
      [scanStart],
    ),
    q(
      `SELECT ${DAY("list_time")} AS d, count(*) AS received, max(list_time)::text AS latest
       FROM stg_chotot_ads WHERE list_time >= $1 GROUP BY 1`,
      [scanStart],
    ),
    q(
      `SELECT o.source, ${DAY("o.first_seen")} AS d, count(*) AS offers, count(po.offer_id) AS linked,
              count(*) FILTER (WHERE o.area_id IS NOT NULL) AS with_ward,
              count(*) FILTER (WHERE o.property_type <> 'unknown') AS with_type,
              count(*) FILTER (WHERE o.price_vnd IS NOT NULL AND o.area_m2 IS NOT NULL) AS with_price_area,
              count(*) FILTER (WHERE o.confidence = 'high') AS high_conf,
              count(*) FILTER (WHERE ${COMPLETE_SQL}) AS complete,
              count(*) FILTER (WHERE o.kind = 'sale') AS sale,
              count(*) FILTER (WHERE o.kind = 'rent_lt') AS rent_lt
       FROM sale_offers o LEFT JOIN (SELECT DISTINCT offer_id FROM property_offers) po USING (offer_id)
       WHERE o.first_seen >= $1 AND o.source IN ('S03', 'S05', 'S06')
       GROUP BY 1, 2`,
      [scanStart],
    ),
    q(
      `WITH ${POSTS_CTE},
       link AS (
         SELECT DISTINCT unnest(post_ids) AS post_id, offer_id, source FROM sale_offers WHERE source IN ('S03', 'S05')
       )
       SELECT t.src, coalesce(nullif(btrim(t.group_name), ''), 'Nhóm chưa có tên') AS g,
              count(DISTINCT t.post_id) AS received,
              count(DISTINCT t.post_id) FILTER (WHERE l.offer_id IS NOT NULL) AS readable,
              count(DISTINCT l.offer_id) AS offers,
              max(t.posted_at)::text AS latest
       FROM t LEFT JOIN link l ON l.post_id = t.post_id AND l.source = t.src
       WHERE NOT t.is_test
       GROUP BY 1, 2`,
      [totalsStart],
    ),
    q(
      `SELECT (SELECT count(DISTINCT listing_id) FROM stg_abnb_listings WHERE fetched_at >= $1) AS received,
              count(*) AS stored, count(area_id) AS with_ward, max(last_seen)::text AS latest
       FROM listings WHERE last_seen >= ($1::timestamptz AT TIME ZONE '${VN_TZ}')::date`,
      [totalsStart],
    ),
    q(
      `SELECT o.offer_id, o.source, o.kind, o.property_type, o.price_vnd, o.area_m2, o.bedrooms, o.confidence,
              o.n_reposts, o.first_seen::text, o.last_seen::text,
              a.name AS ward, m.name AS market,
              EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id) AS linked,
              z.text AS post_text, z.group_name AS post_group
       FROM (
         -- Mỗi nguồn tối đa 150 tin mới nhất: S06 (~500 tin/ngày) không đẩy tin nhóm khép ra khỏi bảng.
         SELECT *, row_number() OVER (PARTITION BY source ORDER BY first_seen DESC) AS rn
         FROM sale_offers WHERE first_seen >= $1 AND source IN ('S03', 'S05', 'S06')
       ) o
       LEFT JOIN areas a ON a.id = o.area_id
       LEFT JOIN areas m ON m.id = a.parent_id
       LEFT JOIN LATERAL (
         SELECT left(s.text, 600) AS text, s.group_name FROM stg_zalo_posts s
         WHERE s.post_id = ANY (o.post_ids) ORDER BY s.posted_at LIMIT 1
       ) z ON TRUE
       WHERE o.rn <= 150
       ORDER BY o.first_seen DESC`,
      [totalsStart],
    ),
    q(
      `SELECT (SELECT count(*) FROM enrichment_proposals WHERE status = 'pending') AS enrich,
              (SELECT count(*) FROM review_queue WHERE status = 'pending') AS review`,
    ),
  ]);

  const inTotals = (d: string) => !since || d >= vnDayKey(since);
  const seriesFrom = vnDayKey(seriesStart);

  // Gom theo nguồn (tổng cửa sổ) và theo (nguồn, ngày) cho chuỗi.
  const bySource = new Map<FlowSource, SourceFlow>(
    FLOW_SOURCES.map((s) => [
      s,
      { source: s, received: 0, readable: 0, offers: 0, linked: 0, testRejected: 0, withWard: 0, withType: 0,
        withPriceArea: 0, complete: 0, highConfidence: 0, latestAt: null, approx: s === "S06" },
    ]),
  );
  const dayMap = new Map<string, FlowDay>();
  const dayOf = (source: FlowSource, day: string) => {
    const k = `${source}|${day}`;
    let row = dayMap.get(k);
    if (!row) dayMap.set(k, (row = { source, day, received: 0, readable: 0, offers: 0, linked: 0 }));
    return row;
  };
  const later = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);
  const mix: KindMix = { sale: 0, rentLt: 0, shortStay: 0 };

  for (const r of posts.rows) {
    const s = r.src as FlowSource;
    if (inTotals(r.d)) {
      const t = bySource.get(s)!;
      t.received += num(r.received);
      t.readable += num(r.readable);
      t.testRejected += num(r.test_rejected);
      t.latestAt = later(t.latestAt, r.latest);
    }
    if (r.d >= seriesFrom) {
      const d = dayOf(s, r.d);
      d.received += num(r.received);
      d.readable += num(r.readable);
    }
  }
  for (const r of s06.rows) {
    if (inTotals(r.d)) {
      const t = bySource.get("S06")!;
      t.received += num(r.received);
      t.latestAt = later(t.latestAt, r.latest);
    }
    if (r.d >= seriesFrom) dayOf("S06", r.d).received += num(r.received);
  }
  for (const r of offers.rows) {
    const s = r.source as FlowSource;
    if (inTotals(r.d)) {
      const t = bySource.get(s)!;
      t.offers += num(r.offers);
      t.linked += num(r.linked);
      t.withWard += num(r.with_ward);
      t.withType += num(r.with_type);
      t.withPriceArea += num(r.with_price_area);
      t.highConfidence += num(r.high_conf);
      t.complete += num(r.complete);
      mix.sale += num(r.sale);
      mix.rentLt += num(r.rent_lt);
    }
    if (r.d >= seriesFrom) {
      const d = dayOf(s, r.d);
      d.offers += num(r.offers);
      d.linked += num(r.linked);
    }
  }
  // S06: không có khoá nối ngược → «đọc được» ước lượng bằng số tin, không vượt số bài.
  const s06Flow = bySource.get("S06")!;
  s06Flow.readable = readableS06(s06Flow.offers, s06Flow.received);
  for (const d of dayMap.values()) if (d.source === "S06") d.readable = readableS06(d.offers, d.received);

  const ss = shortStay.rows[0] ?? {};
  mix.shortStay = num(ss.stored);

  return {
    window,
    since: since ? since.toISOString() : null,
    sources: [...bySource.values()],
    days: [...dayMap.values()].sort((a, b) => a.day.localeCompare(b.day)),
    groups: groups.rows.map((r) => ({
      group: r.g as string,
      source: r.src as FlowSource,
      received: num(r.received),
      readable: num(r.readable),
      offers: num(r.offers),
      latestAt: r.latest ?? null,
    })),
    shortStay: { received: num(ss.received), stored: num(ss.stored), withWard: num(ss.with_ward), latestAt: ss.latest ?? null },
    mix,
    records: records.rows.map((r) => ({
      offerId: r.offer_id,
      source: r.source,
      kind: r.kind,
      propertyType: r.property_type ?? "unknown",
      priceVnd: r.price_vnd == null ? null : Number(r.price_vnd),
      areaM2: r.area_m2 == null ? null : Number(r.area_m2),
      bedrooms: r.bedrooms == null ? null : Number(r.bedrooms),
      ward: r.ward ?? null,
      market: r.market ?? null,
      confidence: r.confidence,
      nPosts: num(r.n_reposts),
      linked: Boolean(r.linked),
      firstSeen: r.first_seen,
      lastSeen: r.last_seen,
      postText: r.post_text ?? null,
      postGroup: r.post_group ?? null,
    })),
    enrichPending: num(pending.rows[0]?.enrich),
    reviewPending: num(pending.rows[0]?.review),
  };
}

export function parseFlowWindow(v: string | string[] | undefined): FlowWindow {
  const s = Array.isArray(v) ? v[0] : v;
  return (FLOW_WINDOWS as readonly string[]).includes(s ?? "") ? (s as FlowWindow) : "7d";
}

// ---- Ảnh tin của hồ sơ tin (AC-10, Mạnh sửa ở Cổng Phạm vi 26/10) ----
// Cùng luật với Hàng duyệt: ảnh tin chỉ cho admin, chỉ ở máy thu; ghép bằng chính buildOfferImages (ảnh đã tải trước,
// rồi URL gốc, không trùng, tối đa 12). Không sửa lib/ops/review-media.ts — tệp nằm trong hồ sơ đã ký của Hàng duyệt.
// S06 chưa có khoá nối tin → quảng cáo (TV10) nên không truy vấn ảnh cho S06.

const MEDIA_SQL = `
  SELECT o.offer_id, p.snapshot_id, p.media, p.media_files
  FROM sale_offers o
  CROSS JOIN LATERAL unnest(o.post_ids) WITH ORDINALITY AS u(post_id, ord)
  JOIN stg_zalo_posts p ON p.post_id = u.post_id
  WHERE o.offer_id = ANY($1::text[])
  ORDER BY o.offer_id, u.ord`;

export type MediaQuery = (text: string, values: unknown[]) => Promise<{ rows: PostMediaRow[] }>;
const defaultMediaQuery: MediaQuery = (text, values) => pool.query<PostMediaRow>(text, values);

/** Ảnh từng tin S03/S05, khoá theo offer_id. Không phải admin → `{}` không chạm DB; cloud (42P01) → `{}`. */
export async function loadFlowMedia(
  records: Pick<FlowRecord, "offerId" | "source">[],
  user: User | null,
  query: MediaQuery = defaultMediaQuery,
): Promise<Record<string, ReviewImage[]>> {
  if (!isAdmin(user)) return {};
  const ids = [...new Set(records.filter((r) => r.source === "S03" || r.source === "S05").map((r) => r.offerId))];
  if (ids.length === 0) return {};
  let rows: PostMediaRow[];
  try {
    ({ rows } = await query(MEDIA_SQL, [ids]));
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") return {};
    throw err;
  }
  const posts = new Map<string, PostMediaRow[]>();
  for (const r of rows) posts.set(r.offer_id, [...(posts.get(r.offer_id) ?? []), r]);
  return Object.fromEntries(ids.map((id) => [id, buildOfferImages(posts.get(id) ?? [])]));
}

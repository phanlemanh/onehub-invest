import { pool } from "./db";

// Tiền tệ theo market — THB (Bangkok/Inside Airbnb) + VND (Hà Nội/tự thu).
const CURRENCY: Record<string, string> = { "th-bangkok": "THB", "vn-hanoi": "VND" };
export function currencyFor(areaId: string): string {
  const marketId = areaId.split("-").slice(0, 2).join("-");
  return CURRENCY[marketId] ?? "USD";
}

export type Area = {
  id: string;
  parentId: string | null;
  regionType: string;
  name: string;
  parentName: string | null;
  lat: number;
  lng: number;
};

export async function getArea(areaId: string): Promise<Area | null> {
  const { rows } = await pool.query(
    `SELECT a.id, a.parent_id, a.region_type, a.name, p.name AS parent_name,
            ST_Y(ST_Centroid(a.geom)) AS lat, ST_X(ST_Centroid(a.geom)) AS lng
     FROM areas a LEFT JOIN areas p ON p.id = a.parent_id
     WHERE a.id = $1`,
    [areaId],
  );
  const r = rows[0];
  return r
    ? {
        id: r.id,
        parentId: r.parent_id,
        regionType: r.region_type,
        name: r.name,
        parentName: r.parent_name,
        lat: Number(r.lat),
        lng: Number(r.lng),
      }
    : null;
}

/** Slug bỏ dấu tiếng Việt (khớp slugify của pipeline/transform-airbnb.mjs). */
function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Resolve submarket theo slug tên (URL thân thiện, không phụ thuộc id nội bộ). */
export async function resolveSubmarketId(
  marketId: string,
  subSlug: string,
): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT id, name FROM areas
     WHERE region_type = 'submarket' AND parent_id = $1`,
    [marketId],
  );
  const hit = rows.find((r) => slugifyName(r.name) === subSlug);
  return hit?.id ?? null;
}

export type MetricRow = {
  month: string; // YYYY-MM-DD
  listingCount: number;
  revenue: number;
  adr: number | null;
  occupancy: number | null;
  revpar: number | null;
};

export async function getMetrics(areaId: string): Promise<MetricRow[]> {
  const { rows } = await pool.query(
    `SELECT month::text, listing_count, revenue, adr, occupancy, revpar
     FROM market_metrics WHERE area_id = $1 ORDER BY month`,
    [areaId],
  );
  return rows.map((r) => ({
    month: r.month,
    listingCount: Number(r.listing_count),
    revenue: Number(r.revenue),
    adr: r.adr === null ? null : Number(r.adr),
    occupancy: r.occupancy === null ? null : Number(r.occupancy),
    revpar: r.revpar === null ? null : Number(r.revpar),
  }));
}

/** KPI rollup trên toàn bộ cửa sổ dữ liệu (mirror KPI strip AirDNA). */
export async function getKpis(areaId: string) {
  const { rows } = await pool.query(
    `SELECT sum(revenue) AS revenue,
            sum(booked_nights) AS booked,
            sum(available_nights) AS avail,
            max(listing_count) AS listings,
            sum(revenue) / nullif(sum(booked_nights), 0) AS adr,
            sum(booked_nights)::numeric /
              nullif(sum(booked_nights) + sum(available_nights), 0) AS occ
     FROM market_metrics WHERE area_id = $1`,
    [areaId],
  );
  const r = rows[0];
  return {
    revenue: Number(r.revenue ?? 0),
    listings: Number(r.listings ?? 0),
    adr: r.adr === null ? null : Number(r.adr),
    occupancy: r.occ === null ? null : Number(r.occ),
  };
}

/** Benchmark so với các submarket anh em ở tháng mới nhất (mirror metric_percentiles). */
export async function getSiblingBenchmark(areaId: string) {
  const q = `
    WITH last AS (
      SELECT max(month) AS m FROM market_metrics WHERE area_id = $1
    ), siblings AS (
      SELECT mm.adr, mm.occupancy
      FROM market_metrics mm
      JOIN areas a ON a.id = mm.area_id
      WHERE a.parent_id = (SELECT parent_id FROM areas WHERE id = $1)
        AND mm.month = (SELECT m FROM last)
    ), me AS (
      SELECT adr, occupancy FROM market_metrics
      WHERE area_id = $1 AND month = (SELECT m FROM last)
    )
    SELECT
      (SELECT percentile_cont(array[0.3, 0.6, 0.9]) WITHIN GROUP (ORDER BY adr) FROM siblings) AS adr_p,
      (SELECT percentile_cont(array[0.3, 0.6, 0.9]) WITHIN GROUP (ORDER BY occupancy) FROM siblings) AS occ_p,
      (SELECT count(*) FROM siblings) AS n,
      me.adr AS my_adr, me.occupancy AS my_occ
    FROM me`;
  const { rows } = await pool.query(q, [areaId]);
  const r = rows[0];
  if (!r || !r.adr_p) return null;
  return {
    nSiblings: Number(r.n),
    adr: { p: (r.adr_p as number[]).map(Number), mine: r.my_adr === null ? null : Number(r.my_adr) },
    occ: { p: (r.occ_p as number[]).map(Number), mine: r.my_occ === null ? null : Number(r.my_occ) },
  };
}

type MapFeature = {
  type: "Feature";
  properties: { name: string; active: boolean };
  geometry: unknown;
};/** GeoJSON simplified các submarket của market (cho mini-map, không cần basemap). */
export async function getMarketGeoJson(
  marketId: string,
  activeAreaId: string,
): Promise<{ features: MapFeature[]; lat: number; lng: number } | null> {
  const { rows } = await pool.query(
    `SELECT id, name,
            ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.002)) AS geojson,
            ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST_Centroid(geom)) AS lng
     FROM areas
     WHERE id = $1 OR parent_id = $1`,
    [marketId],
  );
  if (rows.length === 0) return null;
  const features: MapFeature[] = rows
    .filter((r) => r.geojson)
    .map((r) => ({
      type: "Feature" as const,
      properties: { name: r.name, active: r.id === activeAreaId },
      geometry: JSON.parse(r.geojson),
    }));
  const anchor = rows.find((r) => r.id === activeAreaId) ?? rows[0];
  return {
    features,
    lat: Number(anchor?.lat ?? 13.75),
    lng: Number(anchor?.lng ?? 100.5),
  };
}

// ---------- M4′: Market Finder choropleth ----------

export type ChoroplethFeature = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  metrics: {
    revenue: number; // 12 tháng
    adr: number | null; // tháng mới nhất
    occupancy: number | null;
    revpar: number | null;
    listings: number; // max monthly
  };
  geometry: unknown;
};

/** GeoJSON + đủ 5 metric cho choropleth Market Finder (đọc market_metrics, không quét nights). */
export async function getSubmarketChoropleth(
  marketId: string,
): Promise<ChoroplethFeature[]> {
  const { rows } = await pool.query(
    `WITH kids AS (
       SELECT id, name,
              regexp_replace(lower(name), '\\s+', '-', 'g') AS slug,
              ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.002)) AS geojson,
              ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST_Centroid(geom)) AS lng
       FROM areas WHERE parent_id = $1
     ), agg AS (
       SELECT mm.area_id, max(mm.listing_count) AS listings, sum(mm.revenue) AS revenue
       FROM market_metrics mm
       WHERE mm.area_id IN (SELECT id FROM kids)
       GROUP BY 1
     ), lm AS (
       SELECT DISTINCT ON (area_id) area_id, adr, occupancy, revpar
       FROM market_metrics
       WHERE area_id IN (SELECT id FROM kids)
       ORDER BY area_id, month DESC
     )
     SELECT k.id, k.name, k.slug, k.lat, k.lng, k.geojson,
            agg.listings, agg.revenue, lm.adr, lm.occupancy, lm.revpar
     FROM kids k
     JOIN agg ON agg.area_id = k.id
     JOIN lm ON lm.area_id = k.id
     ORDER BY k.name`,
    [marketId],
  );
  return rows
    .filter((r) => r.geojson)
    .map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      lat: Number(r.lat),
      lng: Number(r.lng),
      metrics: {
        revenue: Number(r.revenue ?? 0),
        adr: r.adr === null ? null : Number(r.adr),
        occupancy: r.occupancy === null ? null : Number(r.occupancy),
        revpar: r.revpar === null ? null : Number(r.revpar),
        listings: Number(r.listings ?? 0),
      },
      geometry: JSON.parse(r.geojson),
    }));
}

// ---------- M3′: các section sâu ----------

export type TopSubmarket = {
  id: string;
  name: string;
  slug: string;
  listings: number;
  adr: number | null;
  occupancy: number | null;
  revpar: number | null;
  revenue: number; // tổng cửa sổ 12 tháng
};

/** Bảng xếp hạng submarket con của một market — đọc từ market_metrics (đã precompute). */
export async function getTopSubmarkets(marketId: string, limit = 10): Promise<TopSubmarket[]> {
  const { rows } = await pool.query(
    `WITH kids AS (
       SELECT id, name, regexp_replace(lower(name), '\\s+', '-', 'g') AS slug
       FROM areas WHERE parent_id = $1
     ), agg AS (
       SELECT mm.area_id, max(mm.listing_count) AS listings, sum(mm.revenue) AS revenue
       FROM market_metrics mm JOIN kids k ON k.id = mm.area_id
       GROUP BY 1
     ), lm AS (
       SELECT DISTINCT ON (mm.area_id) mm.area_id, mm.adr, mm.occupancy, mm.revpar
       FROM market_metrics mm JOIN kids k ON k.id = mm.area_id
       ORDER BY mm.area_id, mm.month DESC
     )
     SELECT k.id, k.name, k.slug, agg.listings, agg.revenue, lm.adr, lm.occupancy, lm.revpar
     FROM agg
     JOIN lm USING (area_id)
     JOIN kids k ON k.id = agg.area_id
     ORDER BY agg.revenue DESC NULLS LAST
     LIMIT $2`,
    [marketId, limit],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    listings: Number(r.listings ?? 0),
    adr: r.adr === null ? null : Number(r.adr),
    occupancy: r.occupancy === null ? null : Number(r.occupancy),
    revpar: r.revpar === null ? null : Number(r.revpar),
    revenue: Number(r.revenue ?? 0),
  }));
}

export type BreakdownRow = {
  label: string;
  listings: number;
  revenue: number;
  adr: number | null;
  occupancy: number | null;
  share: number; // tỷ trọng revenue trong tổng
};

export type TopListingRow = {
  id: string;
  name: string | null;
  bedrooms: number | null;
  roomType: string | null;
  adr: number | null;
  occupancy: number | null;
  revenue: number;
};

export type AreaBreakdown = {
  bedrooms: BreakdownRow[];
  roomTypes: BreakdownRow[];
  topListings: TopListingRow[];
};

/**
 * Cả 3 breakdown theo area (hoặc market = chính nó + các con) trong MỘT lần quét nights
 * — per_listing CTE gom theo listing rồi group tiếp theo bucket phòng ngủ / room type / top.
 */
export async function getAreaBreakdown(areaId: string): Promise<AreaBreakdown> {
  const { rows } = await pool.query(
    `WITH scope AS (
       SELECT id FROM areas WHERE id = $1 OR parent_id = $1
     ), per_listing AS (
       SELECT l.id, l.name, l.bedrooms, l.room_type,
              count(*) FILTER (WHERE NOT n.available) AS booked,
              count(*) FILTER (WHERE n.available) AS avail,
              COALESCE(sum(n.price) FILTER (WHERE NOT n.available), 0) AS revenue
       FROM nights n
       JOIN listings l ON l.id = n.listing_id
       WHERE l.area_id IN (SELECT id FROM scope)
       GROUP BY l.id, l.name, l.bedrooms, l.room_type
     ), beds AS (
       SELECT CASE
                WHEN bedrooms IS NULL THEN 'N/A'
                WHEN bedrooms = 0 THEN 'Studio'
                WHEN bedrooms >= 4 THEN '4+'
                ELSE bedrooms::text
              END AS label,
              count(*) AS listings,
              sum(revenue) AS revenue,
              sum(revenue) / NULLIF(sum(booked), 0) AS adr,
              sum(booked)::numeric / NULLIF(sum(booked) + sum(avail), 0) AS occupancy
       FROM per_listing GROUP BY 1
     ), rtypes AS (
       SELECT COALESCE(room_type, 'N/A') AS label,
              count(*) AS listings,
              sum(revenue) AS revenue,
              sum(revenue) / NULLIF(sum(booked), 0) AS adr,
              sum(booked)::numeric / NULLIF(sum(booked) + sum(avail), 0) AS occupancy
       FROM per_listing GROUP BY 1
     ), tops AS (
       SELECT id, name, bedrooms, room_type, revenue,
              revenue / NULLIF(booked, 0) AS adr,
              booked::numeric / NULLIF(booked + avail, 0) AS occupancy
       FROM (SELECT * FROM per_listing ORDER BY revenue DESC LIMIT 8) x
     )
     SELECT
       (SELECT json_agg(row_to_json(b) ORDER BY array_position(ARRAY['Studio','1','2','3','4+','N/A'], b.label))
        FROM beds b) AS bedrooms,
       (SELECT json_agg(row_to_json(r) ORDER BY r.revenue DESC NULLS LAST) FROM rtypes r) AS room_types,
       (SELECT json_agg(row_to_json(t) ORDER BY t.revenue DESC) FROM tops t) AS top_listings`,
    [areaId],
  );

  const r = rows[0] ?? {};
  const withShare = (arr: unknown[]): BreakdownRow[] => {
    const total = arr.reduce<number>(
      (s, x) => s + Number((x as { revenue: string | number }).revenue ?? 0),
      0,
    );
    return arr.map((x) => {
      const b = x as Record<string, string | number | null>;
      return {
        label: String(b.label),
        listings: Number(b.listings ?? 0),
        revenue: Number(b.revenue ?? 0),
        adr: b.adr === null || b.adr === undefined ? null : Number(b.adr),
        occupancy: b.occupancy === null || b.occupancy === undefined ? null : Number(b.occupancy),
        share: total > 0 ? Number(b.revenue ?? 0) / total : 0,
      };
    });
  };
  return {
    bedrooms: withShare(r.bedrooms ?? []),
    roomTypes: withShare(r.room_types ?? []),
    topListings: (r.top_listings ?? []).map((x: Record<string, string | number | null>) => ({
      id: String(x.id),
      name: x.name === null || x.name === undefined ? null : String(x.name),
      bedrooms: x.bedrooms === null || x.bedrooms === undefined ? null : Number(x.bedrooms),
      roomType: x.room_type === null || x.room_type === undefined ? null : String(x.room_type),
      adr: x.adr === null || x.adr === undefined ? null : Number(x.adr),
      occupancy: x.occupancy === null || x.occupancy === undefined ? null : Number(x.occupancy),
      revenue: Number(x.revenue ?? 0),
    })),
  };
}

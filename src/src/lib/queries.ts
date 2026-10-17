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
              ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.002)) AS geojson,
              ST_Y(ST_Centroid(geom)) AS lat, ST_X(ST_Centroid(geom)) AS lng
       FROM areas WHERE parent_id = $1
     ), agg AS (
       SELECT mm.area_id, max(mm.listing_count) AS listings, sum(mm.revenue) AS revenue
       FROM market_metrics mm
       WHERE mm.area_id IN (SELECT id FROM kids)
       GROUP BY 1
     ), lm AS (
       -- tháng mới nhất CÓ adr (tháng cuối window thường chưa có booking)
       SELECT DISTINCT ON (area_id) area_id, adr, occupancy, revpar
       FROM market_metrics
       WHERE area_id IN (SELECT id FROM kids) AND adr IS NOT NULL
       ORDER BY area_id, month DESC
     )
     SELECT k.id, k.name, k.lat, k.lng, k.geojson,
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
      slug: slugifyName(r.name),
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

// ---------- P2: supply growth (từ stg discovery snapshots) ----------

export type SupplyPoint = {
  snapshotId: string;
  date: string;
  seen: number; // listings snapshot thấy
  newVsPrev: number; // id mới so với snapshot trước đó
};

/**
 * Lịch sử discovery theo city + tổng unique từng thấy.
 * Lưu ý trung thực: search-paging xáo trộn giữa các lần chạy → new/removed
 * là "mới xuất hiện/không còn thấy", không hẳn listing mới thật.
 */
export async function getSupplyHistory(
  marketAreaId: string,
): Promise<{ points: SupplyPoint[]; cumulative: number } | null> {
  const city = marketAreaId.split("-").slice(1).join("-"); // 'vn-hanoi' → 'hanoi'
  const { rows } = await pool.query(
    `SELECT d.snapshot_id,
            to_char(min(a.collected_at), 'YYYY-MM-DD HH24:MI') AS date,
              array_agg(DISTINCT d.listing_id) AS ids
     FROM stg_abnb_discovery d JOIN airbnb_snapshots a ON a.snapshot_id = d.snapshot_id
     WHERE a.city = $1
     GROUP BY d.snapshot_id ORDER BY min(a.collected_at)`,
    [city],
  );
  if (rows.length === 0) return null;
  // đơn giản hoá: tính new bằng JS để tránh SQL rối
  const seen = new Set<string>();
  const points: SupplyPoint[] = [];
  for (const r of rows) {
    const ids: string[] = r.ids ?? [];
    let fresh = 0;
    for (const id of ids) if (!seen.has(id)) fresh++;
    ids.forEach((i) => seen.add(i));
    points.push({
      snapshotId: r.snapshot_id,
      date: r.date,
      seen: ids.length,
      newVsPrev: fresh,
    });
  }
  return { points, cumulative: seen.size };
}

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
       -- tháng mới nhất CÓ adr (tháng cuối window thường chưa có booking)
       SELECT DISTINCT ON (mm.area_id) mm.area_id, mm.adr, mm.occupancy, mm.revpar
       FROM market_metrics mm JOIN kids k ON k.id = mm.area_id
       WHERE mm.adr IS NOT NULL
       ORDER BY mm.area_id, mm.month DESC
     )
     SELECT k.id, k.name, agg.listings, agg.revenue, lm.adr, lm.occupancy, lm.revpar
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
    slug: slugifyName(r.name),
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
 * Đọc 3 breakdown từ bảng cache area_breakdowns (precompute bởi
 * pipeline/sql/400_breakdowns.sql) — không quét nights runtime.
 */
export async function getAreaBreakdown(areaId: string): Promise<AreaBreakdown> {
  const { rows } = await pool.query(
    `SELECT kind, label, payload FROM area_breakdowns WHERE area_id = $1`,
    [areaId],
  );
  const beds: Record<string, unknown>[] = [];
  const rtypes: Record<string, unknown>[] = [];
  const tops: Record<string, unknown>[] = [];
  for (const r of rows) {
    const p = r.payload as Record<string, string | number | null>;
    const row = { label: r.label, ...p };
    if (r.kind === "bedrooms") beds.push(row);
    else if (r.kind === "roomTypes") rtypes.push(row);
    else if (r.kind === "topListings") tops.push(row);
  }
  const order = ["Studio", "1", "2", "3", "4+", "N/A"];
  beds.sort((a, b) => order.indexOf(String(a.label)) - order.indexOf(String(b.label)));
  rtypes.sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0));
  tops.sort((a, b) => Number(b.revenue ?? 0) - Number(a.revenue ?? 0));

  const withShare = (arr: Record<string, unknown>[]): BreakdownRow[] => {
    const total = arr.reduce<number>((s, x) => s + Number(x.revenue ?? 0), 0);
    return arr.map((b) => ({
      label: String(b.label),
      listings: Number(b.listings ?? 0),
      revenue: Number(b.revenue ?? 0),
      adr: b.adr === null || b.adr === undefined ? null : Number(b.adr),
      occupancy: b.occupancy === null || b.occupancy === undefined ? null : Number(b.occupancy),
      share: total > 0 ? Number(b.revenue ?? 0) / total : 0,
    }));
  };
  return {
    bedrooms: withShare(beds),
    roomTypes: withShare(rtypes),
    topListings: tops.map((x) => ({
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

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

export type SearchEntry = {
  id: string;
  kind: "market" | "submarket";
  name: string;
  parentName: string | null;
  slug: string; // ASCII, dùng cho tìm kiếm không dấu
  href: string;
};

/** Chỉ mục tìm kiếm ⌘K: mọi market + submarket, đường dẫn theo slug tên. */
export async function getSearchIndex(): Promise<SearchEntry[]> {
  const { rows } = await pool.query(
    `SELECT a.id, a.region_type, a.name, a.parent_id, p.name AS parent_name
     FROM areas a LEFT JOIN areas p ON p.id = a.parent_id
     WHERE a.region_type IN ('market', 'submarket')
     ORDER BY a.region_type, a.name`,
  );
  return rows.map((r) => {
    const marketId: string = r.parent_id ?? r.id;
    const [country, ...rest] = marketId.split("-");
    const marketPath = `/${country}/${rest.join("-")}`;
    const slug = slugifyName(r.name);
    const isMarket = r.region_type === "market";
    return {
      id: r.id,
      kind: isMarket ? "market" : "submarket",
      name: r.name,
      parentName: r.parent_name,
      slug,
      href: isMarket ? marketPath : `${marketPath}/${slug}`,
    };
  });
}

export type MetricRow = {
  month: string; // YYYY-MM-DD
  listingCount: number;
  revenue: number;
  adr: number | null;
  occupancy: number | null;
  revpar: number | null;
  bookedNights: number;
  availableNights: number;
};

export async function getMetrics(areaId: string): Promise<MetricRow[]> {
  const { rows } = await pool.query(
    `SELECT month::text, listing_count, revenue, adr, occupancy, revpar,
            booked_nights, available_nights
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
    bookedNights: Number(r.booked_nights ?? 0),
    availableNights: Number(r.available_nights ?? 0),
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

/**
 * Benchmark so với các submarket anh em trên CẢ cửa sổ dữ liệu (mirror
 * metric_percentiles). Không dùng tháng mới nhất: dữ liệu là lịch tương lai nên
 * tháng xa nhất gần như chưa có booking.
 */
export async function getSiblingBenchmark(areaId: string) {
  const q = `
    WITH win AS (
      SELECT mm.area_id,
             sum(mm.revenue) / nullif(sum(mm.booked_nights), 0) AS adr,
             sum(mm.booked_nights)::numeric
               / nullif(sum(mm.booked_nights) + sum(mm.available_nights), 0) AS occupancy
      FROM market_metrics mm
      JOIN areas a ON a.id = mm.area_id
      WHERE a.parent_id = (SELECT parent_id FROM areas WHERE id = $1)
      GROUP BY mm.area_id
    )
    SELECT
      -- ADR = 0: có đêm đặt nhưng chưa có giá — loại khỏi phân vị.
      percentile_cont(array[0.3, 0.6, 0.9]) WITHIN GROUP (ORDER BY adr)
        FILTER (WHERE adr > 0) AS adr_p,
      percentile_cont(array[0.3, 0.6, 0.9]) WITHIN GROUP (ORDER BY occupancy)
        FILTER (WHERE occupancy IS NOT NULL) AS occ_p,
      count(*) AS n,
      max(adr) FILTER (WHERE area_id = $1) AS my_adr,
      max(occupancy) FILTER (WHERE area_id = $1) AS my_occ
    FROM win`;
  const { rows } = await pool.query(q, [areaId]);
  const r = rows[0];
  if (!r || !r.adr_p || Number(r.n) < 3) return null;
  return {
    nSiblings: Number(r.n),
    adr: { p: (r.adr_p as number[]).map(Number), mine: r.my_adr === null ? null : Number(r.my_adr) },
    occ: { p: (r.occ_p as number[]).map(Number), mine: r.my_occ === null ? null : Number(r.my_occ) },
  };
}

export type SiblingBenchmark = NonNullable<Awaited<ReturnType<typeof getSiblingBenchmark>>>;

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

/** Bảng xếp hạng submarket con của một market — đọc từ market_metrics (đã precompute).
 * sortBy: revenue (12 tháng) | adr | occupancy | revpar (tháng mới nhất có adr). */
export async function getTopSubmarkets(
  marketId: string,
  limit = 10,
  sortBy: "revenue" | "adr" | "occupancy" | "revpar" = "revenue",
): Promise<TopSubmarket[]> {
  const order =
    sortBy === "revenue"
      ? `agg.revenue DESC NULLS LAST`
      : sortBy === "adr"
        ? `lm.adr DESC NULLS LAST`
        : sortBy === "occupancy"
          ? `lm.occupancy DESC NULLS LAST`
          : `lm.revpar DESC NULLS LAST`;
  const { rows } = await pool.query(
    `WITH kids AS (
       SELECT id, name FROM areas WHERE parent_id = $1
     ), agg AS (
       SELECT mm.area_id, max(mm.listing_count) AS listings, sum(mm.revenue) AS revenue
       FROM market_metrics mm
       WHERE mm.area_id IN (SELECT id FROM kids)
       GROUP BY 1
     ), lm AS (
       SELECT DISTINCT ON (mm.area_id) mm.area_id, mm.adr, mm.occupancy, mm.revpar
       FROM market_metrics mm
       WHERE mm.area_id IN (SELECT id FROM kids) AND mm.adr IS NOT NULL
       ORDER BY mm.area_id, mm.month DESC
     )
     SELECT k.id, k.name, agg.listings, agg.revenue, lm.adr, lm.occupancy, lm.revpar
     FROM agg
     JOIN lm USING (area_id)
     JOIN kids k ON k.id = agg.area_id
     ORDER BY ${order}
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

// ---------- G0-d: chi tiết 1 listing ----------

export type ListingDetail = {
  id: string;
  name: string | null;
  roomType: string | null;
  bedrooms: number | null;
  accommodates: number | null;
  priceListed: number | null;
  lat: number | null;
  lng: number | null;
  areaId: string | null;
  areaName: string | null;
  marketPath: string | null; // vd "/vn/hanoi"
  currency: string;
  stats: { nights: number; booked: number; revenue: number; occupancy: number | null };
  calendar: { night: string; available: boolean | null }[];
};

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const { rows } = await pool.query(
    `SELECT l.*, a.name AS area_name, a.id AS area_id,
            p.id AS parent_id
     FROM listings l
     LEFT JOIN areas a ON a.id = l.area_id
     LEFT JOIN areas p ON p.id = a.parent_id
     WHERE l.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;

  const { rows: nightRows } = await pool.query(
    `SELECT night::text, available,
            count(*) OVER () AS total,
            count(*) FILTER (WHERE NOT available) OVER () AS booked,
            COALESCE(sum(price) FILTER (WHERE NOT available) OVER (), 0) AS revenue
     FROM nights WHERE listing_id = $1 ORDER BY night`,
    [id],
  );
  const stats = nightRows[0]
    ? {
        nights: Number(nightRows[0].total),
        booked: Number(nightRows[0].booked),
        revenue: Number(nightRows[0].revenue),
        occupancy:
          Number(nightRows[0].total) > 0
            ? Number(nightRows[0].booked) / Number(nightRows[0].total)
            : null,
      }
    : { nights: 0, booked: 0, revenue: 0, occupancy: null };

  const areaId = r.area_id as string | null;
  let marketPath: string | null = null;
  if (areaId) {
    const parts = areaId.split("-");
    marketPath = `/${parts[0]}/${parts.slice(1).join("-")}`;
  }

  return {
    id: r.id,
    name: r.name,
    roomType: r.room_type,
    bedrooms: r.bedrooms,
    accommodates: r.accommodates,
    priceListed: r.price_listed === null ? null : Number(r.price_listed),
    lat: r.latitude === null ? null : Number(r.latitude),
    lng: r.longitude === null ? null : Number(r.longitude),
    areaId,
    areaName: r.area_name,
    marketPath,
    currency: currencyFor(areaId ?? r.id),
    stats,
    calendar: nightRows.map((n) => ({ night: n.night, available: n.available })),
  };
}

// ---------- G1: asset stats + yield ----------

export type YieldRow = {
  areaId: string;
  name: string;
  slug: string;
  nSale: number;
  medianPerm2: number | null; // VND/m²
  nRentLt: number;
  medianRentLt: number | null; // VND/tháng
  strRevenueMonth: number | null; // từ market_metrics tháng mới nhất có adr
  yieldStr: number | null; // (strRevenueMonth × 12) / (medianPerm2 × 60m²) — giả định 60m²
  yieldLt: number | null; // (medianRentLt × 12) / (medianPerm2 × 60m²)
};

/** Yield theo submarket — kết hợp market_asset_stats (bán/thuê) + market_metrics (STR). */
export async function getYieldRows(marketId: string): Promise<YieldRow[]> {
  const { rows } = await pool.query(
    `WITH sales AS (
       SELECT area_id, n_offers, median_perm2 FROM market_asset_stats WHERE kind = 'sale'
     ), rents AS (
       SELECT area_id, n_offers, median_rent FROM market_asset_stats WHERE kind = 'rent_lt'
     ), lm AS (
       SELECT DISTINCT ON (area_id) area_id, adr, occupancy, listing_count
       FROM market_metrics WHERE adr IS NOT NULL ORDER BY area_id, month DESC
     )
     SELECT a.id, a.name, s.n_offers AS n_sale, s.median_perm2,
            r.n_offers AS n_rent_lt, r.median_rent,
            lm.adr * lm.listing_count AS str_revenue_month,
            lm.listing_count
     FROM areas a
     LEFT JOIN sales s ON s.area_id = a.id
     LEFT JOIN rents r ON r.area_id = a.id
     LEFT JOIN lm ON lm.area_id = a.id
     WHERE a.parent_id = $1 AND (s.area_id IS NOT NULL OR r.area_id IS NOT NULL)
     ORDER BY s.median_perm2 DESC NULLS LAST`,
    [marketId],
  );
  return rows.map((r) => {
    const slug = slugifyName(r.name);
    const ASSUMED_M2 = 60; // giả định căn hộ 60m² để tính yield
    const salePrice = r.median_perm2 ? Number(r.median_perm2) * ASSUMED_M2 : null;
    const strMonth = r.str_revenue_month ? Number(r.str_revenue_month) : null;
    const rentLt = r.median_rent ? Number(r.median_rent) : null;
    return {
      areaId: r.id,
      name: r.name,
      slug,
      nSale: Number(r.n_sale ?? 0),
      medianPerm2: r.median_perm2 === null ? null : Number(r.median_perm2),
      nRentLt: Number(r.n_rent_lt ?? 0),
      medianRentLt: r.median_rent === null ? null : Number(r.median_rent),
      strRevenueMonth: strMonth,
      yieldStr: salePrice && strMonth ? (strMonth * 12) / salePrice : null,
      yieldLt: salePrice && rentLt ? (rentLt * 12) / salePrice : null,
    };
  });
}

// ---------- G2: AirDNA đối chiếu ----------
// CHỈ dùng trong Ops Portal (/ops/quality) — AirDNA là nguồn hiệu chuẩn, không
// hiển thị cho nhà đầu tư (CLAUDE.md "Don't", IA rủi ro R1).

export type AirdnaMarketRow = {
  airdnaId: string;
  name: string;
  score: number | null;
  ourAreaId: string | null;
  ourListings: number | null;
};

/** Danh sách market AirDNA toàn quốc + crosswalk sang khu vực của ta (chỉ Ops). */
export async function getAirdnaMarkets(): Promise<AirdnaMarketRow[]> {
  const { rows } = await pool.query(
    `SELECT am.airdna_id, am.name,
            s.total AS score,
            -- Crosswalk qua area_sources (chính xác), fallback fuzzy
            COALESCE(
              (SELECT x.area_id FROM area_sources x
               WHERE x.source = 'airdna' AND x.source_area_key = am.airdna_id
               LIMIT 1),
              (SELECT a.id FROM areas a
               WHERE a.country_code = 'vn' AND a.region_type = 'market'
                 AND (translate(lower(a.name), 'àáảãạăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooouuuuuuuuuuuuyyyyyd')
                   = translate(lower(am.name), 'àáảãạăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooouuuuuuuuuuuuyyyyyd')
                 )
               LIMIT 1)
            ) AS our_area_id,
            (SELECT mm.listing_count FROM market_metrics mm
             WHERE mm.area_id = COALESCE(
               (SELECT x.area_id FROM area_sources x
                WHERE x.source = 'airdna' AND x.source_area_key = am.airdna_id LIMIT 1),
               (SELECT a.id FROM areas a WHERE a.country_code='vn' AND a.region_type='market'
                 AND translate(lower(a.name), 'àáảãạăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooouuuuuuuuuuuuyyyyyd')
                   = translate(lower(am.name), 'àáảãạăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộùúủũụưừứửữựỳýỷỹỵđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiioooooooooooouuuuuuuuuuuuyyyyyd')
                 LIMIT 1))
             ORDER BY mm.month DESC LIMIT 1) AS our_listings
     FROM airdna_markets am
     LEFT JOIN airdna_scores s ON s.airdna_id = am.airdna_id
     ORDER BY s.total DESC NULLS LAST, am.name`,
  );
  return rows.map((r) => ({
    airdnaId: r.airdna_id,
    name: r.name,
    score: r.score === null ? null : Number(r.score),
    ourAreaId: r.our_area_id,
    ourListings: r.our_listings === null ? null : Number(r.our_listings),
  }));
}


export type AirdnaComparison = {
  marketScore: { total: number; seasonality: number; revenueGrowth: number; regulation: number; rentalDemand: number } | null;
  metrics: {
    metric: string;
    ourValue: number | null;
    ourUnit: string;
    airdnaValue: number | null;
    airdnaUnit: string;
    ratio: number | null; // our / airdna
  }[];
  submarketCount: number;
  capturedAt: string | null;
};

export async function getAirdnaComparison(areaId: string): Promise<AirdnaComparison | null> {
  // Crosswalk: areaId → airdna_id
  const { rows: xw } = await pool.query(
    `SELECT source_area_key FROM area_sources WHERE area_id = $1 AND source = 'airdna' LIMIT 1`,
    [areaId],
  );
  const airdnaId = xw[0]?.source_area_key;
  if (!airdnaId) return null;

  const { rows: scores } = await pool.query(
    `SELECT * FROM airdna_scores WHERE airdna_id = $1`, [airdnaId],
  );
  const { rows: airdnaMetrics } = await pool.query(
    `SELECT metric, period, value FROM airdna_market_metrics
     WHERE airdna_id = $1 AND period = (SELECT max(period) FROM airdna_market_metrics WHERE airdna_id = $1 AND metric = 'adr')
     ORDER BY metric`, [airdnaId],
  );
  // Số tự thu gộp CẢ cửa sổ (có trọng số đêm), không lấy tháng cuối: dữ liệu là
  // lịch tương lai nên tháng xa nhất gần như chưa có booking.
  const { rows: ourMetrics } = await pool.query(
    `SELECT sum(revenue) / nullif(sum(booked_nights), 0) AS adr,
            sum(booked_nights)::numeric
              / nullif(sum(booked_nights) + sum(available_nights), 0) AS occupancy,
            max(listing_count) AS listing_count
     FROM market_metrics WHERE area_id = $1`, [areaId],
  );
  const { rows: subCount } = await pool.query(
    `SELECT count(*) n FROM airdna_submarket_metrics WHERE airdna_market_id = $1`, [airdnaId],
  );

  const ours = ourMetrics[0] ?? {};
  const byMetric = new Map(airdnaMetrics.map(m => [m.metric, Number(m.value)]));

  const metrics = [
    {
      metric: "ADR",
      ourValue: ours.adr !== null && ours.adr !== undefined ? Number(ours.adr) : null,
      ourUnit: "VND",
      airdnaValue: byMetric.get("adr") ?? null,
      airdnaUnit: "VND", // user đã đổi AirDNA sang VND — cùng đơn vị
      ratio: null as number | null,
    },
    {
      metric: "Occupancy",
      ourValue: ours.occupancy !== null && ours.occupancy !== undefined ? Number(ours.occupancy) : null,
      ourUnit: "%",
      airdnaValue: byMetric.get("occupancy") ?? null,
      airdnaUnit: "%",
      ratio: null as number | null,
    },
    {
      metric: "Listings",
      ourValue: ours.listing_count ? Number(ours.listing_count) : null,
      ourUnit: "",
      airdnaValue: byMetric.get("listing_count") ?? null,
      airdnaUnit: "",
      ratio: null as number | null,
    },
  ];
  for (const m of metrics) {
    const av = m.airdnaValue ?? 0;
    if (m.ourValue !== null && av > 0) {
      if (m.ourUnit === "%" && m.airdnaUnit === "%") {
        // occupancy: both as decimal (0-1) — normalize
        const o = m.ourValue > 1 ? m.ourValue / 100 : m.ourValue;
        const a = av > 1 ? av / 100 : av;
        m.ratio = a > 0 ? o / a : null;
      } else {
        m.ratio = m.ourValue / av; // same unit (VND or count) — direct
      }
    }
  }

  const score = scores[0];
  return {
    marketScore: score ? {
      total: Number(score.total),
      seasonality: Number(score.seasonality),
      revenueGrowth: Number(score.revenue_growth),
      regulation: Number(score.regulation),
      rentalDemand: Number(score.rental_demand),
    } : null,
    metrics,
    submarketCount: Number(subCount[0]?.n ?? 0),
    capturedAt: score?.captured_at?.toISOString?.() ?? null,
  };
}

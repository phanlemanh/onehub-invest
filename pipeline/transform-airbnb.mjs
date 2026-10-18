// transform-airbnb.mjs — staging Airbnb → canonical (areas + listings + nights)
// Mọi suy diễn nằm ở đây (staging giữ nguyên vẹn):
//  - area: title discovery "Căn hộ tại Quận Hoàn Kiếm" → submarket; market MARKET_PREFIX
//  - listings: pdpSections (lat/lng, capacity, roomType, giá VND) + ogTitle (bedrooms)
//  - nights: stg_abnb_nights snapshot mới nhất per listing (price NULL — divergence
//    cùng mô hình Bangkok: giá niêm yết từ price_listed)
import pg from "pg";

const CITY = process.argv[2] ?? 'hanoi';
const MARKET_PREFIX = CITY === 'hcmc' ? 'vn-hcmc' : 'vn-hanoi';
const MARKET_NAME = CITY === 'hcmc' ? 'Hồ Chí Minh' : 'Hà Nội';
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseVnd = (s) => {
  if (!s) return null;
  const digits = String(s).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
};

const parseBedrooms = (ogTitle) => {
  const m = String(ogTitle ?? "").match(/(\d+)\s*phòng\s*ngủ/i);
  if (m) return Number(m[1]);
  if (/studio/i.test(String(ogTitle))) return 0;
  return null;
};

/** Lấy giá/lat/lng/... từ payload pdpSections của 1 listing. */
function extractListing(payload) {
  const pdp = payload?.pdpSections;
  if (!pdp) return null;
  const node = pdp?.data?.node ?? {};
  const sections = pdp?.data?.presentation?.stayProductDetailPage?.sections ?? {};
  const meta = sections?.metadata ?? {};
  const log = meta?.loggingContext?.eventDataLogging ?? {};
  const ogTitle =
    meta?.seoFeatures?.ogTags?.ogTitle?.content?.localizedString ??
    meta?.sharingConfig?.title ??
    null;
  // structuredDisplayPrice nằm trong sections.sections[] — lấy section đầu có giá.
  // Hai variant: primaryLine.discountedPrice hoặc chỉ primaryLine.price/priceString.
  let priceListed = null;
  for (const s of sections?.sections ?? []) {
    const line = s?.section?.structuredDisplayPrice?.primaryLine;
    const raw =
      line?.discountedPrice ?? line?.price ?? line?.priceString ?? line?.originalPrice ?? null;
    if (raw) {
      priceListed = parseVnd(raw);
      break;
    }
  }
  if (priceListed === null) {
    // Fallback cuối: chuỗi giá VND đầu tiên trong toàn payload (primary price)
    const m = String(JSON.stringify(pdp)).match(/"(?:discountedPrice|priceString|price)":"([\d.,\s]+)₫/);
    if (m) priceListed = parseVnd(m[1]);
  }
  return {
    name: node?.pdpPresentation?.overview?.title ?? ogTitle,
    roomType: log.roomType ?? null,
    personCapacity: node.personCapacity ?? null,
    lat: node?.location?.coordinate?.latitude ?? null,
    lng: node?.location?.coordinate?.longitude ?? null,
    bedrooms: parseBedrooms(ogTitle),
    priceListed,
  };
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    // ---- 0. Discovery mới nhất: listing_id → location (từ title) ----
    const { rows: disc } = await client.query(
      `SELECT DISTINCT ON (listing_id) listing_id, title
       FROM stg_abnb_discovery WHERE snapshot_id LIKE '${CITY}__%' ORDER BY listing_id, snapshot_id DESC`,
    );
    const locationOf = new Map();
    for (const d of disc) {
      const m = String(d.title ?? "").match(/tại\s+(.+?)(?:,|$)/);
      if (m) locationOf.set(d.listing_id, m[1].trim());
    }
    const locations = [...new Set([...locationOf.values()])].sort();
    console.log(`discovery: ${disc.length} refs, ${locationOf.size} có vị trí, ${locations.length} khu vực duy nhất`);

    // ---- 1. Areas: market vn-hanoi + submarket theo location ----
    await client.query(
      `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
       VALUES ('${MARKET_PREFIX}', NULL, 'market', '${MARKET_NAME}', 'vn', '{"source":"airbnb-discovery"}'::jsonb)
       ON CONFLICT (id) DO NOTHING`,
    );
    for (const loc of locations) {
      await client.query(
        `INSERT INTO areas (id, parent_id, region_type, name, country_code, meta)
         VALUES ($1, '${MARKET_PREFIX}', 'submarket', $2, 'vn', $3)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [`vn-hanoi-${slugify(loc)}`, loc, JSON.stringify({ source: "airbnb-discovery" })],
      );
    }
    console.log(`areas: 1 market + ${locations.length} submarket`);

    // ---- 2. Canonical listings (snapshot pdp mới nhất per listing) ----
    const { rows: stg } = await client.query(
      `SELECT DISTINCT ON (listing_id) listing_id, fetched_at, payload
       FROM stg_abnb_listings WHERE snapshot_id LIKE '${CITY}__%' ORDER BY listing_id, snapshot_id DESC`,
    );
    let nListings = 0;
    let missingField = 0;
    for (const r of stg) {
      const ex = extractListing(r.payload);
      if (!ex) continue;
      const loc = locationOf.get(r.listing_id);
      const areaId = loc ? `${MARKET_PREFIX}-${slugify(loc)}` : null;
      const id = `abnb_${r.listing_id}`;
      await client.query(
        `INSERT INTO listings (id, area_id, name, room_type, bedrooms, accommodates,
                               price_listed, latitude, longitude, last_seen)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           area_id = COALESCE(EXCLUDED.area_id, listings.area_id),
           name = EXCLUDED.name, room_type = EXCLUDED.room_type,
           bedrooms = EXCLUDED.bedrooms, accommodates = EXCLUDED.accommodates,
           price_listed = EXCLUDED.price_listed,
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           last_seen = EXCLUDED.last_seen`,
        [
          id,
          areaId,
          ex.name,
          ex.roomType,
          ex.bedrooms,
          ex.personCapacity,
          ex.priceListed,
          ex.lat,
          ex.lng,
          new Date(r.fetched_at).toISOString().slice(0, 10),
        ],
      );
      nListings++;
      const filled = [ex.name, ex.roomType, ex.personCapacity, ex.lat, ex.priceListed].filter(
        (x) => x !== null && x !== undefined,
      ).length;
      if (filled < 4) missingField++;
    }
    console.log(
      `listings: ${nListings} chuẩn hoá (thiếu ≥2 trường chính: ${missingField})`,
    );

    // ---- 3. Nights: snapshot mới nhất per listing → canonical nights ----
    const { rowCount: nNights } = await client.query(
      `INSERT INTO nights (listing_id, night, available, price)
       SELECT DISTINCT ON (n.listing_id, n.night)
              'abnb_' || n.listing_id, n.night, n.available,
              l.price_listed
       FROM stg_abnb_nights n
       JOIN listings l ON l.id = 'abnb_' || n.listing_id
       WHERE NOT EXISTS (SELECT 1 FROM nights x WHERE x.listing_id = 'abnb_' || n.listing_id)
       ORDER BY n.listing_id, n.night, n.snapshot_id DESC
       ON CONFLICT (listing_id, night) DO NOTHING`,
    );
    console.log(`nights: +${nNights ?? 0} dòng mới`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

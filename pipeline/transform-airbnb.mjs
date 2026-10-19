// transform-airbnb.mjs — staging Airbnb → canonical (listings + nights)
// Mọi suy diễn nằm ở đây (staging giữ nguyên vẹn):
//  - area: phường OSM chứa tọa độ listing (point-in-polygon, G0-b) — không theo title
//  - listings: pdpSections (lat/lng, capacity, roomType, giá VND) + ogTitle (bedrooms)
//  - nights: stg_abnb_nights snapshot mới nhất per listing (price NULL — divergence
//    cùng mô hình Bangkok: giá niêm yết từ price_listed)
import pg from "pg";

const CITY = process.argv[2] ?? 'hanoi';
const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

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
    // ---- 1. Phường OSM (reassign-areas.mjs upsert) — area_id suy từ TỌA ĐỘ ----
    // Không tin title discovery ("Căn hộ tại Quận Tây Hồ"): title dùng tên quận cũ,
    // tên tỉnh, cả tỉnh lân cận → area trùng/ngoài tỉnh (G0-b).
    const { rows: [{ n: nPhuong }] } = await client.query(
      `SELECT count(*)::int n FROM areas
       WHERE country_code = 'vn' AND meta->>'source' = 'osm-phuong' AND geom IS NOT NULL`,
    );
    if (nPhuong === 0) {
      throw new Error("chưa có phường OSM — chạy `node reassign-areas.mjs` trước");
    }
    const phuongOf = async (lat, lng) => {
      if (lat === null || lng === null) return null;
      const { rows } = await client.query(
        `SELECT id FROM areas
         WHERE region_type = 'submarket' AND country_code = 'vn'
           AND meta->>'source' = 'osm-phuong'
           AND ST_Covers(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
         ORDER BY ST_Area(geom), id LIMIT 1`,
        [lng, lat],
      );
      return rows[0]?.id ?? null;
    };

    // ---- 2. Canonical listings (snapshot pdp mới nhất per listing) ----
    const { rows: stg } = await client.query(
      `SELECT DISTINCT ON (listing_id) listing_id, fetched_at, payload
       FROM stg_abnb_listings WHERE snapshot_id LIKE '${CITY}__%' ORDER BY listing_id, snapshot_id DESC`,
    );
    let nListings = 0;
    let missingField = 0;
    let outside = 0;
    for (const r of stg) {
      const ex = extractListing(r.payload);
      if (!ex) continue;
      const id = `abnb_${r.listing_id}`;
      const areaId = await phuongOf(ex.lat, ex.lng);
      if (!areaId) {
        // ngoài mọi phường đã có polygon (ngoài tỉnh) / thiếu tọa độ → không vào canonical
        await client.query(`DELETE FROM listings WHERE id = $1`, [id]);
        outside++;
        continue;
      }
      await client.query(
        `INSERT INTO listings (id, area_id, name, room_type, bedrooms, accommodates,
                               price_listed, latitude, longitude, last_seen)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO UPDATE SET
           area_id = EXCLUDED.area_id,
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
      `listings: ${nListings} chuẩn hoá (thiếu ≥2 trường chính: ${missingField}; ngoài mọi phường — bỏ: ${outside})`,
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

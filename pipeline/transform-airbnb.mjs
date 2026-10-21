// transform-airbnb.mjs — staging Airbnb → canonical (listings + nights)
// Mọi suy diễn nằm ở đây (staging giữ nguyên vẹn):
//  - area: phường OSM chứa tọa độ listing (point-in-polygon, G0-b) — không theo title
//  - listings: pdpSections (lat/lng, capacity, roomType, giá VND) + ogTitle (bedrooms)
//  - nights: stg_abnb_nights snapshot mới nhất per listing (price NULL — divergence
//    cùng mô hình Bangkok: giá niêm yết từ price_listed; đêm cũ còn NULL được lấp lại)
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
  // Ảnh + review (E2 B1): URL CDN muscache có sẵn trong raw — unique theo
  // path, bỏ query (kích thước render thêm ?im_w=), giữ thứ tự xuất hiện,
  // cover = phần tử đầu. reviewCount: số review của listing.
  // Chỉ giữ ảnh căn hộ: loại avatar (user/), asset platform & AI-review.
  // Ưu tiên hosting/Hosting-<id> (ảnh do chủ nhà đăng) lên đầu.
  const rawAll = JSON.stringify(payload);
  const seenPath = new Set();
  const all = [];
  for (const m of rawAll.matchAll(/(a0\.muscache\.com\/im\/pictures\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+){2,6})(?:\?[^"]*)?/g)) {
    let p = m[1].replace(/\/$/, "");
    if (/\/(user|AirbnbPlatformAssets)(\/|$)/.test(p)) continue;
    // Airbnb CDN trả 404 với path KHÔNG có đuôi file (ảnh vỡ toàn trang
    // listing — backfill 2026-10-21). Regex trên bắt path trần; gốc HTML
    // có đuôi .jpeg/.jpg — regex mở rộng bắt cả đuôi, thiếu thì mặc định
    // .jpeg (chuẩn im/pictures/hosting).
    const withExt = rawAll.includes(p + ".jpeg") ? p + ".jpeg" : null;
    p = withExt ?? (/\.(jpe?g|png|webp)$/i.test(p) ? p : p + ".jpeg");
    if (!seenPath.has(p)) {
      seenPath.add(p);
      all.push(p);
    }
  }
  const photos = [...all.filter((p) => p.includes("/hosting/")), ...all.filter((p) => !p.includes("/hosting/"))].slice(0, 10);
  const reviewCount = Number(rawAll.match(/"reviewCount":(\d+)/)?.[1] ?? 0) || null;
  // Tên THẬT do host đặt nằm ở DemandStayListing.description.name.source —
  // overview.title chỉ là template "Toàn bộ căn hộ cho thuê tại…" (backfill
  // 2026-10-21: 8/8 payload có tên thật ở path này).
  const realName = rawAll.match(
    /"description":\s*\{\s*"name":\s*\{\s*"source":\s*"([^"]{4,150})"/,
  )?.[1];
  return {
    name: realName ?? node?.pdpPresentation?.overview?.title ?? ogTitle,
    roomType: log.roomType ?? null,
    personCapacity: node.personCapacity ?? null,
    lat: node?.location?.coordinate?.latitude ?? null,
    lng: node?.location?.coordinate?.longitude ?? null,
    bedrooms: parseBedrooms(ogTitle),
    priceListed,
    photos,
    reviewCount,
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
                               price_listed, latitude, longitude, last_seen,
                               photo_urls, review_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO UPDATE SET
           area_id = EXCLUDED.area_id,
           name = EXCLUDED.name, room_type = EXCLUDED.room_type,
           bedrooms = EXCLUDED.bedrooms, accommodates = EXCLUDED.accommodates,
           price_listed = EXCLUDED.price_listed,
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           last_seen = EXCLUDED.last_seen,
           photo_urls = EXCLUDED.photo_urls,
           review_count = EXCLUDED.review_count`,
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
          ex.photos.length ? JSON.stringify(ex.photos) : null,
          ex.reviewCount,
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

    // ---- 4. Lấp giá đêm còn NULL bằng price_listed hiện tại ----
    // Bước 3 chỉ nạp nights cho listing CHƯA có đêm nào, nên đêm nạp lúc listing chưa
    // bóc được giá sẽ kẹt NULL mãi (2026-10: 64k/80k đêm Hà Nội) → ADR/RevPAR bị pha
    // loãng vì revenue thiếu giá mà booked_nights vẫn đếm. Chỉ lấp NULL, không ghi đè giá đã có.
    const { rowCount: nFilled } = await client.query(
      `UPDATE nights n SET price = l.price_listed
       FROM listings l
       WHERE l.id = n.listing_id
         AND n.price IS NULL AND l.price_listed IS NOT NULL`,
    );
    console.log(`nights: lấp giá ${nFilled ?? 0} đêm còn NULL từ price_listed`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

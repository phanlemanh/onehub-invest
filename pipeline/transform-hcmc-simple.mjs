import pg from "pg";
import { ganPhuongTheoToaDo, slugify } from "./lib/osm.mjs";

const client = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
await client.connect();

// 1. Lấy staging listings HCMC (mới nhất per listing)
const { rows: stg } = await client.query(
  `SELECT DISTINCT ON (listing_id) listing_id, fetched_at, payload
   FROM stg_abnb_listings WHERE snapshot_id LIKE 'hcmc__%'
   ORDER BY listing_id, snapshot_id DESC`
);
console.log(`staging: ${stg.length}`);

// 2. Insert listings với area_id = 'vn-hcmc' (market itself, sẽ reassign sau)
let n = 0, fail = 0;
for (const r of stg) {
  const pdp = r.payload?.pdpSections;
  if (!pdp) { fail++; continue; }
  const node = pdp?.data?.node ?? {};
  const sections = pdp?.data?.presentation?.stayProductDetailPage?.sections ?? {};
  const meta = sections?.metadata ?? {};
  const log = meta?.loggingContext?.eventDataLogging ?? {};
  const ogTitle = meta?.seoFeatures?.ogTags?.ogTitle?.content?.localizedString ?? null;

  // price
  let priceListed = null;
  for (const s of sections?.sections ?? []) {
    const line = s?.section?.structuredDisplayPrice?.primaryLine;
    if (line?.discountedPrice ?? line?.price) {
      const raw = line.discountedPrice ?? line.price;
      const digits = String(raw).replace(/[^\d]/g, "");
      priceListed = digits ? Number(digits) : null;
      break;
    }
  }

  const id = `abnb_${r.listing_id}`;
  try {
    await client.query(
      `INSERT INTO listings (id, area_id, name, room_type, bedrooms, accommodates,
                             price_listed, latitude, longitude, last_seen)
       VALUES ($1, 'vn-hcmc', $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, room_type = EXCLUDED.room_type,
         price_listed = EXCLUDED.price_listed,
         latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude`,
      [id, node?.pdpPresentation?.overview?.title ?? ogTitle, log.roomType ?? null,
       null, node.personCapacity ?? null, priceListed,
       node?.location?.coordinate?.latitude ?? null,
       node?.location?.coordinate?.longitude ?? null,
       new Date(r.fetched_at).toISOString().slice(0, 10)]
    );
    // nights
    const months = r.payload?.calendar?.data?.node?.pdpAvailabilityCalendar?.calendarMonths ?? [];
    for (const m of months) {
      for (const d of m.days ?? []) {
        if (!d.calendarDate) continue;
        await client.query(
          `INSERT INTO nights (listing_id, night, available, price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (listing_id, night) DO NOTHING`,
          [id, d.calendarDate, d.available ?? null, priceListed]
        );
      }
    }
    n++;
  } catch (e) { fail++; }
}
console.log(`listings: ${n} OK, ${fail} fail`);

// 3. Point-in-polygon reassign — chỉ vào phường hợp lệ (bỏ khu vực lạc), hàm dùng chung của lib/osm.mjs
const assigned = await ganPhuongTheoToaDo(client, "vn-hcmc");
console.log(`reassigned to phường: ${assigned}`);
await client.end();

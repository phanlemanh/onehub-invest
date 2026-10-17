// import-airbnb.mjs — nạp snapshot từ one-invest-collector theo DATA-CONTRACT
// (docs/DATA-CONTRACT.md schemaVersion 1): verify sha256 từng file trước khi parse,
// payload listing giữ nguyên vẹn vào stg_abnb_listings, calendar bung thành
// stg_abnb_nights (PdpCalendarDay). Không chuẩn hoá gì khác — transform lo phần còn lại.
//
// Dùng: node import-airbnb.mjs <đường-dẫn-snapshot-dir>
//   (vd: ../one-invest-collector/snapshots/hanoi/hanoi__airbnb-listing__2026…)
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error("thiếu tham số: node import-airbnb.mjs <snapshot-dir>");
    process.exit(1);
  }
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  if (manifest.schemaVersion !== 1) {
    throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ`);
  }

  // 1. Verify checksum từng file (quy tắc tiêu thụ #2 của DATA-CONTRACT)
  for (const f of manifest.files) {
    const buf = await readFile(join(dir, f.name));
    const sha = createHash("sha256").update(buf).digest("hex");
    if (sha !== f.sha256) throw new Error(`checksum sai: ${f.name}`);
  }
  console.log(`manifest ok: ${manifest.snapshotId} (${manifest.files.length} file đã verify)`);

  // 2. Đọc items
  const items = [];
  for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
    items.push(...JSON.parse(gunzipSync(await readFile(join(dir, f.name))).toString("utf8")));
  }

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (snapshot_id) DO UPDATE SET manifest = EXCLUDED.manifest`,
      [
        manifest.snapshotId,
        manifest.city,
        manifest.source,
        manifest.finishedAt,
        JSON.stringify(manifest),
      ],
    );

    let listings = 0;
    let nights = 0;
    for (const it of items) {
      if (it.source !== "airbnb-listing") continue;
      await client.query(
        `INSERT INTO stg_abnb_listings (listing_id, snapshot_id, fetched_at, payload)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (listing_id, snapshot_id) DO UPDATE SET payload = EXCLUDED.payload`,
        [it.sourceId, manifest.snapshotId, it.fetchedAt, JSON.stringify(it.payload)],
      );
      listings++;

      // bung PdpAvailabilityCalendar → stg_abnb_nights
      const months =
        it.payload?.calendar?.data?.node?.pdpAvailabilityCalendar?.calendarMonths ?? [];
      const values = [];
      const params = [];
      let p = 0;
      for (const m of months) {
        for (const d of m.days ?? []) {
          if (!d.calendarDate) continue;
          params.push(it.sourceId, manifest.snapshotId, d.calendarDate, d.available ?? null, d.minNights ?? null);
          values.push(`($${++p},$${++p},$${++p},$${++p},$${++p})`);
        }
      }
      if (values.length) {
        await client.query(
          `INSERT INTO stg_abnb_nights (listing_id, snapshot_id, night, available, min_nights)
           VALUES ${values.join(",")}
           ON CONFLICT (listing_id, snapshot_id, night) DO NOTHING`,
          params,
        );
        nights += values.length;
      }
    }
    await client.query("COMMIT");
    console.log(`đã nạp: ${listings} listings, ${nights} đêm (nights)`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

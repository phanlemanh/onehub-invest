// import-airbnb.mjs — nạp snapshot từ one-invest-collector theo DATA-CONTRACT
// (collector/docs/DATA-CONTRACT.md schemaVersion 1–2): verify sha256 từng file trước khi parse.
// v2 chỉ thêm file media/* + RawItem.meta.mediaFiles — items đọc y như v1.
// - airbnb-listing items → stg_abnb_listings (payload nguyên vẹn) + stg_abnb_nights
// - airbnb-discovery items → stg_abnb_discovery (title là nguồn suy ra area)
//
// Dùng: node import-airbnb.mjs <đường-dẫn-snapshot-dir>
//   (vd: ../collector/snapshots/hanoi/hanoi__airbnb-listing__2026…)
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
  // Orphan: crash giữa write items và finalize → dir không có manifest.
  // Skip + warn (không nạp, không ném) để một dir mồ côi không gãy cả finalize.
  if (!existsSync(join(dir, "manifest.json"))) {
    console.warn(`bỏ qua snapshot mồ côi (thiếu manifest): ${dir}`);
    process.exit(0);
  }
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  // v2 (N1 media Zalo) giữ nguyên hình dạng v1, chỉ thêm media/* — media chưa nạp ở đây
  if (![1, 2].includes(manifest.schemaVersion)) {
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
    let discovery = 0;
    let osm = 0;
    let zalo = 0;
    for (const it of items) {
      if (it.source === "zalo-mock" || it.source === "zalo-groups" || it.source === "zalo-agent") {
        await client.query(
          `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, author_hash, posted_at, text,
                                       sender_name, sender_id, conversation_id, media, agent_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
           ON CONFLICT (post_id) DO UPDATE SET text = EXCLUDED.text, captured_at = now(),
             sender_name = COALESCE(EXCLUDED.sender_name, stg_zalo_posts.sender_name),
             sender_id = COALESCE(EXCLUDED.sender_id, stg_zalo_posts.sender_id),
             conversation_id = COALESCE(EXCLUDED.conversation_id, stg_zalo_posts.conversation_id),
             media = COALESCE(EXCLUDED.media, stg_zalo_posts.media),
             agent_id = COALESCE(EXCLUDED.agent_id, stg_zalo_posts.agent_id)`,
          [
            it.sourceId,
            manifest.snapshotId,
            it.payload?.group ?? null,
            it.payload?.author ?? it.payload?.agent_id ?? null,
            it.fetchedAt,
            it.payload?.text ?? "",
            it.payload?.senderName ?? null,
            it.payload?.senderId ?? null,
            it.payload?.conversationId ?? null,
            JSON.stringify(it.payload?.media ?? null),
            it.payload?.agent_id ?? null,
          ],
        );
        zalo++;
      } else if (it.source === "airbnb-listing") {
        await client.query(
          `INSERT INTO stg_abnb_listings (listing_id, snapshot_id, fetched_at, payload)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (listing_id, snapshot_id) DO UPDATE SET payload = EXCLUDED.payload`,
          [it.sourceId, manifest.snapshotId, it.fetchedAt, JSON.stringify(it.payload)],
        );
        listings++;

        const months =
          it.payload?.calendar?.data?.node?.pdpAvailabilityCalendar?.calendarMonths ?? [];
        const values = [];
        const params = [];
        let p = 0;
        for (const m of months) {
          for (const d of m.days ?? []) {
            if (!d.calendarDate) continue;
            params.push(
              it.sourceId,
              manifest.snapshotId,
              d.calendarDate,
              d.available ?? null,
              d.minNights ?? null,
            );
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
      } else if (it.source === "airbnb-discovery") {
        await client.query(
          `INSERT INTO stg_abnb_discovery (listing_id, snapshot_id, title, href, price_label, fetched_at)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (listing_id, snapshot_id) DO NOTHING`,
          [
            it.sourceId,
            manifest.snapshotId,
            it.payload?.title ?? null,
            it.payload?.href ?? null,
            it.payload?.price ?? null,
            it.fetchedAt,
          ],
        );
        discovery++;
      } else if (it.source === "osm-boundaries") {
        await client.query(
          `INSERT INTO stg_osm_boundaries (osm_id, snapshot_id, name, payload)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (osm_id, snapshot_id) DO NOTHING`,
          [it.sourceId, manifest.snapshotId, it.meta?.name ?? null, JSON.stringify(it.payload)],
        );
        osm++;
      }
    }
    await client.query("COMMIT");
    console.log(
      `đã nạp: ${listings} listings (+${nights} đêm), ${discovery} discovery refs, ${osm} osm boundaries, ${zalo} zalo posts`,
    );
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

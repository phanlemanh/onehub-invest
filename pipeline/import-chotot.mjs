// import-chotot.mjs — nạp snapshot chotot-ads vào stg_chotot_ads (S06).
// Theo DATA-CONTRACT như import-airbnb: verify sha256 từng file trước khi parse.
// stg giữ trạng thái MỚI NHẤT per list_id (upsert); lịch sử giá nằm trong
// raw snapshot bất biến — trend query join theo snapshot_id.
//
// Dùng: node import-chotot.mjs <snapshot-dir> | node import-chotot.mjs --latest
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { join } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function latestSnapshotDir() {
  const root = process.argv[3] ?? join(process.cwd(), "collector", "snapshots");
  const dirs = [];
  for (const city of await readdir(root)) {
    const cityPath = join(root, city);
    if (!existsSync(join(cityPath))) continue;
    for (const d of await readdir(cityPath)) {
      if (d.includes("__chotot-ads__") && existsSync(join(cityPath, d, "manifest.json"))) {
        dirs.push({ dir: join(cityPath, d), mtime: (await readFile(join(cityPath, d, "manifest.json"))).length, path: join(cityPath, d) });
      }
    }
  }
  if (dirs.length === 0) throw new Error("không tìm thấy snapshot chotot-ads nào");
  // Chọn theo tên snapshotId mới nhất (timestamp trong tên, sort chuỗi ổn)
  dirs.sort((a, b) => b.path.localeCompare(a.path));
  return [dirs[0].dir];
}

async function readSnapshot(dir) {
  const manifest = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"));
  if (manifest.schemaVersion !== 1) throw new Error(`schemaVersion ${manifest.schemaVersion} chưa hỗ trợ`);
  for (const f of manifest.files) {
    const buf = await readFile(join(dir, f.name));
    const sha = createHash("sha256").update(buf).digest("hex");
    if (sha !== f.sha256) throw new Error(`checksum sai: ${f.name}`);
  }
  const items = [];
  for (const f of manifest.files.filter((f) => f.name.startsWith("items-"))) {
    items.push(...JSON.parse(gunzipSync(await readFile(join(dir, f.name))).toString("utf8")));
  }
  return { manifest, items: items.filter((i) => i.source === "chotot-ads") };
}

async function importDir(client, dir) {
  const { manifest, items } = await readSnapshot(dir);
  console.log(`manifest ok: ${manifest.snapshotId} — ${items.length} items`);

  await client.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (snapshot_id) DO UPDATE SET manifest = EXCLUDED.manifest`,
    [manifest.snapshotId, manifest.city, manifest.source, manifest.finishedAt, JSON.stringify(manifest)],
  );

  let n = 0;
  for (const it of items) {
    const a = it.payload;
    await client.query(
      `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, subject,
                                    price, price_string, size_m2, rooms, toilets, house_type,
                                    area_name, ward_name, ward_name_v3, latitude, longitude,
                                    list_time, seller, images, payload, snapshot_id, captured_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT (list_id) DO UPDATE SET
         price = EXCLUDED.price, price_string = EXCLUDED.price_string,
         size_m2 = EXCLUDED.size_m2, subject = EXCLUDED.subject,
         ward_name = EXCLUDED.ward_name, ward_name_v3 = EXCLUDED.ward_name_v3,
         seller = EXCLUDED.seller, images = EXCLUDED.images,
         payload = EXCLUDED.payload, snapshot_id = EXCLUDED.snapshot_id, captured_at = now()`,
      [
        a.list_id, a.region_v2 ?? it.meta?.region_v2, it.meta?.city ?? a.region_name,
        a.category ?? it.meta?.cg, a.type ?? it.meta?.st, a.subject ?? null,
        a.price ?? null, a.price_string ?? null, a.size ?? null,
        a.rooms ?? null, a.toilets ?? null, a.house_type ?? null,
        a.area_name ?? null, a.ward_name ?? null, a.ward_name_v3 ?? null,
        a.latitude ?? null, a.longitude ?? null,
        a.list_time ? new Date(a.list_time).toISOString() : null,
        JSON.stringify({ full_name: a.full_name ?? null, company_ad: a.company_ad ?? null, ...(a.seller_info ?? {}) }),
        JSON.stringify({ images: a.images ?? [], thumbnails: a.image_thumbnails ?? [] }),
        JSON.stringify(a), manifest.snapshotId, it.fetchedAt,
      ],
    );
    n++;
  }
  console.log(`✅ ${n} ads → stg_chotot_ads`);
  return n;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const dirs = process.argv[2] === "--latest" ? await latestSnapshotDir() : [process.argv[2]];
    for (const d of dirs) await importDir(client, d);
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });

// backfill-fb-media.mjs — chạy MỘT LẦN: bù ảnh cho posts FB đã thu khi
// collector còn đọc field `images` (không tồn tại) thay vì `attachments`.
// Nguồn ảnh: các dataset Apify cũ còn lưu (list runs SUCCEEDED gần nhất),
// match stg_zalo_posts theo text (mỗi post text là key đủ duyên duy nhất),
// update cột media. Idempotent: chỉ update khi stg đang rỗng media.
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const API = "https://api.apify.com/v2";
const ACTOR = "apify~facebook-groups-scraper";
const MAX_RUNS = 15;

async function token() {
  const { readFile } = await import("node:fs/promises");
  const { homedir } = await import("node:os");
  const { join } = await import("node:path");
  const env = await readFile(join(homedir(), ".oneinvest/cloud.env"), "utf8");
  const t = env.match(/APIFY_TOKEN=(\S+)/)?.[1];
  if (!t) throw new Error("thiếu APIFY_TOKEN");
  return t;
}

const postImages = (p) =>
  (p.attachments ?? [])
    .map((a) => {
      if (a?.thumbnail) return a.thumbnail;
      const u = a?.url ?? "";
      return /\.(jpe?g|png|webp)(\?|$)/i.test(u) ? u : null;
    })
    .filter(Boolean)
    .slice(0, 5);

async function main() {
  const t = await token();
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const runs = (await (await fetch(`${API}/acts/${ACTOR}/runs?token=${t}&status=SUCCEEDED&limit=${MAX_RUNS}`)).json()).data.items ?? [];
    console.log(`runs SUCCEEDED: ${runs.length}`);

    let matched = 0, updated = 0;
    for (const run of runs) {
      const posts = await (await fetch(`${API}/datasets/${run.defaultDatasetId}/items?token=${t}&clean=true&format=json`)).json();
      for (const p of posts) {
        const text = p.text ?? "";
        const urls = postImages(p);
        if (!text || urls.length === 0) continue;
        matched++;
        const media = JSON.stringify(urls.map((url) => ({ path: null, url, type: "image/jpeg" })));
        const r = await c.query(
          `UPDATE stg_zalo_posts
           SET media = $1::jsonb
           WHERE agent_id = 'apify-facebook' AND text = $2
             AND (media IS NULL OR media = 'null'::jsonb OR media = '[]'::jsonb)`,
          [media, text],
        );
        updated += r.rowCount ?? 0;
      }
    }
    console.log(`posts Apify có ảnh: ${matched} → update stg: ${updated}`);
  } finally {
    await c.end();
  }
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });

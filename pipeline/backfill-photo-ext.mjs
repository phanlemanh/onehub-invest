// backfill-photo-ext.mjs — chạy MỘT LẦN: sửa 4.749 URL ảnh trong
// listings.photo_urls thiếu đuôi file (Airbnb CDN cần .jpeg — không đuôi
// là 404, ảnh vỡ toàn bộ trang listing). Bảng airdna_listings đã có đuôi
// sẵn, chỉ bảng listings (tự thu Airbnb) bị.
//
// Với mỗi URL: thử thêm .jpeg → .jpg → .png (HEAD), URL sống thì ghi lại
// KÈM scheme https:// (DB cũ thiếu scheme làm img src thành relative),
// URL chết cả 3 đuôi thì bỏ. Concurrency 8, HEAD tiết kiệm băng thông.
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const EXTS = [".jpeg", ".jpg", ".png"];
const CONCURRENCY = 8;

const norm = (u) => (u.startsWith("http") ? u : `https://${u}`);

async function probe(url) {
  try {
    const r = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    return r.ok;
  } catch {
    return false;
  }
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT id, photo_urls FROM listings
       WHERE photo_urls IS NOT NULL AND jsonb_array_length(photo_urls) > 0`,
    );
    console.log(`listings cần xử lý: ${rows.length}`);

    let nOk = 0, nDead = 0, nFixed = 0, nDrop = 0;
    const queue = [...rows];
    async function worker() {
      while (queue.length > 0) {
        const row = queue.shift();
        const urls = row.photo_urls;
        const out = [];
        for (let u of urls) {
          if (typeof u !== "string" || !u) continue;
          u = u.trim();
          if (/\.(jpe?g|png|webp)$/i.test(u)) {
            out.push(norm(u)); // đã có đuôi — chỉ bổ scheme
            nOk++;
            continue;
          }
          let fixed = null;
          for (const ext of EXTS) {
            if (await probe(norm(u) + ext)) {
              fixed = norm(u) + ext;
              break;
            }
          }
          if (fixed) {
            out.push(fixed);
            nFixed++;
          } else {
            nDead++;
          }
        }
        if (out.length !== urls.length) nDrop += urls.length - out.length;
        await c.query(`UPDATE listings SET photo_urls = $1::jsonb WHERE id = $2`, [
          JSON.stringify(out),
          row.id,
        ]);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    console.log(`xong: giữ nguyên ${nOk}, thêm đuôi ${nFixed}, URL chết bỏ ${nDead}`);
  } finally {
    await c.end();
  }
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });

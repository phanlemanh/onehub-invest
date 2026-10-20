// airdna-rotate.mjs — chọn N market AirDNA VN cho phiên quét hôm nay (xoay
// vòng con trỏ, bỏ qua market thu trong --max-age-days gần nhất). In ra danh
// sách id phân cách dấu phẩy để AIRDNA_MARKETS=$(...) dùng ngay.
//   node airdna-rotate.mjs [--n 6] [--max-age-days 1] [--dry]
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const STATE = new URL("../collector/state/airdna-rotation.json", import.meta.url).pathname;

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt;
};
const N = flag("n", Number(process.env.AIRDNA_DAILY_MARKETS ?? 6));
const MAX_AGE = flag("max-age-days", 1);
const DRY = args.includes("--dry");

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  let cursor = 0;
  try {
    cursor = JSON.parse((await readFile(STATE, "utf8")).toString()).cursor ?? 0;
  } catch { /* chưa có state */ }
  try {
    const { rows } = await client.query(
      `SELECT airdna_id, captured_at FROM airdna_markets
        WHERE country_code = 'vn' ORDER BY airdna_id::int`,
    );
    await client.end();
    if (rows.length === 0) { console.error("không có market VN trong airdna_markets"); process.exit(1); }

    const cutoff = Date.now() - MAX_AGE * 86400000;
    const isFresh = (r) =>
      r.captured_at !== null && new Date(r.captured_at).getTime() > cutoff;

    // đi vòng tròn từ cursor, gom tới khi đủ N ứng viên (chưa thu gần đây)
    const picked = [];
    let i = cursor;
    for (let step = 0; step < rows.length && picked.length < N; step++) {
      const r = rows[i % rows.length];
      if (!isFresh(r)) picked.push(r.airdna_id);
      i++;
    }
    const nextCursor = rows.length ? i % rows.length : 0;
    if (!DRY) {
      await mkdir(dirname(STATE), { recursive: true });
      await writeFile(STATE, JSON.stringify({ cursor: nextCursor, updatedAt: new Date().toISOString(), lastPicked: picked }, null, 2));
    }
    console.log(picked.join(","));
    console.error(`rotation: cursor ${cursor} → ${nextCursor}, ${rows.length} markets, picked ${picked.length} (n=${N}, max-age=${MAX_AGE}d)`);
  } catch (e) {
    await client.end().catch(() => {});
    throw e;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

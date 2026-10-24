// restore-captured-at.mjs — 2410-1 bước (2): khôi phục captured_at của stg
// bị lượt nạp-lại-toàn-bộ đặt thành now() (đo 24/10: 2.832/4.092 dòng
// stg_zalo_posts = 07:52Z). Mốc đúng = thời điểm THU snapshot chứa post:
//   - stg_zalo_posts: snapshot_id KHÔNG bị upsert đổi → mốc = collected_at
//     của snapshot ĐẦU insert post (sớm nhất theo dõi được).
//   - stg_chotot_ads: snapshot_id BỊ upsert đè (bản mới) → chỉ khôi phục được
//     theo snapshot HIỆN TẠI (gần đúng; giới hạn ghi rõ ở dry-run).
// Mặc định --dry: chỉ đếm + 5 ví dụ. Chạy thật: --apply (phải HỎI claudedp
// trước khi chạy thật theo lời giao 2410-1).
//   node restore-captured-at.mjs [--dry] [--apply] [--table zalo|chotot|all]
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const APPLY = process.argv.includes("--apply");
const only = process.argv.includes("--table")
  ? process.argv[process.argv.indexOf("--table") + 1]
  : "all";

const client = new pg.Client({ connectionString: DB_URL });
await client.connect();

try {
  // stg_zalo_posts: mốc = collected_at của snapshot đầu (snapshot_id không đổi)
  const zalo = `
    SELECT count(*) AS n FROM stg_zalo_posts p
    JOIN airbnb_snapshots s ON s.snapshot_id = p.snapshot_id
    WHERE p.captured_at <> s.collected_at`;
  let rz; try { ({ rows: rz } = await client.query(zalo)); } catch (e) {
    if (e.code === "42P01") { console.log("[stg_zalo_posts] bảng không có trong DB — bỏ qua"); rz = [{ n: 0 }]; }
    else throw e;
  }
  console.log(`[stg_zalo_posts] ${rz[0].n} dòng sẽ được đặt lại = mốc snapshot đầu tiên chứa post`);
  const { rows: sz } = await client.query(`
    SELECT p.post_id, p.captured_at AS sai_hien_tai, s.collected_at AS moc_dung, p.snapshot_id
    FROM stg_zalo_posts p JOIN airbnb_snapshots s ON s.snapshot_id = p.snapshot_id
    WHERE p.captured_at <> s.collected_at ORDER BY p.post_id LIMIT 5`);
  for (const r of sz) console.log(`  vd ${r.post_id}: ${r.sai_hien_tai} → ${r.moc_dung} (${r.snapshot_id})`);

  // stg_chotot_ads: mốc = collected_at của snapshot HIỆN TẠI (giới hạn)
  let rc; try {
    ({ rows: rc } = await client.query(`
    SELECT count(*) AS n FROM stg_chotot_ads c
    JOIN airbnb_snapshots s ON s.snapshot_id = c.snapshot_id
    WHERE c.captured_at <> s.collected_at`));
  } catch (e) {
    if (e.code === "42P01") { console.log("[stg_chotot_ads] bảng không có trong DB — bỏ qua"); rc = [{ n: 0 }]; }
    else throw e;
  }
  console.log(`[stg_chotot_ads] ${rc[0].n} dòng sẽ được đặt lại = mốc snapshot HIỆN TẠI (giới hạn: snapshot_id bị upsert đè, mốc sớm nhất không truy được từ stg)`);

  if (!APPLY) {
    console.log("\n--dry: chưa đổi gì. Chạy thật: node restore-captured-at.mjs --apply (phải HỎI claudedp trước).");
  } else {
    if ((only === "all" || only === "zalo") && rz[0].n > 0) {
      const r = await client.query(`
        UPDATE stg_zalo_posts p SET captured_at = s.collected_at
        FROM airbnb_snapshots s WHERE s.snapshot_id = p.snapshot_id
          AND p.captured_at <> s.collected_at`);
      console.log(`[stg_zalo_posts] ĐÃ đổi ${r.rowCount} dòng`);
    }
    if ((only === "all" || only === "chotot") && rc[0].n > 0) {
      const r = await client.query(`
        UPDATE stg_chotot_ads c SET captured_at = s.collected_at
        FROM airbnb_snapshots s WHERE s.snapshot_id = c.snapshot_id
          AND c.captured_at <> s.collected_at`);
      console.log(`[stg_chotot_ads] ĐÃ đổi ${r.rowCount} dòng`);
    }
  }
} finally {
  await client.end();
}

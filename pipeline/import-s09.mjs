#!/usr/bin/env node
// import-s09.mjs — bộ nạp S09 (1411-8) vào stg_s09_item (097). Ba việc:
//   1. Chèn dòng airbnb_snapshots cho snapshot (city='vn', source='s09-du-an', manifest thật, ON CONFLICT DO
//      NOTHING) — stg_s09_item.snapshot_id có khoá ngoại.
//   2. Đọc items-*.json.gz của snapshot, gọi dongItemS09 (DA31, pipeline/lib/s09-du-an.mjs — DÙNG LẠI, không viết
//      lại) rồi chèn bằng CAU_CHEN_S09_ITEM. Nạp lại lần hai ghi 0 dòng mới (ON CONFLICT DO NOTHING).
//   3. In số dòng bỏ theo ba lý do: thiếu sourceId, kind lạ, chi tiết lỗi (dongItemS09 đếm sẵn).
// KHÔNG đọc item.meta hay manifest.notes làm dữ liệu — bản 13/11 có meta/notes bị sửa 12:16Z 13/11; payload không
// kiểm được vì mất sha256 gốc (lời Mạnh ghi kèm trong nháp DATA-CONTRACT S09). Khoá dự án là payload.chiTiet.data.id.
// KHÔNG chạy trên DB máy thu: lượt nạp máy thu là GIAO triển khai riêng (1411-9 — máy thu đã áp 097 04:29Z 14/11,
// bảng còn trống; chạy bộ nạp này trỏ DATABASE_URL máy thu là ghi dữ liệu thật ngay đêm đó).
//   node pipeline/import-s09.mjs <đường-thư-mục-snapshot-vn__s09-du-an__*>
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { CAU_CHEN_S09_ITEM, dongItemS09 } from "./lib/s09-du-an.mjs";

const CHAY_TRUC_TIEP =
  process.argv[1] && fileURLToPath(import.meta.url) === (await import("node:fs")).realpathSync(process.argv[1]);

async function napS09(thuMuc, db) {
  const manifest = JSON.parse(readFileSync(join(thuMuc, "manifest.json"), "utf8"));
  if (manifest.source !== "s09-du-an") throw new Error(`snapshot không phải s09-du-an: ${manifest.source}`);
  const snapshotId = manifest.snapshotId ?? basename(thuMuc);
  const client = new pg.Client({ connectionString: db });
  await client.connect();
  try {
    await client.query("BEGIN");
    // (1) dòng snapshot — FK của stg_s09_item
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (snapshot_id) DO NOTHING`,
      [snapshotId, manifest.city ?? "vn", manifest.source, manifest.finishedAt ?? null, JSON.stringify(manifest)],
    );
    // (2) đọc items, dựng dòng chung với DA31, chèn
    const items = readdirSync(thuMuc)
      .filter((f) => /^items-\d+\.json\.gz$/.test(f))
      .sort()
      .flatMap((f) => {
        const d = JSON.parse(gunzipSync(readFileSync(join(thuMuc, f))).toString("utf8"));
        return Array.isArray(d) ? d : d.items;
      });
    const { dong, bo } = dongItemS09(items, snapshotId);
    let ghi = 0;
    for (const d of dong) ghi += (await client.query(CAU_CHEN_S09_ITEM, [d.snapshot_id, d.source_id, d.kind, d.payload, d.fetched_at])).rowCount;
    await client.query("COMMIT");
    // (3) tổng kết: số dòng + số bỏ theo ba lý do
    console.log(`S09 nạp: ${ghi}/${dong.length} dòng (snapshot ${snapshotId}); bỏ ${bo["thieu-source-id"]} thiếu-source-id, ${bo["kind-la"]} kind-lạ, ${bo["chi-tiet-loi"]} chi-tiet-lỗi`);
    return { ghi, soDong: dong.length, bo, snapshotId };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export { napS09 };

if (CHAY_TRUC_TIEP) {
  const thuMuc = process.argv[2];
  if (!thuMuc) {
    console.error("import-s09: thiếu đường thư mục snapshot — node pipeline/import-s09.mjs <snapshot>");
    process.exit(2);
  }
  const db = process.env.DATABASE_URL;
  if (!db) {
    console.error("import-s09: thiếu DATABASE_URL");
    process.exit(2);
  }
  // Chốt chặn kiểu DANH SÁCH CHO PHÉP (1411-11/1411-8 MỞ LẠI(2) — danh sách cấm lọt khi viết URL khác đi:
  // postgresql://, ?sslmode=, host lạ). Chỉ chạy khi tên DB khớp ^oneinvest_suite_ (DB thử db-thu); DB khác
  // chỉ chạy khi có cờ tường minh --may-thu (dành cho GIAO triển khai nạp máy thu sau này — 1411-9).
  const tenDb = (() => { try { return decodeURIComponent(new URL(db.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
  const mayThu = process.argv.includes("--may-thu");
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb) && !mayThu) {
    console.error(`import-s09: từ chối DB '${tenDb || "(đọc được tên?)"}' — chỉ chạy DB thử oneinvest_suite_*; DB khác cần cờ --may-thu (GIAO triển khai riêng)`);
    process.exit(2);
  }
  napS09(thuMuc, db).catch((e) => {
    // pg ném AggregateError (message rỗng) khi localhost phân giải ra cả IPv6 lẫn IPv4 mà cả hai từ chối — in lỗi con.
    const loi = e.message || (e.errors ?? []).map((x) => x.message || x.code).filter(Boolean).join("; ") || e.code || String(e);
    console.error(`import-s09: ${loi}`);
    process.exit(1);
  });
}

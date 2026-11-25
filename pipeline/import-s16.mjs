#!/usr/bin/env node
// import-s16.mjs — bộ nạp S16 (claudedp-1711-6, DA33 nap-s16-vao-danh-ba bước 1d) vào bốn bảng
// stg_s16_* (migration 103). Ba việc:
//   1. Chèn MỘT dòng airbnb_snapshots cho snapshot với source='S16' (mẫu danh-ba-s16-that.mjs
//      ~120, claudedp-1711-7(2)(a)) — FK của bốn bảng stg_s16_*.
//   2. Đọc items-*.json.gz của snapshot, gọi ĐÚNG napS16(c, dongS16(items, snapshotId)) của
//      pipeline/lib/s16-danh-muc.mjs (eval E1/E2 của DA33 đo chính hàm đó — không tự viết câu
//      chèn, không đoán cột). Lượt hai cùng snapshot ghi 0 dòng mới (ON CONFLICT trong lib).
//   3. In SỐ ĐẾM đọc/nạp/bỏ theo lý do (thiếu-source-id, kind-lạ, csv-lỗi, jsonl-lỗi) — KHÔNG
//      in mã căn, khu_id, toa_id hay tên nguồn thật ra log (1711-7(2)(b)).
// KHÔNG chạy trên DB máy thu: áp 103 lên máy thu + lượt nạp thật là bước sau chữ ký Cổng
// Bằng chứng DA33, từ main (1711-6). Mặc định chỉ DB thử oneinvest_suite_*; --may-thu là cờ
// cho GIAO triển khai riêng.
//   node pipeline/import-s16.mjs <đường-thư-mục-snapshot-vn__s16-*__*>
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { NGUON_S16, dongS16, napS16 } from "./lib/s16-danh-muc.mjs";

const CHAY_TRUC_TIEP =
  process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);

async function napS16ThuMuc(thuMuc, db) {
  const manifest = JSON.parse(readFileSync(join(thuMuc, "manifest.json"), "utf8"));
  if (!String(manifest.source ?? "").startsWith("s16-")) {
    throw new Error(`snapshot không phải nguồn S16: ${manifest.source}`);
  }
  const snapshotId = manifest.snapshotId ?? basename(thuMuc);
  const items = readdirSync(thuMuc)
    .filter((f) => /^items-\d+\.json\.gz$/.test(f))
    .sort()
    .flatMap((f) => {
      const d = JSON.parse(gunzipSync(readFileSync(join(thuMuc, f))).toString("utf8"));
      return Array.isArray(d) ? d : d.items;
    });
  const client = new pg.Client({ connectionString: db });
  await client.connect();
  try {
    await client.query("BEGIN");
    // (1) dòng snapshot — FK của bốn bảng stg_s16_*; source='S16' đúng mẫu danh-ba (1711-7(2)(a))
    await client.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (snapshot_id) DO NOTHING`,
      [snapshotId, manifest.city ?? "vn", NGUON_S16, manifest.finishedAt ?? null, JSON.stringify(manifest)],
    );
    // (2) dòng stg qua đúng cặp hàm dùng chung của lib
    const kq = dongS16(items, snapshotId);
    const ghi = await napS16(client, kq);
    await client.query("COMMIT");
    // (3) tổng kết — CHỈ số đếm, không giá trị định danh (1711-7(2)(b))
    const tongGhi = ghi.item + ghi.khu + ghi.toa + ghi.can;
    console.log(
      `S16 nạp: item ${ghi.item}/${kq.item.length}, khu ${ghi.khu}/${kq.khu.length}, toà ${ghi.toa}/${kq.toa.length}, căn ${ghi.can}/${kq.can.length} ` +
      `(tổng ${tongGhi}/${kq.item.length + kq.khu.length + kq.toa.length + kq.can.length}; đọc ${items.length} items); ` +
      `bỏ ${kq.bo["thieu-source-id"]} thiếu-source-id, ${kq.bo["kind-la"]} kind-lạ, ${kq.bo["csv-loi"]} csv-lỗi, ${kq.bo["jsonl-loi"]} jsonl-lỗi`,
    );
    return { ghi, bo: kq.bo, soDoc: items.length, snapshotId };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export { napS16ThuMuc };

if (CHAY_TRUC_TIEP) {
  const thuMuc = process.argv[2];
  if (!thuMuc) {
    console.error("import-s16: thiếu đường thư mục snapshot — node pipeline/import-s16.mjs <snapshot>");
    process.exit(2);
  }
  const db = process.env.DATABASE_URL;
  if (!db) {
    console.error("import-s16: thiếu DATABASE_URL");
    process.exit(2);
  }
  // Chốt chặn DANH SÁCH CHO PHÉP (khuôn import-s09 1411-11): chỉ chạy khi tên DB khớp
  // ^oneinvest_suite_ (DB thử db-thu); DB khác chỉ khi cờ tường minh --may-thu (GIAO
  // triển khai riêng — áp máy thu là bước sau chữ ký Cổng Bằng chứng DA33, từ main).
  const tenDb = (() => { try { return decodeURIComponent(new URL(db.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
  const mayThu = process.argv.includes("--may-thu");
  if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb) && !mayThu) {
    console.error(`import-s16: từ chối DB '${tenDb || "(đọc được tên?)"}' — chỉ chạy DB thử oneinvest_suite_*; DB khác cần cờ --may-thu (GIAO triển khai riêng)`);
    process.exit(2);
  }
  napS16ThuMuc(thuMuc, db).catch((e) => {
    const loi = e.message || (e.errors ?? []).map((x) => x.message || x.code).filter(Boolean).join("; ") || e.code || String(e);
    console.error(`import-s16: ${loi}`);
    process.exit(1);
  });
}

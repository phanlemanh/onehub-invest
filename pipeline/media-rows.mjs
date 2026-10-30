// media-rows.mjs — NH1 `media-canonical-reso`: dựng dòng bảng `media` (RESO Media, migration 053) từ bảng nạp.
// Hàm thuần, không import pg: transform-media.mjs ghi DB, test app (tests/media-canonical.test.tsx) so trọn đầu ra của
// mediaRowsFromPosts với luật ghép đã ký buildOfferImages (app/src/lib/ops/review-media.ts, hồ sơ review-media-backend AC-5).
import { createHash } from "node:crypto";

// Chép nguyên hai regex của app/src/lib/ops/zalo-media.ts (route /api/zalo-media) — test «NH-AC-3 hai bản regex» so hai bản.
export const SNAPSHOT_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
export const MEDIA_FILE = /^media\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/** Phép đo chạm DB của NH1 chạy trên DB thử; DB `oneinvest` dùng chung chỉ được khi 053 đã áp (sau gộp). Trả lỗi hoặc null. */
export function chotDbThu(dbName, coBangMedia) {
  if (dbName === "oneinvest" && !coBangMedia) {
    return "DATABASE_URL trỏ DB oneinvest dùng chung khi chưa có bảng media — chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_media)";
  }
  return null;
}

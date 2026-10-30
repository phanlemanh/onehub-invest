// media-rows.mjs — NH1 `media-canonical-reso`: dựng dòng bảng `media` (RESO Media, migration 053) từ bảng nạp.
// Hàm thuần, không import pg: transform-media.mjs ghi DB, test app (tests/media-canonical.test.tsx) so trọn đầu ra của
// mediaRowsFromPosts với luật ghép đã ký buildOfferImages (app/src/lib/ops/review-media.ts, hồ sơ review-media-backend AC-5).
import { createHash } from "node:crypto";

// Chép nguyên hai regex của app/src/lib/ops/zalo-media.ts (route /api/zalo-media) — test «NH-AC-3 hai bản regex» so hai bản.
export const SNAPSHOT_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
export const MEDIA_FILE = /^media\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;

const record = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const list = (v) => (Array.isArray(v) ? v : []);

/** URL http(s) chuẩn hoá (`URL.href`, đúng như remoteImage của bên đọc); giá trị khác → null. */
export function httpUrl(v) {
  if (typeof v !== "string") return null;
  let u;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
}

/** `<snapshotId>/<file>` của một entry media_files đã tải được, null khi tải lỗi / thiếu file / tham số hỏng. */
export function localFile(entry, postSnapshot) {
  if (entry.error || typeof entry.file !== "string") return null;
  const snapshot = typeof entry.snapshotId === "string" ? entry.snapshotId : postSnapshot;
  if (typeof snapshot !== "string" || !SNAPSHOT_ID.test(snapshot) || snapshot.includes("..")) return null;
  if (!MEDIA_FILE.test(entry.file) || entry.file.includes("..")) return null;
  return `${snapshot}/${entry.file}`;
}

/** MediaKey: md5(offer_id | local_file ?? media_url) — ổn định qua các lượt nạp. */
export function mediaKey(offerId, local, url) {
  return createHash("md5").update(`${offerId}|${local ?? url}`).digest("hex");
}

const row = (offerId, source, originKey, url, order, local) => ({
  media_key: mediaKey(offerId, local, url),
  resource_record_key: offerId,
  originating_system_name: source,
  originating_system_resource_record_key: String(originKey),
  media_url: url,
  media_order: order,
  local_file: local,
});

/**
 * Dòng media của một tin S03/S05 từ các bài theo thứ tự post_ids — đúng luật ghép đã ký của buildOfferImages:
 * lượt 1 ảnh đã tải (URL gốc của chúng coi như đã có), lượt 2 URL gốc (entry không tải được rồi cột media cũ), không trùng.
 * Không cắt ở 12: trần là việc của bên đọc.
 */
export function mediaRowsFromPosts(offerId, source, posts) {
  const out = [];
  const seenLocal = new Set();
  const seenUrl = new Set();
  for (const p of posts) {
    for (const e of list(p.media_files).map(record)) {
      const local = localFile(e, p.snapshot_id);
      if (!local) continue;
      const url = httpUrl(e.url);
      if (url) seenUrl.add(url);
      if (seenLocal.has(local)) continue;
      seenLocal.add(local);
      out.push(row(offerId, source, p.post_id, url, out.length, local));
    }
  }
  for (const p of posts) {
    const remotes = [
      ...list(p.media_files).map(record).filter((e) => !localFile(e, p.snapshot_id)).map((e) => e.url),
      ...list(p.media).map((m) => record(m).url),
    ];
    for (const raw of remotes) {
      const url = httpUrl(raw);
      if (!url || seenUrl.has(url)) continue;
      seenUrl.add(url);
      out.push(row(offerId, source, p.post_id, url, out.length, null));
    }
  }
  return out;
}

/** Dòng media của một tin S06: mảng ảnh của dòng bảng nạp (`{images:[…]}` hoặc mảng), giữ thứ tự, bỏ trùng, chỉ http(s). */
export function mediaRowsFromAd(offerId, listId, images) {
  const arr = Array.isArray(images) ? images : list(record(images).images);
  const out = [];
  const seen = new Set();
  for (const raw of arr) {
    const url = httpUrl(raw);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(row(offerId, "S06", listId, url, out.length, null));
  }
  return out;
}

/** Phép đo chạm DB của NH1 chạy trên DB thử; DB `oneinvest` dùng chung chỉ được khi 053 đã áp (sau gộp). Trả lỗi hoặc null. */
export function chotDbThu(dbName, coBangMedia) {
  if (dbName === "oneinvest" && !coBangMedia) {
    return "DATABASE_URL trỏ DB oneinvest dùng chung khi chưa có bảng media — chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_media)";
  }
  return null;
}

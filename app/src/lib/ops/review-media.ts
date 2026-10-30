import type { User } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isAdmin } from "@/lib/ops-access";

import { snapshotMediaUrl } from "./zalo-media";

/**
 * Ảnh tin cho thẻ ở hàng duyệt /ops/review và hồ sơ tin của /ops/data-flow — người duyệt nhìn ảnh để quyết
 * (vd. E1 ghi «đất» mà ảnh là nhà 4 tầng). Ảnh tin chỉ cho admin, chỉ DB máy thu: bảng `media` không sync cloud
 * (URL ảnh S06 mang tên miền nguồn — tầng A).
 *
 * Nguồn: bảng `media` (053, RESO Media; NH1 media-canonical-reso) do pipeline/transform-media.mjs dựng mỗi đêm
 * cho S03, S05, S06 theo `media_order`:
 *   1. dòng có `local_file` — ảnh đã tải vào raw snapshot → qua /api/zalo-media
 *   2. dòng chỉ có `media_url` — URL gốc, fbcdn/zdn có hạn
 *   3. `evidence.*.image_url` của thẻ mẫu, đứng cuối
 * `buildOfferImages` (ghép từ bài) giữ làm thước đối chiếu: bên ghi dựng dòng media theo đúng luật của nó.
 */

export type ReviewImage = {
  src: string;
  origin: "local" | "remote";
  /** URL gốc có hạn (fbcdn S05, zdn S03) — hết hạn thì UI hiện trạng thái ảnh hỏng. */
  expiring: boolean;
};

/** Thẻ entity_match: Tin A/Tin B; thẻ agent_output: tin được bổ sung. */
export type ReviewMedia = {
  offer_a?: ReviewImage[];
  offer_b?: ReviewImage[];
  offer?: ReviewImage[];
};

export type PostMediaRow = {
  offer_id: string;
  snapshot_id: string | null;
  media: unknown;
  media_files: unknown;
};

export type ReviewMediaItem = { id: number; item_type: string; evidence: unknown };

/** Một dòng bảng `media` mà bên đọc cần, theo `media_order` của tin. */
export type MediaRow = { offer_id: string; media_url: string | null; local_file: string | null };

export type MediaRowQuery = (text: string, values: unknown[]) => Promise<{ rows: MediaRow[] }>;

export const MAX_IMAGES_PER_OFFER = 12;

const EXPIRING_HOST = /(^|\.)(fbcdn\.net|fbsbx\.com|zdn\.vn)$/i;

const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Chỉ nhận http(s) — `javascript:`, `data:`, đường tương đối… bị bỏ. */
function remoteImage(url: unknown): ReviewImage | null {
  if (typeof url !== "string") return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  return { src: u.href, origin: "remote", expiring: EXPIRING_HOST.test(u.hostname) };
}

/** URL local của một entry media_files, null khi tải lỗi / thiếu file / tham số hỏng. */
function localSrc(entry: Record<string, unknown>, postSnapshot: string | null): string | null {
  if (entry.error || typeof entry.file !== "string") return null;
  // snapshotId gắn lúc nạp (import-airbnb) — snapshot_id của dòng không đổi khi upsert.
  const snapshot = typeof entry.snapshotId === "string" ? entry.snapshotId : postSnapshot;
  return snapshot ? snapshotMediaUrl(snapshot, entry.file) : null;
}

/** Danh sách ảnh của một tin rao: local trước, rồi URL gốc; không trùng; tối đa 12. */
export function buildOfferImages(posts: PostMediaRow[], evidenceImageUrl?: unknown): ReviewImage[] {
  const out: ReviewImage[] = [];
  const seen = new Set<string>();
  const push = (img: ReviewImage | null) => {
    if (!img || seen.has(img.src) || out.length >= MAX_IMAGES_PER_OFFER) return;
    seen.add(img.src);
    out.push(img);
  };

  // Lượt 1 — file local; URL gốc của chúng đánh dấu đã có để lượt 2 không lặp.
  for (const post of posts) {
    for (const e of list(post.media_files).map(record)) {
      const src = localSrc(e, post.snapshot_id);
      if (!src) continue;
      push({ src, origin: "local", expiring: false });
      const orig = remoteImage(e.url);
      if (orig) seen.add(orig.src);
    }
  }
  // Lượt 2 — URL gốc: entry tải lỗi rồi cột media cũ, theo thứ tự post.
  for (const post of posts) {
    for (const e of list(post.media_files).map(record)) {
      if (!localSrc(e, post.snapshot_id)) push(remoteImage(e.url));
    }
    for (const m of list(post.media)) push(remoteImage(record(m).url));
  }
  push(remoteImage(evidenceImageUrl));
  return out;
}

/** `local_file` (`<snapshotId>/media/<tên>`) → URL /api/zalo-media; null khi khuôn hỏng. */
function localMediaSrc(localFile: string | null): string | null {
  if (!localFile) return null;
  const cut = localFile.indexOf("/");
  return cut > 0 ? snapshotMediaUrl(localFile.slice(0, cut), localFile.slice(cut + 1)) : null;
}

/** Danh sách ảnh của một tin từ dòng `media` (đã theo media_order): ảnh đã tải trước, rồi URL gốc; không trùng; tối đa 12. */
export function buildMediaImages(rows: MediaRow[], evidenceImageUrl?: unknown): ReviewImage[] {
  const out: ReviewImage[] = [];
  const seen = new Set<string>();
  const push = (img: ReviewImage | null) => {
    if (!img || seen.has(img.src) || out.length >= MAX_IMAGES_PER_OFFER) return;
    seen.add(img.src);
    out.push(img);
  };
  for (const r of rows) {
    const src = localMediaSrc(r.local_file);
    if (!src) continue;
    push({ src, origin: "local", expiring: false });
    const orig = remoteImage(r.media_url);
    if (orig) seen.add(orig.src);
  }
  for (const r of rows) if (!localMediaSrc(r.local_file)) push(remoteImage(r.media_url));
  push(remoteImage(evidenceImageUrl));
  return out;
}

const MEDIA_SQL = `
  SELECT resource_record_key AS offer_id, media_url, local_file
  FROM media
  WHERE resource_record_key = ANY($1::text[])
  ORDER BY resource_record_key, media_order`;

const defaultMediaQuery: MediaRowQuery = (text, values) => pool.query<MediaRow>(text, values);

/** Dòng `media` của các tin, khoá theo offer_id, một truy vấn. Lỗi DB (kể cả 42P01 ở cloud) để người gọi quyết. */
export async function loadOfferMedia(offerIds: string[], query: MediaRowQuery = defaultMediaQuery): Promise<Map<string, MediaRow[]>> {
  const { rows } = await query(MEDIA_SQL, [offerIds]);
  const byOffer = new Map<string, MediaRow[]>();
  for (const r of rows) byOffer.set(r.offer_id, [...(byOffer.get(r.offer_id) ?? []), r]);
  return byOffer;
}

type Side = { key: keyof ReviewMedia; offerId: string; imageUrl: unknown };

function sidesOf(item: ReviewMediaItem): Side[] {
  const ev = record(item.evidence);
  if (item.item_type === "entity_match") {
    return (["offer_a", "offer_b"] as const).flatMap((key) => {
      const o = record(ev[key]);
      return typeof o.offer_id === "string" ? [{ key, offerId: o.offer_id, imageUrl: o.image_url }] : [];
    });
  }
  if (item.item_type === "agent_output" && typeof ev.offer_id === "string") {
    return [{ key: "offer", offerId: ev.offer_id, imageUrl: undefined }];
  }
  return [];
}

/**
 * Bản `evidence` gửi xuống client: bỏ `image_url` của từng bên. Ảnh tới thẻ chỉ qua
 * `loadReviewMedia` (chỉ admin) — để nguyên thì URL ảnh nằm trong dữ liệu trang của mọi role ops.
 */
export function stripEvidenceImages(evidence: unknown): Record<string, unknown> {
  const ev = { ...record(evidence) };
  for (const key of ["offer_a", "offer_b"]) {
    if (key in ev && ev[key] && typeof ev[key] === "object" && !Array.isArray(ev[key])) {
      const side = { ...record(ev[key]) };
      delete side.image_url;
      ev[key] = side;
    }
  }
  return ev;
}

/**
 * Ảnh cho từng thẻ, khoá theo `review_queue.id`. Một truy vấn cho cả hàng duyệt.
 * Không phải admin → `{}` (không chạm DB). DB thiếu bảng `media` (cloud) → `{}`.
 */
export async function loadReviewMedia(
  items: ReviewMediaItem[],
  user: User | null,
  query: MediaRowQuery = defaultMediaQuery,
): Promise<Record<number, ReviewMedia>> {
  if (!isAdmin(user)) return {};
  const plan = items.map((item) => ({ id: item.id, sides: sidesOf(item) })).filter((p) => p.sides.length > 0);
  if (plan.length === 0) return {};

  const offerIds = [...new Set(plan.flatMap((p) => p.sides.map((s) => s.offerId)))];
  let byOffer: Map<string, MediaRow[]>;
  try {
    byOffer = await loadOfferMedia(offerIds, query);
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") return {}; // undefined_table: cloud không có bảng media
    throw err;
  }

  const out: Record<number, ReviewMedia> = {};
  for (const { id, sides } of plan) {
    const media: ReviewMedia = {};
    for (const s of sides) media[s.key] = buildMediaImages(byOffer.get(s.offerId) ?? [], s.imageUrl);
    out[id] = media;
  }
  return out;
}

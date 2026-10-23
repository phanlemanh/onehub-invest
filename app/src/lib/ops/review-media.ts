import type { User } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isAdmin } from "@/lib/ops-access";

import { snapshotMediaUrl } from "./zalo-media";

/**
 * Ảnh tin cho thẻ ở hàng duyệt /ops/review — người duyệt nhìn ảnh để quyết
 * (vd. E1 ghi «đất» mà ảnh là nhà 4 tầng). Ảnh tin là PII tầng A (ADR-0007):
 * chỉ admin, chỉ DB local (`stg_zalo_posts` không sync cloud).
 *
 * Nguồn, theo thứ tự `sale_offers.post_ids`:
 *   1. `stg_zalo_posts.media_files` (035) — file N1 đã tải vào raw snapshot → qua /api/zalo-media
 *   2. `media_files[].url` lỗi tải + `stg_zalo_posts.media[].url` — URL gốc, fbcdn/zdn có hạn
 *   3. `evidence.*.image_url` (S06 Chợ Tốt, không có post)
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

type Query = (text: string, values: unknown[]) => Promise<{ rows: PostMediaRow[] }>;

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

const SQL = `
  SELECT o.offer_id, p.snapshot_id, p.media, p.media_files
  FROM sale_offers o
  CROSS JOIN LATERAL unnest(o.post_ids) WITH ORDINALITY AS u(post_id, ord)
  JOIN stg_zalo_posts p ON p.post_id = u.post_id
  WHERE o.offer_id = ANY($1::text[])
  ORDER BY o.offer_id, u.ord`;

const defaultQuery: Query = (text, values) => pool.query<PostMediaRow>(text, values);

/**
 * Ảnh cho từng thẻ, khoá theo `review_queue.id`. Một truy vấn cho cả hàng duyệt.
 * Không phải admin → `{}` (không chạm DB). DB thiếu `stg_zalo_posts` (cloud) → `{}`.
 */
export async function loadReviewMedia(
  items: ReviewMediaItem[],
  user: User | null,
  query: Query = defaultQuery,
): Promise<Record<number, ReviewMedia>> {
  if (!isAdmin(user)) return {};
  const plan = items.map((item) => ({ id: item.id, sides: sidesOf(item) })).filter((p) => p.sides.length > 0);
  if (plan.length === 0) return {};

  const offerIds = [...new Set(plan.flatMap((p) => p.sides.map((s) => s.offerId)))];
  let rows: PostMediaRow[];
  try {
    ({ rows } = await query(SQL, [offerIds]));
  } catch (err) {
    if ((err as { code?: string }).code === "42P01") return {}; // undefined_table: cloud không có stg_*
    throw err;
  }

  const posts = new Map<string, PostMediaRow[]>();
  for (const r of rows) posts.set(r.offer_id, [...(posts.get(r.offer_id) ?? []), r]);

  const out: Record<number, ReviewMedia> = {};
  for (const { id, sides } of plan) {
    const media: ReviewMedia = {};
    for (const s of sides) media[s.key] = buildOfferImages(posts.get(s.offerId) ?? [], s.imageUrl);
    out[id] = media;
  }
  return out;
}

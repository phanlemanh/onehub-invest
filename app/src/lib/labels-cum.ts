import type { PoolClient } from "pg"

import { refsCuaDong, type Ghep } from "./labels-anh"

type Q = Pick<PoolClient, "query">

export type BaiCum = { post_id: string; text: string | null; media: unknown; media_files: unknown; snapshot_id: string | null }

/** Các bài của một dòng mẫu đã ghép, bản thu mới nhất, đúng thứ tự `refsCuaDong`. Chỉ đọc chữ và cột ảnh ở stg: giữ gắn mù. */
export async function docBaiCum(q: Q, refId: string, g: Ghep | null): Promise<BaiCum[]> {
  const refs = refsCuaDong(refId, g)
  const { rows } = await q.query(
    `SELECT DISTINCT ON (post_id) post_id, text, media, media_files, snapshot_id
     FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [refs])
  const theoId = new Map((rows as BaiCum[]).map((r) => [r.post_id, r]))
  return refs.flatMap((id) => theoId.get(id) ?? [])
}

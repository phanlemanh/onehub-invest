import type { PoolClient } from "pg"

import { chuKhongLink, danhSachAnhCum, duongAnh, ghepHien, refsCuaDong, type Ghep } from "./labels-anh"

type Q = Pick<PoolClient, "query">

/** Người đăng (tên, ID tài khoản) và giờ đăng ở stg: định danh người bán tầng C, không phải giá trị máy đọc ra. */
type NguoiDangBai = { sender_name?: string | null; sender_id?: string | null; posted_at?: Date | string | null }

export type BaiCum = { post_id: string; text: string | null; media: unknown; media_files: unknown; snapshot_id: string | null } & NguoiDangBai

/** Các bài của một dòng mẫu đã ghép, bản thu mới nhất, đúng thứ tự `refsCuaDong`. Chỉ đọc chữ và cột ảnh ở stg: giữ gắn mù. */
export async function docBaiCum(q: Q, refId: string, g: Ghep | null): Promise<BaiCum[]> {
  const refs = refsCuaDong(refId, g)
  const { rows } = await q.query(
    `SELECT DISTINCT ON (post_id) post_id, text, media, media_files, snapshot_id, sender_name, sender_id, posted_at
     FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [refs])
  const theoId = new Map((rows as BaiCum[]).map((r) => [r.post_id, r]))
  return refs.flatMap((id) => theoId.get(id) ?? [])
}

type DongBai = { ref_id: string; text: string | null; media: unknown; media_files: unknown; snapshot_id: string | null } & NguoiDangBai

/** Chữ, đường ảnh và cờ ghép của một dòng mẫu trên thẻ. Không ghép thì chỉ dùng chính dòng; có tin chữ thì chữ là của tin chữ, không thì chữ của dòng đã bỏ link ảnh.
 * Người đăng và giờ đăng đi cùng bài có chữ đó: người gắn tìm lại bài trong nhóm bằng tên cùng giờ (app nhóm không hiện ID). */
export async function docThe(q: Q, itemId: number, dong: DongBai, g: Ghep | null) {
  const bai = g ? await docBaiCum(q, dong.ref_id, g) : [dong]
  const nguon = danhSachAnhCum(bai)
  const tinChu = g?.chu_ref ? (bai as BaiCum[]).find((b) => b.post_id === g.chu_ref) : undefined
  const cua: NguoiDangBai = g?.chu_ref ? (tinChu ?? {}) : dong
  const { chu, soLinkKhac } = chuKhongLink(g?.chu_ref ? tinChu?.text : dong.text, nguon)
  return {
    text: chu, anh: nguon.map((_, i) => duongAnh(itemId, i)), soLinkKhac, ghep: ghepHien(g),
    nguoiDang: cua.sender_name?.trim() || null, nguoiDangId: cua.sender_id?.trim() || null, postedAt: cua.posted_at ?? null,
  }
}

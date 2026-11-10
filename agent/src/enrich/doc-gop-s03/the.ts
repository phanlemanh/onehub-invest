// the.ts — PL30: dựng «thẻ» (một bài đọc gộp) từ DB, chỉ đọc. Chữ như màn gắn nhãn hiện (bỏ link), ảnh theo thứ tự màn
// gắn nhãn nhưng CHỈ ảnh đã có tệp trong snapshot: tải ảnh từ nguồn là việc thu thập (làn ZCode) — ảnh chỉ có URL đếm vào
// anh_thieu. Không đọc sender_*, agent_id (định danh người đăng, tài khoản thu không gửi model).
import type { PoolClient } from "pg";
import { chuKhongLink, danhSachAnhCum, docGhep, refsCuaDong } from "../../../../app/src/lib/labels-anh";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { danhSachAnh, luotTuDong } from "../../../../pipeline/lib/vlm-anh.mjs";
// @ts-expect-error — mô-đun .mjs của pipeline, không có kiểu
import { textHash } from "../../../../pipeline/lib/eval-labels.mjs";

export type Q = Pick<PoolClient, "query">;
export type AnhTep = { tep: string; mime: string; sha256: string };
export type The = {
  post_id: string; text_hash: string; group_name: string | null; group_note: string | null; text: string;
  anh: AnhTep[]; anh_thieu: number; item_id?: number; split?: string;
};

/** Trần ảnh mỗi thẻ (lượt đo: tối đa 10 ảnh/thẻ); ảnh > 5 MB hay sai định dạng bị danhSachAnh bỏ. */
export const TRAN_ANH = 20;

type Dong = { post_id: string; text: string | null; group_name: string | null; conversation_id: string | null; media: unknown; media_files: unknown; snapshot_id: string | null };

async function docBai(c: Q, refs: string[]): Promise<Map<string, Dong>> {
  const { rows } = await c.query(
    `SELECT DISTINCT ON (post_id) post_id, text, group_name, conversation_id, media, media_files, snapshot_id
     FROM stg_zalo_posts WHERE post_id = ANY ($1) ORDER BY post_id, captured_at DESC`, [refs]);
  return new Map((rows as Dong[]).map((r) => [r.post_id, r]));
}

async function theNhom(c: Q, conv: string[]): Promise<Map<string, { note: string | null; name: string | null }>> {
  if (!conv.length) return new Map();
  const { rows } = await c.query(`SELECT group_key, note, name FROM collection_units WHERE source_code = 'S03' AND group_key = ANY ($1)`, [conv]);
  return new Map(rows.map((r: { group_key: string; note: string | null; name: string | null }) => [r.group_key, { note: r.note, name: r.name }]));
}

/** Một thẻ từ các bài của nó (bài chữ trước, rồi bài ảnh đã ghép). */
function dungThe(neo: string, chuRef: string | null, refs: string[], bai: Map<string, Dong>, nhom: Map<string, { note: string | null; name: string | null }>): The | null {
  const xep = refs.flatMap((r) => bai.get(r) ?? []);
  if (!xep.length) return null;
  const { anh } = danhSachAnh(xep.flatMap((b) => luotTuDong(b, "rieng")), { tran: TRAN_ANH });
  const tongTrenMan = danhSachAnhCum(xep).length;
  const dongChu = bai.get(chuRef ?? neo) ?? xep[0];
  const { chu } = chuKhongLink(dongChu.text ?? "", []);
  const conv = xep.find((b) => b.conversation_id)?.conversation_id ?? null;
  const n = conv ? nhom.get(conv) : undefined;
  return {
    post_id: dongChu.post_id, text_hash: textHash(dongChu.text ?? ""), text: chu,
    group_name: xep.find((b) => b.group_name)?.group_name ?? n?.name ?? null, group_note: n?.note ?? null,
    anh: anh.map((a: AnhTep) => ({ tep: a.tep, mime: a.mime, sha256: a.sha256 })),
    anh_thieu: Math.max(0, tongTrenMan - anh.length),
  };
}

/** Thẻ của một lát nhãn (bỏ thẻ trung_voi), theo item_id; `split` lọc dev/test; `chiCoNhan` chỉ lấy thẻ đã gắn nhãn
 * (thẻ vàng — lệnh chấm). */
export async function docTheTheoLat(c: Q, lat: string, split?: "dev" | "test", o: { chiCoNhan?: boolean } = {}): Promise<The[]> {
  const { rows: items } = await c.query(
    `SELECT item_id::int, split, ref_id, ghep FROM eval_label_items i
     WHERE lat = $1 AND ghep->>'trung_voi' IS NULL AND ($2::text IS NULL OR split = $2)
       AND (NOT $3 OR EXISTS (SELECT 1 FROM eval_labels l WHERE l.item_id = i.item_id)) ORDER BY item_id`, [lat, split ?? null, !!o.chiCoNhan]);
  const refs = (items as { item_id: number; split: string; ref_id: string; ghep: unknown }[]).map((it) => ({ it, g: docGhep(it.ghep) }));
  const bai = await docBai(c, [...new Set(refs.flatMap(({ it, g }) => refsCuaDong(it.ref_id, g)))]);
  const nhom = await theNhom(c, [...new Set([...bai.values()].flatMap((b) => b.conversation_id ?? []))]);
  return refs.flatMap(({ it, g }) => {
    const t = dungThe(it.ref_id, g?.chu_ref ?? null, refsCuaDong(it.ref_id, g), bai, nhom);
    return t ? [{ ...t, item_id: it.item_id, split: it.split }] : [];
  });
}

/** Thẻ theo danh sách bài (mỗi bài một thẻ, không ghép ảnh lân cận). */
export async function docTheTheoPost(c: Q, postIds: string[]): Promise<The[]> {
  const bai = await docBai(c, postIds);
  const nhom = await theNhom(c, [...new Set([...bai.values()].flatMap((b) => b.conversation_id ?? []))]);
  return postIds.flatMap((p) => dungThe(p, p, [p], bai, nhom) ?? []);
}

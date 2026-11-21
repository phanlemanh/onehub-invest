// ke-the-trong.ts — NB1 cham-bong-bo-sung-tin: kê thẻ «Bổ sung tin» đang chờ mà không còn đề xuất nào nối vào (232 thẻ ngày 21/11,
// chỉ có khối đối chiếu) theo loại đối chiếu × trạng thái đề xuất cùng tin × lượt sinh (AC-10). Chỉ đọc, không đổi thẻ nào; xử lý
// các thẻ này (đóng, giữ, chuyển hạng mục) là việc người quyết sau.
import type { Truy } from "./doc-db.js";

const THE_TRONG = `FROM review_queue r WHERE r.item_type = 'agent_output' AND r.status = 'pending'
  AND NOT EXISTS (SELECT 1 FROM enrichment_proposals p WHERE p.review_id = r.id)`;

/** Câu đếm độc lập để người đếm lại. */
export const CAU_DEM_THE_TRONG = `SELECT count(*) ${THE_TRONG}`;

export const CAU_KE_THE_TRONG = `
SELECT coalesce((SELECT string_agg(DISTINCT e->>'loai', '+' ORDER BY e->>'loai')
                 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(r.evidence->'doi_chieu') = 'array' THEN r.evidence->'doi_chieu' ELSE '[]'::jsonb END) e),
                '(không có)') AS loai,
  CASE WHEN NOT EXISTS (SELECT 1 FROM enrichment_proposals p WHERE p.offer_id = r.evidence->>'offer_id') THEN 'khong-co'
       WHEN NOT EXISTS (SELECT 1 FROM enrichment_proposals p WHERE p.offer_id = r.evidence->>'offer_id' AND p.status <> 'applied') THEN 'da-ap'
       WHEN NOT EXISTS (SELECT 1 FROM enrichment_proposals p WHERE p.offer_id = r.evidence->>'offer_id' AND p.status <> 'skipped') THEN 'da-bo-qua'
       ELSE 'hon-hop' END AS de_xuat_cung_tin,
  coalesce(nullif(regexp_replace(coalesce(r.evidence->>'run_id', ''), '-?[0-9]{4}-[0-9]{2}-[0-9]{2}.*$', ''), ''), '(không rõ)') AS luot,
  count(*)::int AS so
${THE_TRONG}
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`;

export type DongKe = { loai: string; de_xuat_cung_tin: string; luot: string; so: number };

export async function keTheTrong(truy: Truy): Promise<{ dong: DongKe[]; tong: number; tong_sql: number }> {
  const { rows } = await truy(CAU_KE_THE_TRONG);
  const { rows: [d] } = await truy(CAU_DEM_THE_TRONG);
  const dong = rows as DongKe[];
  return { dong, tong: dong.reduce((s, x) => s + x.so, 0), tong_sql: Number(d.count) };
}

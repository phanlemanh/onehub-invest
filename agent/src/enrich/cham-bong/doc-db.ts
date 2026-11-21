// doc-db.ts — NB1 cham-bong-bo-sung-tin: đọc thẻ «Bổ sung tin» chờ còn đề xuất chờ, bài gốc đầy đủ và giá trị tin hiện có. Mọi đọc
// DB máy thu chạy trong giao dịch READ ONLY (AC-5); bộ chạy chỉ nhận hàm `truy`, không nhận kết nối ghi.
import pg from "pg";
import { ASSERTION_METHOD } from "../../vocab.generated.js";
import { laOCham, THU_TU_O, type OCham } from "./ket-cuc.js";

export type Truy = (sql: string, args?: unknown[]) => Promise<{ rows: any[] }>;
export type DeXuat = { id: number; field: OCham; value: string; source: typeof ASSERTION_METHOD.e1_rule | typeof ASSERTION_METHOD.e2_llm; o_da_co: boolean };
export type TheCham = { review_id: number; offer_id: string; source: string; text: string; group_name: string | null; de_xuat: DeXuat[] };
export type BoQua = { review_id: number; ly_do: "khong-tin" | "khong-bai" };

/** Mở giao dịch chỉ đọc trên `url`, trần mỗi câu 60 giây; `dong` luôn ROLLBACK. */
export async function moDocChiDoc(url: string): Promise<{ truy: Truy; dong: () => Promise<void> }> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  await c.query("BEGIN READ ONLY");
  await c.query("SET LOCAL statement_timeout = '60s'");
  return {
    truy: (s, a) => c.query(s, a as unknown[]),
    dong: async () => {
      await c.query("ROLLBACK").catch(() => {});
      await c.end();
    },
  };
}

/** Thẻ agent_output đang chờ có ≥ 1 đề xuất queued nối vào (review_id). Bài = stg_zalo_posts.text bản captured_at mới nhất trong
 * post_ids của tin (như agent/src/enrich/run.ts, nhưng không cắt). o_da_co = tin đã có giá trị bậc observed cho ô đó. */
export const CAU_THE = `
SELECT r.id::int AS review_id, p.offer_id, o.offer_id IS NOT NULL AS co_tin, o.source, b.text, b.group_name,
  json_agg(json_build_object('id', p.id, 'field', p.field, 'value', p.value, 'source', p.source,
    'o_da_co', coalesce(o.field_provenance #>> ARRAY[p.field, 'tier'], '') = 'observed') ORDER BY p.id) AS de_xuat
FROM review_queue r
JOIN enrichment_proposals p ON p.review_id = r.id AND p.status = 'queued'
LEFT JOIN sale_offers o ON o.offer_id = p.offer_id
LEFT JOIN LATERAL (SELECT s.text, s.group_name FROM stg_zalo_posts s WHERE s.post_id = ANY (o.post_ids)
                   ORDER BY s.captured_at DESC NULLS LAST LIMIT 1) b ON true
WHERE r.item_type = 'agent_output' AND r.status = 'pending'
GROUP BY r.id, p.offer_id, o.offer_id, o.source, o.field_provenance, b.text, b.group_name
ORDER BY r.id, p.offer_id`;

export async function docThe(truy: Truy): Promise<{ the: TheCham[]; bo_qua: BoQua[] }> {
  const { rows } = await truy(CAU_THE);
  const the: TheCham[] = [];
  const bo_qua: BoQua[] = [];
  for (const r of rows) {
    if (!r.co_tin) { bo_qua.push({ review_id: r.review_id, ly_do: "khong-tin" }); continue; }
    if (typeof r.text !== "string" || !r.text.trim()) { bo_qua.push({ review_id: r.review_id, ly_do: "khong-bai" }); continue; }
    const de_xuat = (r.de_xuat as DeXuat[]).filter((d) => laOCham(d.field)).map((d) => ({ ...d, id: Number(d.id) }));
    if (de_xuat.length) the.push({ review_id: r.review_id, offer_id: r.offer_id, source: r.source, text: r.text, group_name: r.group_name ?? null, de_xuat });
  }
  return { the, bo_qua };
}

/** Các ô của thẻ, theo THU_TU_O. */
export const oCuaThe = (t: TheCham): OCham[] => THU_TU_O.filter((f) => t.de_xuat.some((d) => d.field === f));

/** Thẻ xếp theo ô ưu tiên cao nhất mà thẻ có đề xuất (AC-8), rồi review_id. */
export function xepThe(the: TheCham[]): TheCham[] {
  const hang = (t: TheCham) => THU_TU_O.indexOf(oCuaThe(t)[0]);
  return [...the].sort((a, b) => hang(a) - hang(b) || a.review_id - b.review_id || a.offer_id.localeCompare(b.offer_id));
}

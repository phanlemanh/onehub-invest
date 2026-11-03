// doi-chieu.ts — khối đối chiếu của thẻ bổ sung dữ liệu (hồ sơ s03-llm-doc-toan-bo): AI và bộ đọc khác nhau về ý định, giá, diện tích.
// Duyệt hay bác chỉ ghi phán quyết vào ops_audit, không đổi cột nào của tin (luật 7). Không import alias «@/» để bộ test agent gọi được.

export type DoiChieu = { loai: "y_dinh" | "gia" | "dien_tich"; trich: string; ai: string | number; bo_doc: string | number };

/** Khối đối chiếu trong evidence của thẻ; thiếu hoặc sai hình thì rỗng. */
export function doiChieuCua(evidence: unknown): DoiChieu[] {
  const d = (evidence as { doi_chieu?: unknown } | null)?.doi_chieu;
  return Array.isArray(d) ? (d as DoiChieu[]) : [];
}

/** Ghi phán quyết trong giao dịch của quyết định; thẻ không có đối chiếu thì không ghi. Trả số dòng ghi. */
export async function ghiPhanQuyetDoiChieu(
  c: { query: (sql: string, params: unknown[]) => Promise<unknown> },
  o: { reviewId: number; itemId: string; status: "approved" | "rejected"; lyDo: string; actor: string; env: string; evidence: unknown },
): Promise<number> {
  const doi_chieu = doiChieuCua(o.evidence);
  if (doi_chieu.length === 0) return 0;
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'enrich:doi-chieu', $2, $3::jsonb)`, [
    o.actor, o.env,
    JSON.stringify({ reviewId: o.reviewId, item_id: o.itemId, phan_quyet: o.status, ly_do: o.lyDo, doi_chieu }),
  ]);
  return 1;
}

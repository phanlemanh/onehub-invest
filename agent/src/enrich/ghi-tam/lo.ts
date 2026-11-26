// lo.ts — NB10: lô ghi tạm (migration 129). Mọi giá trị máy tự ghi theo đường «hai phiếu trùng nhau» đi qua đây trước
// apply_enrichment: mở lô <run_id>:<field>, gắn lo_id + ghi_tam lên đề xuất. Ô đã dừng (quá hạn, đo bù không đạt) thì không ghi.
import type pg from "pg";

import type { EnrichField } from "../route.js";

/** Hỏi-2 (Mạnh duyệt 26/11): ghi nấc hiện có của ô «Bổ sung tin» — nấc 1 — kèm cờ ghi tạm; thang 0–4 không đổi. */
export const NAC_GHI_TAM = 1;
/** Hạn đo bù hai tuần (ROADMAP mục 63 QĐ3). */
export const HAN_DO_BU_NGAY = 14;

export type MoLo = {
  runId: string;
  field: EnrichField;
  docLap: boolean;
  ghiBoi: string;
  model: string | null;
};

/** Mã lô theo lượt × trường (Hỏi-5). */
export const maLo = (runId: string, field: EnrichField): string => `${runId}:${field}`;

/** Các trường đang dừng tự ghi. */
export async function oDangDung(c: pg.Client): Promise<Set<EnrichField>> {
  const { rows } = await c.query<{ field: EnrichField }>(`SELECT field FROM ghi_tam_o WHERE dung`);
  return new Set(rows.map((r) => r.field));
}

/**
 * Gắn các đề xuất vào lô (mở lô nếu chưa có), trả mã lô. Gọi trong giao dịch của tin, TRƯỚC apply_enrichment: đề xuất
 * corroborated không bao giờ áp mà thiếu lô (AC-3).
 */
export async function ganLo(c: pg.Client, ids: number[], l: MoLo): Promise<string> {
  const ma = maLo(l.runId, l.field);
  await c.query(
    `INSERT INTO ghi_tam_lo (ma, field, nguon_luot, doc_lap, ghi_boi, model, nac, han_do_bu)
     VALUES ($1, $2, $3, $4, $5, $6, $7, current_date + $8::int)
     ON CONFLICT (ma) DO NOTHING`,
    [ma, l.field, l.runId, l.docLap, l.ghiBoi, l.model, NAC_GHI_TAM, HAN_DO_BU_NGAY],
  );
  await c.query(`UPDATE enrichment_proposals SET lo_id = $2, ghi_tam = true WHERE id = ANY ($1)`, [ids, ma]);
  return ma;
}

export type LoHetHan = { ma: string; field: EnrichField; han_do_bu: string; da_rut: number };

/** Rút mọi lô quá hạn đo bù chưa có kết quả (actor máy, dừng ô) — AC-6. */
export async function xetHan(c: pg.Client): Promise<LoHetHan[]> {
  const { rows } = await c.query<LoHetHan>(
    `SELECT ma, field, han_do_bu::text AS han_do_bu, da_rut FROM xet_han_ghi_tam()`,
  );
  return rows;
}

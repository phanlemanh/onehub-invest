// kev-phat-bieu.mjs — PL5: điểm Kev typed của một bài (cột kev_* ở stg_zalo_posts, migration 057) thành phát biểu theo bài
// cho field_assertions: trường listing_intent / kind, lớp inferred, phương pháp kev. Không ngưỡng, không lọc — Kev chỉ trả
// một lớp kèm xác suất mỗi câu nên mỗi bài mỗi trường đúng một phát biểu.
// Spec: docs/superpowers/specs/2026-10-30-meta-kev-thanh-phat-bieu-design.md §Phát biểu.

import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER, KIND, VOCAB } from "./vocab.generated.mjs";
import { subjectKey } from "./assert.mjs";

// Kev không bao giờ trả «unknown» — lớp đó là của người/luật khi chưa rõ.
const Y_DINH = VOCAB.listing_intent.filter((v) => v !== "unknown");
// Mã bán/thuê của Kev → mã sổ trục kind («Cho thuê» là rent_lt).
const LOAI_KEV = Object.freeze({ sale: KIND.sale, rent: KIND.rent_lt });
const hopLe = (bo, v) => bo.includes(v);

/**
 * @param {{post_id: string, kev_p: number|null, kev_intent: string|null, kev_intent_p: number|null, kev_kind: string|null,
 *   kev_kind_p: number|null, kev_model: string|null, kev_at: string|Date|null}} row dòng mới nhất của bài
 * @param {string} [source] mã nguồn của chủ thể (S03)
 * @returns {{rows: Array<object>, ngoaiBo: number}} rows đúng khuôn writeAssertions (lib/assert.mjs); ngoaiBo = số giá trị
 *   ngoài bộ bị bỏ (CHECK 057 chặn từ bảng nạp, hàm vẫn chặn)
 */
export function kevThanhPhatBieu(row, source = "S03") {
  const rows = [];
  let ngoaiBo = 0;
  const ghi = (field, value, p) => rows.push({
    subject_key: subjectKey(source, row.post_id), field, value,
    evidence_tier: EVIDENCE_TIER.inferred, method: ASSERTION_METHOD.kev, method_version: row.kev_model ?? null,
    evidence: { p: p ?? null, kev_p: row.kev_p ?? null, model: row.kev_model ?? null }, observed_at: row.kev_at ?? null,
  });
  if (row.kev_intent != null) {
    if (hopLe(Y_DINH, row.kev_intent)) ghi(ASSERTION_FIELD.listing_intent, row.kev_intent, row.kev_intent_p);
    else ngoaiBo++;
  }
  if (row.kev_kind != null) {
    if (hopLe(Object.keys(LOAI_KEV), row.kev_kind)) ghi(ASSERTION_FIELD.kind, LOAI_KEV[row.kev_kind], row.kev_kind_p);
    else ngoaiBo++;
  }
  return { rows, ngoaiBo };
}

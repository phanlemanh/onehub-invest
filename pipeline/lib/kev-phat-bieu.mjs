// kev-phat-bieu.mjs — PL5: điểm Kev typed của một bài (cột kev_* ở stg_zalo_posts, migration 057) thành phát biểu theo bài
// cho field_assertions: trường listing_intent / kind, lớp inferred, phương pháp kev. Không ngưỡng, không lọc — Kev chỉ trả
// một lớp kèm xác suất mỗi câu nên mỗi bài mỗi trường đúng một phát biểu.
// Spec: docs/superpowers/specs/2026-10-30-meta-kev-thanh-phat-bieu-design.md §Phát biểu.

import { ASSERTION_FIELD, ASSERTION_METHOD, EVIDENCE_TIER, KIND, VOCAB } from "./vocab.generated.mjs";
import { subjectKey, writeAssertions } from "./assert.mjs";

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

/**
 * Điểm Kev của các bài (khoá chính stg_zalo_posts là post_id — mỗi bài một dòng). `null` khi DB chưa áp 057 (thiếu cột
 * kev_intent) hoặc chưa có bảng phát biểu (045) — máy thu chạy mã mới trước khi migration được áp.
 * @param {import("pg").Client} client
 * @param {string[]} postIds
 */
export async function docDiemKev(client, postIds) {
  const { rows: [co] } = await client.query(
    `SELECT to_regclass('field_assertions') IS NOT NULL
        AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'stg_zalo_posts'::regclass AND attname = 'kev_intent'
                       AND NOT attisdropped) AS co`);
  if (!co.co) return null;
  const { rows } = await client.query(
    `SELECT post_id, kev_p, kev_intent, kev_intent_p, kev_kind, kev_kind_p, kev_model, kev_at
       FROM stg_zalo_posts WHERE post_id = ANY($1::text[])`, [postIds]);
  return rows;
}

/**
 * Bước Kev của transform: đọc điểm của MỌI bài đã qua cửa gạt bài thử (kể cả bài không thành offer), ghi phát biểu
 * bằng một lần writeAssertions replaceOwn — khoá (chủ thể, trường, phương pháp): chạy lại thay chính nó, listing_intent
 * và kind không thay nhau. Người gọi giữ transaction.
 * @param {import("pg").Client} client
 * @param {Array<{post_id: string}>} posts
 * @returns {Promise<null|{bai: number, phatBieu: number, ngoaiBo: number, inserted: number, retracted: number}>}
 */
export async function ghiPhatBieuKev(client, posts, source = "S03") {
  const diem = await docDiemKev(client, posts.map((p) => p.post_id));
  if (!diem) {
    console.log("kev: chưa áp 057 — bỏ bước phát biểu Kev");
    return null;
  }
  const rows = [];
  let bai = 0, ngoaiBo = 0;
  for (const d of diem) {
    if (d.kev_at != null) bai++;
    const kq = kevThanhPhatBieu(d, source);
    rows.push(...kq.rows);
    ngoaiBo += kq.ngoaiBo;
  }
  const w = await writeAssertions(client, rows, { replaceOwn: true });
  console.log(`kev: ${bai} bài có điểm · ${rows.length} phát biểu (thêm ${w.inserted}, rút ${w.retracted}) · ${ngoaiBo} ngoài bộ`);
  return { bai, phatBieu: rows.length, ngoaiBo, ...w };
}

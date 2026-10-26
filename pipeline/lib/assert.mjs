// assert.mjs — ghi phát biểu (field_assertions, migration 045) và gọi bộ phân xử (PL15).
// Spec: docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md §3.4.
// Người gọi giữ transaction — hàm không tự mở/đóng.

/** Khoá gốc của chủ thể phát biểu: '<S0x>:<id gốc>' (post_id, list_id). */
export function subjectKey(source, id) {
  if (!source || id === null || id === undefined || id === "") throw new Error("subjectKey: thiếu nguồn hoặc id gốc");
  return `${source}:${id}`;
}

const COT = ["subject_key", "field", "value", "evidence_tier", "method", "method_version", "rule_id", "evidence",
  "observed_at", "changed_by", "run_id"];

/**
 * Ghi lô phát biểu bằng một câu INSERT … unnest (chạy lại không nhân dòng — chỉ mục sống của 045).
 * `replaceOwn`: trước khi ghi, rút phát biểu sống cùng (chủ thể, trường, phương pháp) mà giá trị khác lượt này
 * (lý do 'thay-boi-luot') — một bộ đọc chạy lại ra giá trị mới thì thay chính nó, không thành bất đồng.
 * @param {import("pg").Client} client
 * @param {Array<{subject_key: string, field: string, value: string|number, evidence_tier: string, method: string,
 *   method_version?: string|null, rule_id?: string|null, evidence?: object, observed_at?: string|Date|null,
 *   changed_by?: string|null, run_id?: string|null}>} rows
 * @param {{ replaceOwn?: boolean }} [opts]
 * @returns {Promise<{inserted: number, retracted: number}>}
 */
export async function writeAssertions(client, rows, { replaceOwn = false } = {}) {
  if (!rows.length) return { inserted: 0, retracted: 0 };
  const cols = Object.fromEntries(COT.map((c) => [c, []]));
  for (const r of rows) {
    if (r.value === null || r.value === undefined || r.value === "") throw new Error(`writeAssertions: giá trị rỗng (${r.subject_key} · ${r.field})`);
    for (const c of COT) {
      const v = r[c];
      cols[c].push(c === "value" ? String(v) : c === "evidence" ? JSON.stringify(v ?? {}) : v ?? null);
    }
  }
  let retracted = 0;
  if (replaceOwn) {
    const res = await client.query(
      `WITH moi AS (SELECT DISTINCT s, f, m, assertion_value_key(v) AS vk
                      FROM unnest($1::text[], $2::text[], $3::text[], $4::text[]) AS t(s, f, m, v))
       UPDATE field_assertions fa SET retracted_at = clock_timestamp(), retract_reason = 'thay-boi-luot'
         FROM (SELECT s, f, m FROM moi GROUP BY s, f, m) k
        WHERE fa.retracted_at IS NULL AND fa.subject_key = k.s AND fa.field = k.f AND fa.method = k.m
          AND NOT EXISTS (SELECT 1 FROM moi x WHERE x.s = k.s AND x.f = k.f AND x.m = k.m AND x.vk = fa.value_key)`,
      [cols.subject_key, cols.field, cols.method, cols.value],
    );
    retracted = res.rowCount;
  }
  const res = await client.query(
    `INSERT INTO field_assertions (${COT.join(", ")})
     SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[],
                          $8::jsonb[], $9::timestamptz[], $10::text[], $11::text[])
     ON CONFLICT DO NOTHING`,
    COT.map((c) => cols[c]),
  );
  return { inserted: res.rowCount, retracted };
}

/**
 * Phân xử lại năm cột của các tin (null = mọi bản ghi tin).
 * @returns {Promise<{offers: number, offers_changed: number}>}
 */
export async function resolveOffers(client, offerIds) {
  const { rows } = await client.query(`SELECT resolve_offer_fields($1::text[]) AS r`, [offerIds]);
  return rows[0].r;
}

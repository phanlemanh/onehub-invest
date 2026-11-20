// source-name-entries.mjs — MỘT hàm nạp sổ nguồn cho bộ che và bộ soát tên nguồn (che-ten-nguon-khong-lay-tu-dau, lối B GS
// chốt 18/11). Trả [{ code, realName, wholeOnly }]: mỗi token của source_registry (tên thật và từng định danh) một mục, mang
// cờ match_whole của dòng (migration 112). Bản chép cho app: docSourceNameEntriesVoi của app/src/lib/mask-source-names.ts
// (source-roles.docSourceNameEntries gọi nó với pool của app).
//   - DB chưa áp 112 (thiếu cột) → đọc không cột, mọi cờ false = hành vi cũ: che thừa, không rò.
//   - Không có bảng → [] — bộ che trả null, bộ soát dừng (đóng chặt như trước).
//   - Lỗi khác → ném: không bao giờ đổi lỗi thành danh sách rỗng.

export const SQL_SO_CO_CO = `SELECT code, real_name, coalesce(source_ids, '{}') AS ids, match_whole FROM source_registry ORDER BY code`;
export const SQL_SO_KHONG_CO = `SELECT code, real_name, coalesce(source_ids, '{}') AS ids, false AS match_whole FROM source_registry ORDER BY code`;

/** Các dòng sổ → entries. Token rỗng bỏ; token trùng trong cùng mã chỉ giữ một. */
export function entriesFromRows(rows) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    for (const t of [r.real_name, ...(r.ids ?? [])]) {
      if (typeof t !== "string" || t.trim() === "") continue;
      const k = `${r.code}\u0000${t}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ code: r.code, realName: t, wholeOnly: r.match_whole === true });
    }
  }
  return out;
}

// Hỏi trước bảng và cột có hay không — KHÔNG thử câu rồi bắt lỗi: trong giao dịch (sync-cloud đọc trong REPEATABLE READ)
// một câu lỗi làm hỏng cả giao dịch. Theo search_path của chính phiên.
export const SQL_SO_HINH = `SELECT to_regclass('source_registry') IS NOT NULL AS bang,
  EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('source_registry') AND attname = 'match_whole'
          AND NOT attisdropped) AS cot`;

/** Đọc sổ qua `client` (pg Client hoặc Pool). Không có bảng → []; thiếu cột → cờ false; lỗi khác → ném. */
export async function docSourceNameEntries(client) {
  const { rows: [h] } = await client.query(SQL_SO_HINH);
  if (!h?.bang) return [];
  const { rows } = await client.query(h.cot ? SQL_SO_CO_CO : SQL_SO_KHONG_CO);
  return entriesFromRows(rows);
}

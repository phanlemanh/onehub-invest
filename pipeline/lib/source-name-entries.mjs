// source-name-entries.mjs — MỘT hàm nạp sổ nguồn cho bộ che và bộ soát tên nguồn (che-ten-nguon-khong-lay-tu-dau, lối B GS
// chốt 18/11). Trả [{ code, realName, wholeOnly }]: mỗi token của source_registry (tên thật và từng định danh) một mục, mang
// cờ match_whole của dòng (migration 112). Bản chép cho app: docSourceNameEntries của app/src/lib/source-roles.ts.
//   - DB chưa áp 112 (thiếu cột, 42703) → đọc lại không cột, mọi cờ false = hành vi cũ: che thừa, không rò.
//   - Không có bảng (42P01) → [] — bộ che trả null, bộ soát dừng (đóng chặt như trước).
//   - Lỗi khác → ném: không bao giờ đổi lỗi thành danh sách rỗng.

const CO_CO = `SELECT code, real_name, coalesce(source_ids, '{}') AS ids, match_whole FROM source_registry ORDER BY code`;
const KHONG_CO = `SELECT code, real_name, coalesce(source_ids, '{}') AS ids, false AS match_whole FROM source_registry ORDER BY code`;

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

/** Đọc sổ qua `client` (pg Client hoặc Pool). */
export async function docSourceNameEntries(client) {
  let rows;
  try {
    ({ rows } = await client.query(CO_CO));
  } catch (e) {
    if (e?.code === "42P01") return [];
    if (e?.code !== "42703") throw e;
    try {
      ({ rows } = await client.query(KHONG_CO));
    } catch (e2) {
      if (e2?.code === "42P01") return [];
      throw e2;
    }
  }
  return entriesFromRows(rows);
}

// sdt-trong-chuoi.mjs — hồ sơ sdt-trong-ten-duong: chuỗi đường S06 có số điện thoại không lên tin và căn (AGENTS.md luật 6).
// Cùng một mẫu cho JS và Postgres: dãy từ 9 chữ số, giữa các chữ số cho phép một dấu cách, chấm hoặc gạch.

export const MAU_DAY_SO = "[0-9](?:[ .-]?[0-9]){8,}";
const DAY_SO = new RegExp(MAU_DAY_SO);

export const chuaDaySo = (s) => DAY_SO.test(s);

/**
 * Rút mọi phát biểu `street_raw` sống của S06 mang dãy số, lý do `chua-sdt`; dòng không xoá. Dùng trước khi phân xử.
 * @returns {Promise<string[]>} khoá chủ thể đã rút
 */
export async function rutDuongCoSo(client) {
  const { rows } = await client.query(
    `UPDATE field_assertions SET retracted_at = clock_timestamp(), retract_reason = 'chua-sdt'
      WHERE retracted_at IS NULL AND field = 'street_raw' AND subject_key LIKE 'S06:%' AND value ~ $1
      RETURNING subject_key`,
    [MAU_DAY_SO],
  );
  return rows.map((r) => r.subject_key);
}

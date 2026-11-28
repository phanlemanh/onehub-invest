// s09-danh-ba-v16.mjs — DA56 (nap-s09-quy-can-va-can-cao-tang): bộ lọc khoá tầng A của DATA-CONTRACT v16 trước khi ghi stg.
// Căn quỹ căn mang URL ảnh trên tên miền CDN của nguồn (`galleries`) và toạ độ từng căn (`geolocation`, Hỏi-2 duyệt 25/11) — bỏ
// khỏi từng phần tử payload.data. Danh sách khoá là bảng kiểm kê viết trước từ bản thu thật (s09-danh-ba-v16-khoa.json); khoá cấp
// một KHÔNG có trong bảng thì ném lỗi — nguồn thêm trường thì người xếp trường đó giữ hay bỏ trước, không để URL lạ lọt vào stg.
// Hàm thuần: không đổi đầu vào (raw bất biến).
import { readFileSync } from "node:fs";

export const KHOA_V16 = Object.freeze(JSON.parse(readFileSync(new URL("./s09-danh-ba-v16-khoa.json", import.meta.url), "utf8")));

/** Lọc payload một item theo kind. Trả { payload, boKhoa } — boKhoa = số căn đã bỏ ít nhất một khoá. */
export function locTangA(kind, payload) {
  const bang = KHOA_V16[kind];
  if (kind !== "quy-can" || !bang || !payload || !Array.isArray(payload.data)) return { payload, boKhoa: 0 };
  let boKhoa = 0;
  const data = payload.data.map((can) => {
    if (!can || typeof can !== "object" || Array.isArray(can)) return can;
    const ra = {};
    let bo = false;
    for (const [k, v] of Object.entries(can)) {
      const xep = bang[k];
      if (xep === undefined) throw new Error(`s09-danh-ba v16: khoá chưa xếp: ${k} (kind ${kind}) — thêm vào bảng kiểm kê trước khi nạp`);
      if (xep === "bo") bo = true;
      else ra[k] = v;
    }
    if (bo) boKhoa++;
    return ra;
  });
  return { payload: { ...payload, data }, boKhoa };
}

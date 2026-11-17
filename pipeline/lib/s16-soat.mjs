// s16-soat.mjs — DA33 nap-s16-vao-danh-ba: bộ soát mã đăng nhập S16 cho mọi đường dữ liệu rời máy (thiết kế §6, AC-9).
// Mã căn, khu_id, toa_id lấy bằng phiên đăng nhập là chỉ nội bộ (ROADMAP §3 mục 48). Hai lớp:
//   1. kiemBangDay — danh sách bảng đẩy lên cloud không được chứa bảng stg S16 hay bảng vật thể danh bạ;
//   2. soatS16 / soatDuLieu — khớp theo TOKEN (tách bởi ký tự ngoài [A-Za-z0-9._-]), không theo chuỗi con: toa_id, khu_id
//      ở mọi giá trị của mọi bảng; mã căn chỉ ở bảng S16 chạm được (BANG_SOAT_MA_CAN) và trong thẻ.
// Báo bằng tên bảng + cột / đường JSON — KHÔNG bao giờ trả giá trị trúng.

/** Bảng không bao giờ lên cloud (thiết kế §6). */
export const BANG_CAM_S16 = Object.freeze([/^stg_s16/, "registry_aliases", "units", "stacks", "buildings"]);

/** Tên bảng đầu tiên của danh sách đẩy nằm trong BANG_CAM_S16, hoặc null. */
export function kiemBangDay(fill) {
  for (const t of fill ?? []) {
    if (BANG_CAM_S16.some((m) => (m instanceof RegExp ? m.test(t) : m === t))) return t;
  }
  return null;
}

const TACH = /[^A-Za-z0-9._-]+/;

/**
 * Bảng sắp đẩy mà dữ liệu S16 chạm được — chỉ ở đây mới soát MÃ CĂN S16 (lời AC-9 sửa, chờ Mạnh duyệt 17/11).
 * Bảng sinh từ tin rao (sale_offers, properties…) mang số căn người bán tự ghi công khai — trùng mã S16 không phải rò.
 * toa_id, khu_id S16 (định danh mờ của nguồn) vẫn soát ở MỌI bảng.
 */
export const BANG_SOAT_MA_CAN = Object.freeze(["asset_nodes", "review_queue"]);

/**
 * Token S16 từ stg local, tách hai tập; null khi DB chưa áp 103. Bỏ token dưới 4 ký tự.
 * dinhDanh: toa_id, khu_id. maCan: mã căn viết hoa, BỎ token toàn số (không phân biệt được với định danh số của kho).
 */
export async function tokenS16(c) {
  // Kiểm theo đúng search_path mà câu đọc dưới dùng (không ghim public): DB có 103 ở public nhưng phiên đứng ở schema khác
  // (test chạy schema riêng) thì câu đọc không thấy bảng — coi như chưa áp 103.
  const co = (await c.query(
    `SELECT to_regclass('stg_s16_khu') IS NOT NULL AND to_regclass('stg_s16_toa') IS NOT NULL AND to_regclass('stg_s16_can') IS NOT NULL AS t`)).rows[0].t;
  if (!co) return null;
  const { rows } = await c.query(
    `SELECT DISTINCT x, loai FROM (
       SELECT khu_id AS x, 'dinh_danh' AS loai FROM stg_s16_khu UNION ALL SELECT toa_id, 'dinh_danh' FROM stg_s16_toa
       UNION ALL SELECT khu_id, 'dinh_danh' FROM stg_s16_toa UNION ALL SELECT upper(btrim(ma_can)), 'ma_can' FROM stg_s16_can) s
      WHERE x IS NOT NULL AND length(x) >= 4 AND NOT (loai = 'ma_can' AND x ~ '^[0-9]+$')`);
  const ra = { dinhDanh: new Set(), maCan: new Set() };
  for (const r of rows) ra[r.loai === "dinh_danh" ? "dinhDanh" : "maCan"].add(r.x);
  return ra;
}

/** Hợp hai tập token (thẻ, asset_nodes); nhận cả một Set trần. */
const hop = (token) => (token instanceof Set ? token : new Set([...(token?.dinhDanh ?? []), ...(token?.maCan ?? [])]));

const trungChuoi = (s, token) => s.split(TACH).some((p) => p && (token.has(p) || token.has(p.toUpperCase())));

/** Đường JSON đầu tiên mang một token S16 (`a.b[2]`), hoặc null. Đi sâu mọi mảng, đối tượng, khoá. Soát cả định danh lẫn mã căn. */
export function soatS16(giaTri, tokenVao) {
  const token = hop(tokenVao);
  if (!token.size) return null;
  let ra = null;
  const di = (v, p) => {
    if (ra) return;
    if (typeof v === "string") { if (trungChuoi(v, token)) ra = { duong: p || "$" }; return; }
    if (typeof v === "number") { if (trungChuoi(String(v), token)) ra = { duong: p || "$" }; return; }
    if (Array.isArray(v)) { v.forEach((x, i) => di(x, `${p}[${i}]`)); return; }
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (trungChuoi(k, token)) { ra = { duong: p ? `${p}.${k}` : k }; return; }
        di(x, p ? `${p}.${k}` : k);
      }
    }
  };
  di(giaTri, "");
  return ra;
}

/**
 * Soát dữ liệu sắp gửi: `data` là Map tên bảng → mảng dòng (chuỗi JSON hay đối tượng). Trả { bang, cot } của chỗ trúng đầu tiên.
 * Định danh S16 soát ở mọi bảng; mã căn S16 chỉ ở BANG_SOAT_MA_CAN. Một Set trần (cách gọi cũ) soát mọi token ở mọi bảng.
 */
export function soatDuLieu(data, token) {
  if (!token) return null;
  const tatCa = hop(token);
  const chiDinhDanh = token instanceof Set ? tatCa : new Set(token.dinhDanh ?? []);
  if (!tatCa.size) return null;
  for (const [bang, dong] of data) {
    const tk = BANG_SOAT_MA_CAN.includes(bang) ? tatCa : chiDinhDanh;
    if (!tk.size) continue;
    for (const d of dong ?? []) {
      const o = typeof d === "string" ? JSON.parse(d) : d;
      const hit = soatS16(o, tk);
      if (hit) return { bang, cot: hit.duong.split(/[.[]/)[0] };
    }
  }
  return null;
}

/** Thông điệp dừng — chỉ tên bảng, cột; không giá trị. */
export const thongDiepS16 = (hit) =>
  `giá trị mang mã đăng nhập S16 ở ${hit.bang}.${hit.cot} — dừng trước khi gửi, không dòng nào rời máy`;

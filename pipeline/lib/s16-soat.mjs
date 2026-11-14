// s16-soat.mjs — DA33 nap-s16-vao-danh-ba: bộ soát mã đăng nhập S16 cho mọi đường dữ liệu rời máy (thiết kế §6, AC-9).
// Mã căn, khu_id, toa_id lấy bằng phiên đăng nhập là chỉ nội bộ (ROADMAP §3 mục 48). Hai lớp:
//   1. kiemBangDay — danh sách bảng đẩy lên cloud không được chứa bảng stg S16 hay bảng vật thể danh bạ;
//   2. soatS16 / soatDuLieu — khớp theo TOKEN (tách bởi ký tự ngoài [A-Za-z0-9._-]), không theo chuỗi con, trên mọi giá trị.
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

/** Tập token S16 (khu_id, toa_id, mã căn viết hoa) từ stg local; null khi DB chưa áp 103. Bỏ token dưới 4 ký tự. */
export async function tokenS16(c) {
  if (!(await c.query("SELECT to_regclass('public.stg_s16_toa') AS t")).rows[0].t) return null;
  const { rows } = await c.query(
    `SELECT DISTINCT x FROM (
       SELECT khu_id AS x FROM stg_s16_khu UNION ALL SELECT toa_id FROM stg_s16_toa UNION ALL SELECT khu_id FROM stg_s16_toa
       UNION ALL SELECT upper(btrim(ma_can)) FROM stg_s16_can) s
      WHERE x IS NOT NULL AND length(x) >= 4`);
  return new Set(rows.map((r) => r.x));
}

const trungChuoi = (s, token) => s.split(TACH).some((p) => p && (token.has(p) || token.has(p.toUpperCase())));

/** Đường JSON đầu tiên mang một token S16 (`a.b[2]`), hoặc null. Đi sâu mọi mảng, đối tượng, khoá. */
export function soatS16(giaTri, token) {
  if (!token?.size) return null;
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
 */
export function soatDuLieu(data, token) {
  if (!token?.size) return null;
  for (const [bang, dong] of data) {
    for (const d of dong ?? []) {
      const o = typeof d === "string" ? JSON.parse(d) : d;
      const hit = soatS16(o, token);
      if (hit) return { bang, cot: hit.duong.split(/[.[]/)[0] };
    }
  }
  return null;
}

/** Thông điệp dừng — chỉ tên bảng, cột; không giá trị. */
export const thongDiepS16 = (hit) =>
  `giá trị mang mã đăng nhập S16 ở ${hit.bang}.${hit.cot} — dừng trước khi gửi, không dòng nào rời máy`;

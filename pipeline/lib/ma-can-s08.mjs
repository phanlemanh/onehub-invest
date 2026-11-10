// ma-can-s08.mjs — bộ tách mã căn S08 thành toà · tầng · trục (hồ sơ danh-ba-toa-truc-can, DB1, AC-2).
// Mỗi khuôn một luật có tên, khớp toàn chuỗi; mã khớp không khuôn nào hay khớp hai khuôn thì KHÔNG đoán — trả lý do.
// Khuôn khai theo DẠNG chữ/số (đo trên danh mục cao tầng hai khu 07/11); không mã S08 thật nào nằm ở đây (luật 5).
// Tầng trả dạng số thập phân bỏ số 0 đầu ("07" → "7"), giữ hậu tố chữ ("15A"); trục giữ nguyên chữ ("05", "5A", "S10").

/** @type {ReadonlyArray<{ id: string, mo_ta: string, re: RegExp }>} — mỗi re có ba nhóm: toà, tầng, trục. */
export const KHUON = Object.freeze([
  { id: "gach", mo_ta: "<toà>-<tầng 2 số>-<trục>", re: /^([A-Z]\d{2}[A-Z]?)-(\d{2})-(\d{2}[A-Z]?)$/ },
  { id: "cham", mo_ta: "<toà>.<tầng 2 số>.<trục 2 số>", re: /^([A-Z]{1,2}\d?)\.(\d{2})\.(\d{2})$/ },
  { id: "tien-to-x", mo_ta: "<mã dự án 5 ký tự>_<toà>-X<tầng>.<trục>", re: /^[A-Z0-9]{5}_([A-Z]{1,2}\d?)-X(\d{2})\.(\d{2})$/ },
  { id: "dinh-cham", mo_ta: "<toà 2 chữ + số><tầng 2 số>.<trục 2 số>", re: /^([A-Z]{2}\d{1,2})(\d{2})\.(\d{2})$/ },
  { id: "toa-cham-bon", mo_ta: "<toà chữ số.2 số><tầng 2 số>.<trục 2 số>", re: /^([A-Z]\d{1,2}\.\d{2})(\d{2})\.(\d{2})$/ },
  {
    id: "toa-cham-dinh",
    mo_ta: "<toà chữ số.2 số><tầng 2 số | số + A><trục 1–2 số + A?>",
    re: /^([A-Z]\d{1,2}\.\d{2})(\d{2}|\d{1,2}A)(\d{1,2}A?)$/,
  },
  { id: "dinh-lien", mo_ta: "<toà 2 chữ + 1 số><tầng 2 số><trục 2 số>", re: /^([A-Z]{2}\d)(\d{2})(\d{2})$/ },
  { id: "chan-de", mo_ta: "<toà 2 chữ + 1 số><tầng 2 số>S<trục 2 số> — căn thương mại chân đế", re: /^([A-Z]{2}\d)(\d{2})(S\d{2})$/ },
]);

const chuanTang = (t) => {
  const m = /^0*(\d+)([A-Z]?)$/.exec(t);
  return m ? `${m[1] || "0"}${m[2]}` : t;
};

/**
 * Tách một mã căn.
 * @param {string|null|undefined} ma
 * @returns {{ toa: string, tang: string, truc: string, khuon_id: string } | { khong_tach: 'ma-rong'|'khong-khop-khuon'|'nhieu-khuon' }}
 */
export function tachMa(ma) {
  if (typeof ma !== "string" || !ma.trim()) return { khong_tach: "ma-rong" };
  const s = ma.trim().toUpperCase();
  const khop = [];
  for (const k of KHUON) {
    const m = k.re.exec(s);
    if (m) khop.push({ toa: m[1], tang: chuanTang(m[2]), truc: m[3], khuon_id: k.id });
  }
  if (khop.length === 0) return { khong_tach: "khong-khop-khuon" };
  if (khop.length > 1) return { khong_tach: "nhieu-khuon" };
  return khop[0];
}

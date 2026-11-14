// tang-ghep.mjs — PL35 tap-nhan-ghep-tin-hai-khu: bộ phân tầng mức gắn cho lát `hai-khu-ghep`.
// Tầng chỉ để phân bổ cỡ mẫu, KHÔNG phải nhãn. Bộ phân tầng chỉ nhận chữ bài và danh sách toà/trục của khu (danh bạ);
// không nhận, không đọc phát biểu hay kết quả gắn của PL20 — tập test phải độc lập với bộ được đo (AC-4, AC-7).

/** Khu × mức gắn. Mức `can` (0 bài) và `truc` của GP (1 bài) không đủ cỡ: trục GP gộp vào toà GP. */
export const TANG_HAI_KHU = Object.freeze(["op1-toa", "op1-truc", "op1-khong", "gp-toa", "gp-khong"]);
/** Tầng bắt buộc đủ cỡ (ROADMAP §3 mục 48, QĐ6 — PL20 chỉ còn nhịp toà); tầng còn lại thiếu cỡ chỉ báo «cho PL36». */
export const TANG_BAT_BUOC = Object.freeze(["op1-toa", "op1-khong", "gp-toa", "gp-khong"]);
export const CO_TANG = 75;

const boDau = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "D").toUpperCase();
/** Chữ để dò: bỏ dấu, viết hoa, mọi ký tự không phải chữ/số/dấu chấm thành một khoảng trắng. */
const chuDo = (s) => ` ${boDau(s).replace(/[^A-Z0-9.]+/g, " ")} `;
const thoat = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Mẫu dò một tên: các từ nối nhau bởi tối đa một khoảng trắng, không dính chữ/số hai bên (dấu chấm theo sau chữ số cũng tính là dính). */
function mauTen(ten) {
  const tu = boDau(ten).replace(/[^A-Z0-9.]+/g, " ").trim().split(" ").filter(Boolean);
  if (!tu.length) return null;
  return new RegExp(`(?<![A-Z0-9.])${tu.map(thoat).join(" ?")}(?![A-Z0-9]|\\.[A-Z0-9])`);
}

/** Mẫu mã căn của một tên toà: tên rồi 3–4 chữ số (cách bởi tối đa một dấu cách/chấm/gạch), không dính số phía sau. */
function mauMaCan(ten) {
  return new RegExp(`(?<![A-Z0-9.])${ten.split(" ").map(thoat).join(" ?")}[ .-]?[0-9]{3,4}(?![0-9])`);
}

/**
 * Mức gắn của một bài theo chữ bài và danh bạ của khu.
 *   - mã căn của một trục khớp (tên toà rồi số căn có hai chữ số cuối là mã trục, hay dạng «xx<trục>») → `truc`;
 *   - tên toà khớp đúng MỘT toà → `toa`;
 *   - khớp từ hai toà (mơ hồ, hay bài nêu nhiều toà), tên toà ngoài danh bạ, không nêu toà → `khong`.
 * @param {string} text chữ bài
 * @param {{ toa: Array<{ key: string, ten: string[] }>, truc?: Array<{ toa_key: string, truc: string }> }} danhBa
 * @returns {'toa'|'truc'|'khong'}
 */
export function mucGan(text, { toa, truc = [] }) {
  const chu = chuDo(text);
  const khopToa = new Set();
  const khopTruc = new Set();
  for (const t of toa) {
    const ten = t.ten.map((x) => boDau(x).replace(/[^A-Z0-9.]+/g, " ").trim()).filter(Boolean);
    if (!ten.length) continue; // toà không có tên: không dò (mẫu rỗng sẽ khớp mọi con số)
    // Tên trần, hay mã căn «<toà>.<tầng><căn>» (3–4 chữ số dính dấu chấm) kể cả khi trục chưa có trong danh bạ.
    if (ten.some((x) => mauTen(x).test(chu) || mauMaCan(x).test(chu))) khopToa.add(t.key);
    // Mã căn «<toà>.<tầng><trục>» dính dấu chấm nên không khớp mẫu tên trần — dò riêng theo từng trục của toà.
    for (const s of truc) {
      if (s.toa_key !== t.key) continue;
      const ma = thoat(String(s.truc).padStart(2, "0"));
      const re = new RegExp(`(?<![A-Z0-9.])(?:${ten.map((x) => x.split(" ").map(thoat).join(" ?")).join("|")})[ .]?(?:XX|[0-9]{1,2})${ma}(?![0-9])`);
      if (re.test(chu)) { khopToa.add(t.key); khopTruc.add(t.key); }
    }
  }
  if (khopToa.size !== 1) return "khong";
  return khopTruc.size ? "truc" : "toa";
}

/** Tầng của một bài: khu × mức; trục của GP gộp vào toà GP. */
export function tangCua(khu, muc) {
  if (khu === "gp" && muc === "truc") return "gp-toa";
  return `${khu}-${muc}`;
}

/** Cận dưới Wilson (z = 1,96) khi đúng hết n ca — trần đạt được của một tầng cỡ n. */
export function wilsonDuoiDungHet(n) {
  if (!n) return 0;
  const z = 1.96, z2 = z * z;
  return (n + z2 / 2 - z * Math.sqrt(z2 / 4)) / (n + z2);
}

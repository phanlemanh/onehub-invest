// che-ten-nguon-gia-tri.mjs — che tên nguồn thật (tầng A, ADR-0007) trong MỘT giá trị ô dữ liệu trước khi rời máy thu.
// GS phán 25/11 (HT18 ban-chep-da-loc-cho-may-phat-trien, sổ d-20261125T065357Z-25); HT26 dùng lại nguyên cho sync-cloud — nên hàm
// không biết bảng, cột hay DB: nhận giá trị + entries ({ code, realName, wholeOnly } của docSourceNameEntries), trả giá trị đã che +
// số chỗ che. Lõi khớp và lõi thay là findSourceNames/maskSourceNames của mask-source-names.mjs — không có bản thứ hai.
// Luật:
//   - chữ tự do → thay tên nguồn bằng mã S0x (maskSourceNames);
//   - phần tử URL trúng trong mảng (mảng json hay text[]) → BỎ phần tử khỏi mảng, không thay chữ (URL thay chữ là URL hỏng);
//   - khoá json trúng → đổi tên khoá thành mã («<tên>_id» → «S0x_id»); giá trị trúng → mã; đi sâu mọi cấp;
//   - ô URL đứng riêng (cột tên có `url`/`photo`, hoặc giá trị bắt đầu http(s)://) mà trúng → NULL, không thay chữ (GS 25/11:
//     «URL thay chữ là URL chết»). Dùng cheO(giaTri, entries, { cot }) cho một ô; cheGiaTri cho giá trị không gắn cột.
// Từ điển rỗng → ném (đóng chặt: không biết tên thì không được coi là đã che).
import { findSourceNames, maskSourceNames } from "./mask-source-names.mjs";

/** Chuỗi trông như URL: có lược đồ, bắt đầu «//» hay «www.», hoặc «máy.chủ/đường» không khoảng trắng (photo_urls lưu dạng này). */
export function laUrl(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (/\s/.test(t)) return false;
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(t) || /^www\./i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(:[0-9]+)?\/\S*$/i.test(t);
}

/**
 * Che một giá trị đã giải (chuỗi, mảng, đối tượng json; số/bool/null giữ nguyên). Trả { giaTri, soCho } — soCho đếm số tên bị thay
 * cộng số khoá đổi tên cộng số phần tử URL bị bỏ; 0 thì giaTri là chính giá trị vào.
 */
export function cheGiaTri(giaTri, entries) {
  if (!entries?.length) throw new Error("che-ten-nguon-gia-tri: từ điển tên nguồn rỗng — không che được");
  let soCho = 0;
  const cheChu = (s) => {
    const n = findSourceNames(s, entries).length;
    if (!n) return s;
    soCho += n;
    return maskSourceNames(s, entries);
  };
  const di = (v) => {
    if (typeof v === "string") return cheChu(v);
    if (Array.isArray(v)) {
      const out = [];
      for (const x of v) {
        if (laUrl(x) && findSourceNames(x, entries).length) { soCho += 1; continue; }
        out.push(di(x));
      }
      return out;
    }
    if (v && typeof v === "object" && !(JSON.isRawJSON && JSON.isRawJSON(v))) {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[cheChu(k)] = di(x);
      return out;
    }
    return v;
  };
  const ra = di(giaTri);
  return { giaTri: soCho ? ra : giaTri, soCho };
}

/** JSON.parse giữ nguyên chữ số gốc (JSON.rawJSON, Node ≥ 21): che rồi ghi lại không làm tròn số của jsonb. */
export function docJson(text) {
  if (typeof JSON.rawJSON !== "function") return JSON.parse(text);
  return JSON.parse(text, (_k, v, ctx) => (typeof v === "number" && ctx?.source !== undefined ? JSON.rawJSON(ctx.source) : v));
}

/** Che một ô json ở dạng chữ. Trả { text, soCho }; không che gì thì text là chuỗi vào. */
export function cheChuJson(text, entries) {
  const { giaTri, soCho } = cheGiaTri(docJson(text), entries);
  return { text: soCho ? JSON.stringify(giaTri) : text, soCho };
}

/** Tên cột chứa URL (listing_url, photo_urls, photo…). */
export const laCotUrl = (cot) => /url|photo/i.test(String(cot ?? ""));

/**
 * Che MỘT ô của cột `cot`. Ô chữ đứng riêng là URL (theo tên cột hoặc giá trị http(s)://) mà trúng → { giaTri: null, soCho: 1 };
 * còn lại như cheGiaTri (mảng trong cột URL vẫn chỉ bỏ phần tử trúng, không NULL cả ô).
 */
export function cheO(giaTri, entries, { cot } = {}) {
  if (!entries?.length) throw new Error("che-ten-nguon-gia-tri: từ điển tên nguồn rỗng — không che được");
  if (typeof giaTri === "string" && (laCotUrl(cot) || /^\s*https?:\/\//i.test(giaTri)) && findSourceNames(giaTri, entries).length) {
    return { giaTri: null, soCho: 1 };
  }
  return cheGiaTri(giaTri, entries);
}

/** Như cheChuJson cho một ô json của cột `cot`: json là một chuỗi URL đứng riêng mà trúng → text null. */
export function cheOJson(text, entries, { cot } = {}) {
  const { giaTri, soCho } = cheO(docJson(text), entries, { cot });
  return { text: !soCho ? text : giaTri === null ? null : JSON.stringify(giaTri), soCho };
}

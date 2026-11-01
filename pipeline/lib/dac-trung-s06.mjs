// dac-trung-s06.mjs — HD5: đọc đặc trưng nhà của một tin S06 (stg_chotot_ads) thành phát biểu trường. Hàm thuần.
// Mỗi phần tử {field, value, rule_id}: rule_id = khoá nguồn đã đọc (căn cứ của phát biểu). Giá trị rác không thành phát
// biểu: số ≤ 0, chữ rỗng, chữ ở trường số, mặt tiền/chiều dài > 200 m, số tầng > 100, WC > 50, toạ độ ngoài khung Việt Nam.
import { ASSERTION_FIELD } from "./vocab.generated.mjs";

/** Khung toạ độ Việt Nam (gồm đảo): vĩ 8–24, kinh 102–110. */
const KHUNG_VN = { vi: [8, 24], kinh: [102, 110] };
const TRAN = { met: 200, tang: 100, wc: 50 };

/** Số từ giá trị nguồn: số JSON, hoặc chuỗi số (dấu phẩy thập phân, đuôi «m»/«tầng» cho phép). Không đọc được → null. */
export function docSo(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:m|mét|tầng|t)?\s*$/i.exec(v);
  return m ? Number(m[1].replace(",", ".")) : null;
}

const chu = (v) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");
const soChu = (n) => String(Number(n));

/**
 * @param {{payload?: object, toilets?: number|null, latitude?: number|null, longitude?: number|null}} ad
 * @returns {{field: string, value: string, rule_id: string}[]}
 */
export function docDacTrungS06(ad) {
  const p = ad?.payload ?? {};
  const out = [];
  const them = (field, value, rule_id) => out.push({ field, value, rule_id });

  const soNha = chu(p.street_number) ? ["street_number", chu(p.street_number)] : chu(p.streetnumber_display) ? ["streetnumber_display", chu(p.streetnumber_display)] : null;
  if (soNha) them(ASSERTION_FIELD.street_number, soNha[1], `payload.${soNha[0]}`);

  const maCan = chu(p.unitnumber_display) ? ["unitnumber_display", chu(p.unitnumber_display)] : chu(p.unitnumber) ? ["unitnumber", chu(p.unitnumber)] : null;
  if (maCan) them(ASSERTION_FIELD.unit_number, maCan[1], `payload.${maCan[0]}`);

  const ngang = docSo(p.width);
  const dai = docSo(p.length);
  const ngangOk = ngang != null && ngang > 0 && ngang <= TRAN.met;
  const daiOk = dai != null && dai > 0 && dai <= TRAN.met;
  if (ngangOk) them(ASSERTION_FIELD.frontage_length, soChu(ngang), "payload.width");
  if (ngangOk && daiOk) them(ASSERTION_FIELD.lot_size_dimensions, `${soChu(ngang)} x ${soChu(dai)}`, "payload.width+payload.length");

  const tang = docSo(p.floors);
  if (tang != null && Number.isInteger(tang) && tang > 0 && tang <= TRAN.tang) them(ASSERTION_FIELD.stories, soChu(tang), "payload.floors");

  const wc = docSo(ad?.toilets);
  if (wc != null && Number.isInteger(wc) && wc > 0 && wc <= TRAN.wc) them(ASSERTION_FIELD.bathrooms, soChu(wc), "toilets");

  const vi = docSo(ad?.latitude);
  const kinh = docSo(ad?.longitude);
  if (vi != null && kinh != null && vi >= KHUNG_VN.vi[0] && vi <= KHUNG_VN.vi[1] && kinh >= KHUNG_VN.kinh[0] && kinh <= KHUNG_VN.kinh[1]) {
    them(ASSERTION_FIELD.latitude, soChu(vi), "latitude");
    them(ASSERTION_FIELD.longitude, soChu(kinh), "longitude");
  }
  return out;
}

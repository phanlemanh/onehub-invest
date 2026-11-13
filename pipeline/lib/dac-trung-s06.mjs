// dac-trung-s06.mjs — HD5: đọc đặc trưng nhà của một tin S06 (stg_chotot_ads) thành phát biểu trường. Hàm thuần.
// Mỗi phần tử {field, value, rule_id}: rule_id = khoá nguồn đã đọc (căn cứ của phát biểu). Giá trị rác không thành phát
// biểu: số ≤ 0, chữ rỗng, chữ ở trường số, mặt tiền/chiều dài > 200 m, số tầng > 100, WC > 50, toạ độ ngoài khung Việt Nam.
import { ASSERTION_FIELD } from "./vocab.generated.mjs";
import { chuaDaySo } from "./sdt-trong-chuoi.mjs";

/** Khung toạ độ Việt Nam (gồm đảo): vĩ 8–24, kinh 102–110. */
const KHUNG_VN = { vi: [8, 24], kinh: [102, 110] };
const TRAN = { met: 200, tang: 100, wc: 50 };
// DA5: mã căn chỉ gồm chữ số 0 hay đúng «1», số nhà chỉ gồm chữ số 0 là rác (điều kiện bật của hàng DA5).
const MA_CAN_RAC = /^(0+|1)$/;
const SO_NHA_RAC = /^0+$/;

/** Số từ giá trị nguồn: số JSON, hoặc chuỗi số (dấu phẩy thập phân, đuôi «m»/«tầng» cho phép). Không đọc được → null. */
export function docSo(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*(?:m|mét|tầng|t)?\s*$/i.exec(v);
  return m ? Number(m[1].replace(",", ".")) : null;
}

// DS1: chuỗi mở đầu bằng địa danh hành chính không phải tên đường. Xã, TP, Thành phố, Tỉnh chỉ bỏ khi có dấu phẩy, để giữ
// «Xã Đàn», «Tỉnh lộ 10», «TP Giao Lưu».
const DIA_DANH = /^(?:(?:phường|quận|huyện|thị trấn|thị xã)(?!\p{L})|[pq]\.)/iu;
const DIA_DANH_CO_PHAY = /^(?:xã|tp\.?|thành phố|tỉnh(?!\s+lộ))(?!\p{L})[^,]*,/iu;
// Nguồn đôi khi trả street_name đã mã hoá (base64 dài 44 ký tự, không khoảng trắng): không phải tên đường.
const MA_HOA = /^[A-Za-z0-9+/_-]{32,}={0,2}$/;

/** Tên đường từ `payload.street_name`: NFC, cắt đầu cuối, gộp khoảng trắng; giữ tiền tố «Đường», số nhà và phần sau phẩy vì
 *  `khoaDuong` xử các dạng đó khi so. Không phải chữ, rỗng, hay chỉ là địa danh → null. */
export function docDuong(v) {
  if (typeof v !== "string") return null;
  const t = v.normalize("NFC").trim().replace(/\s+/g, " ");
  if (!t || DIA_DANH.test(t) || DIA_DANH_CO_PHAY.test(t)) return null;
  if (MA_HOA.test(t)) return null;
  if (chuaDaySo(t)) return null;
  return t;
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

  const duong = docDuong(p.street_name);
  if (duong) them(ASSERTION_FIELD.street_raw, duong, "payload.street_name");

  // DA5: *_display của S06 là cờ hiển thị (chỉ 0, 1 — đo 12/11), không phải giá trị: chỉ đọc trường thật.
  const soNha = chu(p.street_number);
  if (soNha && !SO_NHA_RAC.test(soNha)) them(ASSERTION_FIELD.street_number, soNha, "payload.street_number");

  const maCan = chu(p.unitnumber);
  if (maCan && !MA_CAN_RAC.test(maCan)) them(ASSERTION_FIELD.unit_number, maCan, "payload.unitnumber");

  // DA5: toà của tin từ trường block của nguồn — chữ thô (BuildingName), chuẩn hoá toà ở danh bạ.
  const toa = chu(p.block).normalize("NFC").replace(/\s+/g, " ");
  if (toa) them(ASSERTION_FIELD.block_raw, toa, "payload.block");

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

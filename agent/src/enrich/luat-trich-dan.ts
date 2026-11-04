// luat-trich-dan.ts — luật XÁC ĐỊNH cho việc máy tự điền loại hình (hồ sơ s03-llm-doc-toan-bo, Hỏi-3): câu trích của model phải có
// thật trong chữ, chứa từ khoá căn hộ hoặc dạng số phòng, không dính ngữ cảnh loại trừ. Độ tự tin của model không phải căn cứ (luật 7).
// Chỉ căn hộ có quyền tự điền; loại khác luôn lên thẻ (đo 02/11: Haiku nói loại khác đúng 1/10).
import { PROPERTY_TYPE } from "../vocab.generated.js";

export type KetTrich =
  | { ok: true; ma: string }
  | { ok: false; lyDo: "khong-co-trich" | "trich-gia" | "khong-tu-khoa" | "tu-khoa-loai-khac" | "ngu-canh-loai-tru" };

/** NFC, gộp khoảng trắng, chữ thường — chỉ để so, không đổi chữ lưu. */
export function chuanHoaSoTrich(s: string): string {
  return String(s ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

export function trichCoThat(quote: string | null, chu: string): boolean {
  if (!quote) return false;
  const q = chuanHoaSoTrich(quote);
  return q.length > 0 && chuanHoaSoTrich(chu).includes(q);
}

const tu = (m: string) => new RegExp(`(?<![\\p{L}\\p{N}])(?:${m})(?![\\p{L}\\p{N}])`, "u");
const CAN_HO = "căn hộ|chung cư|cc";
const TU_KHOA_CAN_HO = tu(CAN_HO);
const TU_KHOA_LOAI_KHAC = tu("nhà phố|nhà riêng|nhà mặt phố|nhà mặt tiền|nhà ngõ|nhà trong ngõ|biệt thự|liền kề|shophouse|đất nền|lô đất|mảnh đất|đất thổ cư|phòng trọ|nhà trọ|mặt bằng|văn phòng|ki ốt|kiot");
// Từ đứng trước từ khoá nói về nơi chốn hay nhu cầu, không phải thứ đang rao. Cho phép xen tối đa hai từ («gần khu chung cư»).
const NGU_CANH_TRUOC = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:gần|cạnh|sát|đối diện|cách|cần mua|cần tìm|cần thuê|tìm mua|tìm thuê|khách tìm)\\s+(?:[\\p{L}\\p{N}]+\\s+){0,2}(?:${CAN_HO})(?![\\p{L}\\p{N}])`, "u");
/** Số ký tự đứng trước câu trích được xét cùng: model có thể trích «chung cư X» từ câu «gần chung cư X». */
const CUA_SO_TRUOC = 24;

// Nhánh số phòng (s03-noi-luat-trich-dan): môi giới viết «2PN», «1N+», «studio» thay cho «căn hộ». Không tự nói loại hình bằng từ khoá cũ,
// nên chỉ đạt khi model đã nói căn hộ và cả thân bài không có từ của loại khác. Không nhận «1+», «căn», tên toà (Hỏi-2).
const SO_PHONG = "[1-5]\\s*(?:pn|n|phòng ngủ)(?:\\s*\\+\\s*\\d?)?(?:\\s*\\d?\\s*(?:wc|vs|w))?|studio|stu";
const TU_KHOA_SO_PHONG = tu(SO_PHONG);
const TU_NHA = tu("nhà");
/** Danh sách đóng của chốt thân bài (hợp đồng AC-2): bỏ oan vài bài «view biệt thự», đổi lại không tự ghi căn hộ cho bài nhà phố có «3PN». */
export const DANH_SACH_LOAI_KHAC_THAN = [
  "nhà phố", "nhà riêng", "nhà mặt phố", "nhà mặt tiền", "nhà ngõ", "nhà trong ngõ", "nhà \\d+ tầng", "biệt thự", "liền kề", "shophouse", "đất nền", "lô đất",
  "mảnh đất", "đất thổ cư", "phòng trọ", "nhà trọ", "mặt bằng", "văn phòng", "ki ốt", "kiot",
  "nha pho", "nha rieng", "biet thu", "lien ke", "dat nen", "phong tro", "mat bang", "van phong",
] as const;
const TU_LOAI_KHAC_THAN = tu(DANH_SACH_LOAI_KHAC_THAN.join("|"));
const NGU_CANH_TRUOC_SO_PHONG = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:gần|cạnh|sát|đối diện|cách|cần mua|cần tìm|cần thuê|tìm mua|tìm thuê|khách tìm)\\s+(?:[\\p{L}\\p{N}]+\\s+){0,2}(?:${SO_PHONG})(?![\\p{L}\\p{N}])`, "u");

export function kiemTrichLoai(value: string, quote: string | null, chu: string): KetTrich {
  if (!quote || !chuanHoaSoTrich(quote)) return { ok: false, lyDo: "khong-co-trich" };
  if (!trichCoThat(quote, chu)) return { ok: false, lyDo: "trich-gia" };
  if (value !== PROPERTY_TYPE.apartment) return { ok: false, lyDo: "tu-khoa-loai-khac" };
  const q = chuanHoaSoTrich(quote);
  const co = TU_KHOA_CAN_HO.test(q);
  const khac = TU_KHOA_LOAI_KHAC.test(q);
  if (!co && khac) return { ok: false, lyDo: "tu-khoa-loai-khac" };
  if (khac) return { ok: false, lyDo: "ngu-canh-loai-tru" };
  const c = chuanHoaSoTrich(chu);
  const i = c.indexOf(q);
  if (!co) {
    if (!TU_KHOA_SO_PHONG.test(q)) return { ok: false, lyDo: "khong-tu-khoa" };
    const duoi = c.slice(Math.max(0, i - CUA_SO_TRUOC), i + q.length);
    if (TU_NHA.test(q) || TU_LOAI_KHAC_THAN.test(c) || NGU_CANH_TRUOC_SO_PHONG.test(duoi)) return { ok: false, lyDo: "ngu-canh-loai-tru" };
    return { ok: true, ma: "trich-dan:so-phong" };
  }
  if (NGU_CANH_TRUOC.test(c.slice(Math.max(0, i - CUA_SO_TRUOC), i + q.length))) return { ok: false, lyDo: "ngu-canh-loai-tru" };
  return { ok: true, ma: "trich-dan:can-ho" };
}

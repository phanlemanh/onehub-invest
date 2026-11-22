// cau-hinh.ts — NB1 cham-bong-bo-sung-tin: cấu hình lượt chấm bóng (agent/config/cham-bong-bo-sung-tin.json). Đúng hai model khác
// nhau, cả hai trong danh sách đóng MODEL_DUYET (ADR-0007 sửa 06/11; Hỏi-1 Cổng Phạm vi NB1: Haiku 5.5 + DeepSeek V4.1 Flash). Giá
// token (USD mỗi triệu token) chép bảng của doc-gop-s03; trần tiền mỗi lượt (Hỏi-2, mặc định 3 USD). Tệp sai thì dừng trước lời gọi đầu.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DUONG, DUONG_ANTHROPIC, MODEL_DUYET, dsDuong, type Duong } from "../doc-gop-s03/cau-hinh.js";

export type ModelCham = { khoa: string; gateway: string; duong: Duong[]; gia_vao: number; gia_ra: number };
export type CauHinhCham = { phien_ban: 1; prompt_version: string; tran_usd: number; model: [ModelCham, ModelCham] };
export const DUONG_CAU_HINH = join(import.meta.dirname, "../../../config/cham-bong-bo-sung-tin.json");

const banGhi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const soKhongAm = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;

/** Kiểm cấu hình đã parse; sai thì ném Error gọi tên chỗ sai. */
export function kiemCauHinhCham(x: unknown): CauHinhCham {
  if (!banGhi(x)) throw new Error("cấu hình chấm bóng: không phải object JSON");
  if (x.phien_ban !== 1) throw new Error(`cấu hình chấm bóng: phien_ban phải là 1, nhận ${JSON.stringify(x.phien_ban)}`);
  if (typeof x.prompt_version !== "string" || !x.prompt_version) throw new Error("cấu hình chấm bóng: thiếu prompt_version");
  if (typeof x.tran_usd !== "number" || !(x.tran_usd > 0)) throw new Error(`cấu hình chấm bóng: tran_usd phải > 0, nhận ${JSON.stringify(x.tran_usd)}`);
  if (!Array.isArray(x.model) || x.model.length !== 2) throw new Error("cấu hình chấm bóng: model phải có đúng hai phần tử");
  const ra: ModelCham[] = x.model.map((m: unknown, i: number) => {
    if (!banGhi(m)) throw new Error(`cấu hình chấm bóng: model[${i}] không phải object`);
    if (typeof m.khoa !== "string" || !m.khoa) throw new Error(`cấu hình chấm bóng: model[${i}] thiếu khoa`);
    if (typeof m.gateway !== "string" || !(MODEL_DUYET as readonly string[]).includes(m.gateway)) {
      throw new Error(`cấu hình chấm bóng: model ${m.khoa} dùng ${JSON.stringify(m.gateway)} ngoài ba mã đã duyệt (${MODEL_DUYET.join(", ")})`);
    }
    const duong = dsDuong(m.duong);
    if (!duong.length || new Set(duong).size !== duong.length) throw new Error(`cấu hình chấm bóng: model ${m.khoa} có duong rỗng hay lặp`);
    for (const d of duong) {
      if (!(DUONG as readonly unknown[]).includes(d)) throw new Error(`cấu hình chấm bóng: model ${m.khoa} có duong ${JSON.stringify(d)}`);
      if (d === "anthropic" && !DUONG_ANTHROPIC[m.gateway]) throw new Error(`cấu hình chấm bóng: model ${m.khoa} không có đường anthropic`);
    }
    if (!soKhongAm(m.gia_vao) || !soKhongAm(m.gia_ra)) throw new Error(`cấu hình chấm bóng: model ${m.khoa} thiếu gia_vao/gia_ra`);
    return { khoa: m.khoa, gateway: m.gateway, duong, gia_vao: m.gia_vao, gia_ra: m.gia_ra };
  });
  if (ra[0].gateway === ra[1].gateway) throw new Error(`cấu hình chấm bóng: hai model trùng ${ra[0].gateway} — hai lần đọc phải độc lập`);
  if (ra[0].khoa === ra[1].khoa) throw new Error(`cấu hình chấm bóng: hai model trùng khoa ${ra[0].khoa}`);
  return { phien_ban: 1, prompt_version: x.prompt_version, tran_usd: x.tran_usd, model: [ra[0], ra[1]] };
}

/** Nạp cấu hình từ tệp; `sha` là sha256 hex của byte tệp (ghi vào tổng kết lượt). */
export function napCauHinhCham(duong: string = DUONG_CAU_HINH): { cauHinh: CauHinhCham; sha: string } {
  const byte = readFileSync(duong);
  let x: unknown;
  try {
    x = JSON.parse(byte.toString("utf8"));
  } catch (e) {
    throw new Error(`cấu hình chấm bóng: ${duong} không phải JSON (${(e as Error).message})`);
  }
  return { cauHinh: kiemCauHinhCham(x), sha: createHash("sha256").update(byte).digest("hex") };
}

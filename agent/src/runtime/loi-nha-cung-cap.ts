// loi-nha-cung-cap.ts — goi-thang-anthropic: phân lớp lỗi của lời gọi model (API Anthropic thẳng hay Vercel AI Gateway) thành
// chuỗi ai_calls.loi `<lớp>:<http|->:<kiểu|->:<tên lớp>` (≤ 80 ký tự, CHECK của migration 052). Chỉ chép mã HTTP và kiểu lỗi
// (token máy đọc như `billing_error`), KHÔNG chép message hay responseBody (có thể mang nội dung prompt).
// Lớp `het-tien` và `khoa` (401/403) là hai lớp dừng sớm cả lượt. `het-tien` gồm: HTTP 402, kiểu billing_error /
// insufficient_funds, và ca API Anthropic báo hết credit bằng 400 invalid_request_error «credit balance is too low» (gap-probe P0).
// Ca cuối là chỗ DUY NHẤT đọc message — chỉ để so mẫu, không chép vào sổ (kiểu ghi là `credit_balance`).
import { tenLop } from "./ai-call-log.js";

export type LopLoi = "het-tien" | "khoa" | "han-muc" | "may-chu" | "het-gio" | "mang" | "khac";
export type PhanLoai = { lop: LopLoi; http: number | null; kieu: string | null; ten: string };

const KIEU_HET_TIEN = new Set(["billing_error", "insufficient_funds", "credit_balance"]);
/** API Anthropic trả 400 invalid_request_error với câu «Your credit balance is too low…» khi tổ chức hết credit. */
const MAU_HET_CREDIT = /credit balance is too low/i;
const banGhi = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object";
/** Kiểu lỗi chỉ nhận dạng token (chữ thường, số, gạch dưới) để không có chữ tự do nào lọt vào sổ. */
const token = (v: unknown): string | null => (typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v) ? v : null);

function soHttp(e: Record<string, unknown>): number | null {
  for (const k of ["status", "statusCode"]) {
    const v = e[k];
    if (typeof v === "number" && Number.isInteger(v) && v >= 100 && v <= 599) return v;
  }
  return null;
}

/** Kiểu lỗi, ưu tiên kiểu GỐC của nhà cung cấp: `error.type` trong responseBody (của lỗi hay lỗi gốc `cause` — Gateway gói 402
 * `insufficient_funds` thành GatewayInternalServerError mang `.type` của lớp gói), rồi thân lỗi `error.error.type` / `error.type`
 * (SDK Anthropic), cuối cùng `.type` trên chính lỗi. */
function kieuLoi(e: Record<string, unknown>): string | null {
  for (const nguon of [e, e.cause]) {
    if (!banGhi(nguon)) continue;
    const body = nguon.responseBody;
    if (typeof body !== "string") continue;
    try {
      const o = JSON.parse(body);
      const k = banGhi(o) && banGhi(o.error) ? token(o.error.type) : null;
      if (k) return k;
    } catch {
      /* thân không phải JSON — bỏ */
    }
  }
  const than = banGhi(e.error) && banGhi(e.error.error) ? token(e.error.error.type) : banGhi(e.error) ? token(e.error.type) : null;
  return than ?? token(e.type);
}

export function phanLoaiLoi(err: unknown): PhanLoai {
  const ten = tenLop(err);
  if (!banGhi(err)) return { lop: "khac", http: null, kieu: null, ten };
  let http = soHttp(err);
  if (http === null && banGhi(err.cause)) http = soHttp(err.cause);
  let kieu = kieuLoi(err);
  const msg = typeof err.message === "string" ? err.message : "";
  if (http === 400 && MAU_HET_CREDIT.test(msg)) kieu = "credit_balance";
  let lop: LopLoi;
  if (http === 402 || (kieu && KIEU_HET_TIEN.has(kieu))) lop = "het-tien";
  else if (http === 401 || http === 403) lop = "khoa";
  else if (http === 429) lop = "han-muc";
  else if (http !== null && http >= 500) lop = "may-chu";
  else if (/Timeout|Abort/i.test(ten)) lop = "het-gio";
  else if (/Connection|Fetch|Network/i.test(ten) || (err as { code?: unknown }).code === "ECONNREFUSED") lop = "mang";
  else lop = "khac";
  return { lop, http, kieu, ten };
}

/** Chuỗi ghi vào ai_calls.loi. */
export function chuoiLoi(p: PhanLoai): string {
  return `${p.lop}:${p.http ?? "-"}:${p.kieu ?? "-"}:${p.ten}`.slice(0, 80);
}

/** Lớp làm cả lượt dừng ngay: hết tiền, hay khoá sai/bị từ chối. */
export const laLopDung = (lop: LopLoi | null | undefined): lop is "het-tien" | "khoa" => lop === "het-tien" || lop === "khoa";

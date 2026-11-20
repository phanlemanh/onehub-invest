// trinh-duyet.ts — MỘT CHỖ CẤU HÌNH trình duyệt cho mọi bộ thu (2011-5, trình duyệt chuyên dụng).
// Mạnh duyệt thứ tự ứng viên: (1) Chrome for Testing ghim bản → (2) Chrome Beta →
// (3) Chrome thường «chỉ bộ thu». Chọn qua env, đổi ứng viên KHÔNG sửa từng bộ thu:
//   ONEHUB_TRINH_DUYET = chrome | cft | beta        (mặc định chrome)
//   ONEHUB_BROWSER_CFT  = đường tuyệt đối Chrome for Testing (bắt buộc khi chọn cft)
//   ONEHUB_BROWSER_BETA = đường tuyệt đối Chrome Beta        (bắt buộc khi chọn beta)
//   ONEHUB_PROFILE_GOC  = gốc profile NGOÀI KHO, mỗi nguồn một ngăn
//                        (mặc định <home>/onehub-collector-profiles)
// Ngăn profile: <gốc>/<mã-nguồn> — tầng A (phiên/cookies không rời máy, không vào kho).
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type BrowserType } from "playwright-core";

export type UngVien = "chrome" | "cft" | "beta";

export function ungVienHienTai(env: NodeJS.ProcessEnv = process.env): UngVien {
  const v = (env.ONEHUB_TRINH_DUYET ?? "chrome") as UngVien;
  if (v !== "chrome" && v !== "cft" && v !== "beta") {
    throw new Error(`ONEHUB_TRINH_DUYET sai: '${v}' — chỉ chrome | cft | beta`);
  }
  return v;
}

/** Đường executable theo ứng viên; chrome = undefined (channel "chrome"). */
export function duongThucThi(ungVien: UngVien, env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (ungVien === "chrome") return undefined;
  const duong = ungVien === "cft" ? env.ONEHUB_BROWSER_CFT : env.ONEHUB_BROWSER_BETA;
  if (!duong) throw new Error(`chọn ${ungVien} nhưng thiếu ONEHUB_BROWSER_${ungVien.toUpperCase()}`);
  return duong;
}

/** Ngăn profile của một nguồn: <ONEHUB_PROFILE_GOC>/<mã-nguồn> (tạo nếu chưa có). */
export function nganProfile(maNguon: string, env: NodeJS.ProcessEnv = process.env): string {
  const goc = env.ONEHUB_PROFILE_GOC ?? join(homedir(), "onehub-collector-profiles");
  if (!maNguon || /[\\/]/.test(maNguon)) throw new Error(`mã nguồn ngăn profile không hợp lệ: '${maNguon}'`);
  const duong = join(goc, maNguon);
  mkdirSync(duong, { recursive: true });
  return duong;
}

export type CauHinhMo = {
  headless?: boolean;
  viewport?: { width: number; height: number };
  locale?: string;
};

/** 1911-5 (MỞ LẠI): hàm THUẦN dựng tuỳ chọn mở theo ứng viên — đo được bằng đột biến:
 * cft/beta → executablePath ĐÚNG ĐƯỜNG và KHÔNG có channel; chrome → channel chrome
 * và không executablePath. moTrinhDuyet/moTrinhDuyetTam chỉ gọi hàm này. */
export function dungTuyChonMo(
  ungVien: UngVien,
  env: NodeJS.ProcessEnv,
  cauHinh: CauHinhMo = {},
): { executablePath?: string; channel?: string; headless: boolean; locale: string } {
  const exec = duongThucThi(ungVien, env);
  return exec
    ? { executablePath: exec, headless: cauHinh.headless ?? false, locale: cauHinh.locale ?? "en-US" }
    : { channel: "chrome", headless: cauHinh.headless ?? false, locale: cauHinh.locale ?? "en-US" };
}

/** Mở TRÌNH DUYỆT CHUYÊN DỤNG dạng persistent (phiên giữ giữa các lượt — S02/S05/S06).
 * executablePath theo ứng viên hiện tại; KHÔNG bao giờ dùng channel khi có đường riêng. */
export async function moTrinhDuyet(
  maNguon: string,
  cauHinh: CauHinhMo = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<BrowserContext> {
  const tuyChon = dungTuyChonMo(ungVienHienTai(env), env, cauHinh);
  const launchOpts: Parameters<BrowserType["launchPersistentContext"]>[1] = {
    ...tuyChon,
    viewport: cauHinh.viewport ?? { width: 1440, height: 900 },
  };
  return chromium.launchPersistentContext(nganProfile(maNguon, env), launchOpts);
}

/** Mở TRÌNH DUYỆT CHUYÊN DỤNG dạng launch thường, KHÔNG profile (bộ thu khám phá — S01):
 * phiên không cần giữ; vẫn qua cùng ứng viên để đo chống bot đồng nhất. */
export async function moTrinhDuyetTam(
  cauHinh: CauHinhMo = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<Browser> {
  const tuyChon = dungTuyChonMo(ungVienHienTai(env), env, cauHinh);
  const launchOpts: Parameters<BrowserType["launch"]>[0] = {
    ...tuyChon,
    headless: tuyChon.headless,
  };
  delete (launchOpts as Record<string, unknown>).locale;
  return chromium.launch(launchOpts);
}

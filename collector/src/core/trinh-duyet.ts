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

/** Mở TRÌNH DUYỆT CHUYÊN DỤNG dạng persistent (phiên giữ giữa các lượt — S02/S05/S06).
 * executablePath theo ứng viên hiện tại; KHÔNG bao giờ dùng channel khi có đường riêng. */
export async function moTrinhDuyet(
  maNguon: string,
  cauHinh: CauHinhMo = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<BrowserContext> {
  const ungVien = ungVienHienTai(env);
  const exec = duongThucThi(ungVien, env);
  const launchOpts: Parameters<BrowserType["launchPersistentContext"]>[1] = {
    headless: cauHinh.headless ?? false,
    viewport: cauHinh.viewport ?? { width: 1440, height: 900 },
    locale: cauHinh.locale ?? "en-US",
  };
  if (exec) (launchOpts as Record<string, unknown>).executablePath = exec;
  else (launchOpts as Record<string, unknown>).channel = "chrome";
  return chromium.launchPersistentContext(nganProfile(maNguon, env), launchOpts);
}

/** Mở TRÌNH DUYỆT CHUYÊN DỤNG dạng launch thường, KHÔNG profile (bộ thu khám phá — S01):
 * phiên không cần giữ; vẫn qua cùng ứng viên để đo chống bot đồng nhất. */
export async function moTrinhDuyetTam(
  cauHinh: CauHinhMo = {},
  env: NodeJS.ProcessEnv = process.env,
): Promise<Browser> {
  const ungVien = ungVienHienTai(env);
  const exec = duongThucThi(ungVien, env);
  // launch thường (không persistent) không nhận viewport/locale ở LaunchOptions — bỏ qua
  const { viewport: _vp, locale: _lc, ...cauHinhLaunch } = cauHinh;
  const launchOpts: Parameters<BrowserType["launch"]>[0] = {
    headless: cauHinhLaunch.headless ?? false,
  };
  if (exec) (launchOpts as Record<string, unknown>).executablePath = exec;
  else (launchOpts as Record<string, unknown>).channel = "chrome";
  return chromium.launch(launchOpts);
}

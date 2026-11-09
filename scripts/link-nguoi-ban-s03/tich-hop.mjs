// tich-hop.mjs — bộ chạy tích hợp độc lập của làn Claude, thước cổng cho AC-1, AC-2, AC-3, AC-4, AC-9 của link-nguoi-ban-s03
// (giám sát duyệt 09/11, XONG U1-0911-5; thay quyết 07/11 «chỉ nối lệnh vào test ZCode» cho riêng hồ sơ này).
//
// Cây tạm = OpenClaw nền + extension.patch áp bằng git apply thật (trenCayOpenclaw). Tệp test tich-hop/bo-tra.tich-hop.test.ts của
// làn Claude (JavaScript thuần) được chép vào thư mục src của extension trên cây tạm rồi chạy bằng vitest của cây nguồn: bộ tra và Provider là mã THẬT
// của .patch; chỉ module kênh (lấy API bộ nghe tin đang nối) bị thay bằng API giả đếm mọi thuộc tính. Kho không viết tên thư mục
// extension hay tên module kênh: tệp test đọc chúng lúc chạy từ chính .patch và từ dòng import của bộ tra. Không chạm collector/**.
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PATCH, trenCayOpenclaw } from "./chung-zcode.mjs";
import { ROOT } from "./chung.mjs";

const DAY = dirname(fileURLToPath(import.meta.url));
export const MAU_TEST = join(DAY, "tich-hop", "bo-tra.tich-hop.test.mjs");
export const TEN_TREN_CAY = "lnb-tich-hop.test.ts";

/** Thư mục src của extension mà .patch thêm bộ tra vào (đọc từ .patch). */
export function thuMucExtension(patch = PATCH) {
  const m = readFileSync(patch, "utf8").match(/^\+\+\+ b\/(extensions\/[^/\s]+\/src)\/seller-lookup\.ts$/m);
  return m?.[1] ?? null;
}

/**
 * Chạy các ca của một nhóm eval (`E1`, `E2`, `E3`, `E4`, `E9`) trong bộ chạy tích hợp. Trả mã thoát của vitest; thiếu thứ gì → 2.
 * @param {string} nhom
 * @param {{ patch?: string }} [tuy] `patch` thay .patch của hồ sơ (phá thử trên bản sao)
 */
export function chayTichHop(nhom, { patch = PATCH } = {}) {
  if (!existsSync(MAU_TEST)) { console.error(`THIẾU tệp test tích hợp ${MAU_TEST.slice(ROOT.length + 1)}`); return 2; }
  const ext = existsSync(patch) ? thuMucExtension(patch) : null;
  if (!ext) { console.error("THIẾU khối seller-lookup.ts trong .patch — không biết thư mục extension"); return 2; }
  return trenCayOpenclaw((tam, sha, base) => {
    const dich = join(tam, ext, TEN_TREN_CAY);
    copyFileSync(MAU_TEST, dich);
    console.log(`tích hợp ${nhom}: OpenClaw ${base} @${sha.slice(0, 9)} + extension.patch (git apply thật)`);
    const r = spawnSync(join(tam, "node_modules", ".bin", "vitest"), ["run", join(ext, TEN_TREN_CAY), "-t", `\\[${nhom}\\]`],
      { cwd: tam, stdio: "inherit", env: { ...process.env, LNB_PATCH: patch, LNB_ROOT: ROOT, LNB_CAY: tam, LNB_HOME_THAT: homedir(),
        LNB_OPENCLAW_SRC: process.env.OPENCLAW_SRC ?? join(homedir(), "dev", "openclaw"), LNB_NEN_SHA: sha } });
    return r.status ?? 1;
  }, { patch });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [nhom = "E1", ...rest] = process.argv.slice(2);
  const i = rest.indexOf("--patch");
  process.exit(chayTichHop(nhom, i >= 0 ? { patch: rest[i + 1] } : {}));
}

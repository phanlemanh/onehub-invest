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

/** Che tên kênh trong một đoạn chữ: tên thư mục extension (`ext` = extensions/<thư mục>/src) và phần gốc của nó. */
export function cheTenKenh(text, ext) {
  const thuMuc = ext.split("/")[1] ?? "";
  const gocTen = thuMuc.replace(/user$/i, "");
  let ra = thuMuc ? text.split(thuMuc).join("<ext>") : text;
  if (gocTen.length >= 3) ra = ra.replace(new RegExp(gocTen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<kenh>");
  return ra;
}

/**
 * Khuôn của .patch trước khi áp: mọi hunk của mọi tệp có dòng ngữ cảnh (khối -U0 làm git apply đặt dòng sai chỗ mà không báo —
 * 09/11 một dòng rơi ra ngoài hàm làm module kênh vỡ lúc nạp), và đường a/ trùng đường b/ (tệp mới thì a/ là /dev/null). Thuần.
 * @returns {string[]} lỗi, mỗi lỗi một dòng; rỗng là đạt
 */
export function kiemKhuonPatch(text) {
  const loi = [];
  for (const khoi of text.split(/^diff --git /m).slice(1)) {
    const dau = khoi.split("\n")[0];
    const m = dau.match(/^a\/(\S+) b\/(\S+)$/);
    const tenB = m?.[2] ?? dau;
    // Không in tên kênh: tên thư mục extension và phần gốc của nó (bỏ hậu tố «user») thay bằng chỗ thế, cả trong tên tệp.
    const thuMuc = tenB.match(/^extensions\/([^/]+)\//)?.[1] ?? "";
    const gocTen = thuMuc.replace(/user$/i, "");
    let ten = thuMuc ? tenB.split(thuMuc).join("<ext>") : tenB;
    if (gocTen.length >= 3) ten = ten.replace(new RegExp(gocTen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<kenh>");
    const moi = /^--- \/dev\/null$/m.test(khoi);
    if (m && m[1] !== m[2] && !moi) loi.push(`${ten}: đường a/ khác đường b/ — .patch sinh từ cây khác cây nền`);
    const hunk = khoi.split(/^@@/m).slice(1);
    if (moi) continue;
    hunk.forEach((h, i) => {
      if (!h.split("\n").slice(1).some((l) => l.startsWith(" "))) loi.push(`${ten}: hunk ${i + 1} không có dòng ngữ cảnh (-U0)`);
    });
  }
  return loi;
}

/**
 * Chạy các ca của một nhóm eval (`E1`, `E2`, `E3`, `E4`, `E9`) trong bộ chạy tích hợp. Trả mã thoát của vitest; thiếu thứ gì → 2;
 * .patch sai khuôn → 1 kèm từng lỗi (lỗi của sản phẩm, không phải của phép đo).
 * @param {string} nhom
 * @param {{ patch?: string }} [tuy] `patch` thay .patch của hồ sơ (phá thử trên bản sao)
 */
export function chayTichHop(nhom, { patch = PATCH } = {}) {
  if (!existsSync(MAU_TEST)) { console.error(`THIẾU tệp test tích hợp ${MAU_TEST.slice(ROOT.length + 1)}`); return 2; }
  const ext = existsSync(patch) ? thuMucExtension(patch) : null;
  if (!ext) { console.error("THIẾU khối seller-lookup.ts trong .patch — không biết thư mục extension"); return 2; }
  const loiKhuon = kiemKhuonPatch(readFileSync(patch, "utf8"));
  if (loiKhuon.length) {
    for (const l of loiKhuon) console.error(`PATCH SAI KHUÔN: ${l}`);
    console.error("PATCH SAI KHUÔN — sinh lại bằng git diff mặc định (-U3) trên cây nền + thay đổi; các ca không chạy");
    return 1;
  }
  return trenCayOpenclaw((tam, sha, base) => {
    const dich = join(tam, ext, TEN_TREN_CAY);
    copyFileSync(MAU_TEST, dich);
    console.log(`tích hợp ${nhom}: OpenClaw ${base} @${sha.slice(0, 9)} + extension.patch (git apply thật)`);
    // Đầu ra của vitest in đường tệp (mang tên thư mục extension): hứng lại, che tên kênh rồi mới in — đầu ra lệnh chấm có thể
    // được chép vào run-log và báo cáo bằng chứng của kho công khai.
    const r = spawnSync(join(tam, "node_modules", ".bin", "vitest"), ["run", join(ext, TEN_TREN_CAY), "-t", `\\[${nhom}\\]`],
      { cwd: tam, encoding: "utf8", maxBuffer: 256 << 20, env: { ...process.env, LNB_PATCH: patch, LNB_ROOT: ROOT, LNB_CAY: tam, LNB_HOME_THAT: homedir(),
        LNB_OPENCLAW_SRC: process.env.OPENCLAW_SRC ?? join(homedir(), "dev", "openclaw"), LNB_NEN_SHA: sha } });
    process.stdout.write(cheTenKenh(r.stdout ?? "", ext));
    process.stderr.write(cheTenKenh(r.stderr ?? "", ext));
    return r.status ?? 1;
  }, { patch });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [nhom = "E1", ...rest] = process.argv.slice(2);
  const i = rest.indexOf("--patch");
  process.exit(chayTichHop(nhom, i >= 0 ? { patch: rest[i + 1] } : {}));
}

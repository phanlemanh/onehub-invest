// chung-zcode.mjs — gọi test có sẵn của làn ZCode cho các lệnh chấm tra · dung · thu · ranh-gioi · api · tien-kiem (giám sát quyết
// 07/11: làn Claude nối lệnh, KHÔNG sửa test hay mã của ZCode). Mỗi lệnh trả đúng mã thoát của test; test thiếu → thoát 2 có tên.
//
// Test vitest của bộ tra nằm trong _acceptance/link-nguoi-ban-s03/extension.patch, áp lên cây mã nguồn OpenClaw. Cây làm việc của
// ZCode không bị chạm: xuất bản sạch của ref nền (git archive) ra thư mục tạm, áp .patch, trỏ node_modules của từng gói về cây nguồn
// (chỉ đọc), rồi chạy vitest ở đó. OPENCLAW_SRC (mặc định ~/dev/openclaw) · OPENCLAW_BASE (mặc định nhánh feat/s03-ma-album-ext —
// .patch vá trên mã album).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { ROOT } from "./chung.mjs";

export const PATCH = join(ROOT, "_acceptance", "link-nguoi-ban-s03", "extension.patch");
/** Tệp test vitest của bộ tra: đường đọc từ chính .patch (tệp `.test.ts` đầu tiên nó thêm) — kho không viết tên thư mục extension. */
export function tepTestBoTra() {
  if (!existsSync(PATCH)) return null;
  return readFileSync(PATCH, "utf8").match(/^\+\+\+ b\/(\S+\.test\.ts)$/m)?.[1] ?? null;
}
export const TEST_OPENCLAW = join(ROOT, "collector", "openclaw", "tests", "link-nguoi-ban");

/** node_modules cấp gói của cây nguồn (không đi vào chính node_modules), sâu tối đa 4 bậc. */
function thuMucModules(goc, tuong = "", sau = 0, ra = []) {
  if (sau > 4) return ra;
  for (const d of readdirSync(join(goc, tuong), { withFileTypes: true })) {
    if (!d.isDirectory() || d.name === ".git") continue;
    const p = tuong ? `${tuong}/${d.name}` : d.name;
    if (d.name === "node_modules") { ra.push(p); continue; }
    thuMucModules(goc, p, sau + 1, ra);
  }
  return ra;
}

/**
 * Dựng cây OpenClaw tạm: xuất bản sạch của ref nền (git archive), áp .patch bằng git apply thật, trỏ node_modules của từng gói về
 * cây nguồn (chỉ đọc). Gọi `lam(tam, sha, base)` trên cây đó rồi xoá cây. Thiếu thứ gì → 2 kèm tên, không gọi `lam`.
 * @param {(tam: string, sha: string, base: string) => number} lam
 * @param {{ patch?: string }} [tuy] `patch` thay .patch của hồ sơ (bộ chạy tích hợp dùng để phá thử trên bản sao)
 */
export function trenCayOpenclaw(lam, { patch = PATCH } = {}) {
  const src = process.env.OPENCLAW_SRC ?? join(homedir(), "dev", "openclaw");
  if (!existsSync(patch)) { console.error(`THIẾU .patch extension (${patch})`); return 2; }
  if (!existsSync(join(src, ".git")) || !existsSync(join(src, "node_modules", ".bin", "vitest"))) {
    console.error(`THIẾU cây nguồn OpenClaw có vitest ở ${src} (đặt OPENCLAW_SRC)`);
    return 2;
  }
  const base = process.env.OPENCLAW_BASE ?? "feat/s03-ma-album-ext";
  const tam = mkdtempSync(join(tmpdir(), "lnb-oc-"));
  try {
    const sha = execFileSync("git", ["-C", src, "rev-parse", "--verify", `${base}^{commit}`], { encoding: "utf8" }).trim();
    execFileSync("bash", ["-c", `git -C "$1" archive "$2" | tar -x -C "$3"`, "_", src, sha, tam]);
    // patch giờ là -U3 (mọi hunk có ngữ cảnh) — áp KHÔNG cờ phụ; biến patch
    // do caller truyền (PATCH mặc định).
    const ap = spawnSync("git", ["apply", patch], { cwd: tam, encoding: "utf8" });
    if (ap.status !== 0) { console.error(`.patch không áp được lên ${base} (${sha.slice(0, 9)}): ${ap.stderr.trim()}`); return 2; }
    for (const m of thuMucModules(src)) {
      const dich = join(tam, m);
      if (existsSync(dich)) continue;
      mkdirSync(dirname(dich), { recursive: true });
      symlinkSync(join(src, m), dich);
    }
    return lam(tam, sha, base);
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

/** Chạy vitest của bộ tra (test đơn vị của làn ZCode) trên bản OpenClaw sạch + .patch. Trả mã thoát; thiếu thứ gì → 2 kèm tên. */
export function chayVitestBoTra(locTen) {
  return trenCayOpenclaw((tam, sha, base) => {
    const testTra = tepTestBoTra();
    if (!testTra || !existsSync(join(tam, testTra))) { console.error("THIẾU test vitest (.test.ts) của bộ tra trong .patch"); return 2; }
    console.log(`bộ tra: OpenClaw ${base} @${sha.slice(0, 9)} + extension.patch`);
    // U1(10): ca tích hợp trong patch cần collector thật — trỏ dist của kho.
    const r = spawnSync(join(tam, "node_modules", ".bin", "vitest"), ["run", testTra, ...(locTen ? ["-t", locTen] : [])],
      { cwd: tam, stdio: "inherit", env: { ...process.env, LNB_COLLECTOR_DIST: join(ROOT, "collector", "dist") } });
    return r.status ?? 1;
  });
}

/** Chạy node --test trên các tệp test của thư mục collector/openclaw/tests/link-nguoi-ban. Tệp thiếu → 2. */
export function chayNodeTest(...ten) {
  const tep = ten.map((t) => join(TEST_OPENCLAW, t));
  const thieu = tep.filter((t) => !existsSync(t));
  if (thieu.length) { console.error(`THIẾU test ${thieu.map((t) => t.slice(ROOT.length + 1)).join(", ")}`); return 2; }
  return spawnSync(process.execPath, ["--test", ...tep], { stdio: "inherit" }).status ?? 1;
}

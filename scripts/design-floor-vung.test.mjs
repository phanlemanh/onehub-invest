// node --test scripts/design-floor-vung.test.mjs
// Hồ sơ noi-design-floor: vùng giao diện của design-floor (design.surface_globs) liệt kê dương — mọi thư mục con của
// app/src/components nằm trong vùng hoặc trong VENDOR_DIRS của app/eslint.config.mjs, không bao giờ cả hai — và sàn S4
// (executors.design.floor) đã nối. Bộ khớp glob, RE_HEX, docBac và chayS4 nạp từ gói acceptance-gate đang cài (đường
// không số); CI không cài kit nên các ca ấy bỏ qua có lời ở CI, còn ở máy local thiếu kit thì đỏ.
// Khác việc với scripts/don-hex-tho.test.mjs (0 hex thô ngoài danh sách vendor cố định).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, describe, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CFG = "_acceptance/config.yaml";
const ESLINT = "app/eslint.config.mjs";
const COMP = "app/src/components";
const TMP = mkdtempSync(path.join(tmpdir(), "ndf-"));
after(() => rmSync(TMP, { recursive: true, force: true }));

const doc = (root, rel) => readFileSync(path.join(root, rel), "utf8");

/** design.surface_globs của config (khối `design:` sát lề). */
export function docGlobs(cfgText) {
  const m = cfgText.match(/^design:\n(?:\s*#.*\n)*\s+surface_globs:\n((?:\s+- .*\n)+)/m);
  assert.ok(m, "config.yaml không còn khối design.surface_globs");
  return [...m[1].matchAll(/- "([^"]+)"/g)].map((x) => x[1]);
}

/** Tên thư mục vendor từ VENDOR_DIRS của eslint.config.mjs ("src/components/ui/**" → "ui"). */
export function docVendor(eslintText) {
  const m = eslintText.match(/const VENDOR_DIRS = \[([\s\S]*?)\];/);
  assert.ok(m, "eslint.config.mjs không còn «const VENDOR_DIRS = [...]»");
  return [...m[1].matchAll(/"src\/components\/([^/"]+)\/\*\*"/g)].map((x) => x[1]);
}

/** Thư mục con thật (readdir, chỉ thư mục) dưới app/src/components của gốc `root`. */
export function lietKeThuMuc(root) {
  return readdirSync(path.join(root, COMP), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

/** Mỗi thư mục con nằm trong vùng giao diện hoặc vendor, không bao giờ cả hai. */
export function kiemVung(root) {
  const globs = docGlobs(doc(root, CFG));
  const vendor = docVendor(doc(root, ESLINT));
  const trongVung = (d) => globs.some((g) => g.startsWith(`${COMP}/${d}/`));
  const dirs = lietKeThuMuc(root);
  const thieu = dirs.filter((d) => !vendor.includes(d) && !trongVung(d));
  const chong = dirs.filter((d) => vendor.includes(d) && trongVung(d));
  if (thieu.length) throw new Error(`thư mục chưa khai: ${thieu.join(", ")}`);
  if (chong.length) throw new Error(`vừa vùng giao diện vừa vendor: ${chong.join(", ")}`);
}

// Danh sách viết trước (đo 29/10 trên main 8977b9b7): 13 thư mục giao diện của app.
const GIAO_DIEN = ["auth", "charts", "compare", "finder", "insight", "listing", "marketing", "ops", "page", "saved", "shell", "states", "yield"];

test("NDF-AC-1 surface_globs là danh sách dương: app/src/app, tệp thẳng trong components, 13 thư mục giao diện", () => {
  const globs = docGlobs(doc(REPO, CFG));
  assert.deepEqual(globs, ["app/src/app/**", `${COMP}/*.tsx`, ...GIAO_DIEN.map((d) => `${COMP}/${d}/**`)]);
  assert.ok(!globs.includes(`${COMP}/**`), "còn glob bao trùm app/src/components/**");
  const vendor = docVendor(doc(REPO, ESLINT));
  assert.deepEqual(lietKeThuMuc(REPO).filter((d) => !vendor.includes(d)), GIAO_DIEN);
});

describe("NDF-AC-2 mọi thư mục components thuộc vùng giao diện hoặc vendor, không cả hai", () => {
  test("NDF-AC-2 cây thật", () => {
    assert.doesNotThrow(() => kiemVung(REPO));
  });

  const banSao = (ten, cfgText, dirs) => {
    const root = path.join(TMP, ten);
    mkdirSync(path.join(root, "_acceptance"), { recursive: true });
    mkdirSync(path.join(root, "app"), { recursive: true });
    writeFileSync(path.join(root, CFG), cfgText);
    cpSync(path.join(REPO, ESLINT), path.join(root, ESLINT));
    for (const d of dirs) {
      mkdirSync(path.join(root, COMP, d), { recursive: true });
      writeFileSync(path.join(root, COMP, d, "x.tsx"), "export const X = 1\n");
    }
    return root;
  };

  test("NDF-AC-2 chiều đỏ: thư mục thật moi-khong-khai trên bản sao → «thư mục chưa khai»", () => {
    const root = banSao("thieu", doc(REPO, CFG), ["auth", "ui", "moi-khong-khai"]);
    assert.throws(() => kiemVung(root), /thư mục chưa khai: moi-khong-khai$/);
  });

  test("NDF-AC-2 chiều đỏ: surface_globs bản sao có ui/** → «vừa vùng giao diện vừa vendor: ui»", () => {
    const cfg = doc(REPO, CFG).replace(`    - "${COMP}/auth/**"\n`, `    - "${COMP}/auth/**"\n    - "${COMP}/ui/**"\n`);
    const root = banSao("chong", cfg, ["auth", "ui"]);
    assert.throws(() => kiemVung(root), /vừa vùng giao diện vừa vendor: ui$/);
  });
});

/** Gốc gói acceptance-gate đang cài — đường không số qua resolve-plugin của feature-loop (cùng khuôn #171). */
function napKit(t) {
  if (process.env.CI) {
    t.skip("CI không cài acceptance-gate — ca nạp kit chỉ chạy ở máy local");
    return null;
  }
  const rp = path.join(homedir(), ".claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs");
  try {
    const out = execFileSync("node", [rp, "--plugin", "acceptance-gate", "--require", "lib/evidence-core.cjs", "--require", "scripts/design-floor-s4.mjs"], { encoding: "utf8" });
    return out.trim().split("\n").pop();
  } catch (e) {
    assert.fail(`không nạp được kit acceptance-gate qua resolve-plugin: ${e.message.split("\n")[0]}`);
  }
}

test("NDF-AC-3 số tệp khớp vùng mới = vùng cũ trừ tệp vendor (bộ khớp của kit), và 0 hex thô", async (t) => {
  const kit = napKit(t);
  if (!kit) return;
  const { pathGlobToRe } = createRequire(import.meta.url)(path.join(kit, "lib/evidence-core.cjs"));
  const { RE_HEX } = await import(pathToFileURL(path.join(kit, "scripts/design-floor-s4.mjs")).href);
  assert.equal(typeof pathGlobToRe, "function", "kit không còn xuất pathGlobToRe");
  const tep = execFileSync("git", ["ls-files"], { cwd: REPO, encoding: "utf8" }).split("\n").filter(Boolean);
  const khop = (globs) => tep.filter((f) => globs.map(pathGlobToRe).some((r) => r.test(f)));
  const vendor = docVendor(doc(REPO, ESLINT));
  const laVendor = (f) => vendor.some((d) => f.startsWith(`${COMP}/${d}/`));
  const globs = docGlobs(doc(REPO, CFG));
  const moi = khop(globs);
  const cu = khop(["app/src/app/**", `${COMP}/**`]);
  assert.deepEqual(moi, cu.filter((f) => !laVendor(f)), "tập tệp vùng mới khác vùng cũ trừ vendor");
  assert.equal(moi.length, cu.length - cu.filter(laVendor).length);
  const hex = moi.flatMap((f) => readFileSync(path.join(REPO, f), "utf8").split("\n").flatMap((dong, i) => [...dong.matchAll(RE_HEX)].map((m) => `${f}:${i + 1} ${m[0]}`)));
  assert.deepEqual(hex, []);
  // Chiều đỏ: '*.tsx' đổi thành '**/*.tsx' thì vendor lọt lại vùng — số tệp lệch.
  const lan = khop(globs.map((g) => (g === `${COMP}/*.tsx` ? `${COMP}/**/*.tsx` : g)));
  assert.notEqual(lan.length, moi.length, "đổi *.tsx thành **/*.tsx mà số tệp không lệch — bộ khớp không phân biệt một đoạn");
});

describe("NDF-AC-4 sàn thiết kế S4 đã nối", () => {
  test("NDF-AC-4 khoá floor đường không số, ghi chú cũ đã gỡ", () => {
    const cfg = doc(REPO, CFG);
    const floor = cfg.split("\n").find((l) => /^\s+floor: /.test(l));
    assert.ok(floor, "chưa có executors.design.floor");
    assert.ok(floor.includes("design-floor-s4.mjs") && floor.includes("--root .") && floor.includes("${CLAUDE_PLUGIN_ROOT:-"), `khoá floor sai khuôn: ${floor}`);
    assert.ok(!floor.includes("/2.35.0/"), "khoá floor ghi cứng số phiên bản kit");
    assert.ok(!cfg.includes("CHƯA nối") && !cfg.includes("52/619"), "config còn ghi chú «CHƯA nối» / số đo cũ");
  });

  test("NDF-AC-4 docBac của kit thấy floor; chayS4 chặn hex dưới finder, không chặn dưới ui", async (t) => {
    const kit = napKit(t);
    if (!kit) return;
    const { docBac } = await import(pathToFileURL(path.join(kit, "scripts/design-floor-bac.mjs")).href);
    const { chayS4 } = await import(pathToFileURL(path.join(kit, "scripts/design-floor-s4.mjs")).href);
    assert.ok(docBac(REPO).floor, "docBac của kit chưa thấy executors.design.floor");
    const root = path.join(TMP, "s4");
    const g = (...a) => execFileSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: root, encoding: "utf8" }).trim();
    mkdirSync(path.join(root, "_acceptance"), { recursive: true });
    cpSync(path.join(REPO, CFG), path.join(root, CFG));
    g("init", "-q");
    g("add", "-A");
    g("commit", "-qm", "base");
    const base = g("rev-parse", "HEAD");
    for (const d of ["finder", "ui"]) {
      mkdirSync(path.join(root, COMP, d), { recursive: true });
      writeFileSync(path.join(root, COMP, d, "x.tsx"), 'export const A = "#123456"\n');
    }
    g("add", "-A");
    g("commit", "-qm", "hex");
    const ra = chayS4(root, base);
    assert.deepEqual(ra.dong.filter((l) => l.includes("hex thô")), [`design-floor S4: hex thô ${COMP}/finder/x.tsx:1 #123456`]);
    assert.notEqual(ra.ma, 0, "sàn S4 không chặn hex thô dưới components/finder");
  });
});

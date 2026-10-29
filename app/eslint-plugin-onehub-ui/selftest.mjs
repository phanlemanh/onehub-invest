#!/usr/bin/env node
// Selftest bằng ESLint thật + cấu hình thật của app (E3, E5, E7 của ui-standards-reui).
//   cd app && node eslint-plugin-onehub-ui/selftest.mjs <should-fire|should-not-fire|baseline-guard>
// Mẫu code là file ẢO (lintText với filePath dưới src/) — không bao giờ ghi vào cây làm việc.
// Thoát 0 khi đạt, 1 khi hỏng (in lý do).
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { findBareDisables } from "./check-bare-disables.mjs";

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(PLUGIN_DIR, "..");
const REPO_DIR = join(APP_DIR, "..");
const eslint = new ESLint({ cwd: APP_DIR });

let failures = 0;
const check = (cond, msg) => {
  if (cond) console.log(`  OK    ${msg}`);
  else {
    failures++;
    console.log(`  FAIL  ${msg}`);
  }
};

/** Lint văn bản ảo; trả về các message thật (không gồm mục bị directive nuốt). */
async function lint(code, relPath) {
  const [res] = await eslint.lintText(code, { filePath: join(APP_DIR, relPath), warnIgnored: false });
  return res?.messages ?? [];
}
const onehub = (msgs) => msgs.filter((m) => m.ruleId?.startsWith("onehub-ui/"));
const fatal = (msgs) => msgs.filter((m) => m.fatal);
const wrap = (jsx) => `export const Sample = () => (\n  ${jsx}\n);\n`;

// ------------------------------------------------------------------ should-fire (E3)
// require-disable-reason: ESLint nuốt báo cáo của chính luật cho `/* eslint-disable */` trần, nên mẫu dùng
// directive có nêu luật nhưng thiếu lý do; dạng trần được bắt bởi check-bare-disables (kiểm riêng bên dưới).
const FIRE = [
  ["no-raw-table", wrap("<table><tbody /></table>"), "onehub-ui/no-raw-table"],
  ["no-raw-controls select", wrap("<select />"), "onehub-ui/no-raw-controls"],
  ["no-raw-controls button", wrap("<button>Lưu</button>"), "onehub-ui/no-raw-controls"],
  ["no-native-dialogs confirm", 'export function f() {\n  return window.confirm("Xoá?");\n}\n', "onehub-ui/no-native-dialogs", "nativeDialog"],
  ["no-native-dialogs overlay", wrap('<div className="fixed inset-0 z-50" />'), "onehub-ui/no-native-dialogs", "rawOverlay"],
  ["no-raw-palette state", wrap('<span className="text-green-600 dark:text-green-400">success</span>'), "onehub-ui/no-raw-palette", "state"],
  ["no-raw-palette noDarkPair", wrap('<p className="text-red-500">Ghi chú</p>'), "onehub-ui/no-raw-palette", "noDarkPair"],
  ["no-hardcoded-color style", wrap('<div style={{ color: "#ff0000" }} />'), "onehub-ui/no-hardcoded-color"],
  ["no-hardcoded-color arbitrary", wrap('<div className="bg-[#2563eb]" />'), "onehub-ui/no-hardcoded-color"],
  ["no-arbitrary-text-size", wrap('<p className="text-[10px]">nhỏ</p>'), "onehub-ui/no-arbitrary-text-size"],
  ["no-banned-motion transition-all", wrap('<div className="transition-all duration-300" />'), "onehub-ui/no-banned-motion", "transitionAll"],
  ["no-banned-motion duration", wrap('<div className="duration-700" />'), "onehub-ui/no-banned-motion", "duration"],
  ["no-banned-motion framer", 'import { motion } from "framer-motion";\nexport const M = motion;\n', "onehub-ui/no-banned-motion", "framer"],
  ["no-aschild", wrap("<DialogTrigger asChild><span /></DialogTrigger>"), "onehub-ui/no-aschild"],
  ["no-emoji-icons", wrap("<p>✅ Xong</p>"), "onehub-ui/no-emoji-icons"],
  [
    "require-disable-reason",
    "// eslint-disable-next-line onehub-ui/no-raw-table\nexport const T = () => <table />;\n",
    "onehub-ui/require-disable-reason",
  ],
];

async function shouldFire() {
  console.log("[ui-standards-reui] selftest should-fire — mẫu → luật mong đợi → luật nhận được");
  const seen = new Set();
  let i = 0;
  for (const [name, code, ruleId, messageId] of FIRE) {
    i++;
    const msgs = await lint(code, `src/components/__selftest__/sample-${i}.tsx`);
    const hit = onehub(msgs).filter((m) => m.ruleId === ruleId && (!messageId || m.messageId === messageId));
    const got = [...new Set(onehub(msgs).map((m) => m.ruleId + (m.messageId ? `#${m.messageId}` : "")))].join(", ") || "(không)";
    check(hit.length > 0 && fatal(msgs).length === 0, `${name.padEnd(34)} → ${ruleId}${messageId ? `#${messageId}` : ""}  | got: ${got}`);
    if (hit.length) seen.add(ruleId);
  }
  const allRules = (await import("./index.mjs")).default.rules;
  for (const r of Object.keys(allRules)) check(seen.has(`onehub-ui/${r}`), `luật onehub-ui/${r} được phủ ít nhất một mẫu`);
  check(FIRE.length >= 14, `số mẫu = ${FIRE.length} (cần >= 14)`);

  // check-bare-disables: dạng trần mà ESLint tự nuốt.
  const bare = findBareDisables("/* eslint-disable */\nexport const a = <table />;\n");
  check(bare.length === 1, "check-bare-disables báo `/* eslint-disable */` trần");
  const bareSelf = findBareDisables("// eslint-disable-next-line onehub-ui/require-disable-reason\nconst a = 1;\n");
  check(bareSelf.length === 1, "check-bare-disables báo ngoại lệ require-disable-reason thiếu lý do");
  const clean = findBareDisables("// eslint-disable-next-line onehub-ui/no-raw-table -- bảng in hoá đơn\nconst a = 1;\n");
  check(clean.length === 0, "check-bare-disables không báo directive có luật + lý do");
}

// ------------------------------------------------------------------ should-not-fire (E5)
const CLEAN = [
  ["Badge variant", wrap('<Badge variant="success-light">Đã duyệt</Badge>')],
  ["cặp text-violet-600 dark:text-violet-400", wrap('<p className="text-violet-600 dark:text-violet-400">Ghi chú</p>')],
  ["duration-200", wrap('<div className="transition-colors duration-200" />')],
  ["render prop (không asChild)", wrap('<Button render={<a href="/x" />}>Mở</Button>')],
  ["token ngữ nghĩa", wrap('<p className="text-muted-foreground text-sm">Ghi chú</p>')],
  [
    "ngoại lệ có lý do",
    "// eslint-disable-next-line onehub-ui/no-raw-table -- bảng in hoá đơn, data-grid không in được\nexport const T = () => <table />;\n",
  ],
];

async function shouldNotFire() {
  console.log("[ui-standards-reui] selftest should-not-fire");
  let i = 0;
  for (const [name, code] of CLEAN) {
    i++;
    const msgs = await lint(code, `src/components/__selftest__/clean-${i}.tsx`);
    check(onehub(msgs).length === 0 && fatal(msgs).length === 0, `${name} → 0 báo cáo onehub-ui${onehub(msgs).length ? ` (got ${onehub(msgs).map((m) => m.ruleId)})` : ""}`);
  }

  // File bản đồ: hex được phép, nhưng <table> vẫn bị báo.
  const mapCode = 'export const A = () => <div style={{ color: "#ff0000" }} />;\nexport const B = () => <table />;\n';
  const mapMsgs = onehub(await lint(mapCode, "src/components/mini-map.tsx")).map((m) => m.ruleId);
  check(!mapMsgs.includes("onehub-ui/no-hardcoded-color"), "src/components/mini-map.tsx: hex KHÔNG bị no-hardcoded-color");
  check(mapMsgs.includes("onehub-ui/no-raw-table"), "src/components/mini-map.tsx: <table> VẪN bị no-raw-table");
  // Đối chứng: cùng mã ở file không thuộc bản đồ thì hex bị báo.
  const ctrl = onehub(await lint(mapCode, "src/components/__selftest__/not-map.tsx")).map((m) => m.ruleId);
  check(ctrl.includes("onehub-ui/no-hardcoded-color"), "đối chứng: file thường vẫn bị no-hardcoded-color (cấu hình bản đồ là ngoại lệ có chủ đích)");

  // Vendor: ui/ examples/ (lint bằng bộ luật Next nhưng không onehub-ui), reui/ blocks/ (ignore toàn cục).
  const tableCode = "export const T = () => <table />;\nexport const H = () => <div style={{ color: '#fff' }} />;\n";
  for (const dir of ["ui", "examples", "reui", "blocks"]) {
    const rel = `src/components/${dir}/__selftest__.tsx`;
    const msgs = onehub(await lint(tableCode, rel));
    check(msgs.length === 0, `${rel} → 0 báo cáo onehub-ui`);
    const cfg = await eslint.calculateConfigForFile(join(APP_DIR, rel));
    const ruleKeys = Object.keys(cfg?.rules ?? {}).filter((k) => k.startsWith("onehub-ui/") && cfg.rules[k]?.[0] !== "off" && cfg.rules[k] !== "off" && cfg.rules[k]?.[0] !== 0);
    const ignored = cfg === undefined || (await eslint.isPathIgnored(join(APP_DIR, rel)));
    check(ignored || ruleKeys.length === 0, `${rel}: cấu hình ${ignored ? "bị ignore toàn cục" : "không bật luật onehub-ui nào"}`);
  }
}

// ------------------------------------------------------------------ baseline-guard (E7)
function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
}
// Bỏ _acceptance/: lượt chấm ghi sổ hồ sơ song song với selftest — không phải thay đổi do selftest gây ra.
const porcelain = () => run("git", ["-C", REPO_DIR, "status", "--porcelain", "--", ".", ":(exclude)_acceptance"]).stdout;
const ESLINT_BIN = join(APP_DIR, "node_modules/eslint/bin/eslint.js");

/** Dựng bản sao tối thiểu của app/ (không node_modules — symlink) dưới tmpdir. */
function makeTempApp() {
  const dir = mkdtempSync(join(tmpdir(), "onehub-ui-baseline-"));
  for (const f of ["src", "eslint-plugin-onehub-ui", "eslint.config.mjs", "eslint-suppressions.json", "package.json", "tsconfig.json"]) {
    cpSync(join(APP_DIR, f), join(dir, f), { recursive: true });
  }
  symlinkSync(join(APP_DIR, "node_modules"), join(dir, "node_modules"));
  return dir;
}

// Một vi phạm mẫu cho mỗi luật có thể nằm trong baseline — thêm vào cuối tệp mẫu để vượt số đếm suppress của CÙNG luật.
const MAU_VI_PHAM = {
  "onehub-ui/no-raw-palette": 'export const __SelfTestVp = () => <div className="bg-red-500" />;',
  "onehub-ui/no-arbitrary-text-size": 'export const __SelfTestVp = () => <p className="text-[13px]" />;',
  "onehub-ui/no-emoji-icons": "export const __SelfTestVp = () => <span>🚀</span>;",
  "onehub-ui/no-raw-table": "export const __SelfTestVp = () => <table />;",
};

async function baselineGuard() {
  console.log("[ui-standards-reui] selftest baseline-guard");
  const before = porcelain();
  // Tệp mẫu suy từ CHÍNH eslint-suppressions.json (không viết cứng): tệp .tsx đầu tiên (thứ tự khoá) có mục suppress của một luật
  // có mẫu vi phạm — dọn UI xoá dần mục suppress nên tệp viết cứng sẽ hết mục (hồ sơ ui-standards-reui-thuoc-loi-thoi).
  const sup = JSON.parse(readFileSync(join(APP_DIR, "eslint-suppressions.json"), "utf8"));
  const chon = Object.keys(sup)
    .sort()
    .filter((f) => f.endsWith(".tsx"))
    .flatMap((f) => Object.keys(sup[f]).filter((r) => MAU_VI_PHAM[r]).map((r) => [f, r]))[0];
  check(Boolean(chon), "eslint-suppressions.json còn tệp .tsx có mục suppress với luật có mẫu vi phạm");
  if (!chon) return;
  const [FILE, LUAT] = chon;
  console.log(`  INFO  tệp mẫu ${FILE} · luật ${LUAT} (suppress ${sup[FILE][LUAT].count})`);
  const original = readFileSync(join(APP_DIR, FILE), "utf8");
  const extraCungLuat = `${original}\n${MAU_VI_PHAM[LUAT]}\n`;
  const extraSelect = `${original}\nexport const __SelfTestSelect = () => <select />;\n`;

  // (a1) Thử stdin trước: suppressions chỉ áp dụng ở chế độ file thật, stdin thường không.
  const stdin = (text) => run("node", [ESLINT_BIN, "--stdin", "--stdin-filename", FILE], { cwd: APP_DIR, input: text });
  const probe = stdin(original);
  const stdinHonors = probe.status === 0;
  console.log(`  INFO  stdin ${stdinHonors ? "có" : "KHÔNG"} áp dụng suppressions (bản gốc exit ${probe.status}) → ${stdinHonors ? "dùng stdin" : "dùng bản sao tạm"}`);

  let runner;
  let temp = null;
  if (stdinHonors) {
    runner = (text) => stdin(text);
  } else {
    temp = makeTempApp();
    console.log(`  INFO  bản sao tạm: ${temp}`);
    runner = (text) => {
      writeFileSync(join(temp, FILE), text);
      const r = run("node", [join(temp, "node_modules/eslint/bin/eslint.js"), FILE], { cwd: temp });
      writeFileSync(join(temp, FILE), original);
      return r;
    };
  }
  try {
    const base = runner(original);
    check(base.status === 0, `bản gốc ${FILE} (đã có mục suppress) → eslint exit 0`);
    const t = runner(extraCungLuat);
    check(t.status === 1 && (t.stdout + t.stderr).includes(LUAT), `thêm 1 vi phạm ${LUAT} vào ${FILE} (vượt số đếm suppress) → exit ${t.status}, in ${LUAT}`);
    const s = runner(extraSelect);
    check(s.status === 1 && /onehub-ui\/no-raw-controls/.test(s.stdout + s.stderr), `thêm 1 <select/> (luật chưa có trong baseline) → exit ${s.status}, in onehub-ui/no-raw-controls`);
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
  }

  // (b) check-baseline-growth trên bản sao JSON.
  const tmp = mkdtempSync(join(tmpdir(), "onehub-ui-growth-"));
  try {
    const guard = join(PLUGIN_DIR, "check-baseline-growth.mjs");
    const write = (name, obj) => {
      const p = join(tmp, name);
      writeFileSync(p, JSON.stringify(obj, null, 2));
      return p;
    };
    const basePath = write("base.json", sup);
    const growth = (headObj, name) => run("node", [guard, basePath, write(name, headObj)]);

    const same = growth(sup, "same.json");
    check(same.status === 0, `head == base → exit ${same.status} (cần 0)`);

    const grown = structuredClone(sup);
    const [f0] = Object.keys(grown);
    const r0 = Object.keys(grown[f0])[0];
    grown[f0][r0].count += 1;
    const g = growth(grown, "grown.json");
    check(g.status === 1, `+1 count ở ${r0} (${f0}) → exit ${g.status} (cần 1)`);
    check(g.stderr.includes(r0), "thông báo nêu đúng luật bị tăng");

    const renamed = structuredClone(sup);
    renamed[`${f0}.moved.tsx`] = renamed[f0];
    delete renamed[f0];
    const rn = growth(renamed, "renamed.json");
    check(rn.status === 0, `đổi tên khoá ${f0} giữ nguyên số đếm → exit ${rn.status} (cần 0)`);

    const lowered = structuredClone(sup);
    lowered[f0][r0].count = Math.max(0, lowered[f0][r0].count - 1);
    const lw = growth(lowered, "lowered.json");
    check(lw.status === 0, `giảm 1 count → exit ${lw.status} (cần 0)`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  check(porcelain() === before, "cây làm việc (git status --porcelain) không đổi sau khi chạy");
  check(readFileSync(join(APP_DIR, FILE), "utf8") === original, `${FILE} thật không bị sửa`);
}

const MODES = { "should-fire": shouldFire, "should-not-fire": shouldNotFire, "baseline-guard": baselineGuard };
const mode = process.argv[2];
if (!MODES[mode]) {
  console.error(`Cách dùng: selftest.mjs <${Object.keys(MODES).join("|")}>`);
  process.exit(2);
}
await MODES[mode]();
console.log(failures ? `FAIL (${failures} kiểm hỏng)` : "PASS");
process.exit(failures ? 1 : 0);

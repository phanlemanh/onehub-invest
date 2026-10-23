#!/usr/bin/env node
// Thước máy của đợt B3 thống nhất biểu đồ (hồ sơ ui-clean-b3-charts). Chỉ dùng Node builtins.
// Dùng: node scripts/ui-standards/b3-check.mjs <lệnh> [--root <dir>] [--git <dir>]
//   lệnh: palette | contrast | data-color | duplicates | file-size | suppressions | api |
//         structure | pixels | docs | selftest
//   --root: gốc đọc tệp (mặc định gốc kho); --git: gốc chạy git/eslint (mặc định = --root).
// Thoát 0 đạt · 1 hỏng (mỗi lỗi một dòng "<lệnh>: <thông điệp>") · 2 dùng sai.
// selftest: dựng fixture từ cây thật, với mỗi lệnh chạy bản lành (phải 0) và từng bản phá
// (phải 1 kèm đúng thông điệp ghim) — vật lành → xanh, phá vật thật trong bản sao → đỏ.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  appendFileSync, cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SLUG_DIR = "_acceptance/ui-clean-b3-charts";
const SCOPE = [
  "app/src/components/insight/performance",
  "app/src/components/insight/revenue-mix",
  "app/src/components/yield/pnl",
  "app/src/components/charts",
];
const PALETTE = "app/src/components/charts/palette.ts";
// Danh sách miễn 3:1 người chốt ở Cổng Phạm vi (Hỏi-3) — đóng, đổi phải qua người.
const EXEMPT = ["expenses", "share3", "rest", "hatch"];
const HUES =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const CSS_NAMES =
  "red|green|blue|black|white|gray|grey|orange|yellow|purple|pink|teal|navy|maroon|olive|lime|aqua|cyan|magenta|silver|gold|indigo|violet|brown|crimson|coral|salmon|tomato|khaki";

// ---------------------------------------------------------------- tiện ích
const ctx = { root: REPO, git: REPO };
const read = (rel) => readFileSync(join(ctx.root, rel), "utf8");
function filesIn(rel) {
  const abs = join(ctx.root, rel);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { recursive: true })
    .map((name) => join(rel, String(name)))
    .filter((p) => /\.tsx?$/.test(p) && statSync(join(ctx.root, p)).isFile())
    .sort();
}
const scopeFiles = () => SCOPE.flatMap(filesIn);
const isComment = (line) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line);
function git(...argv) {
  const r = spawnSync("git", argv, { cwd: ctx.git, encoding: "utf8" });
  return { ok: r.status === 0, out: (r.stdout || "").trim() };
}
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// ---------------------------------------------------------------- palette (AC-1)
const LITERALS = [
  ["var(--color-sắc-bậc)", new RegExp(`var\\(--color-(?:${HUES})-\\d{2,3}\\)`)],
  ["lớp Tailwind sắc-bậc", new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|divide|decoration)-(?:${HUES})-\\d{2,3}\\b`)],
  ["hex", /(?<!url\()["'`[(\s]#[0-9a-fA-F]{3,8}\b/],
  ["rgb", /\brgba?\(/],
  ["hsl", /\bhsla?\(/],
  ["oklch", /\bokl(?:ch|ab)\(/],
  ["tên màu CSS", new RegExp(`\\b(?:fill|stroke|stopColor|color)=\\{?["'](?:${CSS_NAMES})["']`)],
];
const MIX_KEYS = { lead: "share1", second: "share2", third: "share3", rest: "rest", hatch: "hatch" };

function paletteKeys() {
  if (!existsSync(join(ctx.root, PALETTE))) return null;
  const keys = new Map();
  for (const m of read(PALETTE).matchAll(/^\s*(\w+):\s*\{([^}]*)\}/gm)) {
    const body = m[2];
    const light = body.match(/light:\s*"var\(--color-([a-z]+-\d+)\)"/)?.[1];
    const dark = body.match(/dark:\s*"var\(--color-([a-z]+-\d+)\)"/)?.[1];
    if (!light || !dark) continue;
    keys.set(m[1], {
      light, dark,
      swatch: body.match(/swatch:\s*"([^"]+)"/)?.[1] ?? null,
      exempt: /exempt:\s*true/.test(body),
    });
  }
  return keys;
}

function checkPalette() {
  const errs = [];
  for (const file of scopeFiles()) {
    if (file === PALETTE) continue;
    read(file).split("\n").forEach((line, i) => {
      if (isComment(line)) return;
      if (/--chart-[1-5](?![\w-])|--color-chart-/.test(line)) errs.push(`palette: dùng --chart-* (${file}:${i + 1})`);
      for (const [name, re] of LITERALS)
        if (re.test(line)) errs.push(`palette: màu ngoài palette.ts (${name}) ${file}:${i + 1}`);
    });
  }
  const keys = paletteKeys();
  if (!keys) return [...errs, "palette: thiếu components/charts/palette.ts"];
  const relate = (key, used, where) => {
    if (used !== key) errs.push(`palette: lệch nghĩa ${key} (${where} dùng ${used ?? "không gì"})`);
  };
  const perf = existsSync(join(ctx.root, "app/src/components/insight/performance/data.ts"))
    ? read("app/src/components/insight/performance/data.ts") : "";
  for (const key of ["revenue", "occupancy", "adr", "revpar"]) {
    const block = perf.match(new RegExp(`key:\\s*"${key}"[^}]*?series:\\s*"(\\w+)"`));
    relate(key, block?.[1], "performance/data.ts");
  }
  const pnl = existsSync(join(ctx.root, "app/src/components/yield/pnl/data.ts"))
    ? read("app/src/components/yield/pnl/data.ts") : "";
  for (const key of ["revenue", "expenses", "margin"])
    relate(key, pnl.match(new RegExp(`\\b${key}:\\s*\\{[^}]*?themeOf\\("(\\w+)"\\)`))?.[1], "pnl/data.ts");
  // Chấm chú giải/tooltip đi kênh riêng (swatchOf): cùng nghĩa → cùng khoá.
  for (const key of ["revenue", "expenses", "margin"])
    relate(key, pnl.match(new RegExp(`\\b${key}:\\s*swatchOf\\("(\\w+)"\\)`))?.[1], "pnl/data.ts SWATCHES");
  const mixFile = filesIn("app/src/components/insight/revenue-mix").find((f) => /chartConfig\s*=/.test(read(f)));
  const mix = mixFile ? read(mixFile) : "";
  for (const [slot, key] of Object.entries(MIX_KEYS))
    relate(key, mix.match(new RegExp(`\\b${slot}:\\s*\\{[^}]*?themeOf\\("(\\w+)"\\)`))?.[1], `revenue-mix ${slot}`);
  // Chấm lát: "Khác" (rest) mang màu vạch chéo như block gốc chart-13.
  const DOT_KEYS = { ...MIX_KEYS, rest: "hatch" };
  for (const [slot, key] of Object.entries(DOT_KEYS)) {
    if (slot === "hatch") continue;
    relate(key, mix.match(new RegExp(`\\b${slot}:\\s*swatchOf\\("(\\w+)"\\)`))?.[1], `revenue-mix chấm ${slot}`);
  }
  return errs;
}

// ---------------------------------------------------------------- contrast (AC-2)
function oklchToLum(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
const parseOklch = (text) => {
  const m = text.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  return m ? [Number(m[1]) / (m[2] ? 100 : 1), Number(m[3]), Number(m[4])] : null;
};

function checkContrast() {
  const keys = paletteKeys();
  if (!keys) return ["contrast: thiếu components/charts/palette.ts"];
  const theme = read("app/node_modules/tailwindcss/theme.css");
  const shade = (name) => parseOklch(theme.match(new RegExp(`--color-${name}:\\s*(oklch\\([^)]*\\))`))?.[1] ?? "");
  const css = read("app/src/app/globals.css");
  // Khối mở đầu dòng (`:root {` / `.dark {`), không phải chữ `.dark` trong dòng @custom-variant.
  const cardOf = (block) => {
    const at = css.search(new RegExp(`^${block}\\s*\\{`, "m"));
    return at < 0 ? null : parseOklch(css.slice(at).match(/--card:\s*(oklch\([^)]*\))/)?.[1] ?? "");
  };
  const bg = { sáng: cardOf(":root"), tối: cardOf("\\.dark") };
  if (!bg.sáng || !bg.tối) return ["contrast: không đọc được --card ở globals.css"];
  const errs = [];
  const exempt = [...keys].filter(([, v]) => v.exempt).map(([k]) => k).sort();
  if (exempt.join() !== [...EXEMPT].sort().join())
    errs.push(`contrast: danh sách miễn đổi (${exempt.join(", ")} ≠ ${EXEMPT.join(", ")})`);
  for (const [key, v] of keys) {
    const cells = [];
    for (const [mode, name] of [["sáng", v.light], ["tối", v.dark]]) {
      const c = shade(name);
      if (!c) { errs.push(`contrast: không có màu ${name} trong theme`); continue; }
      const r = ratio(oklchToLum(...c), oklchToLum(...bg[mode]));
      cells.push(`${mode} ${name} ${r.toFixed(2)}`);
      if (!v.exempt && r < 3) errs.push(`contrast: ${key} ${mode} ${r.toFixed(2)} < 3`);
    }
    if (v.swatch !== null && v.swatch !== `bg-${v.light} dark:bg-${v.dark}`)
      errs.push(`contrast: swatch ${key} lệch cặp (${v.swatch})`);
    console.log(`  ${key.padEnd(10)} ${cells.join(" · ")}${v.exempt ? " (miễn)" : ""}`);
  }
  return errs;
}

// ---------------------------------------------------------------- data-color (AC-3)
function checkDataColor() {
  const doc = read(".claude/skills/onehub-ui/data-color.md");
  const keys = paletteKeys();
  if (!keys) return ["data-color: thiếu components/charts/palette.ts"];
  const errs = [];
  if (/\bTBD\b/.test(doc)) errs.push("data-color: còn TBD");
  // Bậc phải nằm đúng CỘT: tìm cột "Sáng"/"Tối" theo dòng tiêu đề của bảng khoá.
  const lines = doc.split("\n");
  const cells = (line) => line.split("|").slice(1, -1).map((c) => c.trim());
  const header = lines.find((l) => l.startsWith("|") && /\|\s*Khoá\s*\|/.test(l));
  const col = header ? { light: cells(header).indexOf("Sáng"), dark: cells(header).indexOf("Tối") } : null;
  if (!col || col.light < 0 || col.dark < 0) errs.push("data-color: bảng khoá thiếu cột Sáng/Tối");
  for (const [key, v] of keys) {
    const row = lines.find((l) => l.startsWith("|") && cells(l)[0] === `\`${key}\``);
    if (!row) { errs.push(`data-color: thiếu khoá ${key}`); continue; }
    if (!col) continue;
    const c = cells(row);
    const shade = (cell) => cell?.match(/^[a-z]+-\d+/)?.[0];
    if (shade(c[col.light]) !== v.light || shade(c[col.dark]) !== v.dark)
      errs.push(`data-color: lệch bậc ${key} (bảng ${c[col.light]} / ${c[col.dark]}, module ${v.light} / ${v.dark})`);
  }
  for (const rule of ["--chart-", "3:1", "miễn"])
    if (!doc.includes(rule)) errs.push(`data-color: thiếu luật chọn màu (${rule})`);
  return errs;
}

// ---------------------------------------------------------------- duplicates (AC-4)
// Bỏ dòng rỗng, comment, câu import/re-export (kể cả thân import nhiều dòng), dòng chỉ có ngoặc, thẻ đóng.
function normalized(file) {
  let inImport = false;
  return read(file).split("\n").map((line, i) => [line.trim(), i + 1]).filter(([t]) => {
    if (inImport) { if (/\bfrom\s+["']/.test(t)) inImport = false; return false; }
    if (/^(import|export)\b.*\{\s*$/.test(t) && !/\bfrom\s+["']/.test(t) && /^import\b|^export \{/.test(t)) { inImport = true; return false; }
    return t && t !== '"use client"' && !isComment(t) && !/^(import\b|export \{|\} from)/.test(t) &&
      !/^[\])}>;,/\s]*$/.test(t) && !/^<\/[\w.]+>$/.test(t);
  });
}
function checkDuplicates() {
  const errs = [];
  for (const dir of SCOPE.slice(0, 3))
    for (const name of ["use-trigger-tooltip.ts", "icons.tsx"])
      if (existsSync(join(ctx.root, dir, name))) errs.push(`duplicates: còn bản riêng ${dir}/${name}`);
  const seen = new Map();
  for (const file of scopeFiles()) {
    const lines = normalized(file);
    for (let i = 0; i + 6 <= lines.length; i++) {
      const key = lines.slice(i, i + 6).map(([t]) => t).join("\n");
      if (!seen.has(key)) seen.set(key, new Map());
      if (!seen.get(key).has(file)) seen.get(key).set(file, lines[i][1]);
    }
  }
  const pairs = new Set();
  for (const where of seen.values()) {
    if (where.size < 2) continue;
    const pair = [...where].map(([f, l]) => `${relative("app/src/components", f)}:${l}`).join(" ↔ ");
    const id = [...where.keys()].join("|");
    if (!pairs.has(id)) { pairs.add(id); errs.push(`duplicates: trùng ${pair}`); }
  }
  return errs;
}

// ---------------------------------------------------------------- file-size (AC-5)
function checkFileSize() {
  const errs = [];
  for (const file of scopeFiles()) {
    const n = read(file).replace(/\n$/, "").split("\n").length;
    console.log(`  ${String(n).padStart(4)} ${file}`);
    if (n > 200) errs.push(`file-size: ${file} ${n} > 200`);
  }
  return errs;
}

// ---------------------------------------------------------------- suppressions (AC-6)
function checkSuppressions() {
  const errs = [];
  const sup = JSON.parse(read("app/eslint-suppressions.json"));
  const inScope = (p) => SCOPE.some((d) => `app/${p}`.startsWith(`${d}/`));
  for (const key of Object.keys(sup)) if (inScope(key)) errs.push(`suppressions: còn mục ${key}`);
  const found = [];
  for (const file of scopeFiles())
    read(file).split("\n").forEach((line, i) => {
      const m = line.match(/eslint-disable(?:-next-line|-line)?\s+(\S+)(.*)/);
      if (m) found.push({ where: `${file}:${i + 1}`, rule: m[1], rest: m[2] });
    });
  const chart6 = (rule) => found.filter((d) => d.rule === rule && /--\s*nguyên bản @reui\/chart-6/.test(d.rest)).length;
  const memo = found.filter((d) => d.rule === "react-hooks/preserve-manual-memoization").length;
  if (found.length !== 4 || chart6("onehub-ui/no-banned-motion") !== 2 || chart6("onehub-ui/no-raw-controls") !== 1 || memo !== 1)
    errs.push(`suppressions: số disable ${found.length} ≠ 4 (${found.map((d) => `${d.rule}@${d.where}`).join(", ")})`);
  return errs;
}

// ---------------------------------------------------------------- api (AC-7)
const API = [
  ["app/src/components/insight/performance/chart.tsx", "PerformanceChart", ["months", "currency", "source"]],
  ["app/src/components/insight/revenue-mix/chart.tsx", "RevenueMixChart", ["rows", "currency", "window"]],
  ["app/src/components/yield/pnl/chart.tsx", "PnlChart", ["months", "currency", "breakEvenMargin", "ltNetIncome"]],
];
function checkApi() {
  const errs = [];
  const base = git("merge-base", "HEAD", "main");
  if (!base.ok) errs.push("api: không tìm được merge-base với main");
  else for (const f of ["app/src/components/insight/insight-page.tsx", "app/src/app/(app)/yield/page.tsx"]) {
    const d = spawnSync("git", ["diff", "--quiet", base.out, "--", f], { cwd: ctx.git });
    if (d.status !== 0) errs.push(`api: ${f} đổi so với nhánh chính`);
  }
  for (const [file, name, props] of API) {
    const m = read(file).match(new RegExp(`export function ${name}\\(\\{([^}]*)\\}`));
    if (!m) { errs.push(`api: thiếu export ${name}`); continue; }
    const got = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    for (const p of props) if (!got.includes(p)) errs.push(`api: ${name} thiếu prop ${p}`);
    for (const p of got) if (!props.includes(p)) errs.push(`api: ${name} thêm prop ${p}`);
  }
  if (!/export type MonthRow\b/.test(read("app/src/components/insight/performance/data.ts")))
    errs.push("api: performance/data.ts thiếu export type MonthRow");
  return errs;
}

// ---------------------------------------------------------------- structure (AC-8)
const snap = (which) => {
  const p = join(ctx.root, SLUG_DIR, "evidence", which, "snapshot.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
};
function firstDiff(a, b, path = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) return path || "(gốc)";
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const d = firstDiff(a[k], b[k], path ? `${path}.${k}` : k);
    if (d) return d;
  }
  return path;
}
function checkStructure() {
  const before = snap("before");
  const after = snap("after");
  if (!before || !after) return [`structure: thiếu snapshot ${before ? "after" : "before"}`];
  const errs = [];
  for (const part of ["structure", "interactions"]) {
    const d = firstDiff(before[part], after[part]);
    if (d) errs.push(`structure: khác ở ${part}.${d}`);
  }
  if (!before.capture_sha || before.capture_sha !== after.capture_sha) errs.push("structure: khác bản script chụp");
  if (Math.abs(Date.parse(after.at) - Date.parse(before.at)) > 2 * 3600e3) errs.push("structure: hai bản chụp cách nhau quá 2 giờ");
  if (!before.app_src_tree || git("rev-parse", `${before.head}:app/src`).out !== before.app_src_tree)
    errs.push("structure: bản trước không khớp cây app/src của before.head");
  if (spawnSync("git", ["merge-base", "--is-ancestor", before.head ?? "x", "HEAD"], { cwd: ctx.git }).status !== 0)
    errs.push("structure: before.head không là tổ tiên HEAD");
  if (!after.app_src_tree || after.app_src_tree !== git("rev-parse", "HEAD:app/src").out)
    errs.push("structure: bản sau không chụp trên HEAD");
  return errs;
}

// ---------------------------------------------------------------- pixels (AC-8, khung P&L)
function checkPixels() {
  const errs = [];
  const [b, a] = [snap("before"), snap("after")];
  if (!b || !a || b.capture_sha !== a.capture_sha) errs.push("pixels: hai bản chụp khác bản script");
  for (const mode of ["light", "dark", "light-390", "dark-390"]) {
    const name = `yield-pnl-${mode}.png`;
    const [pb, pa] = ["before", "after"].map((w) => join(ctx.root, SLUG_DIR, "evidence", w, name));
    if (!existsSync(pb) || !existsSync(pa)) { errs.push(`pixels: thiếu ${name}`); continue; }
    if (sha256(readFileSync(pb)) !== sha256(readFileSync(pa))) errs.push(`pixels: yield-pnl-${mode} khác`);
  }
  return errs;
}

// ---------------------------------------------------------------- docs (AC-10)
let reportCache = null;
function lintReport() {
  if (reportCache === null) {
    const r = spawnSync("npm", ["run", "-s", "lint:ui-report"], { cwd: join(ctx.git, "app"), encoding: "utf8" });
    reportCache = r.stdout || "";
  }
  return reportCache;
}
const reportCore = (text) =>
  text.split("\n").filter((l) => /^\*\*Tổng \d+ vi phạm/.test(l) || /^\| (`onehub-ui\/|\*\*Tổng)/.test(l)).join("\n");
function checkDocs() {
  const errs = [];
  const doc = read("docs/research/ui-baseline-2026-10.md");
  const at = doc.indexOf("## Sau B3");
  if (at < 0) return ["docs: thiếu mục Sau B3"];
  const section = doc.slice(at, doc.indexOf("\n## ", at + 1) > 0 ? doc.indexOf("\n## ", at + 1) : undefined);
  if (!/File > 200 dòng phạm vi B3[^\n]*7 → 0/.test(section)) errs.push("docs: thiếu dòng file > 200 dòng 7 → 0");
  if (!/mục suppress phạm vi B3[^\n]*8 → 0/i.test(section)) errs.push("docs: thiếu dòng mục suppress phạm vi 8 → 0");
  const sha = section.match(/\*\*Commit:\*\*\s*`([0-9a-f]{7,40})`/)?.[1];
  if (!sha) errs.push("docs: mục Sau B3 thiếu commit đo");
  else if (git("rev-parse", `${sha}:app/src`).out === git("rev-parse", "HEAD:app/src").out) {
    if (reportCore(section) !== reportCore(lintReport())) errs.push("docs: tổng lệch với npm run lint:ui-report");
  } else console.log(`  (app/src đã đổi sau ${sha}: số tổng chỉ chứng ở commit đó)`);
  const catalog = read(".claude/skills/onehub-ui/catalog.md").split("\n");
  for (const block of ["chart-6", "chart-13", "chart-36"]) {
    const row = catalog.find((l) => l.includes(`\`@reui/${block}\``));
    if (!row?.includes("components/charts/")) errs.push(`docs: catalog thiếu components/charts/ ở ${block}`);
  }
  return errs;
}

// ---------------------------------------------------------------- selftest
const CHECKS = {
  palette: checkPalette, contrast: checkContrast, "data-color": checkDataColor, duplicates: checkDuplicates,
  "file-size": checkFileSize, suppressions: checkSuppressions, api: checkApi, structure: checkStructure,
  pixels: checkPixels, docs: checkDocs,
};
const FIXTURE = [
  "app/src/components/insight", "app/src/components/yield", "app/src/components/charts",
  "app/src/app/globals.css", "app/src/app/(app)/yield/page.tsx", "app/node_modules/tailwindcss/theme.css",
  "app/eslint-suppressions.json", ".claude/skills/onehub-ui/data-color.md", ".claude/skills/onehub-ui/catalog.md",
  "docs/research/ui-baseline-2026-10.md", `${SLUG_DIR}/evidence/before`, `${SLUG_DIR}/evidence/after`,
];
const edit = (rel, fn) => (dir) => writeFileSync(join(dir, rel), fn(readFileSync(join(dir, rel), "utf8")));
const add = (rel, text) => (dir) => appendFileSync(join(dir, rel), text);
const PERF = "app/src/components/insight/performance/data.ts";
const snapEdit = (which, fn) => edit(`${SLUG_DIR}/evidence/${which}/snapshot.json`, (t) => JSON.stringify(fn(JSON.parse(t))));
const CASES = [
  ["palette", null],
  ["palette", add(PERF, '\nexport const X = "bg-teal-500 dark:bg-teal-400"\n'), "màu ngoài palette.ts (lớp Tailwind sắc-bậc)"],
  ["palette", add(PERF, '\nexport const X = "var(--color-teal-500)"\n'), "màu ngoài palette.ts (var(--color-sắc-bậc))"],
  ["palette", add(PERF, '\nexport const X = "#14b8a6"\n'), "màu ngoài palette.ts (hex)"],
  ["palette", add(PERF, '\nexport const X = "rgb(1, 2, 3)"\n'), "màu ngoài palette.ts (rgb)"],
  ["palette", add(PERF, '\nexport const X = "hsl(1 2% 3%)"\n'), "màu ngoài palette.ts (hsl)"],
  ["palette", add(PERF, '\nexport const X = "oklch(0.5 0.1 100)"\n'), "màu ngoài palette.ts (oklch)"],
  ["palette", add(PERF, '\n// <path fill="teal" />\nexport const X = \'<path fill="teal" />\'\n'), "màu ngoài palette.ts (tên màu CSS)"],
  ["palette", add(PERF, '\nexport const X = "var(--chart-1)"\n'), "dùng --chart-*"],
  ["palette", edit(PERF, (t) => t.replace(/(key:\s*"revenue"[^}]*?series:\s*)"revenue"/, '$1"share1"')), "lệch nghĩa revenue"],
  ["palette", edit("app/src/components/yield/pnl/data.ts", (t) => t.replace('revenue: swatchOf("revenue")', 'revenue: swatchOf("margin")')), "lệch nghĩa revenue (pnl/data.ts SWATCHES"],
  ["palette", edit("app/src/components/insight/revenue-mix/value-faces.tsx", (t) => t.replace('lead: swatchOf("share1")', 'lead: swatchOf("share2")')), "lệch nghĩa share1 (revenue-mix chấm lead"],
  ["contrast", null],
  ["contrast", edit(PALETTE, (t) => t.replace(/(revenue:\s*\{[^}]*light:\s*)"var\(--color-indigo-500\)"/, '$1"var(--color-indigo-300)"')), "revenue sáng 2.01 < 3"],
  ["contrast", edit(PALETTE, (t) => t.replace(/(margin:\s*\{[^}]*?)\s*\}/, "$1, exempt: true }")), "danh sách miễn đổi"],
  ["contrast", edit(PALETTE, (t) => t.replace("bg-amber-600 dark:bg-amber-400", "bg-amber-500 dark:bg-amber-400")), "swatch occupancy lệch cặp"],
  ["data-color", null],
  ["data-color", edit(".claude/skills/onehub-ui/data-color.md", (t) => t.split("\n").filter((l) => !(l.startsWith("|") && l.includes("`margin`"))).join("\n")), "thiếu khoá margin"],
  ["data-color", edit(".claude/skills/onehub-ui/data-color.md", (t) => t.replace(/(\|\s*`adr`[^\n]*?)sky-600/, "$1sky-500")), "lệch bậc adr"],
  ["data-color", add(".claude/skills/onehub-ui/data-color.md", "\nBảng phụ: TBD.\n"), "còn TBD"],
  ["data-color", edit(".claude/skills/onehub-ui/data-color.md", (t) => t.replace("| `revenue` | Doanh thu | indigo-500 (4,58) | indigo-400 (5,74) |", "| `revenue` | Doanh thu | indigo-400 (5,74) | indigo-500 (4,58) |")), "lệch bậc revenue"],
  ["duplicates", null],
  ["duplicates", (dir) => cpSync(join(dir, "app/src/components/charts/use-trigger-tooltip.ts"), join(dir, "app/src/components/yield/pnl/hint.ts")), "duplicates: trùng"],
  ["file-size", null],
  ["file-size", add(PERF, "\n".repeat(201)), "file-size: app/src/components/insight/performance/data.ts"],
  ["suppressions", null],
  ["suppressions", edit("app/eslint-suppressions.json", (t) => JSON.stringify({ ...JSON.parse(t), "src/components/insight/performance/data.ts": { "onehub-ui/no-raw-palette": { count: 1 } } })), "còn mục src/components/insight/performance/data.ts"],
  ["suppressions", add(PERF, "\n// eslint-disable-next-line onehub-ui/no-raw-palette -- thử\nexport const Y = 1\n"), "số disable 5"],
  ["api", null],
  ["api", edit("app/src/components/insight/performance/chart.tsx", (t) => t.replace(/(export function PerformanceChart\(\{[^}]*?)\bsource\b/, "$1origin")), "PerformanceChart thiếu prop source"],
  ["structure", null],
  ["structure", snapEdit("after", (s) => { const k = Object.keys(s.interactions)[0]; s.interactions[k].hover = `${s.interactions[k].hover}x`; return s; }), "structure: khác ở interactions."],
  ["structure", snapEdit("after", (s) => ({ ...s, capture_sha: "0" })), "khác bản script chụp"],
  ["structure", snapEdit("after", (s) => ({ ...s, app_src_tree: "0".repeat(40) })), "bản sau không chụp trên HEAD"],
  ["pixels", null],
  ["pixels", add(`${SLUG_DIR}/evidence/after/yield-pnl-dark.png`, "x"), "pixels: yield-pnl-dark khác"],
  ["pixels", (dir) => rmSync(join(dir, SLUG_DIR, "evidence/after/yield-pnl-light-390.png")), "pixels: thiếu yield-pnl-light-390.png"],
  ["docs", null],
  ["docs", edit("docs/research/ui-baseline-2026-10.md", (t) => t.replace(/(## Sau B3[\s\S]*?\*\*Tổng )(\d+)/, (_, a, n) => `${a}${Number(n) + 1}`)), "docs: tổng lệch"],
  ["docs", edit(".claude/skills/onehub-ui/catalog.md", (t) => t.replace(/(`@reui\/chart-36`[^\n]*?)components\/charts\//, "$1")), "catalog thiếu components/charts/ ở chart-36"],
];

function runCheck(name, root, gitRoot) {
  ctx.root = root;
  ctx.git = gitRoot;
  const log = console.log;
  console.log = () => {};
  try { return CHECKS[name](); } finally { console.log = log; }
}
function selftest() {
  const base = mkdtempSync(join(tmpdir(), "b3-fixture-"));
  for (const rel of FIXTURE) cpSync(join(REPO, rel), join(base, rel), { recursive: true });
  let failed = 0;
  CASES.forEach(([name, breakIt, expected], i) => {
    const dir = mkdtempSync(join(tmpdir(), "b3-case-"));
    cpSync(base, dir, { recursive: true });
    if (breakIt) breakIt(dir);
    const errs = runCheck(name, dir, REPO);
    const label = breakIt ? `phá #${i} (${expected})` : "lành";
    const ok = breakIt ? errs.some((e) => e.includes(expected)) : errs.length === 0;
    console.log(`${ok ? "PASS" : "FAIL"} ${name} ${label}${ok ? "" : ` → ${errs.join(" | ") || "không lỗi nào"}`}`);
    if (!ok) failed += 1;
    rmSync(dir, { recursive: true, force: true });
  });
  rmSync(base, { recursive: true, force: true });
  console.log(`${CASES.length - failed}/${CASES.length} ca đạt`);
  return failed === 0;
}

// ---------------------------------------------------------------- main
const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : null; };
const cmd = argv[0];
if (cmd === "selftest") process.exit(selftest() ? 0 : 1);
if (!CHECKS[cmd]) {
  console.error(`usage: b3-check.mjs <${[...Object.keys(CHECKS), "selftest"].join("|")}> [--root <dir>] [--git <dir>]`);
  process.exit(2);
}
ctx.root = opt("root") ?? REPO;
ctx.git = opt("git") ?? ctx.root;
const errs = CHECKS[cmd]();
for (const e of errs) console.log(e);
console.log(errs.length ? `${cmd}: HỎNG (${errs.length})` : `${cmd}: ĐẠT`);
process.exit(errs.length ? 1 : 0);

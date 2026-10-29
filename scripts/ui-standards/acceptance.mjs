#!/usr/bin/env node
// Harness nghiệm thu cho ui-standards-reui (E1, E2, E10, E11, E12). Chỉ dùng Node builtins.
// Dùng: node scripts/ui-standards/acceptance.mjs <mcp-config|mcp-connected|kit-sockets|pointers|baseline-doc>
// Mỗi check in báo cáo ngắn; thoát 0 khi đạt, 1 khi hỏng (kèm lý do).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const MCP_URL = "https://mcp.reui.io/api/mcp";

class Fail extends Error {}
const fail = (msg) => {
  throw new Fail(msg);
};
const ok = (msg) => console.log(`  OK  ${msg}`);

function git(args) {
  const r = spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) fail(`git ${args.join(" ")} lỗi: ${r.stderr}`);
  return r.stdout;
}

// ---------------------------------------------------------------- E1
function mcpConfig() {
  const mcp = JSON.parse(read(".mcp.json"));
  const url = (mcp.mcpServers ?? mcp.servers ?? {}).reui?.url;
  if (url !== MCP_URL) fail(`.mcp.json: reui.url = ${JSON.stringify(url)}, cần ${MCP_URL}`);
  ok(`.mcp.json có server reui → ${url}`);

  const tracked = git(["ls-files"]).split("\n").filter(Boolean);
  const candidates = tracked.filter(
    (f) =>
      f === ".mcp.json" ||
      f === ".cursor/mcp.json" ||
      f === "opencode.json" ||
      f === ".gemini/settings.json" ||
      f.startsWith(".codex/") ||
      /^\.claude\/settings[^/]*\.json$/.test(f),
  );
  if (!candidates.includes(".mcp.json")) fail(".mcp.json chưa được git theo dõi");
  const bad = [];
  for (const f of candidates) {
    const text = read(f);
    const hits = [];
    if (/Authorization/.test(text)) hits.push("Authorization");
    if (/reui_pat_/.test(text)) hits.push("reui_pat_");
    // REUI_LICENSE_KEY=<giá trị> hoặc "REUI_LICENSE_KEY": "<giá trị>" — chấp nhận placeholder.
    const placeholder = /^(<[^>]*>|\$\{?[A-Z_]+\}?|your[-_ ].*|xxx+|\.\.\.|changeme|placeholder|)$/i;
    for (const m of text.matchAll(/REUI_LICENSE_KEY["']?\s*[=:]\s*["']?([^"'\s,}]*)/g)) {
      if (!placeholder.test(m[1])) hits.push(`REUI_LICENSE_KEY=${m[1].slice(0, 4)}…`);
    }
    if (hits.length) bad.push(`${f}: ${hits.join(", ")}`);
  }
  if (bad.length) fail(`file đã commit chứa bí mật/header cấm:\n    ${bad.join("\n    ")}`);
  ok(`${candidates.length} file cấu hình agent đã commit sạch (${candidates.join(", ")})`);
}

// ---------------------------------------------------------------- E2
function mcpConnected() {
  const r = spawnSync("claude", ["mcp", "list"], { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
  if (r.error) fail(`không chạy được 'claude mcp list': ${r.error.message}`);
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const lines = out.split("\n").filter((l) => /reui|conflict/i.test(l));
  console.log(lines.map((l) => `    | ${l}`).join("\n") || "    | (không có dòng nào nhắc reui)");
  if (/conflicting scopes?/i.test(out)) fail("còn cảnh báo 'Conflicting scopes' cho reui (xoá entry local: claude mcp remove reui -s local)");
  const line = lines.find((l) => l.includes(MCP_URL) && /Connected/.test(l) && !/Needs authentication|Failed/i.test(l));
  if (!line) fail(`không có dòng reui nào có ${MCP_URL} ở trạng thái Connected (đăng nhập OAuth: claude mcp login reui)`);
  ok("reui phạm vi dự án Connected, không trùng phạm vi local");
}

// ---------------------------------------------------------------- E10
function kitSockets() {
  const base = join(process.env.HOME ?? "", ".claude/plugins/cache/acceptance-gate-kit/acceptance-gate");
  let lib = join(base, "2.32.0/lib/evidence-core.cjs");
  if (!existsSync(lib)) {
    const vs = existsSync(base) ? readdirSync(base).sort() : [];
    if (!vs.length) fail(`không thấy kit tại ${base}`);
    lib = join(base, vs[vs.length - 1], "lib/evidence-core.cjs");
  }
  const { resolveConfigKey } = createRequire(import.meta.url)(lib);
  if (typeof resolveConfigKey !== "function") fail("kit không export resolveConfigKey");
  const cfg = read("_acceptance/config.yaml");
  for (const key of ["feature_loop.ui_standards_skill", "design_pass.ds_skill"]) {
    const v = resolveConfigKey(cfg, key);
    if (v !== "onehub-ui") fail(`${key} = ${JSON.stringify(v)}, cần "onehub-ui"`);
    ok(`resolveConfigKey(${key}) = onehub-ui`);
  }
  const skill = ".claude/skills/onehub-ui/SKILL.md";
  if (!existsSync(join(ROOT, skill))) fail(`thiếu ${skill}`);
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(read(skill));
  if (!fm || !/^name:\s*onehub-ui\s*$/m.test(fm[1])) fail(`${skill}: frontmatter không có 'name: onehub-ui'`);
  ok(`${skill} có frontmatter name: onehub-ui`);
}

// ---------------------------------------------------------------- E11
function pointers() {
  for (const f of ["AGENTS.md", "app/CLAUDE.md", "app/DESIGN_RULES.md", ".claude/rules/ui.md"]) {
    if (!read(f).includes("onehub-ui")) fail(`${f} không nhắc onehub-ui`);
    ok(`${f} nhắc onehub-ui`);
  }
  const agents = read("AGENTS.md");
  const begin = agents.split("<!-- BEGIN:reui-agent-rules -->").length - 1;
  const end = agents.split("<!-- END:reui-agent-rules -->").length - 1;
  if (begin !== 1 || end !== 1) fail(`AGENTS.md có ${begin} BEGIN / ${end} END reui-agent-rules, cần đúng 1/1`);
  ok("AGENTS.md có đúng 1 khối reui-agent-rules (BEGIN/END)");

  const ia = read("docs/architecture/invest-portal-ia.md").split("\n");
  const start = ia.findIndex((l) => l.startsWith("### 3.3"));
  if (start < 0) fail("IA: không thấy mục '### 3.3'");
  let stop = ia.length;
  for (let i = start + 1; i < ia.length; i++) {
    if (/^#{2,3} /.test(ia[i])) {
      stop = i;
      break;
    }
  }
  const section = ia.slice(start, stop);
  const offenders = section.filter((l) => l.includes("loading.tsx") && !/không dùng|KHÔNG/.test(l));
  if (offenders.length) fail(`IA §3.3 còn dặn loading.tsx:\n    ${offenders.join("\n    ")}`);
  if (!section.some((l) => l.includes("Suspense"))) fail("IA §3.3 không nhắc Suspense");
  ok("IA §3.3: không dặn loading.tsx cấp segment, có nhắc Suspense");
}

// ---------------------------------------------------------------- E12
/** Các hàng «| **Tổng** | tổng | baseline | ngoại lệ | mới |» theo thứ tự xuất hiện. */
const hangTong = (md) =>
  [...md.matchAll(/\|\s*\*\*Tổng\*\*\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/g)].map((m) => m.slice(1, 5).map(Number));

// Tài liệu baseline là NHẬT KÝ các lần đo (138 → 131 → 85 → …): mỗi lần đo hai bảng (theo luật, theo thư mục) cùng hàng Tổng.
// Thước: lần đo MỚI NHẤT khớp báo cáo sống; cột Baseline = tổng count của eslint-suppressions.json; không vi phạm mới; số
// tổng và baseline qua các lần đo chỉ giảm (hồ sơ ui-standards-reui-thuoc-loi-thoi — thay so «ba con số bằng 138» đã lỗi thời).
function baselineDoc() {
  const appDir = join(ROOT, "app");
  const rep = spawnSync("npm run --silent lint:ui-report", {
    cwd: appDir,
    encoding: "utf8",
    shell: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  // eslint thoát khác 0 nếu có lỗi mới; report vẫn in được → chỉ cần stdout.
  const song = hangTong(rep.stdout ?? "")[0];
  if (!song) fail(`không đọc được hàng Tổng từ lint:ui-report:\n${(rep.stdout ?? "").slice(-300)}${rep.stderr ?? ""}`);

  const sup = JSON.parse(readFileSync(join(appDir, "eslint-suppressions.json"), "utf8"));
  const supTotal = Object.values(sup)
    .flatMap((rules) => Object.values(rules))
    .reduce((a, v) => a + v.count, 0);

  // UI_BASELINE_DOC (đường tuyệt đối): bản chép tài liệu cho phép đo đột biến; vắng → tài liệu thật.
  const hang = hangTong(process.env.UI_BASELINE_DOC ? readFileSync(process.env.UI_BASELINE_DOC, "utf8") : read("docs/research/ui-baseline-2026-10.md"));
  if (hang.length < 2 || hang.length % 2) fail(`tài liệu baseline phải có từng cặp hàng Tổng (theo luật, theo thư mục) — đọc được ${hang.length}`);
  const lan = [];
  for (let i = 0; i < hang.length; i += 2) {
    if (hang[i].join() !== hang[i + 1].join()) fail(`lần đo thứ ${i / 2 + 1} của tài liệu: hai bảng lệch nhau (${hang[i]} ≠ ${hang[i + 1]})`);
    lan.push(hang[i]);
  }
  const moiNhat = lan.at(-1);
  console.log(`    lint:ui-report = ${song.join("/")} (tổng/baseline/ngoại lệ/mới) · eslint-suppressions.json = ${supTotal} · tài liệu: ${lan.map((l) => l[0]).join(" → ")} (mới nhất ${moiNhat.join("/")})`);
  if (song[3] !== 0) fail(`lint:ui-report còn ${song[3]} vi phạm mới (đỏ)`);
  if (song[1] !== supTotal) fail(`cột Baseline của báo cáo (${song[1]}) lệch tổng eslint-suppressions.json (${supTotal})`);
  if (moiNhat.join() !== song.join()) fail(`mục đo mới nhất của tài liệu (${moiNhat.join("/")}) lệch báo cáo sống (${song.join("/")}) — thêm mục đo mới vào tài liệu`);
  const tongTang = lan.findIndex((l, i) => i > 0 && l[0] > lan[i - 1][0]);
  if (tongTang > 0) fail(`tổng vi phạm tăng ở lần đo thứ ${tongTang + 1} (${lan[tongTang - 1][0]} → ${lan[tongTang][0]}) — tổng chỉ được giảm`);
  const tang = lan.findIndex((l, i) => i > 0 && l[1] > lan[i - 1][1]);
  if (tang > 0) fail(`số baseline tăng ở lần đo thứ ${tang + 1} (${lan[tang - 1][1]} → ${lan[tang][1]}) — baseline chỉ được giảm`);
  ok(`lần đo mới nhất khớp báo cáo sống (${song.join("/")}), baseline = suppressions = ${supTotal}, tổng và baseline chỉ giảm`);
}

const CHECKS = {
  "mcp-config": mcpConfig,
  "mcp-connected": mcpConnected,
  "kit-sockets": kitSockets,
  pointers,
  "baseline-doc": baselineDoc,
};

const name = process.argv[2];
if (!CHECKS[name]) {
  console.error(`Cách dùng: acceptance.mjs <${Object.keys(CHECKS).join("|")}>`);
  process.exit(2);
}
console.log(`[ui-standards-reui] ${name}`);
try {
  CHECKS[name]();
  console.log("PASS");
} catch (e) {
  if (!(e instanceof Fail)) throw e;
  console.log(`  FAIL ${e.message}`);
  console.log("FAIL");
  process.exit(1);
}

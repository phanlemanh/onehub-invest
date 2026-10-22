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
function baselineDoc() {
  const appDir = join(ROOT, "app");
  const rep = spawnSync("npm run --silent lint:ui-report", {
    cwd: appDir,
    encoding: "utf8",
    shell: true,
    maxBuffer: 64 * 1024 * 1024,
  });
  // eslint thoát khác 0 nếu có lỗi mới; report vẫn in được → chỉ cần stdout.
  const m = /\*\*Tổng (\d+) vi phạm/.exec(rep.stdout ?? "");
  if (!m) fail(`không đọc được tổng từ lint:ui-report:\n${(rep.stdout ?? "").slice(-300)}${rep.stderr ?? ""}`);
  const reportTotal = Number(m[1]);

  const sup = JSON.parse(readFileSync(join(appDir, "eslint-suppressions.json"), "utf8"));
  const supTotal = Object.values(sup)
    .flatMap((rules) => Object.values(rules))
    .reduce((a, v) => a + v.count, 0);

  const doc = read("docs/research/ui-baseline-2026-10.md");
  const dm = /\*\*Tổng (\d+) vi phạm/.exec(doc);
  if (!dm) fail("tài liệu baseline không có câu '**Tổng N vi phạm'");
  const docTotal = Number(dm[1]);
  const tableTotal = [...doc.matchAll(/\|\s*\*\*Tổng\*\*\s*\|\s*(\d+)\s*\|/g)].map((x) => Number(x[1]));

  console.log(`    lint:ui-report = ${reportTotal} · eslint-suppressions.json = ${supTotal} · tài liệu = ${docTotal} (hàng bảng: ${tableTotal.join(", ")})`);
  if (!(reportTotal === supTotal && supTotal === docTotal)) fail("ba con số không bằng nhau");
  if (tableTotal.some((n) => n !== docTotal)) fail("hàng Tổng trong bảng của tài liệu lệch con số tổng");
  ok(`cả ba bằng ${docTotal}`);
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

#!/usr/bin/env node
// Harness nghiệm thu cho glossary-context (CONTEXT.md + luật đặt tên + CONTEXT-PRODUCT). Chỉ dùng Node builtins.
// Dùng: node scripts/glossary/acceptance.mjs <glossary|w6|rebuild|naming-rule|product-page|runner>
// Mỗi check in báo cáo ngắn; thoát 0 khi đạt, 1 khi hỏng (kèm lý do).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const DOSSIER = "_acceptance/glossary-context";
const GROUPS = ["Địa lý", "Tài sản & tin", "Giá", "Chỉ số", "Chiến lược đầu tư", "Dữ liệu & nguồn", "Cổng & tính năng"];

class Fail extends Error {}
const fail = (msg) => {
  throw new Fail(msg);
};
const ok = (msg) => console.log(`  OK  ${msg}`);

/** Thư mục kit acceptance-gate mới nhất trong cache plugin. */
function kitDir() {
  const base = join(process.env.HOME ?? "", ".claude/plugins/cache/acceptance-gate-kit/acceptance-gate");
  const num = (v) => v.split(".").map(Number);
  const vs = existsSync(base)
    ? readdirSync(base).filter((v) => /^\d+\.\d+\.\d+$/.test(v)).sort((a, b) => {
        const [x, y] = [num(a), num(b)];
        return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
      })
    : [];
  if (!vs.length) fail(`không thấy kit tại ${base}`);
  return join(base, vs[vs.length - 1]);
}
const glossaryLib = () => createRequire(import.meta.url)(join(kitDir(), "lib/context-glossary.js"));

// ---------------------------------------------------------------- AC-1
function glossary() {
  if (!existsSync(join(ROOT, "CONTEXT.md"))) fail("thiếu CONTEXT.md ở gốc repo");
  const text = read("CONTEXT.md");
  const g = glossaryLib().readGlossary(ROOT);
  if (!g || !g.terms.length) fail("parser của kit không đọc ra thuật ngữ nào");
  ok(`parser kit đọc ${g.terms.length} thuật ngữ, ${g.aliases.length} tên bị loại, ${g.allow.length} cụm _Allow_`);

  // Nhóm = heading `## …`; đếm thuật ngữ theo nhóm bằng vị trí dòng.
  const lines = text.split("\n");
  let group = null;
  const perGroup = Object.fromEntries(GROUPS.map((x) => [x, 0]));
  for (const l of lines) {
    const h = /^##\s+(.+?)\s*$/.exec(l);
    if (h) group = h[1];
    else if (/^\s*\*\*(.+?)\*\*\s*:/.test(l) && group in perGroup) perGroup[group]++;
  }
  const empty = GROUPS.filter((x) => !perGroup[x]);
  if (empty.length) fail(`nhóm không có thuật ngữ: ${empty.join(", ")}`);
  ok(`7/7 nhóm có thuật ngữ (${GROUPS.map((x) => `${x} ${perGroup[x]}`).join(" · ")})`);

  const noDef = g.terms.filter((t) => t.definition.length < 8).map((t) => t.term);
  if (noDef.length) fail(`thuật ngữ thiếu định nghĩa: ${noDef.join(", ")}`);
  ok("mọi thuật ngữ có định nghĩa cùng dòng");

  const canon = new Set(g.terms.map((t) => t.term.toLowerCase()));
  const clash = g.aliases.filter((a) => canon.has(a.alias.toLowerCase())).map((a) => `${a.alias} (_Avoid_ của ${a.term})`);
  if (clash.length) fail(`tên bị loại trùng một thuật ngữ chuẩn: ${clash.join(", ")}`);
  const dupTerm = g.terms.map((t) => t.term).filter((t, i, a) => a.indexOf(t) !== i);
  if (dupTerm.length) fail(`thuật ngữ khai hai lần: ${dupTerm.join(", ")}`);
  ok("không tên bị loại nào trùng thuật ngữ chuẩn; không thuật ngữ trùng");
}

// ---------------------------------------------------------------- AC-2
function lint(root, slug) {
  const r = spawnSync("node", [join(kitDir(), "scripts/eval-coverage-lint.js"), root, "--slug", slug], { encoding: "utf8" });
  return (r.stdout ?? "") + (r.stderr ?? "");
}
function w6() {
  if (!existsSync(join(ROOT, "CONTEXT.md"))) fail("thiếu CONTEXT.md ở gốc repo");
  // Should-fire: hồ sơ mẫu trong thư mục tạm, tiêu chí dùng "tỷ lệ lấp đầy" (bị loại cho "Công suất").
  const tmp = mkdtempSync(join(tmpdir(), "glossary-w6-"));
  try {
    mkdirSync(join(tmp, "_acceptance", "w6-mau"), { recursive: true });
    cpSync(join(ROOT, "_acceptance/config.yaml"), join(tmp, "_acceptance/config.yaml"));
    cpSync(join(ROOT, "CONTEXT.md"), join(tmp, "CONTEXT.md"));
    writeFileSync(
      join(tmp, "_acceptance/w6-mau/contract.md"),
      ["---", "feature: mẫu W6", "slug: w6-mau", "risk_tier: T2", "surfaces: [cli]", "status: draft", "---", "", "## Criteria", "",
        "- AC-1: Given thị trường có listing, When mở Insight, Then thấy tỷ lệ lấp đầy của tháng gần nhất.", "",
        "## Out of scope", "", "- a", "- b", ""].join("\n"),
    );
    writeFileSync(join(tmp, "_acceptance/w6-mau/evals.yaml"),
      "schema_version: 1\nfeature_slug: w6-mau\nevals:\n  - id: E1\n    criterion: AC-1\n    executor: judgment\n    question: \"?\"\n");
    const out = lint(tmp, "w6-mau");
    const hit = out.split("\n").filter((l) => /\bW6\b/.test(l) && /contract line/.test(l));
    // "lấp đầy" cũng bị loại và nằm trong "tỷ lệ lấp đầy" → có thể ra 2 dòng, đều phải chỉ "Công suất".
    if (!hit.some((l) => /"tỷ lệ lấp đầy"/.test(l)) || !hit.every((l) => /for "Công suất"/.test(l)))
      fail(`hồ sơ mẫu: cần W6 nêu "tỷ lệ lấp đầy" và mọi dòng W6 chỉ "Công suất", nhận:\n${out}`);
    hit.forEach((l) => ok(`should-fire: ${l.trim()}`));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  // Should-NOT-fire: ba hồ sơ đã ký.
  for (const slug of ["portal-deals-airdna", "ops-access-hardening", "ui-standards-reui"]) {
    const w = lint(ROOT, slug).split("\n").filter((l) => /\bW6 contract line/.test(l));
    if (w.length) fail(`${slug}: có W6 không mong muốn:\n    ${w.join("\n    ")}`);
    ok(`should-NOT-fire: ${slug} không có W6`);
  }
}

// ---------------------------------------------------------------- AC-3
async function rebuild() {
  const tmp = mkdtempSync(join(tmpdir(), "glossary-rebuild-"));
  try {
    const out = join(tmp, "CONTEXT.md");
    const date = (/Mạnh duyệt (\d{4}-\d{2}-\d{2})/.exec(read("CONTEXT.md")) ?? [])[1];
    if (!date) fail("CONTEXT.md thiếu dòng 'Mạnh duyệt YYYY-MM-DD'");
    const r = spawnSync("node", [join(ROOT, DOSSIER, "build.mjs"), "--context", date, "--out", out], { encoding: "utf8" });
    if (r.status !== 0) fail(`build.mjs lỗi: ${r.stderr}`);
    if (readFileSync(out, "utf8") !== read("CONTEXT.md")) fail("CONTEXT.md lệch bản dựng từ terms.mjs — dựng lại hoặc sửa terms.mjs");
    ok("CONTEXT.md trùng từng byte bản dựng từ terms.mjs");
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  const { TERMS, RULE_CHOICES } = await import(pathToFileURL(join(ROOT, DOSSIER, "terms.mjs")).href);
  const decided = new Map();
  for (const l of read(`${DOSSIER}/decisions.jsonl`).split("\n").filter(Boolean)) {
    const e = JSON.parse(l);
    const m = /^(Q\d+)\s+([A-C])\b/.exec(e.decision ?? "");
    if (m) decided.set(m[1], m[2]);
  }
  const choices = [...TERMS.filter((t) => t.choice).map((t) => ({ ...t.choice, vn: t.vn })), ...RULE_CHOICES];
  for (const c of choices) {
    const pick = decided.get(c.q);
    if (!pick) fail(`decisions.jsonl chưa có câu trả lời ${c.q}`);
    const want = "ABC"[c.rec];
    if (pick !== want) fail(`${c.q}: Mạnh chọn ${pick} nhưng terms.mjs vẫn để phương án ${want}`);
  }
  ok(`${choices.length} câu Q khớp lựa chọn đã ghi trong decisions.jsonl`);
}

// ---------------------------------------------------------------- AC-7
function namingRule() {
  const agents = read("AGENTS.md");
  const conv = (/## Quy ước\n([\s\S]*?)\n## /.exec(agents) ?? [])[1] ?? "";
  if (!conv) fail("AGENTS.md không có mục '## Quy ước'");
  const parts = [
    [/tiếng Anh;[^\n]*RESO/, "code/API tiếng Anh, RESO khi có"],
    [/Chữ UI tiếng Việt, nhãn lấy từ `CONTEXT\.md`/, "chữ UI tiếng Việt lấy từ CONTEXT.md"],
    [/URL tiếng Anh toàn bộ\*\*: ASCII, kebab-case/, "URL tiếng Anh toàn bộ, ASCII kebab"],
    [/tên riêng[\s\S]*mã quốc gia/, "ngoại lệ slug địa lý + mã quốc gia"],
    [/redirect vĩnh viễn trong `app\/next\.config\.ts`,\s*\n?\s*làm trong đợt dọn/, "đổi slug kèm redirect, làm trong đợt dọn"],
  ];
  for (const [re, label] of parts) {
    if (!re.test(conv)) fail(`AGENTS.md › Quy ước thiếu vế: ${label}`);
    ok(`Quy ước có vế: ${label}`);
  }
  if (/URL ASCII không dấu/.test(agents)) fail("AGENTS.md còn câu cũ 'URL ASCII không dấu'");
  ok("câu cũ 'URL ASCII không dấu (slugifyName())' đã bỏ");
  for (const f of ["AGENTS.md", ".claude/skills/onehub-ui/copy-vi.md", "docs/architecture/portals.md"]) {
    if (!/`CONTEXT\.md`/.test(read(f))) fail(`${f} không trỏ tới CONTEXT.md`);
    ok(`${f} trỏ CONTEXT.md`);
  }
}

// ---------------------------------------------------------------- AC-8
function productPage() {
  const rel = "docs/product/CONTEXT-PRODUCT.md";
  if (!existsSync(join(ROOT, rel))) fail(`thiếu ${rel}`);
  const text = read(rel);
  const n = text.split("\n").length;
  if (n > 80) fail(`${rel} dài ${n} dòng (> 80)`);
  ok(`${rel} dài ${n} dòng`);
  const want = [/người dùng/i, /pipeline đầu tư 4 giai đoạn/i, /thị trường đang phủ/i, /hai cổng/i, /nguồn dữ liệu và SPL/i];
  const sections = text.split(/\n(?=## )/).slice(1);
  for (const re of want) {
    const s = sections.find((x) => re.test(x.split("\n")[0]));
    if (!s) fail(`thiếu mục ${re}`);
    const refs = [...s.matchAll(/`([^`\s]+\.(?:md|yaml|mjs|ts))`/g)].map((m) => m[1]);
    const real = refs.filter((r) => existsSync(join(ROOT, r)));
    const dead = refs.filter((r) => !existsSync(join(ROOT, r)));
    if (!real.length) fail(`mục "${s.split("\n")[0]}" không trỏ tài liệu nguồn nào có thật`);
    if (dead.length) fail(`mục "${s.split("\n")[0]}" trỏ tệp không tồn tại: ${dead.join(", ")}`);
    ok(`${s.split("\n")[0]} — trỏ ${real.join(", ")}`);
  }
  if (!read("AGENTS.md").includes(rel)) fail(`AGENTS.md không trỏ ${rel}`);
  ok(`AGENTS.md trỏ ${rel}`);
}

// ---------------------------------------------------------------- AC-10
function runner() {
  const pkg = JSON.parse(read("app/package.json"));
  const cmd = pkg.scripts?.["test:lint-rules"] ?? "";
  if (!/eslint-plugin-onehub-ui\/tests\/\*\.test\.mjs/.test(cmd)) fail(`test:lint-rules không gom tests/*.test.mjs: ${cmd}`);
  if (!existsSync(join(ROOT, "app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs"))) fail("thiếu tests/route-slugs.test.mjs");
  ok("route-slugs.test.mjs nằm trong glob của npm run test:lint-rules");
  const ci = read(".github/workflows/ui-lint.yml");
  if (!/npm run test:lint-rules/.test(ci)) fail("CI ui-lint không chạy test:lint-rules");
  if (!/"CONTEXT\.md"/.test(ci)) fail("CI ui-lint không kích hoạt khi CONTEXT.md đổi");
  ok("CI ui-lint chạy test:lint-rules và kích hoạt khi CONTEXT.md đổi");
  if (!/^\s+ui_route_slugs:\s*"cd app && node --test eslint-plugin-onehub-ui\/tests\/route-slugs\.test\.mjs"/m.test(read("_acceptance/config.yaml")))
    fail("_acceptance/config.yaml thiếu executors.test.ui_route_slugs");
  ok("config.yaml có executors.test.ui_route_slugs");
}

const CHECKS = { glossary, w6, rebuild, "naming-rule": namingRule, "product-page": productPage, runner };

const name = process.argv[2];
if (!CHECKS[name]) {
  console.error(`Cách dùng: acceptance.mjs <${Object.keys(CHECKS).join("|")}>`);
  process.exit(2);
}
console.log(`[glossary-context] ${name}`);
try {
  await CHECKS[name]();
  console.log("PASS");
} catch (e) {
  if (!(e instanceof Fail)) throw e;
  console.log(`  FAIL ${e.message}`);
  console.log("FAIL");
  process.exit(1);
}

#!/usr/bin/env node
// Báo cáo vi phạm UI: đọc JSON của ESLint từ stdin, in bảng markdown theo luật, theo thư mục cấp 2 dưới src/, và tổng.
//
//   cd app && eslint -f json . | node eslint-plugin-onehub-ui/report.mjs      (hoặc: npm run lint:ui-report)
//
// ĐẾM CẢ MỤC ĐANG BỊ SUPPRESS: ESLint 9.39 đưa mục bị chặn bởi `eslint-suppressions.json` (kind "file") và bởi
// chú thích eslint-disable (kind "directive") vào `result.suppressedMessages`, còn lỗi mới/vượt số đếm nằm ở `result.messages`.
// Tổng = messages + suppressedMessages (chỉ luật `onehub-ui/*`), nên khi cây sạch với baseline thì
// "baseline" == tổng số đếm trong eslint-suppressions.json (kiểm bằng: node -e với reduce count). Không cần
// `--suppressions-location /dev/null`: thử rồi, ESLint 9.39.5 báo lỗi parse với /dev/null và lỗi "không tồn tại" với đường dẫn lạ.
//
// Ghi chú luật không viết riêng: dòng "render không thuần" (Math.random()/Date.now() trong render, spec A4) do
// `react-hooks/purity` của eslint-config-next lo — kiểm `eslint --print-config src/app/page.tsx` ra mức 2 (error),
// nên KHÔNG có luật onehub-ui tương ứng và không bật thêm trong eslint.config.mjs.
//
// Ghi chú suppressions lỗi thời: ESLint 9.39.5 mặc định thoát mã 2 và in "There are suppressions left that do not
// occur anymore" khi sửa xong một vi phạm mà chưa `eslint --prune-suppressions` — không cần cờ phụ. Chỉ khi truyền
// `--pass-on-unpruned-suppressions` thì mới im lặng; ĐỪNG truyền cờ đó trong `npm run lint`.

import { readFileSync } from "node:fs";

const PREFIX = "onehub-ui/";
const results = JSON.parse(readFileSync(0, "utf8"));

const byRule = new Map(); // rule -> { baseline, directive, active }
const byDir = new Map();
const files = new Set();
let total = 0;

const bucket = (map, key) => {
  if (!map.has(key)) map.set(key, { baseline: 0, directive: 0, active: 0 });
  return map.get(key);
};

// Thư mục cấp 2 dưới src/: src/app/ops/page.tsx -> app/ops; src/lib/x.ts -> lib.
function dirOf(filePath) {
  const rel = filePath.includes("/src/") ? filePath.slice(filePath.indexOf("/src/") + 5) : filePath;
  const parts = rel.split("/");
  return parts.length >= 3 ? `${parts[0]}/${parts[1]}` : parts[0];
}

for (const r of results) {
  const dir = dirOf(r.filePath);
  const add = (m, kind) => {
    if (!m.ruleId?.startsWith(PREFIX)) return;
    bucket(byRule, m.ruleId)[kind]++;
    bucket(byDir, dir)[kind]++;
    files.add(r.filePath);
    total++;
  };
  for (const m of r.messages) add(m, "active");
  for (const m of r.suppressedMessages ?? []) {
    const kinds = (m.suppressions ?? []).map((s) => s.kind);
    add(m, kinds.includes("file") ? "baseline" : "directive");
  }
}

const sum = (map, k) => [...map.values()].reduce((a, v) => a + v[k], 0);
const row = (name, v) => `| ${name} | ${v.baseline + v.directive + v.active} | ${v.baseline} | ${v.directive} | ${v.active} |`;
const table = (title, map) => {
  const rows = [...map.entries()].sort((a, b) => {
    const t = (v) => v.baseline + v.directive + v.active;
    return t(b[1]) - t(a[1]) || a[0].localeCompare(b[0]);
  });
  return [
    `### ${title}`,
    "",
    `| ${title.startsWith("Theo luật") ? "Luật" : "Thư mục"} | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |`,
    "|---|---:|---:|---:|---:|",
    ...rows.map(([k, v]) => row(`\`${k}\``, v)),
    row("**Tổng**", { baseline: sum(map, "baseline"), directive: sum(map, "directive"), active: sum(map, "active") }),
    "",
  ].join("\n");
};

console.log(
  [
    "## Số liệu lint UI (luật `onehub-ui/*`)",
    "",
    `**Tổng ${total} vi phạm trong ${files.size} file.** Baseline = mục nằm trong \`eslint-suppressions.json\`; ngoại lệ = \`eslint-disable\` kèm lý do; mới = đang làm lint đỏ.`,
    "",
    table("Theo luật", byRule),
    table("Theo thư mục (cấp 2 dưới `src/`)", byDir),
  ].join("\n"),
);

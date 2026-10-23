// sync-pii-mutation.mjs — chứng minh sync-pii.test.mjs ĐỎ khi ảnh PII lọt vào
// luồng sync: chép sync-cloud.mjs + test + importer sang thư mục tạm (không đụng
// cây làm việc), cấy stg_zalo_posts vào FILL, chạy test, đòi exit ≠ 0.
//   M0 bản gốc (đối chứng)                 → phải XANH
//   M1 FILL += stg_zalo_posts, toàn bộ test → phải ĐỎ
//   M2 như M1 nhưng chỉ ca đọc schema DB    → phải ĐỎ (ca DB tự bắt được, không
//      dựa vào ca tĩnh "không stg_*")
// Exit 0 = cả ba đúng kỳ vọng.
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, symlinkSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs"];

function run(label, mutate, extraArgs, wantFail) {
  const dir = mkdtempSync(join(tmpdir(), "sync-pii-mut-"));
  try {
    for (const f of FILES) copyFileSync(join(PIPE, f), join(dir, f));
    symlinkSync(join(PIPE, "node_modules"), join(dir, "node_modules"));
    if (mutate) {
      const p = join(dir, "sync-cloud.mjs");
      const src = readFileSync(p, "utf8");
      const out = src.replace("export const FILL = [", 'export const FILL = [\n  "stg_zalo_posts",');
      if (out === src) throw new Error("không cấy được đột biến — FILL đổi hình dạng?");
      writeFileSync(p, out);
    }
    const r = spawnSync("node", ["--test", ...extraArgs, "sync-pii.test.mjs"], { cwd: dir, encoding: "utf8" });
    const summary = (r.stdout.match(/^ℹ (pass|fail|skipped) \d+$/gm) ?? []).join(" · ");
    const good = wantFail ? r.status !== 0 : r.status === 0;
    console.log(`${good ? "ok  " : "SAI "} ${label}: ${wantFail ? "mong ĐỎ" : "mong XANH"} → ${r.status === 0 ? "xanh" : "đỏ"} (${summary})`);
    if (/skipped [1-9]/.test(summary) && extraArgs.length) {
      console.log("SAI  ca DB bị skip — DB local không chạy, M2 không chứng minh được gì");
      return false;
    }
    return good;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const results = [
  run("M0 bản gốc", false, [], false),
  run("M1 FILL += stg_zalo_posts", true, [], true),
  run("M2 FILL += stg_zalo_posts, chỉ ca schema DB", true, ["--test-name-pattern=cột ảnh"], true),
];
const pass = results.every(Boolean);
console.log(pass ? "MUTATION PASS" : "MUTATION FAIL");
process.exit(pass ? 0 : 1);

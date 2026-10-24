// sync-pii-mutation.mjs — chứng minh sync-pii.test.mjs ĐỎ khi ảnh PII lọt vào
// luồng sync: chép sync-cloud.mjs + test + importer sang thư mục tạm (không đụng
// cây làm việc; lib/ + node_modules trỏ về bản thật), cấy stg_zalo_posts vào FILL,
// chạy test, đòi đúng các ca gác FILL đỏ — không phải đỏ vì import lỗi.
//   M0 bản gốc (đối chứng)                 → phải XANH, không ca nào skip
//   M1 FILL += stg_zalo_posts, toàn bộ test → đỏ ĐÚNG ba ca gác FILL, ca khác xanh
//   M2 như M1 nhưng chỉ ca đọc schema DB    → đỏ ĐÚNG ca DB (ca DB tự bắt được,
//      không dựa vào ca tĩnh "không stg_*")
// Exit 0 = cả ba đúng kỳ vọng.
import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, symlinkSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["sync-cloud.mjs", "sync-pii.test.mjs", "import-airbnb.mjs"];
// sync-cloud.mjs import ./lib/tier-a-guard.mjs (NT2) — thiếu là đỏ giả ở cả ba ca
const LINKS = ["node_modules", "lib"];

const T_STG = "FILL không chứa bảng staging stg_* nào";
const T_ZALO = "FILL không chứa stg_zalo_posts (media, media_files = ảnh PII tầng A)";
const T_DB = "không bảng nào trong FILL có cột ảnh media/media_files (schema DB local)";

/** Đọc kết quả từng ca cấp đỉnh từ TAP: { name → "pass" | "fail" | "skip" }. */
function parseTap(stdout) {
  const res = new Map();
  for (const m of stdout.matchAll(/^(not ok|ok) \d+ - (.+?)(?: # (SKIP|TODO)\b.*)?$/gm)) {
    res.set(m[2], m[3] ? "skip" : m[1] === "ok" ? "pass" : "fail");
  }
  return res;
}

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

function run(label, { mutate, extraArgs = [], wantFail = [] }) {
  const dir = mkdtempSync(join(tmpdir(), "sync-pii-mut-"));
  try {
    for (const f of FILES) copyFileSync(join(PIPE, f), join(dir, f));
    for (const l of LINKS) symlinkSync(join(PIPE, l), join(dir, l));
    if (mutate) {
      const p = join(dir, "sync-cloud.mjs");
      const src = readFileSync(p, "utf8");
      const out = src.replace("export const FILL = [", 'export const FILL = [\n  "stg_zalo_posts",');
      if (out === src) throw new Error("không cấy được đột biến — FILL đổi hình dạng?");
      writeFileSync(p, out);
    }
    const r = spawnSync("node", ["--test", "--test-reporter=tap", ...extraArgs, "sync-pii.test.mjs"], {
      cwd: dir,
      encoding: "utf8",
    });
    const cases = parseTap(r.stdout);
    const of = (s) => [...cases].filter(([, v]) => v === s).map(([k]) => k);
    const [failed, passed, skipped] = [of("fail"), of("pass"), of("skip")];
    const summary = `pass ${passed.length} · fail ${failed.length} · skip ${skipped.length}`;
    const problems = [];
    // Ca cấp đỉnh mang tên tệp = tệp test không nạp được (import lỗi) → đỏ giả
    if (cases.has("sync-pii.test.mjs")) problems.push("tệp test không nạp được (import lỗi)");
    if (skipped.length) problems.push(`ca bị skip: ${skipped.join(" | ")} — DB local không chạy?`);
    if (!sameSet(failed, wantFail)) {
      problems.push(`ca đỏ ${JSON.stringify(failed)} ≠ mong ${JSON.stringify(wantFail)}`);
    }
    if (wantFail.length ? r.status === 0 : r.status !== 0) problems.push(`exit ${r.status}`);
    const want = wantFail.length ? `mong ĐỎ đúng ${wantFail.length} ca` : "mong XANH";
    console.log(`${problems.length ? "SAI " : "ok  "} ${label}: ${want} → ${r.status === 0 ? "xanh" : "đỏ"} (${summary})`);
    for (const p of problems) console.log(`       ${p}`);
    if (problems.length && r.stdout.includes("ERR_")) console.log(r.stdout.split("\n").filter((l) => /Error|ERR_/.test(l)).slice(0, 3).join("\n"));
    return problems.length === 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const results = [
  run("M0 bản gốc", { mutate: false }),
  run("M1 FILL += stg_zalo_posts", { mutate: true, wantFail: [T_STG, T_ZALO, T_DB] }),
  run("M2 FILL += stg_zalo_posts, chỉ ca schema DB", {
    mutate: true,
    extraArgs: ["--test-name-pattern=cột ảnh"],
    wantFail: [T_DB],
  }),
];
const pass = results.every(Boolean);
console.log(pass ? "MUTATION PASS" : "MUTATION FAIL");
process.exit(pass ? 0 : 1);

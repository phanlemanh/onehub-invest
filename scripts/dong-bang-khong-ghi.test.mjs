// dong-bang-khong-ghi.test.mjs — hồ sơ _acceptance/dong-bang-stage-b-resolve E7 (AC-7): vòng đóng băng không ghi dữ liệu.
// Quét diff từ merge-base với origin/main tới cây làm việc: không migration mới, không câu INSERT/UPDATE/DELETE/TRUNCATE mới
// nhắm review_queue, property_candidates, property_offers, properties (bỏ test), route decide không đổi. Câu ghi viết nhiều
// dòng vẫn bị bắt: các dòng thêm liền nhau được nối thành một khối rồi tách theo «;» và backtick.
// Chạy: node --test scripts/dong-bang-khong-ghi.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", a, { cwd: REPO, encoding: "utf8" });
const ROUTE = "app/src/app/api/v1/ops/review/[id]/decide/route.ts";
const BANG = "review_queue|property_candidates|property_offers|properties";
const CAU_GHI = new RegExp(`\\b(INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|TRUNCATE)\\b[\\s\\S]*?\\b(${BANG})\\b`, "i");
const LA_TEST = (tep) => /(^|\/)tests?\/|\.(test|itest)\.[a-z]+$/.test(tep);
/** Chỉ quét tệp mã: trang sinh (LO-TRINH.html, PRODUCT-MAP.md) và tài liệu không chạy câu nào. */
const LA_MA = (tep) => /\.(ts|tsx|mjs|js|cjs|sql|sh)$/.test(tep);

/** Diff hợp nhất → { moi: tệp mới, sua: tệp đổi, them: Map<tệp, khối thêm[]> }. */
export function docDiff(diff) {
  const moi = [], sua = [], them = new Map();
  let tep = null, khoi = [];
  const dongKhoi = () => { if (tep && khoi.length) them.set(tep, [...(them.get(tep) ?? []), khoi.join("\n")]); khoi = []; };
  for (const d of diff.split("\n")) {
    const m = /^\+\+\+ b\/(.+)$/.exec(d);
    if (m) { dongKhoi(); tep = m[1]; sua.push(tep); continue; }
    if (d.startsWith("new file mode")) { moi.push("__next__"); continue; }
    if (d.startsWith("+") && !d.startsWith("+++")) khoi.push(d.slice(1));
    else dongKhoi();
  }
  dongKhoi();
  // «new file mode» đứng trước dòng +++ của chính tệp ấy.
  const that = [];
  const dong = diff.split("\n");
  for (let i = 0; i < dong.length; i++) if (dong[i].startsWith("new file mode")) {
    for (let j = i; j < dong.length; j++) { const m = /^\+\+\+ b\/(.+)$/.exec(dong[j]); if (m) { that.push(m[1]); break; } }
  }
  return { moi: that, sua, them };
}

export function kiem({ moi, sua, them }) {
  const mig = moi.find((t) => t.startsWith("db/migrations/"));
  if (mig) throw new Error("DBS-AC-7 migration mới");
  if (sua.includes(ROUTE)) throw new Error("DBS-AC-7 route decide đổi");
  for (const [tep, ds] of them) {
    if (LA_TEST(tep) || !LA_MA(tep)) continue;
    for (const k of ds) for (const cau of k.split(/[;`]/)) {
      const m = CAU_GHI.exec(cau);
      if (m) throw new Error(`DBS-AC-7 câu ghi mới: ${m[2]}`);
    }
  }
}

test("DBS-AC-7 vòng không thêm migration, không câu ghi mới vào bảng căn/thẻ, không đổi route decide", () => {
  const base = git("merge-base", "HEAD", "origin/main").trim();
  const diff = git("diff", "--no-color", "-U0", base, "--", ".", ":(exclude)_acceptance/**", ":(exclude)docs/**");
  const d = docDiff(diff);
  assert.ok(d.sua.includes("pipeline/resolve-properties.mjs"), "đối chứng: diff phải thấy tệp vòng đổi");
  assert.doesNotThrow(() => kiem(d));

  // Chiều đỏ trên diff mẫu.
  const mau = (tep, them, moiTep = false) => `diff --git a/${tep} b/${tep}\n${moiTep ? "new file mode 100644\n" : ""}--- a/${tep}\n+++ b/${tep}\n@@ -1 +1 @@\n${them.map((x) => `+${x}`).join("\n")}\n`;
  assert.throws(() => kiem(docDiff(mau("app/src/lib/x.ts", ["await q(`UPDATE review_queue SET status = 'rejected'`)"]))),
    /^Error: DBS-AC-7 câu ghi mới: review_queue$/);
  assert.throws(() => kiem(docDiff(mau("app/src/lib/x.ts", ["await q(`UPDATE", "  review_queue SET status = 'rejected'`)"]))),
    /^Error: DBS-AC-7 câu ghi mới: review_queue$/);
  assert.throws(() => kiem(docDiff(mau("db/migrations/999_x.sql", ["SELECT 1;"], true))), /^Error: DBS-AC-7 migration mới$/);
  assert.throws(() => kiem(docDiff(mau(ROUTE, ["// x"]))), /^Error: DBS-AC-7 route decide đổi$/);
  assert.doesNotThrow(() => kiem(docDiff(mau("app/tests/x.test.tsx", ["await q(`DELETE FROM review_queue`)"]))));
});

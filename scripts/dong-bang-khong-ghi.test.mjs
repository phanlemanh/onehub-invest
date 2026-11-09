// dong-bang-khong-ghi.test.mjs — hồ sơ _acceptance/dong-bang-stage-b-resolve E7 (AC-7): vòng đóng băng không ghi dữ liệu.
// Quét diff CỦA VÒNG: không migration mới, không câu INSERT/UPDATE/DELETE/TRUNCATE mới nhắm review_queue,
// property_candidates, property_offers, properties (bỏ test), route decide không đổi. Câu ghi viết nhiều dòng vẫn bị bắt: các
// dòng thêm liền nhau được nối thành một khối rồi tách theo «;» và backtick.
// Khoảng diff (khoangVong): vòng chưa vào nhánh chính → merge-base..cây làm việc; đã vào → đúng commit đưa vòng vào nhánh
// chính (cha thứ nhất..nó). KHÔNG so merge-base trên cây đã gộp — diff rỗng thì đối chứng đỏ mãi, và PR sau thêm migration
// hay câu ghi (GC0–GC3, DB1) là việc hợp lệ (S4-r2, cùng bài học scripts/auth-error-thu-lai-retry.test.mjs).
// Chạy: node --test scripts/dong-bang-khong-ghi.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Bộ đệm 64 MB: diff gồm cả trang sinh dài dòng thì bộ đệm mặc định 1 MB của execFileSync tràn (ENOBUFS).
const git = (...a) => execFileSync("git", a, { cwd: REPO, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const ROUTE = "app/src/app/api/v1/ops/review/[id]/decide/route.ts";
const BANG = "review_queue|property_candidates|property_offers|properties";
const CAU_GHI = new RegExp(`\\b(INSERT\\s+INTO|UPDATE|DELETE\\s+FROM|TRUNCATE)\\b[\\s\\S]*?\\b(${BANG})\\b`, "i");
const LA_TEST = (tep) => /(^|\/)tests?\/|\.(test|itest)\.[a-z]+$/.test(tep);
/** Chỉ quét tệp mã: trang sinh (LO-TRINH.html, PRODUCT-MAP.md) và tài liệu không chạy câu nào. */
const LA_MA = (tep) => /\.(ts|tsx|mjs|js|cjs|sql|sh)$/.test(tep);
// Gốc vòng (origin/main lúc cắt nhánh) và dấu nhận ra commit đưa vòng vào nhánh chính.
const GOC_VONG = "773a0040dc5ac65bfafbc0e3cb8ba5eea7d877df";
const TEP_DAU = "pipeline/resolve-properties.mjs";
const DAU = "export const STAGE_B_DONG_BANG";
const LOAI = ["--", ".", ":(exclude)_acceptance/**", ":(exclude)docs/**", ":(exclude)LO-TRINH.html", ":(exclude)PRODUCT-MAP.md"];
const nhanhChinh = () => ["origin/main", "main"].find((r) => { try { git("rev-parse", "--verify", "-q", `${r}^{commit}`); return true; } catch { return false; } });

/** Khoảng diff của vòng so với nhánh chính `main` (ref hay sha): { tu, den } — den null là cây làm việc. */
export function khoangVong(main = nhanhChinh()) {
  let daVao = false;
  try { daVao = git("show", `${main}:${TEP_DAU}`).includes(DAU); } catch { daVao = false; }
  if (!daVao) return { tu: git("merge-base", "HEAD", main).trim(), den: null };
  const L = git("log", "--first-parent", "--reverse", "--format=%H", "-S", DAU, `${GOC_VONG}..${main}`, "--", TEP_DAU).trim().split("\n")[0];
  if (!L) throw new Error(`DBS-AC-7 không tìm thấy commit đưa vòng vào ${main}`);
  return { tu: `${L}^1`, den: L };
}
export const diffVong = ({ tu, den }) => git("diff", "--no-color", "-U0", tu, ...(den ? [den] : []), ...LOAI);

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
  const d = docDiff(diffVong(khoangVong()));
  assert.ok(d.sua.includes(TEP_DAU), "đối chứng: diff phải thấy tệp vòng đổi");
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

// Sau khi gộp: dựng commit gộp giả (squash cây HEAD lên nhánh chính hiện tại) rồi một commit PR sau thêm migration và câu ghi
// — chỉ tạo đối tượng git bằng commit-tree, không đổi ref, index hay cây làm việc.
test("DBS-AC-7 sau khi gộp: đo đúng commit của vòng, PR sau thêm migration hay câu ghi không làm đỏ", (t) => {
  const main = nhanhChinh();
  if (!main) return t.skip("không có nhánh chính trong lịch sử");
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@local.test", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@local.test" };
  const g = (a, extra = {}) => execFileSync("git", a, { cwd: REPO, encoding: "utf8", env: { ...env, ...extra }, maxBuffer: 64 * 1024 * 1024 }).trim();
  const base = g(["merge-base", "HEAD", main]);
  const gop = g(["commit-tree", "HEAD^{tree}", "-p", base, "-m", "gop gia"]);
  // PR sau: thêm db/migrations/999_x.sql và một tệp mã có câu ghi vào property_offers.
  const idx = path.join(tmpdir(), `dbs-ac7-idx-${process.pid}`);
  try {
    const blob = (noi) => execFileSync("git", ["hash-object", "-w", "--stdin"], { cwd: REPO, input: noi, encoding: "utf8" }).trim();
    g(["read-tree", gop], { GIT_INDEX_FILE: idx });
    g(["update-index", "--add", "--cacheinfo", `100644,${blob("SELECT 1;\n")},db/migrations/999_x.sql`], { GIT_INDEX_FILE: idx });
    g(["update-index", "--add", "--cacheinfo", `100644,${blob("await q(`UPDATE property_offers SET unit_id = 1`);\n")},pipeline/gan-can-x.mjs`], { GIT_INDEX_FILE: idx });
    const sau = g(["commit-tree", g(["write-tree"], { GIT_INDEX_FILE: idx }), "-p", gop, "-m", "pr sau"]);

    const k = khoangVong(sau);
    assert.deepEqual(k, { tu: `${gop}^1`, den: gop }, "khoảng vòng phải là đúng commit gộp giả");
    const d = docDiff(diffVong(k));
    assert.ok(d.sua.includes(TEP_DAU), "đối chứng: commit gộp phải thấy tệp vòng đổi");
    assert.doesNotThrow(() => kiem(d));
    // Đối chứng đỏ: cách đo cũ trên nhánh chính đã gộp (merge-base = chính nó) cho diff rỗng — đối chứng dương đỏ, đúng lỗi S4-r2.
    assert.ok(!docDiff(g(["diff", "--no-color", "-U0", g(["merge-base", sau, sau]), sau])).sua.includes(TEP_DAU));
    // Đối chứng đỏ: khoảng của PR sau (cha..nó) có migration và câu ghi — kiem đỏ đúng thông điệp, nên phép đo không mù.
    assert.throws(() => kiem(docDiff(diffVong({ tu: gop, den: sau }))), /^Error: DBS-AC-7 migration mới$/);
  } finally { execFileSync("rm", ["-f", idx]); }
});

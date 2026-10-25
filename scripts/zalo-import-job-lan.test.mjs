// node --test scripts/zalo-import-job-lan.test.mjs
// Hồ sơ zalo-import-so-phan-nap-khong-do-gia (Ngoài-4 của transform-zalo-boc-job-run): ca ZJ-AC-5 của
// scripts/zalo-import-job.test.mjs phải chứng «vòng ấy không đổi phần nạp» trên hai commit cố định, không đỏ giả khi làn
// ZCode sửa hợp lệ phần nạp sau này. Mô phỏng một nhánh zcode/*: worktree git TẠM (thư mục tạm, HEAD tách rời) có MỘT commit
// sửa phần nạp của tệp bọc, rồi chạy tệp test thật trong đó. Không đụng cây thật, không DB, không OpenClaw.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "scripts/zalo-import-daily.sh";
const TEST = "scripts/zalo-import-job.test.mjs";
const TEST_CU = "12b8942"; // main trước vòng — bản ZJ-AC-5 so cây làm việc với merge-base
const SUA_GOC = "for try in 1 2 3 4 5; do";
const SUA_MOI = "for try in 1 2 3 4 5; do # sửa của ZCode";

const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
// Tiến trình node --test con không được thừa hưởng NODE_TEST_CONTEXT của tiến trình cha (nếu không, nó chạy ở chế độ «test
// con» và không tự báo kết quả).
const { NODE_TEST_CONTEXT: _bo, ...ENV_CON } = process.env;
const chayTest = (cwd, args) => spawnSync(process.execPath, ["--test", ...args], { cwd, env: ENV_CON, encoding: "utf8", timeout: 240_000 });
const nodeTest = (cwd, rel) => chayTest(cwd, [rel]);

let WT = "";
before(() => {
  WT = path.join(realpathSync(mkdtempSync(path.join(tmpdir(), "zalo-lan-"))), "wt");
  git(REPO, "worktree", "add", "-q", "--detach", WT, "HEAD");
  // Bản test đang đo (cây làm việc của kho, có thể chưa commit) chép vào cây tạm.
  writeFileSync(path.join(WT, TEST), readFileSync(path.join(REPO, TEST), "utf8"));
  // Mô phỏng ZCode sửa hợp lệ phần nạp, commit thành một nhánh rời.
  const goc = readFileSync(path.join(WT, SCRIPT), "utf8");
  const sua = goc.replace(SUA_GOC, SUA_MOI);
  assert.notEqual(sua, goc, `không thấy «${SUA_GOC}» trong phần nạp của tệp bọc`);
  writeFileSync(path.join(WT, SCRIPT), sua);
  git(WT, "-c", "user.name=zcode-mo-phong", "-c", "user.email=mo-phong@local.test", "commit", "-qam", "mô phỏng: ZCode sửa phần nạp");
});
after(() => {
  if (WT) {
    try {
      git(REPO, "worktree", "remove", "--force", WT);
    } catch {
      rmSync(WT, { recursive: true, force: true });
      git(REPO, "worktree", "prune");
    }
  }
});

test("ZL-AC-1 ZJ-AC-5 không đọc tệp bọc ở cây làm việc, không dùng merge-base", () => {
  const src = readFileSync(path.join(REPO, TEST), "utf8");
  const dau = src.indexOf('test("ZJ-AC-5');
  assert.ok(dau >= 0, "không thấy ca ZJ-AC-5");
  assert.doesNotMatch(src.slice(dau, src.indexOf("\n});", dau)), /merge-base/, "ZL-AC-1 ZJ-AC-5 còn dùng merge-base");
  // Hành vi: một cây tạm khác (chung lịch sử) xoá tệp bọc ở cây làm việc — ZJ-AC-5 vẫn chạy và xanh.
  const wt2 = path.join(path.dirname(WT), "wt-xoa");
  git(REPO, "worktree", "add", "-q", "--detach", wt2, "HEAD");
  try {
    writeFileSync(path.join(wt2, TEST), src);
    rmSync(path.join(wt2, SCRIPT));
    const r = chayTest(wt2, ["--test-name-pattern=ZJ-AC-5", TEST]);
    assert.equal(r.status, 0, `ZL-AC-1 ZJ-AC-5 phụ thuộc tệp ở cây làm việc:\n${r.stdout.slice(-1500)}`);
    assert.match(r.stdout, /ℹ pass 1\b/, "ZL-AC-1 ZJ-AC-5 không chạy");
    assert.match(r.stdout, /ℹ skipped 0/, "ZL-AC-1 ZJ-AC-5 bị bỏ qua");
  } finally {
    git(REPO, "worktree", "remove", "--force", wt2);
  }
});

test("ZL-AC-2 nhánh ZCode sửa phần nạp → tệp test job Zalo hiện tại thoát 0", () => {
  assert.notEqual(git(WT, "rev-parse", "HEAD").trim(), git(REPO, "rev-parse", "HEAD").trim(), "cây tạm phải có commit mô phỏng");
  assert.ok(readFileSync(path.join(WT, SCRIPT), "utf8").includes(SUA_MOI), "cây tạm chưa có sửa phần nạp");
  const r = nodeTest(WT, TEST);
  assert.equal(r.status, 0, `ZL-AC-2 đỏ giả trên nhánh ZCode:\n${r.stdout.split("\n").filter((l) => /✖|Error/.test(l)).join("\n")}`);
  assert.match(r.stdout, /ℹ skipped 0/, "ZL-AC-2 có ca bị bỏ qua");
});

test("ZL-AC-3 đối chứng: bản test cũ (12b8942) đỏ trên cùng nhánh với «phần nạp của tệp bọc đã đổi»", () => {
  const cu = git(REPO, "show", `${TEST_CU}:${TEST}`);
  writeFileSync(path.join(WT, "scripts/zalo-import-job-cu.test.mjs"), cu);
  const r = nodeTest(WT, "scripts/zalo-import-job-cu.test.mjs");
  assert.notEqual(r.status, 0, "ZL-AC-3 bản cũ không đỏ — mô phỏng không tái hiện lỗi đỏ giả");
  assert.match(r.stdout, /ZJ-AC-5 phần nạp của tệp bọc đã đổi/, "ZL-AC-3 bản cũ đỏ vì lý do khác");
});

test("ZL-AC-4 chiều đỏ của phép so mới: rev không có · bản clone nông → «thiếu lịch sử git»", () => {
  const src = readFileSync(path.join(REPO, TEST), "utf8");
  // (b) Bản sao trỏ sang commit không có.
  const sao = src.replaceAll('"e962e78^1"', '"0000000^1"').replaceAll('"e962e78"', '"0000000"');
  assert.notEqual(sao, src, "đột biến không đổi gì — không thấy rev e962e78 trong tệp test");
  writeFileSync(path.join(WT, "scripts/zalo-import-job-thieu.test.mjs"), sao);
  const r = chayTest(WT, ["--test-name-pattern=ZJ-AC-5", "scripts/zalo-import-job-thieu.test.mjs"]);
  assert.notEqual(r.status, 0, "ZL-AC-4 (b) rev không có mà ca xanh");
  assert.match(r.stdout, /thiếu lịch sử git/, "ZL-AC-4 (b) không báo «thiếu lịch sử git»");
  // (c) Bản clone nông: không có e962e78^1.
  const nong = path.join(path.dirname(WT), "nong");
  execFileSync("git", ["clone", "-q", "--depth", "1", `file://${REPO}`, nong], { stdio: "ignore" });
  writeFileSync(path.join(nong, TEST), src);
  const rn = chayTest(nong, ["--test-name-pattern=ZJ-AC-5", TEST]);
  rmSync(nong, { recursive: true, force: true });
  assert.notEqual(rn.status, 0, "ZL-AC-4 (c) bản clone nông mà ca xanh");
  assert.match(rn.stdout, /thiếu lịch sử git/, "ZL-AC-4 (c) bản clone nông không báo «thiếu lịch sử git»");
});

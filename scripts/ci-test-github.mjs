#!/usr/bin/env node
// CI thật trên GitHub cho .github/workflows/ci-test.yml (AU11 `ci-test-module` AC-8, Hỏi-3 lối (a) — Mạnh duyệt 25/10).
// Đẩy nhánh thăm dò `ci-probe/sach` (HEAD nguyên) và `ci-probe/<module>` (HEAD + đúng một lỗi cấy của bảng CAY), chờ lượt
// chạy của workflow ci-test trên từng nhánh, đọc kết luận từng job bằng `gh`, rồi XOÁ mọi nhánh ci-probe/* (kể cả khi lỗi).
// Lỗi cấy là mã hỏng có chủ đích, chỉ sống trên nhánh thăm dò vài phút; không đụng main, không mở PR.
// Chạy: node scripts/ci-test-github.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CAY, JOBS } from "./ci-test-local.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = "ci-test.yml";
const CHO_PHUT = 40;

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const gh = (...a) => execFileSync("gh", a, { encoding: "utf8" }).trim();
const ngu = (s) => spawnSync("sleep", [String(s)]);

/** Chờ lượt chạy của workflow trên nhánh ở đúng sha; trả { id, jobs: { tên: kết luận } }. */
function cho(nhanh, sha) {
  const han = Date.now() + CHO_PHUT * 60_000;
  while (Date.now() < han) {
    const runs = JSON.parse(gh("run", "list", "--workflow", WORKFLOW, "--branch", nhanh, "--json", "databaseId,headSha,status", "--limit", "5"));
    const r = runs.find((x) => x.headSha === sha);
    if (r?.status === "completed") {
      const v = JSON.parse(gh("run", "view", String(r.databaseId), "--json", "jobs"));
      return { id: r.databaseId, jobs: Object.fromEntries(v.jobs.map((j) => [j.name, j.conclusion])) };
    }
    ngu(20);
  }
  return null;
}

const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

const head = git("-C", ROOT, "rev-parse", "HEAD");
const tmp = realpathSync(mkdtempSync(path.join(tmpdir(), "ci-probe-")));
const nhanhDay = [];
try {
  git("-C", ROOT, "worktree", "add", "-q", "--detach", tmp, head);
  // bản sạch
  git("-C", tmp, "push", "-q", "-f", "origin", `${head}:refs/heads/ci-probe/sach`);
  nhanhDay.push("ci-probe/sach");
  const mau = [];
  for (const m of JOBS) {
    const c = CAY[m];
    git("-C", tmp, "checkout", "-q", "--detach", head);
    const f = path.join(tmp, c.tep);
    writeFileSync(f, c.sua(readFileSync(f, "utf8")));
    git("-C", tmp, "-c", "user.name=ci-probe", "-c", "user.email=ci-probe@local.test", "commit", "-q", "--no-verify", "-am", `ci-probe: cấy ${c.loai} vào ${c.tep} (AU11 AC-8, xoá sau khi đọc)`);
    const sha = git("-C", tmp, "rev-parse", "HEAD");
    git("-C", tmp, "push", "-q", "-f", "origin", `${sha}:refs/heads/ci-probe/${m}`);
    nhanhDay.push(`ci-probe/${m}`);
    mau.push({ m, sha });
  }
  console.log(`đã đẩy ${nhanhDay.length} nhánh thăm dò từ ${head}`);

  const s = cho("ci-probe/sach", head);
  check(Boolean(s) && JOBS.every((j) => s.jobs[j] === "success"), s ? `CI thật trên ${head}: ${JOBS.map((j) => `${j}=${s.jobs[j]}`).join(" · ")} (run ${s.id})` : `CI thật trên ${head}: chưa xong sau ${CHO_PHUT} phút`);
  for (const { m, sha } of mau) {
    const r = cho(`ci-probe/${m}`, sha);
    if (!r) {
      check(false, `ci-probe/${m}: chưa xong sau ${CHO_PHUT} phút`);
      continue;
    }
    const dung = JOBS.every((j) => r.jobs[j] === (j === m ? "failure" : "success"));
    check(dung, `ci-probe/${m}: ${dung ? `đúng job ${m} failure, bốn job còn lại success` : JOBS.map((j) => `${j}=${r.jobs[j]}`).join(" · ")} (run ${r.id})`);
  }
} catch (e) {
  check(false, `dừng giữa chừng: ${e.message.split("\n")[0]}`);
} finally {
  for (const n of nhanhDay) spawnSync("git", ["-C", ROOT, "push", "-q", "origin", "--delete", n]);
  spawnSync("git", ["-C", ROOT, "worktree", "remove", "--force", tmp]);
  rmSync(tmp, { recursive: true, force: true });
  const con = git("-C", ROOT, "ls-remote", "origin", "refs/heads/ci-probe/*").split("\n").filter(Boolean).length;
  check(con === 0, `dọn: ${con} nhánh ci-probe còn lại`);
}
console.log(fails.length === 0 ? "\nci-test-github: PASS" : `\nci-test-github: FAIL (${fails.length})`);
process.exit(fails.length === 0 ? 0 : 1);

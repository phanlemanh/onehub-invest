// Đo ZL-AC-3 ở ba thế của cây (hồ sơ zl-ac-3-doi-chung-dung-tren-main). Mỗi thế là một bản clone TẠM của kho tại HEAD
// (cây làm việc phải sạch — đo đúng commit), refs/remotes/origin/main đặt lại để tạo thế:
//   main  : origin/main = HEAD (merge-base = HEAD — main sau gộp và mọi nhánh không đổi tệp bọc)
//   nap   : HEAD + một commit sửa PHẦN NẠP của tệp bọc, origin/main = HEAD gốc (như nhánh s03-tran)
//   khac  : HEAD + một commit sửa phần SAU phần nạp (như nhánh MH1), origin/main = HEAD gốc
// Mỗi thế chạy ba bản của tệp test: «sua» (cây hiện tại) phải xanh; «pha» (đối chứng bị phá: không sửa phần nạp) phải đỏ
// với «bản cũ không đỏ»; «truoc» (bản tệp test của commit TRUOC, trước khi sửa) — ghi kết quả để thấy vì sao lọt.
// Không ghi gì vào cây thật; không DB. Thoát 0 khi mọi ô «sua» xanh và mọi ô «pha» đỏ đúng thông điệp.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TRUOC = process.env.TRUOC || "e78ff0db9";
const TEST = "scripts/zalo-import-job-lan.test.mjs";
const SCRIPT = "scripts/zalo-import-daily.sh";
const git = (cwd, ...a) => execFileSync("git", ["-C", cwd, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
if (git(REPO, "status", "--porcelain", "--", "scripts").trim()) { console.error("ba-the: scripts/ có thay đổi chưa commit — commit trước khi đo"); process.exit(2); }
const HEAD = git(REPO, "rev-parse", "HEAD").trim();
const { NODE_TEST_CONTEXT: _b, ...ENV } = process.env;
const goc = mkdtempSync(path.join(tmpdir(), "zl-ba-the-"));
const sua = readFileSync(path.join(REPO, TEST), "utf8");
const pha = sua.replace("const suaPhanNap = (src) => src.replace(SUA_GOC, SUA_MOI);", "const suaPhanNap = (src) => src;");
if (pha === sua) { console.error("ba-the: không phá được — dòng suaPhanNap đã đổi"); process.exit(2); }
const truoc = git(REPO, "show", `${TRUOC}:${TEST}`);
const commit = (cwd, msg) => git(cwd, "-c", "user.name=mo-phong", "-c", "user.email=mo-phong@local.test", "commit", "-qam", msg);
let loi = 0;
const ket = [];
for (const the of ["main", "nap", "khac"]) {
  const c = path.join(goc, the);
  execFileSync("git", ["clone", "-q", "--no-checkout", `file://${REPO}`, c], { stdio: "ignore" });
  git(c, "checkout", "-q", "--detach", HEAD);
  git(c, "update-ref", "refs/remotes/origin/main", HEAD);
  for (const m of ["app", "pipeline", "agent"]) { try { symlinkSync(path.join(REPO, m, "node_modules"), path.join(c, m, "node_modules")); } catch {} }
  const s = readFileSync(path.join(c, SCRIPT), "utf8");
  if (the === "nap") { const n = s.replace("for try in 1 2 3 4 5; do", "for try in 1 2 3 4 5; do # sửa phần nạp"); if (n === s) { console.error("ba-the: thế nap không sửa được"); process.exit(2); } writeFileSync(path.join(c, SCRIPT), n); commit(c, "mô phỏng: sửa phần nạp"); }
  if (the === "khac") { writeFileSync(path.join(c, SCRIPT), s + "\n# mô phỏng: sửa phần khác\n"); commit(c, "mô phỏng: sửa phần khác"); }
  const mb = git(c, "merge-base", "HEAD", "origin/main").trim();
  for (const [ban, src] of [["sua", sua], ["pha", pha], ["truoc", truoc]]) {
    writeFileSync(path.join(c, TEST), src);
    const r = spawnSync(process.execPath, ["--test", TEST], { cwd: c, env: ENV, encoding: "utf8", timeout: 300_000 });
    const out = r.stdout + r.stderr;
    const pass = (out.match(/ℹ pass (\d+)/) || [])[1], fail = (out.match(/ℹ fail (\d+)/) || [])[1];
    const zl3 = out.split("\n").filter((l) => /^✖ ZL-AC-3/.test(l)).map((l) => l.replace(/ \(\d.*$/, ""));
    let dung = true;
    if (ban === "sua") dung = r.status === 0;
    if (ban === "pha") dung = r.status !== 0 && /ZL-AC-3 bản cũ không đỏ/.test(out);
    if (!dung) loi++;
    ket.push({ the, merge_base_la_head: mb === git(c, "rev-parse", "HEAD").trim(), ban, rc: r.status, pass, fail, zl3, dung: ban === "truoc" ? "ghi" : dung });
    git(c, "checkout", "-q", "--", TEST);
  }
}
for (const k of ket) console.log(JSON.stringify(k));
rmSync(goc, { recursive: true, force: true });
console.log(loi ? `ba-the: ${loi} ô sai` : "ba-the: đủ 9 ô — sua xanh ở cả ba thế, pha đỏ đúng thông điệp ở cả ba thế");
process.exit(loi ? 1 : 0);

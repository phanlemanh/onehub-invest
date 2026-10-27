// node --test scripts/audit-all.test.mjs
// AU5 `audit-all-noi-that`: audit-all không còn PASS giả ở backup + membership S03, trang /ops kiểm ở :3456.
// Chạy NGUYÊN scripts/audit-all.sh trong cây tạm: PATH chỉ gồm thư mục bản giả + /usr/bin:/bin, HOME tạm, env tối
// thiểu. Bản giả docker/curl/launchctl/security/openclaw ghi nhật ký lời gọi — không lời gọi mạng thật, không chạy
// CLI OpenClaw thật (an toàn Zalo). launchctl phát lại bản chụp THẬT 23/10. Ma trận: design doc §3.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, utimesSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO, "scripts/audit-all.sh");
const FIXTURE = readFileSync(path.join(REPO, "scripts/fixtures/launchctl-list-2026-10-23.txt"), "utf8");
const GROUP_ID = "6506309329752400506";
const OPS_PAGES = ["/ops", "/ops/collections", "/ops/quality", "/ops/sources"];

// Dòng backup sinh từ dòng thật của bản chụp: thay nhãn (và cột mã khi ca cần), giữ nguyên tab/cột.
const REAL_LINE = FIXTURE.split("\n").find((l) => l.endsWith("\tcom.oneinvest.smoke"));
function backupLine(rc) {
  const cols = REAL_LINE.split("\t");
  cols[1] = String(rc);
  cols[2] = "com.oneinvest.backup";
  return cols.join("\t");
}

const roots = [];
after(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));

// Mốc giờ ghim cho dòng tiêu đề: hai lượt audit vắt qua ranh giới phút không còn lệch dòng tiêu đề (audit-all-test-moc-phut).
const MOC_GHIM = "2026-10-23 09:00";

const FAKES = {
  date: `echo "date $*" >> "$FAKE_LOG"; if [ "$#" -eq 1 ] && [ "$1" = "+%Y-%m-%d %H:%M" ]; then echo "${MOC_GHIM}"; else PATH=/usr/bin:/bin exec date "$@"; fi`,
  docker: `echo "docker $*" >> "$FAKE_LOG"; echo "\${FAKE_DB_VALUE:-5}"`,
  curl: `echo "curl $*" >> "$FAKE_LOG"
url=""; want_code=0
for a in "$@"; do case "$a" in http*) url="$a";; %{http_code}) want_code=1;; esac; done
echo "URL $url" >> "$FAKE_LOG"
if [ $want_code = 1 ]; then
  case "$url" in */ops*) [ "\${url#*://localhost}" != "$url" ] && { printf '%s' "\${FAKE_OPS_CODE:-200}"; exit 0; };; esac
  printf '200'
else
  echo '{}'
fi`,
  launchctl: `echo "launchctl $*" >> "$FAKE_LOG"; [ "$1" = list ] && cat "$FAKE_LAUNCHCTL"`,
  security: `echo "security $*" >> "$FAKE_LOG"; exit 44`,
};

function writeExe(file, body) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `#!/bin/bash\n${body}\n`);
  chmodSync(file, 0o755);
}

function plist(env) {
  const vars = Object.entries(env).map(([k, v]) => `<key>${k}</key><string>${v}</string>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict><key>Label</key><string>com.oneinvest.backup</string>
<key>EnvironmentVariables</key><dict>${vars}</dict></dict></plist>\n`;
}

/**
 * Dựng hộp rồi chạy script. Tuỳ chọn: backup {rc, backupDir?, dumpAgeDays?} · openclaw ("has"|"none"|undefined) ·
 * zaloLog (nội dung | undefined) · opsCode · opsBaseUrl · airdnaLog · scriptText (bản sao đã đột biến).
 */
function runAudit(opts = {}) {
  const root = mkdtempSync(path.join(realpathSync(tmpdir()), "audit-all-"));
  roots.push(root);
  const tree = opts.treeDir ?? path.join(root, "tree");
  const home = path.join(root, "home");
  const bin = path.join(root, "bin");
  const log = path.join(root, "calls.log");
  mkdirSync(path.join(tree, "scripts"), { recursive: true });
  mkdirSync(path.join(tree, "pipeline/logs"), { recursive: true });
  mkdirSync(home, { recursive: true });
  writeFileSync(log, "");
  const script = path.join(tree, "scripts/audit-all.sh");
  if (opts.scriptText) writeFileSync(script, opts.scriptText);
  else copyFileSync(SCRIPT, script);
  if (opts.airdnaLog) writeFileSync(path.join(tree, "pipeline/logs/airdna-daily.log"), opts.airdnaLog);
  for (const [name, body] of Object.entries(FAKES)) writeExe(path.join(bin, name), body);

  let launch = FIXTURE;
  if (opts.backup) {
    launch += backupLine(opts.backup.rc) + "\n";
    const env = { PATH: "/usr/bin:/bin" };
    if (opts.backup.backupDir) {
      const dir = path.join(root, "backup-disk");
      mkdirSync(dir, { recursive: true });
      env.BACKUP_DIR = dir;
      if (opts.backup.dumpAgeDays != null) {
        const f = path.join(dir, "db-20261021.sql.gz");
        writeFileSync(f, "x");
        const t = Date.now() / 1000 - opts.backup.dumpAgeDays * 86400;
        utimesSync(f, t, t);
      }
    }
    const la = path.join(home, "Library/LaunchAgents");
    mkdirSync(la, { recursive: true });
    writeFileSync(path.join(la, "com.oneinvest.backup.plist"), plist(env));
  }
  const launchFile = path.join(root, "launchctl.txt");
  writeFileSync(launchFile, launch);

  if (opts.openclaw) {
    const out = opts.openclaw === "has" ? `g-1 Nhóm A\n${GROUP_ID} Nhóm B\n` : "g-1 Nhóm A\n";
    writeExe(path.join(home, ".openclaw/bin/openclaw"), `echo "openclaw $*" >> "$FAKE_LOG"; printf '%s' '${out}'`);
  }
  if (opts.zaloLog != null) {
    mkdirSync(path.join(home, ".openclaw/logs"), { recursive: true });
    writeFileSync(path.join(home, ".openclaw/logs/oneinvest-zalo-pipe.log"), opts.zaloLog);
  }

  const env = {
    PATH: `${bin}:/usr/bin:/bin`, HOME: home, TMPDIR: root, LANG: "en_US.UTF-8",
    FAKE_LOG: log, FAKE_LAUNCHCTL: launchFile,
  };
  if (opts.opsCode) env.FAKE_OPS_CODE = String(opts.opsCode);
  if (opts.opsBaseUrl) env.OPS_BASE_URL = opts.opsBaseUrl;
  const r = spawnSync("/bin/bash", [script], { env, encoding: "utf8", timeout: 120_000 });
  return { ...r, out: r.stdout, calls: readFileSync(log, "utf8"), tree, home, env };
}

const lineOf = (out, re) => out.split("\n").find((l) => re.test(l));
function backupResult(out) {
  const l = lineOf(out, /Backup tuần/);
  assert.ok(l, `backup: không có dòng «Backup tuần» trong đầu ra:\n${out}`);
  return l;
}
function assertBackupFail(out, re) {
  const l = backupResult(out);
  assert.match(l, /^ {2}❌ /, `backup: dòng phải là FAIL, được «${l}»`);
  if (re) assert.match(l, re, `backup: dòng «${l}» thiếu ${re}`);
}

describe("audit-all nói thật (AU5)", () => {
  test("AA-AC-1 backup (a) vắng job → ❌ CHƯA cài", () => {
    const r = runAudit();
    assert.equal(r.status, 0, r.stderr);
    assertBackupFail(r.out, /Backup tuần CHƯA cài/);
  });

  test("AA-AC-1 backup (b) mã 1 → ❌ kèm mã", () => {
    const r = runAudit({ backup: { rc: 1, backupDir: true, dumpAgeDays: 2 } });
    assertBackupFail(r.out, /mã 1\b/);
  });

  test("AA-AC-1 backup (c) mã 0, plist không BACKUP_DIR → ❌ chưa đặt BACKUP_DIR", () => {
    const r = runAudit({ backup: { rc: 0 } });
    assertBackupFail(r.out, /chưa đặt BACKUP_DIR/);
  });

  test("AA-AC-1 backup (d) BACKUP_DIR không có bản 8 ngày → ❌", () => {
    const noFile = runAudit({ backup: { rc: 0, backupDir: true } });
    assertBackupFail(noFile.out, /không có bản sao lưu trong 8 ngày/);
    const old = runAudit({ backup: { rc: 0, backupDir: true, dumpAgeDays: 10 } });
    assertBackupFail(old.out, /không có bản sao lưu trong 8 ngày/);
  });

  test("AA-AC-1 backup (e) có bản 2 ngày → ✅ kèm tên tệp", () => {
    const r = runAudit({ backup: { rc: 0, backupDir: true, dumpAgeDays: 2 } });
    const l = backupResult(r.out);
    assert.match(l, /^ {2}✅ .*db-20261021\.sql\.gz/);
  });

  test("AA-AC-1 bản sao giữ || echo 0 → backup ra PASS, bị bắt", () => {
    const src = readFileSync(SCRIPT, "utf8");
    const start = src.indexOf("# --- backup (AU5) ---");
    const end = src.indexOf("# --- hết backup ---");
    assert.ok(start > 0 && end > start, "script thiếu dấu khối backup");
    const OLD = `BACKUP_INSTALLED=$(launchctl list 2>/dev/null | grep -c "oneinvest.backup" || echo 0)
[ "$BACKUP_INSTALLED" -eq 0 ] && limit "Backup tuần CHƯA cài" "cần BACKUP_DIR + BACKUP_PASS" || pass "Backup tuần đã cài"
`;
    const mutated = src.slice(0, start) + OLD + src.slice(end);
    const r = runAudit({ scriptText: mutated });
    assert.match(r.out, /TỔNG KẾT/, "bản sao đột biến không chạy tới cuối");
    assert.match(backupResult(r.out), /✅ Backup tuần đã cài/, "khuôn cũ phải tái hiện PASS giả");
    assert.throws(() => assertBackupFail(r.out, /CHƯA cài/), /backup/);
  });

  test("AA-AC-2 membership CLI vắng (command -v thất bại trong hộp) → ⚠️ không kiểm được", () => {
    const r = runAudit();
    const pre = spawnSync("/bin/bash", ["-c", "command -v openclaw"], { env: r.env });
    assert.notEqual(pre.status, 0, "tiền đề: openclaw không được có trên PATH hộp");
    const l = lineOf(r.out, /Diamond Land 3/);
    assert.match(l, /^ {2}⚠️ .*không kiểm được membership/);
    assert.doesNotMatch(r.calls, /^openclaw /m);
  });

  test("AA-AC-2 membership có id → ✅, bản giả ghi 1 lần gọi", () => {
    const r = runAudit({ openclaw: "has" });
    assert.match(lineOf(r.out, /Diamond Land 3/), /^ {2}✅ .*còn membership/);
    assert.equal(r.calls.split("\n").filter((l) => l.startsWith("openclaw ")).length, 1);
  });

  test("AA-AC-2 membership không id → ⚠️ rời nhóm", () => {
    const r = runAudit({ openclaw: "none" });
    assert.match(lineOf(r.out, /Diamond Land 3/), /^ {2}⚠️ .*rời nhóm/);
  });

  test("AA-AC-3 count_matches tệp vắng/0 khớp/3 khớp/stdin → 0/0/3/đúng số, một dòng", () => {
    const root = mkdtempSync(path.join(realpathSync(tmpdir()), "count-"));
    roots.push(root);
    writeFileSync(path.join(root, "zero.txt"), "a\nb\n");
    writeFileSync(path.join(root, "three.txt"), "skip p=1\nx\nskip p=2\nskip p=3\n");
    // bash 3.2 của macOS không source được <(…) — nạp thân hàm bằng eval
    const fn = `eval "$(sed -n '/^count_matches()/,/^}/p' "${SCRIPT}")"`;
    const run = (cmd) => spawnSync("/bin/bash", ["-c", `${fn}; ${cmd}`], { encoding: "utf8" }).stdout;
    assert.equal(run(`count_matches "skip p=" "${root}/missing.txt"`), "0\n");
    assert.equal(run(`count_matches "skip p=" "${root}/zero.txt"`), "0\n");
    assert.equal(run(`count_matches "skip p=" "${root}/three.txt"`), "3\n");
    assert.equal(run(`printf 'oneinvest\\nfoo\\noneinvest\\n' | count_matches oneinvest`), "2\n");
    assert.equal(run(`printf 'foo\\n' | count_matches oneinvest`), "0\n");
  });

  test("AA-AC-3 dòng gate hai số nguyên khi log vắng / 0 khớp", () => {
    for (const zaloLog of [undefined, "dòng không khớp\n"]) {
      const r = runAudit({ zaloLog });
      const l = lineOf(r.out, /Zalo: .*posts thật/);
      assert.match(l, /gate \d+ pass\/\d+ skip$/, `dòng gate lỗi (log ${zaloLog ? "0 khớp" : "vắng"}): «${l}»`);
      assert.match(l, /gate 0 pass\/0 skip$/);
    }
  });

  test("AA-AC-3 mọi grep -c chỉ nằm trong count_matches", () => {
    const src = readFileSync(SCRIPT, "utf8");
    const body = src.match(/^count_matches\(\) \{\n[\s\S]*?^\}/m);
    assert.ok(body, "script thiếu hàm count_matches");
    const rest = src.replace(body[0], "");
    assert.doesNotMatch(rest, /grep -c/, "còn grep -c ngoài count_matches");
    assert.doesNotMatch(src, /\|\| echo 0/, "còn khuôn || echo 0");
  });

  test("AA-AC-4 /ops mặc định ở :3456, không :3000", () => {
    const r = runAudit();
    const urls = r.calls.split("\n").filter((l) => l.startsWith("URL ")).map((l) => l.slice(4));
    for (const p of OPS_PAGES) assert.ok(urls.includes(`http://localhost:3456${p}`), `thiếu ${p} ở :3456`);
    assert.ok(!urls.some((u) => u.includes(":3000")), "còn URL :3000");
  });

  test("AA-AC-4 OPS_BASE_URL đổi cổng", () => {
    const r = runAudit({ opsBaseUrl: "http://localhost:4999" });
    const urls = r.calls.split("\n").filter((l) => l.startsWith("URL ")).map((l) => l.slice(4));
    for (const p of OPS_PAGES) assert.ok(urls.includes(`http://localhost:4999${p}`), `thiếu ${p} ở :4999`);
    assert.ok(!urls.some((u) => u.startsWith("http://localhost:3456")), "còn gọi :3456 khi đã đặt OPS_BASE_URL");
  });

  const opsLines = (out) => OPS_PAGES.map((p) => lineOf(out, new RegExp(`local ${p.replace(/\//g, "\\/")} →`)));
  test("AA-AC-5 /ops 200 → ✅", () => {
    for (const l of opsLines(runAudit({ opsCode: 200 }).out)) assert.match(l, /^ {2}✅ .*→ 200/);
  });
  test("AA-AC-5 /ops 307 → ⚠️ chưa đăng nhập", () => {
    for (const l of opsLines(runAudit({ opsCode: 307 }).out)) {
      assert.match(l, /^ {2}⚠️ .*307.*chưa đăng nhập/);
      assert.match(l, /scripts\/dev-ops-login-check\.sh/);
    }
  });
  test("AA-AC-5 /ops 500 → ❌", () => {
    for (const l of opsLines(runAudit({ opsCode: 500 }).out)) assert.match(l, /^ {2}❌ .*→ 500/);
  });

  test("AA-AC-6 TỔNG KẾT khớp số dòng ✅/❌/⚠️, chỉ lệnh giả được gọi, ROOT = cây tạm", () => {
    const r = runAudit({ airdnaLog: "đêm 22/10 ok\n", openclaw: "has" });
    assert.equal(r.status, 0, r.stderr);
    const lines = r.out.split("\n");
    const n = (mark) => lines.filter((l) => l.startsWith(`  ${mark}`)).length;
    const m = r.out.match(/TỔNG KẾT: (\d+) PASS · (\d+) FAIL · (\d+) LIMITED/);
    assert.ok(m, "thiếu dòng TỔNG KẾT");
    assert.deepEqual([+m[1], +m[2], +m[3]], [n("✅"), n("❌"), n("⚠️")]);
    // ROOT: log đọc từ <cây tạm>/pipeline/logs
    assert.match(lineOf(r.out, /AirDNA nightly log/), /^ {2}✅ /);
    // Mọi lệnh ngoài đi qua bản giả: mỗi bản giả đã được gọi, script không gọi đường tuyệt đối tới bản thật
    for (const name of ["docker", "curl", "launchctl", "security", "openclaw"])
      assert.match(r.calls, new RegExp(`^${name} `, "m"), `bản giả ${name} không được gọi`);
    const src = readFileSync(SCRIPT, "utf8");
    assert.doesNotMatch(src, /\/usr\/(local\/)?bin\/(curl|docker|openclaw|security)|\/bin\/launchctl/);
    assert.doesNotMatch(src, /ROOT="\/Users\//, "ROOT còn viết cứng");
  });
});

// ---------- `audit-all-test-moc-phut`: dòng tiêu đề đọc mốc ghim, không đọc đồng hồ thật ----------
describe("mốc giờ ghim trong hộp", () => {
  test("MP-AC-1 dòng tiêu đề mang mốc ghim, date giả ghi nhật ký và chuyển định dạng khác cho date thật", () => {
    const r = runAudit();
    assert.equal(r.status, 0, r.stderr);
    assert.equal(lineOf(r.out, /AUDIT TOÀN DIỆN/), ` AUDIT TOÀN DIỆN ONE INVEST — ${MOC_GHIM}`, "dòng tiêu đề phải mang mốc ghim");
    assert.match(r.calls, /^date \+%Y-%m-%d %H:%M$/m, "nhật ký lời gọi phải có date của dòng tiêu đề");
    const bin = r.env.PATH.split(":")[0];
    const s = spawnSync(path.join(bin, "date"), ["+%s"], { env: r.env, encoding: "utf8" });
    assert.ok(Math.abs(Number(s.stdout) - Date.now() / 1000) < 5, `date giả phải chuyển định dạng khác cho date thật, được «${s.stdout.trim()}»`);
  });
});

// ---------- ON16 `audit-all-doc-log-o-checkout`: gốc log ở checkout chính khi chạy từ worktree ----------
// Hai cây tạm dựng bằng git THẬT (git init + git worktree add) — tệp .git của worktree do git viết, không viết tay.
// «Checkout chính» tạm có pipeline/logs/airdna-daily.log (gitignore, như kho thật); worktree tạm không có log.

const MAIN_SHA = "9e3bb9f"; // main trước ON16 — đối chứng dương: script suy log từ chính cây
const SCRIPT_MAIN = spawnSync("git", ["-C", REPO, "show", `${MAIN_SHA}:scripts/audit-all.sh`], { encoding: "utf8" }).stdout;
const LOG_S02 = "2026-10-24 19:05 vòng S02 xong: 6 thị trường\n";

function git(cwd, ...args) {
  const r = spawnSync("git", ["-c", "user.name=on16", "-c", "user.email=on16@local.test", "-C", cwd, ...args], { encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}

/** Checkout chính tạm (git init, một commit chứa script) + worktree tạm; log S02 chỉ ở checkout chính. */
function haiCay() {
  const root = realpathSync(mkdtempSync(path.join(realpathSync(tmpdir()), "on16-")));
  roots.push(root);
  const main = path.join(root, "chinh");
  mkdirSync(path.join(main, "scripts"), { recursive: true });
  copyFileSync(SCRIPT, path.join(main, "scripts/audit-all.sh"));
  writeFileSync(path.join(main, ".gitignore"), "pipeline/logs/\n");
  git(main, "init", "-q", "-b", "main");
  git(main, "add", ".");
  git(main, "commit", "-q", "-m", "cay chinh");
  mkdirSync(path.join(main, "pipeline/logs"), { recursive: true });
  writeFileSync(path.join(main, "pipeline/logs/airdna-daily.log"), LOG_S02);
  const wt = path.join(root, "wt");
  git(main, "worktree", "add", "-q", "-b", "wt", wt);
  return { root, main, wt };
}

const dongA1 = (out) => lineOf(out, /AirDNA nightly log/) ?? "(không có dòng A1)";

describe("ON16 audit-all đọc log ở checkout chính", () => {
  test("ON16-AC-1 audit-all từ worktree đọc log ở checkout chính", () => {
    const { main, wt } = haiCay();
    assert.ok(readFileSync(path.join(wt, ".git"), "utf8").startsWith("gitdir: "), "worktree tạm phải có tệp .git do git viết");
    const r = runAudit({ treeDir: wt });
    assert.equal(r.status, 0, r.stderr);
    console.log(`# ON16-AC-1 worktree ${wt} · log chỉ ở ${main}/pipeline/logs · dòng A1: ${dongA1(r.out).trim()}`);
    assert.match(dongA1(r.out), /^ {2}✅ AirDNA nightly log: có activity$/);
  });

  test("ON16-AC-1 script main từ worktree → LIMITED trống", () => {
    const { wt } = haiCay();
    const r = runAudit({ treeDir: wt, scriptText: SCRIPT_MAIN });
    console.log(`# ON16-AC-1 chiều đỏ (main ${MAIN_SHA}): ${dongA1(r.out).trim()}`);
    assert.match(dongA1(r.out), /^ {2}⚠️ {2}AirDNA nightly log trống/, "script main phải báo LIMITED trống từ worktree");
  });

  test("ON16-AC-2 kết quả từ worktree trùng lần chạy ở checkout chính", () => {
    const { main, wt } = haiCay();
    const a = runAudit({ treeDir: wt, openclaw: "has" });
    const b = runAudit({ treeDir: main, openclaw: "has" });
    const la = a.out.split("\n");
    const lb = b.out.split("\n");
    const khac = la.map((l, i) => [i, l, lb[i]]).filter(([, x, y]) => x !== y);
    console.log(`# ON16-AC-2 đã so ${Math.max(la.length, lb.length)} dòng · khác ${khac.length + Math.abs(la.length - lb.length)}`);
    assert.equal(la.length, lb.length, "số dòng khác nhau");
    assert.deepEqual(khac, []);
  });

  test("ON16-AC-2 script main từ worktree → khác ở mục A1", () => {
    const { main, wt } = haiCay();
    const a = runAudit({ treeDir: wt, openclaw: "has", scriptText: SCRIPT_MAIN });
    const b = runAudit({ treeDir: main, openclaw: "has", scriptText: SCRIPT_MAIN });
    const lb = b.out.split("\n");
    const khac = a.out.split("\n").filter((l, i) => l !== lb[i]);
    console.log(`# ON16-AC-2 chiều đỏ: ${khac.length} dòng khác — ${khac.map((l) => l.trim()).join(" | ")}`);
    assert.ok(khac.length > 0 && khac.every((l) => /AirDNA nightly log|TỔNG KẾT/.test(l)), `phải khác đúng ở A1 (và tổng kết), được: ${khac.join(" | ")}`);
  });

  // Ca biên: không tìm được checkout chính → đọc log của chính cây; mục log trống thì dòng LIMITED ghi đường đã đọc (Hỏi-1).
  function caBien(scriptText) {
    const out = {};
    // checkout chính chạy chính nó
    {
      const { main } = haiCay();
      out["checkout chính"] = { r: runAudit({ treeDir: main, scriptText }), want: "pass" };
    }
    // thư mục không phải kho git, có log riêng
    out["không git"] = { r: runAudit({ airdnaLog: LOG_S02, scriptText }), want: "pass" };
    // tệp .git hỏng — git lỗi; cây có log riêng
    {
      const { wt } = haiCay();
      writeFileSync(path.join(wt, ".git"), "gitdir: /khong/co/dau\n");
      mkdirSync(path.join(wt, "pipeline/logs"), { recursive: true });
      writeFileSync(path.join(wt, "pipeline/logs/airdna-daily.log"), LOG_S02);
      out[".git hỏng"] = { r: runAudit({ treeDir: wt, scriptText }), want: "pass" };
    }
    // checkout chính đã dời — git lỗi; cây không log → LIMITED ghi đường của chính cây
    {
      const { main, wt, root } = haiCay();
      renameSync(main, path.join(root, "chinh-da-doi"));
      out["checkout chính đã dời"] = { r: runAudit({ treeDir: wt, scriptText }), want: `đọc ${wt}/pipeline/logs/airdna-daily.log` };
    }
    return out;
  }
  const loiCaBien = (cases) =>
    Object.entries(cases).flatMap(([ten, { r, want }]) => {
      const l = dongA1(r.out);
      const tong = /TỔNG KẾT: \d+ PASS/.test(r.out);
      console.log(`# ON16-AC-3 ${ten}: ${l.trim()}${tong ? "" : " · THIẾU TỔNG KẾT"}`);
      if (!tong || r.status !== 0) return [`${ten}: không chạy hết (mã ${r.status})`];
      if (want === "pass") return /^ {2}✅ AirDNA nightly log: có activity$/.test(l) ? [] : [`${ten}: không đọc log của chính cây — «${l.trim()}»`];
      return /^ {2}⚠️ {2}AirDNA nightly log trống — /.test(l) && l.includes(want) ? [] : [`${ten}: dòng LIMITED không ghi «${want}» — «${l.trim()}»`];
    });

  test("ON16-AC-3 cây không tìm được checkout chính đọc log của chính cây", () => {
    assert.deepEqual(loiCaBien(caBien()), []);
  });

  test("ON16-AC-3 bản đột biến gốc log rỗng khi git lỗi → báo đường đọc sai", () => {
    const src = readFileSync(SCRIPT, "utf8");
    assert.ok(src.includes('LOG_ROOT="$ROOT"\n'), "khuôn đột biến không còn khớp script");
    const loi = loiCaBien(caBien(src.replace('LOG_ROOT="$ROOT"\n', 'LOG_ROOT=""\n')));
    console.log(`# ON16-AC-3 chiều đỏ: ${loi.join(" | ")}`);
    assert.ok(loi.some((x) => x.startsWith("checkout chính đã dời")) && loi.some((x) => x.startsWith(".git hỏng")), `đột biến phải bị bắt: ${loi.join(" | ")}`);
  });
});

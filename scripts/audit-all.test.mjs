// node --test scripts/audit-all.test.mjs
// AU5 `audit-all-noi-that`: audit-all không còn PASS giả ở backup + membership S03, trang /ops kiểm ở :3456.
// Chạy NGUYÊN scripts/audit-all.sh trong cây tạm: PATH chỉ gồm thư mục bản giả + /usr/bin:/bin, HOME tạm, env tối
// thiểu. Bản giả docker/curl/launchctl/security/openclaw ghi nhật ký lời gọi — không lời gọi mạng thật, không chạy
// CLI OpenClaw thật (an toàn Zalo). launchctl phát lại bản chụp THẬT 23/10. Ma trận: design doc §3.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, utimesSync, writeFileSync,
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

const FAKES = {
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
  const tree = path.join(root, "tree");
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

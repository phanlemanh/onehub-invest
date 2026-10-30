// node --test scripts/enrich-buoc-job.test.mjs
// Hồ sơ enrich-chay-sau-nap (AC-6, AC-7, AC-8): bước enrich-run cuối scripts/zalo-import-daily.sh. Khuôn
// scripts/zalo-import-job.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây tạm; `node` giả đầu PATH ghi nhãn
// bước (tệp .mjs/.js/.ts đầu tiên), thư mục chạy, LIMIT và khoá nạp có hay không; hỏng theo FAIL_STEPS. HOME tạm,
// DATABASE_URL cổng đóng: không node thật, không DB, không OpenClaw, không LLM.
// Chiều đỏ: bản sao tệp bọc đột biến một dòng (cùng cây tạm, cùng node giả) → ca đỏ với thông điệp ghim.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "scripts/zalo-import-daily.sh";
const THAT = readFileSync(path.join(REPO, SCRIPT), "utf8");
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "enrich-buoc-job-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const SNAP = "collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-25T000000Z";
const STATE = "pipeline/logs/apify-daily.state";
const LOCK = `${STATE}.lock`;
const NHAN = ["import-airbnb", "transform-zalo", "transform-media", "refresh-bait-gap", "enrich-run"];
const PID_KHAC = "424242";

const NODE_SHIM = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step" >> "$CALLS"
if [ -d "$LOCKP" ]; then khoa=co; else khoa=khong; fi
echo "$step|$PWD|\${LIMIT:-}|$khoa" >> "$SEEN"
if [ "$step" = enrich-run ] && [ "\${FAKE_OTHER_LOCK:-}" = 1 ]; then
  mkdir "$LOCKP" && echo ${PID_KHAC} > "$LOCKP/pid"
fi
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  name="\${it%%:*}"; c="\${it#*:}"
  if [ "$name" = "$step" ]; then echo "Error: boom ($step)" >&2; exit "$c"; fi
done
exit 0
`;

function cay(noiDung = THAT) {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  writeFileSync(path.join(root, SCRIPT), noiDung);
  mkdirSync(path.join(root, SNAP), { recursive: true });
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  writeFileSync(path.join(root, STATE), "2026-10-24T000000Z");
  mkdirSync(path.join(root, "agent"));
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n");
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function chay(root, { fail = "", limit, khoaKhac = false } = {}) {
  const calls = path.join(root, ".calls");
  const seen = path.join(root, ".seen");
  writeFileSync(calls, "");
  writeFileSync(seen, "");
  const env = {
    PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`,
    HOME: path.join(root, ".home"),
    DATABASE_URL: "postgres://127.0.0.1:9/khong-co",
    CALLS: calls,
    SEEN: seen,
    LOCKP: path.join(root, LOCK),
    FAIL_STEPS: fail,
    ...(limit === undefined ? {} : { ENRICH_LIMIT: String(limit) }),
    ...(khoaKhac ? { FAKE_OTHER_LOCK: "1" } : {}),
  };
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT)], { cwd: root, env, encoding: "utf8", timeout: 60_000 });
  const doc = (f) => readFileSync(f, "utf8").split("\n").filter(Boolean);
  const thay = Object.fromEntries(doc(seen).map((l) => {
    const [buoc, cwd, lim, khoa] = l.split("|");
    return [buoc, { cwd, lim, khoa }];
  }));
  return {
    root, code: r.status, stderr: r.stderr, calls: doc(calls), thay,
    jobFail: r.stderr.split("\n").filter((l) => l.startsWith("JOB FAIL")),
  };
}

/** Bản sao tệp bọc: thay đúng một chuỗi (phải có mặt). */
function dotBien(cu, moi) {
  assert.ok(THAT.includes(cu), `đột biến không khớp chuỗi: ${cu}`);
  return THAT.replace(cu, moi);
}

// ── EC-AC-6 ─────────────────────────────────────────────────────────────────────────────────────────────────
function kiemDayBuoc(noiDung) {
  const r = chay(cay(noiDung));
  assert.equal(r.code, 0, r.stderr);
  assert.ok(r.calls.includes("enrich-run"), "EC-AC-6 thiếu bước enrich-run");
  assert.deepEqual(r.calls, NHAN, "EC-AC-6 dãy bước");
  assert.equal(r.thay["enrich-run"].cwd, path.join(r.root, "agent"), "EC-AC-6 enrich-run phải chạy trong agent/");
  assert.equal(r.thay["enrich-run"].lim, "50", "EC-AC-6 LIMIT mặc định 50");
}

test("EC-AC-6 dãy bước: lành → năm bước, enrich cuối, trong agent/, LIMIT 50; ENRICH_LIMIT ghi đè; nạp hỏng thì không enrich", () => {
  kiemDayBuoc(THAT);
  assert.equal(chay(cay(), { limit: 7 }).thay["enrich-run"].lim, "7", "EC-AC-6 ENRICH_LIMIT không ghi đè LIMIT");
  const hong = chay(cay(), { fail: "import-airbnb:2" });
  assert.equal(hong.code, 1, hong.stderr);
  assert.deepEqual(hong.calls, ["import-airbnb"], "EC-AC-6 nạp hỏng mà vẫn chạy bước sau");
});

test("EC-AC-6 chiều đỏ: bỏ dòng job_run enrich-run → thiếu bước enrich-run", () => {
  const cut = dotBien("job_run zalo-import-daily enrich-run enrich_run\n", "");
  assert.throws(() => kiemDayBuoc(cut), /EC-AC-6 thiếu bước enrich-run/);
});

// ── EC-AC-7 ─────────────────────────────────────────────────────────────────────────────────────────────────
const MA_TRAN = [
  { fail: "enrich-run:3", ma: 3, hong: [["enrich-run", 3]] },
  { fail: "enrich-run:2", ma: 2, hong: [["enrich-run", 2]] },
  { fail: "transform-zalo:4", ma: 4, hong: [["transform-zalo", 4]] },
  { fail: "transform-zalo:4,enrich-run:3", ma: 4, hong: [["transform-zalo", 4], ["enrich-run", 3]] },
];

function kiemMaJob(noiDung) {
  let dem = 0;
  for (const { fail, ma, hong } of MA_TRAN) {
    const r = chay(cay(noiDung), { fail });
    assert.equal(r.code, ma, `EC-AC-7 mã enrich bị nuốt — ${fail}: mã ${r.code}, muốn ${ma}`);
    assert.ok(r.calls.includes("enrich-run"), `EC-AC-7 ${fail}: enrich-run không chạy`);
    assert.deepEqual(r.jobFail, hong.map(([n, c]) => `JOB FAIL [zalo-import-daily] bước ${n} mã ${c}`), `EC-AC-7 ${fail}: dòng JOB FAIL`);
    dem++;
  }
  assert.equal(dem, 4, "EC-AC-7 số dòng ma trận");
}

test("EC-AC-7 mã job: ma trận bốn dòng", () => kiemMaJob(THAT));

test("EC-AC-7 chiều đỏ: gọi enrich trần (không job_run) → mã enrich bị nuốt", () => {
  const tran = dotBien("job_run zalo-import-daily enrich-run enrich_run\n", "enrich_run\n");
  assert.throws(() => kiemMaJob(tran), /EC-AC-7 mã enrich bị nuốt/);
});

// ── EC-AC-8 ─────────────────────────────────────────────────────────────────────────────────────────────────
function kiemNhaKhoa(noiDung) {
  const r = chay(cay(noiDung), { khoaKhac: true });
  assert.equal(r.thay["transform-zalo"].khoa, "co", "EC-AC-8 đối chứng: transform-zalo phải thấy khoá nạp");
  assert.equal(r.thay["enrich-run"].khoa, "khong", "EC-AC-8 enrich chạy khi còn giữ khoá nạp");
  const pid = path.join(r.root, LOCK, "pid");
  assert.ok(existsSync(pid), "EC-AC-8 xoá khoá của job khác");
  assert.equal(readFileSync(pid, "utf8").trim(), PID_KHAC, "EC-AC-8 xoá khoá của job khác");
  assert.equal(r.code, 0, r.stderr);
}

test("EC-AC-8 nhả khoá: enrich không giữ khoá nạp; khoá của job khác còn sau khi job thoát", () => kiemNhaKhoa(THAT));

test("EC-AC-8 chiều đỏ: bỏ dòng nhả khoá → enrich chạy khi còn giữ khoá nạp", () => {
  const giu = dotBien(`trap - EXIT; rm -rf "$LOCK_DIR"\n`, "trap - EXIT\n");
  assert.throws(() => kiemNhaKhoa(giu), /EC-AC-8 enrich chạy khi còn giữ khoá nạp/);
});

test("EC-AC-8 chiều đỏ: nhả khoá mà không gỡ trap → xoá khoá của job khác", () => {
  const conTrap = dotBien(`trap - EXIT; rm -rf "$LOCK_DIR"\n`, `rm -rf "$LOCK_DIR"\n`);
  assert.throws(() => kiemNhaKhoa(conTrap), /EC-AC-8 xoá khoá của job khác/);
});

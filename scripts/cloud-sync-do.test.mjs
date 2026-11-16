// node --test scripts/cloud-sync-do.test.mjs
// Hồ sơ s03-len-nhanh-nac-1 AC-4, AC-5: job đo mỗi giờ (scripts/cloud-sync-do.sh) và cờ tự nhận trong scripts/cloud-sync.sh.
// Khuôn scripts/job-exit.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây tạm; `node` giả đầu PATH ghi nhãn bước
// (tên tệp .mjs đầu tiên, kèm --write nếu có) và việc tệp dấu có hay không lúc gọi; `date` giả trả FAKE_NOW cho `date +%s`
// (ô biên 7200 giây không chập chờn). HOME tạm: không node thật, không DB. Chiều đỏ: bản chép tệp bọc đột biến đúng một chỗ.
import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "cloud-sync-do-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const BAY = [
  "trang-thai-chao", "bac-du-lieu --write", "do-danh-ba-sdt --write", "do-the-duyet --write",
  "mau-soat-cuon-chieu", "do-hang-ngay --write", "do-lam-giau --write",
];
const BON = ["ha-bung-het-han", "sync-cloud", "refresh-data-flow", "push-ops-facts"];
const NOW = 1_800_000_000;

const NODE_SHIM = `#!/bin/bash
step=""; flag=""
for a in "$@"; do case "$a" in *.mjs|*.js) [ -z "$step" ] && { step="$(basename "$a")"; step="\${step%.*}"; };; --write) flag=" --write";; esac; done
[ -z "$step" ] && step=node
dau=khong; [ -f "$ROOT_TAM/pipeline/logs/cloud-sync-do.last" ] && dau=co
khoa=khong; [ -d "$ROOT_TAM/pipeline/logs/cloud-sync-do.lock" ] && khoa=co
echo "$step$flag|$dau|$khoa" >> "$CALLS"
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do name="\${it%%:*}"; c="\${it#*:}"; [ "$c" = "$it" ] && c=3; [ "$name" = "$step" ] && { echo "boom" >&2; exit "$c"; }; done
exit 0
`;
const DATE_SHIM = `#!/bin/bash
if [ "$#" -eq 1 ] && [ "$1" = "+%s" ]; then echo "$FAKE_NOW"; exit 0; fi
exec /bin/date "$@"
`;

function cay(ten, tep, sua) {
  const root = mkdtempSync(path.join(SCRATCH, `${ten}-`));
  for (const rel of [tep, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  if (sua) {
    const f = path.join(root, tep);
    const goc = readFileSync(f, "utf8");
    const moi = sua(goc);
    assert.notEqual(moi, goc, `đột biến «${ten}» không đổi gì — mỏ neo đã đổi?`);
    writeFileSync(f, moi);
  }
  mkdirSync(path.join(root, ".shim-bin"), { recursive: true });
  writeFileSync(path.join(root, ".shim-bin/node"), NODE_SHIM);
  writeFileSync(path.join(root, ".shim-bin/date"), DATE_SHIM);
  chmodSync(path.join(root, ".shim-bin/node"), 0o755);
  chmodSync(path.join(root, ".shim-bin/date"), 0o755);
  mkdirSync(path.join(root, ".home"), { recursive: true });
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  return root;
}

function chay(root, tep, env = {}) {
  const calls = path.join(root, `.calls-${Math.random().toString(36).slice(2)}`);
  writeFileSync(calls, "");
  const r = spawnSync("/bin/bash", [path.join(root, tep)], {
    cwd: root, encoding: "utf8",
    env: { PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`, HOME: path.join(root, ".home"), CALLS: calls, ROOT_TAM: root, FAKE_NOW: String(NOW), ...env },
  });
  const dong = readFileSync(calls, "utf8").split("\n").filter(Boolean).map((l) => l.split("|"));
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, nhan: dong.map((d) => d[0]), dau: dong.map((d) => d[1]), khoa: dong.map((d) => d[2]) };
}

const dauTep = (root) => path.join(root, "pipeline/logs/cloud-sync-do.last");
const khoaTep = (root) => path.join(root, "pipeline/logs/cloud-sync-do.lock");
function datKhoa(root, pid) {
  mkdirSync(khoaTep(root), { recursive: true });
  writeFileSync(path.join(khoaTep(root), "pid"), `${pid}\n`);
}
function pidSong() {
  const p = spawn("/bin/sleep", ["60"], { stdio: "ignore" });
  return p;
}
function pidChet() {
  return spawnSync("/usr/bin/true").pid;
}

// ---------------------------------------------------------------- AC-4 job giờ --
function kiemDau(root) {
  const r = chay(root, "scripts/cloud-sync-do.sh");
  if (r.code !== 0) return `CD-AC-4 job thoát ${r.code}: ${r.stderr}`;
  assert.deepEqual(r.nhan, BAY, "CD-AC-4 thứ tự bảy bước");
  if (r.dau.some((d) => d === "co")) return "CD-AC-4 dấu ghi trước khi chạy trọn";
  if (!existsSync(dauTep(root))) return "CD-AC-4 chạy trọn mà không ghi dấu";
  assert.equal(readFileSync(dauTep(root), "utf8").trim(), String(NOW), "CD-AC-4 dấu không phải giây epoch lúc chạy");
  assert.ok(!existsSync(khoaTep(root)), "CD-AC-4 khoá không được gỡ sau lượt");
  return null;
}
test("CD-AC-4 job giờ: bảy bước đúng thứ tự, dấu ghi SAU bước cuối (kèm chiều đỏ)", () => {
  assert.equal(kiemDau(cay("thu-tu", "scripts/cloud-sync-do.sh")), null);
  const dauDau = cay("dau-dau", "scripts/cloud-sync-do.sh", (s) =>
    s.replace('if [ "$JOB_RC" -eq 0 ]; then date +%s > "$DAU"; fi\n', "")
      .replace('. "$ROOT/scripts/lib/job-step.sh"\n', '. "$ROOT/scripts/lib/job-step.sh"\ndate +%s > "$DAU"\n'));
  assert.equal(kiemDau(dauDau), "CD-AC-4 dấu ghi trước khi chạy trọn");
});

function kiemLoi(root) {
  const r = chay(root, "scripts/cloud-sync-do.sh", { FAIL_STEPS: "bac-du-lieu:3,do-lam-giau:5" });
  assert.deepEqual(r.nhan, BAY, "CD-AC-4 bước hỏng mà bước sau không chạy");
  assert.equal(r.code, 3, "CD-AC-4 mã thoát không phải mã hỏng đầu tiên");
  assert.ok(r.stderr.split("\n").includes("JOB FAIL [cloud-sync-do] bước bac-du-lieu mã 3"), r.stderr);
  if (existsSync(dauTep(root))) return "CD-AC-4 dấu ghi khi job lỗi";
  return null;
}
test("CD-AC-4 job giờ: bước lỗi → mã hỏng đầu tiên, KHÔNG ghi dấu (kèm chiều đỏ)", () => {
  assert.equal(kiemLoi(cay("loi", "scripts/cloud-sync-do.sh")), null);
  const dauKhiLoi = cay("dau-khi-loi", "scripts/cloud-sync-do.sh", (s) =>
    s.replace('if [ "$JOB_RC" -eq 0 ]; then date +%s > "$DAU"; fi', 'date +%s > "$DAU"'));
  assert.equal(kiemLoi(dauKhiLoi), "CD-AC-4 dấu ghi khi job lỗi");
});

test("CD-AC-4 job giờ: khoá của PID sống → bỏ lượt, 0 bước, thoát 0; khoá của PID chết → gỡ và chạy", () => {
  const root = cay("khoa", "scripts/cloud-sync-do.sh");
  const p = pidSong();
  try {
    datKhoa(root, p.pid);
    const r = chay(root, "scripts/cloud-sync-do.sh");
    assert.equal(r.code, 0);
    assert.match(r.stdout, /bỏ lượt: lượt đo trước còn chạy/);
    assert.deepEqual(r.nhan, [], "CD-AC-4 khoá sống mà vẫn chạy bước");
    assert.ok(!existsSync(dauTep(root)), "CD-AC-4 bỏ lượt mà ghi dấu");
  } finally { p.kill(); }
  datKhoa(root, pidChet());
  const r2 = chay(root, "scripts/cloud-sync-do.sh");
  assert.equal(r2.code, 0, r2.stderr);
  assert.deepEqual(r2.nhan, BAY, "CD-AC-4 khoá chết không được gỡ");
  assert.ok(!existsSync(khoaTep(root)), "CD-AC-4 khoá còn sau lượt");
});

// ---------------------------------------------------------------- AC-5 cờ tự nhận --
function seqTruocVong() {
  let goc;
  try {
    const mb = execFileSync("git", ["-C", REPO, "merge-base", "HEAD", "origin/main"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    goc = execFileSync("git", ["-C", REPO, "show", `${mb}:scripts/cloud-sync.sh`], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch { goc = readFileSync(path.join(REPO, "scripts/cloud-sync.sh"), "utf8"); }
  const root = mkdtempSync(path.join(SCRATCH, "goc-"));
  mkdirSync(path.join(root, "scripts/lib"), { recursive: true });
  writeFileSync(path.join(root, "scripts/cloud-sync.sh"), goc);
  copyFileSync(path.join(REPO, "scripts/lib/job-step.sh"), path.join(root, "scripts/lib/job-step.sh"));
  mkdirSync(path.join(root, ".shim-bin"), { recursive: true });
  writeFileSync(path.join(root, ".shim-bin/node"), NODE_SHIM);
  writeFileSync(path.join(root, ".shim-bin/date"), DATE_SHIM);
  chmodSync(path.join(root, ".shim-bin/node"), 0o755);
  chmodSync(path.join(root, ".shim-bin/date"), 0o755);
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  return chay(root, "scripts/cloud-sync.sh").nhan;
}
const DU = seqTruocVong();
test("CD-AC-5 bản trước vòng chạy đủ mười một bước (nền so sánh)", () => {
  assert.deepEqual(DU, [...BON, ...BAY]);
});

function kiemCo(root, o) {
  if (o.dau !== undefined) writeFileSync(dauTep(root), `${o.dau}\n`);
  let p;
  if (o.khoaSong) { p = pidSong(); datKhoa(root, p.pid); }
  try {
    const r = chay(root, "scripts/cloud-sync.sh");
    assert.equal(r.code, 0, r.stderr);
    if (o.ky === "bon") {
      if (JSON.stringify(r.nhan) !== JSON.stringify(BON)) {
        return o.khoaSong ? "CD-AC-5 chạy chồng job giờ" : "CD-AC-5 dấu tươi mà vẫn chạy bước đo";
      }
      assert.match(r.stdout, o.khoaSong ? /bước đo: lượt đo khác đang chạy/ : /bước đo: job giờ chạy lúc/);
    } else {
      if (JSON.stringify(r.nhan) !== JSON.stringify(DU)) return "CD-AC-5 dấu cũ vẫn bỏ bước đo";
      assert.deepEqual(r.khoa.slice(4), BAY.map(() => "co"), "CD-AC-5 bảy bước đo chạy ngoài khoá chung");
      assert.ok(!existsSync(khoaTep(root)), "CD-AC-5 khoá còn sau lượt");
    }
    return null;
  } finally { p?.kill(); }
}
const O = [
  { ten: "vang", ky: "du" },
  { ten: "tuoi", dau: NOW - 60, ky: "bon" },
  { ten: "cu", dau: NOW - 7200, ky: "du" },
  { ten: "rac", dau: "abc", ky: "du" },
  { ten: "khoa-song", khoaSong: true, ky: "bon" },
];
test("CD-AC-5 ma trận năm ô dấu: vắng · tươi · cũ 7200 · rác · khoá sống (kèm chiều đỏ)", () => {
  for (const o of O) assert.equal(kiemCo(cay(`co-${o.ten}`, "scripts/cloud-sync.sh"), o), null, `ô ${o.ten}`);
  const le = cay("co-le", "scripts/cloud-sync.sh", (s) =>
    s.replace('-lt "${CLOUD_SYNC_DO_TUOI_GIAY:-7200}"', '-le "${CLOUD_SYNC_DO_TUOI_GIAY:-7200}"'));
  assert.equal(kiemCo(le, O[2]), "CD-AC-5 dấu cũ vẫn bỏ bước đo");
  const boKhoa = cay("co-bo-khoa", "scripts/cloud-sync.sh", (s) => s.replace("elif ! lay_khoa_do; then", "elif false; then"));
  assert.equal(kiemCo(boKhoa, O[4]), "CD-AC-5 chạy chồng job giờ");
});

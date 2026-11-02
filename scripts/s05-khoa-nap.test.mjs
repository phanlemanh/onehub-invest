// node --test scripts/s05-khoa-nap.test.mjs
// 2510-31: 5 điểm ngoài hợp đồng khoa-nap-s05 — (1) cửa sổ '5 days' plist +
// mặc định collector; (2) file khoá 'luc' không phải số không văng vòng until;
// (3) rm -rf không xoá được → tính vào trần 60 lượt + sleep, không quay bận;
// (5) bước thu in dòng ghim 'JOB FAIL [apify-facebook-daily] bước
// apify-facebook-collector mã N' qua job-step.sh. Chạy trên BẢN CHÉP trong
// thư mục tạm — không đụng bản thật, không gọi Apify, không DB.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tmps = [];
after(() => tmps.forEach((d) => rmSync(d, { recursive: true, force: true })));

/** Bản chép cây tối giản: script + job-step + plist (đúng ranh giới lời giao). */
function banChep() {
  const t = mkdtempSync(join(tmpdir(), "s05-khoa-"));
  tmps.push(t);
  mkdirSync(path.join(t, "scripts/lib"), { recursive: true });
  mkdirSync(path.join(t, "pipeline/cron"), { recursive: true });
  cpSync(path.join(REPO, "scripts/apify-facebook-daily.sh"), path.join(t, "scripts/apify-facebook-daily.sh"));
  cpSync(path.join(REPO, "scripts/lib/job-step.sh"), path.join(t, "scripts/lib/job-step.sh"));
  cpSync(path.join(REPO, "pipeline/cron/com.oneinvest.apify-facebook.plist"), path.join(t, "pipeline/cron/com.oneinvest.apify-facebook.plist"));
  return t;
}

// node:test không cho import join lỏng lẻo — dùng path.join qua alias
const join = path.join;

test("(1) cửa sổ: plist + mặc định collector đều '5 days' (đệm trên khoảng T6→T3)", async () => {
  const t = banChep();
  const plist = readFileSync(join(t, "pipeline/cron/com.oneinvest.apify-facebook.plist"), "utf8");
  assert.match(plist, /<string>5 days<\/string>/, "plist S05_NEWER_THAN = 5 days");
  assert.doesNotMatch(plist, /4 days/);

  const mod = await import(path.join(REPO, "pipeline/apify-facebook-collector.mjs").replace(/\\/g, "/"));
  // collector nạp DB client khi import? — không: gate chỉ chạy trong main() — an toàn import
  assert.equal(mod.S05_NEWER_THAN_MAC_DINH, "5 days");
  assert.equal(mod.s05NewerThan(), "5 days");
  // env đè vẫn thắng
  const cur = process.env.S05_NEWER_THAN;
  process.env.S05_NEWER_THAN = "9 days";
  assert.equal(mod.s05NewerThan(), "9 days");
  if (cur === undefined) delete process.env.S05_NEWER_THAN; else process.env.S05_NEWER_THAN = cur;
});

/** Rút riêng khối khoá từ script (từ 'go_khoa_cu()' đến dòng 'echo $$') rồi
 * chạy trong bash với LOCK_DIR trỏ thư mục tạm — không chạy phần còn của script. */
function chayKhoiKhoa(scriptPath, lockDir, bienThem = "") {
  const src = readFileSync(scriptPath, "utf8");
  const d0 = src.indexOf("go_khoa_cu() {");
  const d1 = src.indexOf('echo $$ > "$LOCK_DIR/pid"');
  assert.ok(d0 >= 0 && d1 > d0, "tìm thấy khối khoá trong script");
  const doan = src.slice(d0, d1);
  const harness = join(path.dirname(scriptPath), `.khoa-test-${Date.now}.bash`);
  writeFileSync(harness, `set -uo pipefail\nLOCK_DIR=${JSON.stringify(lockDir)}\n${bienThem}\n${doan}\necho "KHOA-OK pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo -)"\n`);
  tmps.push(harness);
  return spawnSync("bash", [harness], { encoding: "utf8", timeout: 20_000 });
}

test("(2)+(3) hành vi khoá: luc rác → gỡ như khoá cũ; PID chết → gỡ; khoá khoẻ → chờ có trần", () => {
  const t = banChep();
  const script = join(t, "scripts/apify-facebook-daily.sh");

  // (2) luc KHÔNG phải số: trước đây $(( ... - rác )) lỗi làm bash bỏ vòng
  // until — giờ phải gỡ khoá như khoá cũ và VÀO ĐƯỢC khoá (in KHOA-OK).
  const lk1 = join(t, "lock-luc-rac");
  mkdirSync(lk1, { recursive: true });
  writeFileSync(join(lk1, "pid"), "999999999\n");   // PID chắc chắn không sống
  writeFileSync(join(lk1, "luc"), "khong-phai-so\n");
  const r1 = chayKhoiKhoa(script, lk1);
  assert.equal(r1.status, 0, `không lỗi bash (out: ${r1.stdout} ${r1.stderr})`);
  assert.match(r1.stdout, /KHOA-OK/, "vào được khoá sau khi gỡ bản PID chết + luc rác");

  // (2b) luc rác NHƯNG PID còn sống → vẫn gỡ (theo quyết định coi như khoá cũ)
  const lk2 = join(t, "lock-song-luc-rac");
  mkdirSync(lk2, { recursive: true });
  writeFileSync(join(lk2, "pid"), `${process.pid}\n`);
  writeFileSync(join(lk2, "luc"), "rác\n");
  const r2 = chayKhoiKhoa(script, lk2);
  assert.equal(r2.status, 0);
  assert.match(r2.stdout, /KHOA-OK/);
  assert.match(r2.stdout, /luc không phải số/, "nhánh luc rác tự gỡ kể cả PID còn sống");

  // (3) khoá KHOẺ (PID sống + luc mới) → PHẢI chờ: script test chỉ chạy đúng
  // khối khoá — nó sẽ quay tới trần 60 lượt × sleep 5s = quá timeout; thay
  // vào đó thu ngắn: chạy với sleep bị thay bằng no-op để 60 lượt chạy nhanh,
  // kỳ vọng exit 1 với dòng «bận >5′».
  const lk3 = join(t, "lock-khoe");
  mkdirSync(lk3, { recursive: true });
  writeFileSync(join(lk3, "pid"), `${process.pid}\n`);
  writeFileSync(join(lk3, "luc"), `${Math.floor(Date.now() / 1000)}\n`);
  const r3 = chayKhoiKhoa(script, lk3, "sleep() { :; }");
  assert.equal(r3.status, 1, "khoá khoẻ phải chờ tới trần rồi thoát 1");
  assert.match(r3.stdout + r3.stderr, /bận >5′/);
});

test("(3b) rm -rf không xoá được → có trần, không quay bận vô hạn", () => {
  const t = banChep();
  const script = join(t, "scripts/apify-facebook-daily.sh");
  const lk = join(t, "lock-khong-xoa-duoc");
  mkdirSync(lk, { recursive: true });
  writeFileSync(join(lk, "pid"), "999999999\n"); // PID chết → go_khoa_cu cố gỡ
  writeFileSync(join(lk, "luc"), "rác\n");
  // rm giả luôn THẤT BẠI — go_khoa_cu không bao giờ trả 0
  const fakeBin = join(t, "bin");
  mkdirSync(fakeBin, { recursive: true });
  writeFileSync(join(fakeBin, "rm"), "#!/bin/bash\nexit 1\n");
  chmodSync(join(fakeBin, "rm"), 0o755);
  const demFile = join(t, "dem.txt");
  const src = readFileSync(script, "utf8");
  const k0 = src.indexOf("go_khoa_cu() {");
  const k1 = src.indexOf('echo $$ > "$LOCK_DIR/pid"');
  const doan = src.slice(k0, k1)
    .replace("sleep 5", `echo v >> ${JSON.stringify(demFile)}`) // mỗi vòng chờ ghi 1 dòng
    .replace(/\[ "\$i" -ge 60 \]/, '[ "$i" -ge 5 ]');                    // hạ trần cho nhanh
  const harness = join(t, ".khoa-rm-fail.bash");
  writeFileSync(harness, `set -uo pipefail\nLOCK_DIR=${JSON.stringify(lk)}\n${doan}\necho "VAO-KHOA"\n`);
  tmps.push(harness);
  const r = spawnSync("bash", [harness], {
    encoding: "utf8", timeout: 20_000,
    env: { ...process.env, PATH: `${fakeBin}:${process.env.PATH}` },
  });
  assert.equal(r.status, 1, "phải thoát 1 sau trần — không treo khi rm hỏng lặp");
  assert.match(r.stdout + r.stderr, /không gỡ được khoá|bận >/);
  const soVong = readFileSync(demFile, "utf8").trim().split("\n").filter(Boolean).length;
  assert.equal(soVong, 4, `trần 5 vòng → 4 lần chờ rồi thoát (thấy ${soVong}) — có bờ, không quay bận`);
  assert.ok(!/VAO-KHOA/.test(r.stdout), "không được vào khoá khi gỡ thất bại");
});

test("(5) bước thu lỗi → dòng ghim JOB FAIL [apify-facebook-daily] bước apify-facebook-collector mã N", () => {
  const t = banChep();
  const script = join(t, "scripts/apify-facebook-daily.sh");
  const src = readFileSync(script, "utf8");
  // script phải dùng job_step cho bước thu
  assert.match(src, /job_step apify-facebook-daily apify-facebook-collector node /, "bước thu chạy qua job_step");
  // chạy thật job-step với lệnh giả luôn fail mã 7 — dòng ghim phải đúng khuôn
  const r = spawnSync(
    "bash",
    ["-c", `. "${join(t, "scripts/lib/job-step.sh")}"; job_step apify-facebook-daily apify-facebook-collector bash -c 'exit 7'`],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 7, "job_step trả đúng mã thoát của lệnh");
  assert.match(r.stderr.trim(), /^JOB FAIL \[apify-facebook-daily\] bước apify-facebook-collector mã 7$/);
});

test("(6) chú thích đầu: không còn '4 lần/ngày'; nói đúng lịch 2 lượt/tuần", () => {
  const t = banChep();
  const src = readFileSync(join(t, "scripts/apify-facebook-daily.sh"), "utf8");
  assert.doesNotMatch(src, /4 lần\/ngày|4 runs\/ngày/);
  assert.match(src, /2 lượt\/tuần/);
});

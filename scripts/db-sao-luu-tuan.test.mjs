// db-sao-luu-tuan.test.mjs — test job sao lưu tuần DB trên máy (1711-15 MỞ LẠI 1711-16/17).
// CHẠY LẺ: node --test scripts/db-sao-luu-tuan.test.mjs
// KHÔNG đụng DB thật, KHÔNG docker: dump thay bằng SAO_LUU_LENH (đường tệp script
// dump-giả nhận thư mục bản làm $1) trong thư mục tạm. POSIX thuần; shasum là Perl
// core có trên ubuntu-latest — xanh cả linux CI.
// Ca: (1) lib xoay giữ 8 bản CÓ DẤU mới nhất, thư mục khuôn KHÔNG dấu (bản tay
// chạy db-sao-luu.sh) không bao giờ bị đụng; (2) CA ĐỎ: đột biến lib bỏ kiểm dấu
// → xoá nhầm bản khuôn không dấu → đỏ; (3) wrapper dump-giả THOÁT LỖI → thoát ≠0,
// không xoay; (4) wrapper dump-giả OK: truyền đúng DB_SAO_LUU_CHI mặc định
// 'oneinvest' vào dump + tệp dấu được ghi + xoay chạy; (5) SAO_LUU_XOAY_THU=1 chỉ
// in «SẼ XOÁ», không xoá.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRAPPER = join(REPO, "scripts", "db-sao-luu-tuan.sh");
const XOAY = join(REPO, "scripts", "lib", "db-sao-luu-xoay.sh");
const DAU = ".tao-boi-job-tuan";
const KHUON = /^\d{8}T\d{6}Z$/;

const TEN_KHUON = (i) => `202611${String(i).padStart(2, "0")}T000000Z`; // 16 ký tự khớp khuôn, thứ tự tăng theo i
const taoBan = (goc, ten, { dau = true } = {}) => {
  const d = join(goc, ten);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "oneinvest.dump"), `dump ${ten}`);
  if (dau) writeFileSync(join(d, DAU), "");
  return d;
};

const dungGoc = () => {
  const root = mkdtempSync(join(tmpdir(), "sao-luu-tuan-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  return { root, goc };
};

test("SLLT-1 xoay: giữ 8 bản CÓ DẤU mới nhất; bản khuôn KHÔNG dấu (bản tay) không bao giờ bị đụng", () => {
  const { root, goc } = dungGoc();
  try {
    for (let i = 1; i <= 10; i++) taoBan(goc, `2026110${1 + Math.floor(i / 10)}T0${String(i % 10).padStart(5, "0")}Z`);
    mkdirSync(join(goc, "20261001T000000Z")); // khuôn UTC KHÔNG dấu — bản tay cũ hơn cả 10 bản job
    writeFileSync(join(goc, "20261001T000000Z", "quy-gia.dump"), "bản tay quý giá");
    const r = spawnSync("bash", [XOAY, goc, "8"], { encoding: "utf8" });
    assert.equal(r.status, 0, `lib xoay thoát 0 — stderr=${r.stderr}`);
    const con = readdirSync(goc).filter((d) => KHUON.test(d)).sort();
    assert.equal(con.length, 9, `10 khuôn (9 có dấu + 1 không dấu): xoá 1 có dấu cũ nhất, giữ 8 có dấu mới + bản không dấu — thực tế ${con.length}`);
    assert.ok(existsSync(join(goc, "20261001T000000Z", "quy-gia.dump")), "bản tay KHÔNG dấu không bị đụng");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CA ĐỎ SLLT-2: đột biến lib bỏ kiểm dấu → xoá nhầm bản khuôn KHÔNG dấu cũ nhất → đỏ; lib thật không đụng", () => {
  const gocLib = readFileSync(XOAY, "utf8");
  const dotBien = gocLib.split("  [ -f \"$d/.tao-boi-job-tuan\" ] || continue # d\u1ea5u job \u2014 b\u1ea3n tay/ch\u1ea1y tay kh\u00f4ng c\u00f3\n").join(""); // gỡ DÒNG kiểm dấu — mọi thư mục khuôn đều bị đếm
  assert.notEqual(dotBien, gocLib, "đột biến không khớp mã thật — ca đỏ mất chiều");
  const root = mkdtempSync(join(tmpdir(), "sao-luu-dot-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  try {
    for (let i = 1; i <= 9; i++) taoBan(goc, TEN_KHUON(i)); // 9 bản CÓ dấu
    mkdirSync(join(goc, "20261001T000000Z")); // khuôn KHÔNG dấu, cũ nhất — lib thật phải giữ
    const viLib = join(root, "lib-dot-bien.sh");
    writeFileSync(viLib, dotBien);
    const rDot = spawnSync("bash", [viLib, goc, "8"], { encoding: "utf8" });
    assert.equal(rDot.status, 0);
    assert.ok(!existsSync(join(goc, "20261001T000000Z")), "bản đột biến XOÁ nhầm bản khuôn không dấu → ca này chứng lib thật phải kiểm dấu");
    // lib THẬT chạy trên cây GIỐNG HỆT dựng riêng (cây trên đã mất bản không dấu)
    const goc2 = join(root, "db2");
    mkdirSync(goc2, { recursive: true });
    for (let i = 1; i <= 9; i++) taoBan(goc2, `20261101T0000${String(i).padStart(3, "0")}Z`);
    mkdirSync(join(goc2, "20261001T000000Z"));
    spawnSync("bash", [XOAY, goc2, "8"], { encoding: "utf8" });
    assert.ok(existsSync(join(goc2, "20261001T000000Z")), "lib thật KHÔNG đụng bản khuôn không dấu");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SLLT-3 wrapper: dump-giả THOÁT LỖI → wrapper thoát ≠0, không xoay gì", () => {
  const { root, goc } = dungGoc();
  const dumpLoi = join(root, "dump-loi.sh");
  writeFileSync(dumpLoi, "#!/bin/bash\necho 'FAIL dump giả' >&2\nexit 7\n");
  try {
    const r = spawnSync("bash", [WRAPPER], {
      encoding: "utf8",
      env: { ...process.env, SAO_LUU_LENH: dumpLoi, DB_BACKUP_ROOT: goc },
    });
    assert.notEqual(r.status, 0, `dump lỗi → thoát khác 0 — thực tế ${r.status}`);
    const con = readdirSync(goc).filter((d) => KHUON.test(d));
    assert.ok(con.every((d) => !existsSync(join(goc, d, "manifest.sha256"))), "dump lỗi → không bản nào hoàn tất (thư mục DICH rỗng do wrapper mkdir trước)");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SLLT-4 wrapper: dump-giả OK → nhận đúng thư mục bản $1 + DB_SAO_LUU_CHI mặc định 'oneinvest' + tệp dấu + xoay chạy", () => {
  const { root, goc } = dungGoc();
  const dumpOk = join(root, "dump-ok.sh");
  // dump-giả: tạo bản trong $1, ghi giá trị DB_SAO_LUU_CHI nhận được vào tệp riêng để assert
  writeFileSync(
    dumpOk,
    `#!/bin/bash\nset -e\necho "$DB_SAO_LUU_CHI" > "$1/db_sao_luu_chi_nhan.txt"\necho "dump moi" > "$1/oneinvest.dump"\n( cd "$1" && shasum -a 256 $(ls | grep -v '^manifest.sha256$') > manifest.sha256 )\n`,
  );
  for (let i = 1; i <= 9; i++) taoBan(goc, TEN_KHUON(i));
  try {
    const r = spawnSync("bash", [WRAPPER], {
      encoding: "utf8",
      env: { ...process.env, SAO_LUU_LENH: dumpOk, DB_BACKUP_ROOT: goc },
    });
    assert.equal(r.status, 0, `wrapper thoát 0 — stderr=${r.stderr}`);
    const banMoi = readdirSync(goc).filter((d) => KHUON.test(d) && existsSync(join(goc, d, "db_sao_luu_chi_nhan.txt")));
    assert.equal(banMoi.length, 1, "đúng một bản mới có tệp dấu của job");
    assert.equal(readFileSync(join(goc, banMoi[0], "db_sao_luu_chi_nhan.txt"), "utf8").trim(), "oneinvest", "dump nhận đúng DB_SAO_LUU_CHI mặc định 'oneinvest' (job tuần chỉ dump DB chính + globals)");
    const c = spawnSync("shasum", ["-a", "256", "-c", "manifest.sha256", "--status"], { cwd: join(goc, banMoi[0]) });
    assert.equal(c.status, 0, "manifest khớp");
    const con = readdirSync(goc).filter((d) => KHUON.test(d)).sort();
    assert.equal(con.length, 8, "9 bản cũ + 1 mới = 10 khuôn → xoay giữ 8 mới nhất (bản mới + 7 cũ có dấu); 2 cũ nhất bị bỏ — thực tế " + con.length);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SLLT-5 SAO_LUU_XOAY_THU=1: chỉ in «SẼ XOÁ», KHÔNG xoá bản nào", () => {
  const { root, goc } = dungGoc();
  const dumpOk = join(root, "dump-ok.sh");
  writeFileSync(dumpOk, "#!/bin/bash\nset -e\nmkdir -p \"$1\"\necho dump > \"$1/oneinvest.dump\"\n");
  for (let i = 1; i <= 10; i++) taoBan(goc, TEN_KHUON(i));
  try {
    const r = spawnSync("bash", [WRAPPER], {
      encoding: "utf8",
      env: { ...process.env, SAO_LUU_LENH: dumpOk, DB_BACKUP_ROOT: goc, SAO_LUU_XOAY_THU: "1" },
    });
    assert.equal(r.status, 0, `thoát 0 — stderr=${r.stderr}`);
    assert.match(r.stdout, /SẼ XOÁ \(chạy thử, chưa xoá\)/, "in danh sách sẽ xoá");
    const con = readdirSync(goc).filter((d) => KHUON.test(d));
    assert.ok(con.length >= 10, `chế độ thử KHÔNG xoá — 10 bản cũ + 1 bản mới vẫn còn (thực tế ${con.length})`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

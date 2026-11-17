// db-sao-luu-tuan.test.mjs — test job sao lưu tuần DB trên máy (1711-15).
// CHẠY LẺ: node --test scripts/db-sao-luu-tuan.test.mjs
// KHÔNG đụng DB thật, KHÔNG docker: dump thay bằng SAO_LUU_LENH giả trong thư mục
// tạm. POSIX thuần (không stat -f/date -j); shasum là Perl core, có trên ubuntu-latest
// của CI — xanh cả linux.
// Ca: (1) lib xoay giữ đúng 8 khuôn UTC mới nhất, KHÔNG đụng thư mục không khớp
// khuôn («truoc-…» tạo tay); (2) CA ĐỎ: đột biến lib bỏ kiểm dấu → xoá nhầm thư mục
// tay → đỏ; (3) wrapper dump-giả lỗi → thoát ≠0, không xoay; (4) wrapper dump-giả
// ok → xoay chạy, bản thừa bị bỏ.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRAPPER = join(REPO, "scripts", "db-sao-luu-tuan.sh");
const XOAY = join(REPO, "scripts", "lib", "db-sao-luu-xoay.sh");

const KHUON = (i) => `2026110${1 + Math.floor(i / 10)}T0${String(i % 10).padStart(5, "0")}Z`;

const dungGoc = (soKhuon = 10) => {
  const root = mkdtempSync(join(tmpdir(), "sao-luu-tuan-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  for (let i = 0; i < soKhuon; i++) {
    const d = join(goc, KHUON(i));
    mkdirSync(d);
    writeFileSync(join(d, "oneinvest.dump"), `dump ${i}`);
    writeFileSync(join(d, "manifest.sha256"), `tệp giả ${i}\n`);
  }
  mkdirSync(join(goc, "truoc-khoi-dong-tay")); // bản tay — KHÔNG khớp khuôn
  writeFileSync(join(goc, "truoc-khoi-dong-tay", "quy-gia.dump"), "bản tay quý giá");
  return { root, goc };
};

test("SLLT-1 xoay: giữ đúng 8 khuôn UTC mới nhất, thư mục tay «truoc-…» còn nguyên", () => {
  const { root, goc } = dungGoc(10);
  try {
    const r = spawnSync("bash", [XOAY, goc, "8"], { encoding: "utf8" });
    assert.equal(r.status, 0, `lib xoay thoát 0 — stderr=${r.stderr}`);
    const con = readdirSync(goc).sort();
    const khuonCon = con.filter((d) => /^[0-9]{8}T[0-9]{6}Z$/.test(d));
    assert.equal(khuonCon.length, 8, `còn đúng 8 bản khuôn — thực tế ${khuonCon.length}: ${khuonCon.join(",")}`);
    assert.ok(!existsSync(join(goc, KHUON(0))), "bản cũ nhất bị xoá");
    assert.ok(existsSync(join(goc, KHUON(9))), "bản mới nhất còn");
    assert.ok(existsSync(join(goc, "truoc-khoi-dong-tay", "quy-gia.dump")), "thư mục tay KHÔNG bị đụng");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CA ĐỎ SLLT-2: đột biến lib bỏ kiểm dấu (grep mọi tên) → xoá nhầm thư mục tay → đỏ; lib thật không đụng tay", () => {
  const gocLib = readFileSync(XOAY, "utf8");
  const dotBien = gocLib.replace("-E '^[0-9]{8}T[0-9]{6}Z$'", "-E '.'"); // grep mọi tên — mất kiểm dấu
  assert.notEqual(dotBien, gocLib, "đột biến không khớp mã thật — ca đỏ mất chiều");
  const root = mkdtempSync(join(tmpdir(), "sao-luu-dot-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  try {
    // 8 bản khuôn (đúng đủ số giữ) + thư mục tay '0000-…' — byte đầu nhỏ hơn '2'
    // nên sort -r (LC_ALL=C) xếp tay CUỐI danh sách: mất lọc khuôn thì tay rơi vào
    // phần bị xoá; có lọc khuôn thì tay không bao giờ vào danh sách.
    for (let i = 0; i < 8; i++) mkdirSync(join(goc, KHUON(i)));
    mkdirSync(join(goc, "0000-ban-tay-gia"));
    writeFileSync(join(goc, "0000-ban-tay-gia", "quy-gia.dump"), "bản tay quý giá");
    const viLib = join(root, "lib-dot-bien.sh");
    writeFileSync(viLib, dotBien);
    const r = spawnSync("bash", [viLib, goc, "8"], { encoding: "utf8" });
    assert.equal(r.status, 0, `bản đột biến thoát 0 — stderr=${r.stderr}`);
    assert.ok(!existsSync(join(goc, "0000-ban-tay-gia")), "bản đột biến XOÁ nhầm thư mục tay → ca này chứng lib thật phải kiểm dấu");
    // lib THẬT chạy trên cây GIỐNG HỆT dựng riêng (cây trên đã mất tay do đột biến)
    const goc2 = join(root, "db2");
    mkdirSync(goc2, { recursive: true });
    for (let i = 0; i < 8; i++) mkdirSync(join(goc2, KHUON(i)));
    mkdirSync(join(goc2, "0000-ban-tay-gia"));
    writeFileSync(join(goc2, "0000-ban-tay-gia", "quy-gia.dump"), "bản tay quý giá");
    spawnSync("bash", [XOAY, goc2, "8"]);
    assert.ok(existsSync(join(goc2, "0000-ban-tay-gia", "quy-gia.dump")), "lib thật KHÔNG đụng thư mục tay");
    assert.equal(readdirSync(goc2).filter((d) => /^[0-9]{8}T[0-9]{6}Z$/.test(d)).length, 8, "lib thật giữ đủ 8 khuôn");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SLLT-3 wrapper: dump-giả THOÁT LỖI → wrapper thoát ≠0, không xoay gì", () => {
  const root = mkdtempSync(join(tmpdir(), "sao-luu-err-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  const dumpLoi = join(root, "dump-loi.sh");
  writeFileSync(dumpLoi, "#!/bin/bash\necho 'FAIL dump giả' >&2\nexit 7\n");
  try {
    const r = spawnSync("bash", [WRAPPER], {
      encoding: "utf8",
      env: { ...process.env, SAO_LUU_LENH: dumpLoi, DB_BACKUP_ROOT: goc },
    });
    assert.notEqual(r.status, 0, `dump lỗi → thoát khác 0 — thực tế ${r.status}`);
    const con = readdirSync(goc).filter((d) => /^[0-9]{8}T[0-9]{6}Z$/.test(d));
    assert.equal(con.length, 0, "không có bản nào được tạo/xoay khi dump lỗi");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("SLLT-4 wrapper: dump-giả OK tạo bản khuôn → xoay chạy, bản thừa bị bỏ, manifest khớp", () => {
  const root = mkdtempSync(join(tmpdir(), "sao-luu-ok-"));
  const goc = join(root, "db");
  mkdirSync(goc, { recursive: true });
  // 9 bản cũ + dump-giả tạo bản mới hôm nay (khuôn giờ thật) có manifest khớp
  const gio = new Date();
  const khuanMoi = gio.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  for (let i = 0; i < 9; i++) {
    const d = join(goc, KHUON(i));
    mkdirSync(d);
    writeFileSync(join(d, "oneinvest.dump"), `dump ${i}`);
    writeFileSync(join(d, "manifest.sha256"), `tệp giả ${i}\n`);
  }
  const dumpOk = join(root, "dump-ok.sh");
  writeFileSync(
    dumpOk,
    `#!/bin/bash\nset -e\nD="$DB_BACKUP_ROOT/${khuanMoi}"\nmkdir -p "$D"\necho "dump moi" > "$D/oneinvest.dump"\n( cd "$D" && shasum -a 256 $(ls | grep -v '^manifest.sha256$') > manifest.sha256 )\n`,
  );
  try {
    const r = spawnSync("bash", [WRAPPER], {
      encoding: "utf8",
      env: { ...process.env, SAO_LUU_LENH: dumpOk, DB_BACKUP_ROOT: goc },
    });
    assert.equal(r.status, 0, `wrapper thoát 0 — stderr=${r.stderr}`);
    const khuonCon = readdirSync(goc).filter((d) => /^[0-9]{8}T[0-9]{6}Z$/.test(d)).sort();
    assert.equal(khuonCon.length, 8, `giữ 8 bản sau xoay (9 cũ + 1 mới − 1 thừa) — thực tế ${khuonCon.length}`);
    assert.ok(khuonCon.includes(khuanMoi), "bản mới nhất còn");
    const c = spawnSync("shasum", ["-a", "256", "-c", "manifest.sha256", "--status"], {
      cwd: join(goc, khuanMoi),
    });
    assert.equal(c.status, 0, "manifest của bản mới khớp (audit-all dùng đúng kiểm này)");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

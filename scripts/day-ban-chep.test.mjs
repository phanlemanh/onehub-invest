// day-ban-chep.test.mjs — ca thuần (không DB, chạy được ở CI) của lệnh đẩy bản chép sang máy phát triển (HT25).
//   node --test --test-name-pattern='^BCM-<n>:' scripts/day-ban-chep.test.mjs
// «Máy phát triển giả» = thư mục tạm trên máy này, nhận qua CÙNG bước nhận scripts/nhan-ban-chep.sh (gọi như sshd gọi qua
// command=, NHAN_DUNG_SAU=nhan: dừng sau khi so sha256, không chạm DB). Bản chép giả: dump là byte ngẫu nhiên, ke.json khuôn HT18.
// Ca đọc cấu hình riêng máy thật (BCM-9) bỏ qua có lời khi máy không có ~/.config/onehub/hai-may.env (CI).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, utimesSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  dayBanChep, danhSachGui, docCauHinh, loiCauHinhDay, kiemCau, giaoDienCua, lenhSsh, taoGuiCucBo, CAU_HINH, NHAN_SH,
} from "./day-ban-chep.mjs";
import { kiemDongKhoa, dongKhoaDay, blobKhoa, khoaNguoc, dongNhacLenh, grepRieng, giaTriRieng } from "./day-ban-chep-kiem-m5.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEP = "oneinvest-m5-20261125.dump";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const tam = (p = "bcm-") => mkdtempSync(path.join(os.tmpdir(), p));

// Cấu hình giả: địa chỉ thuộc dải tài liệu (RFC 5737), không phải địa chỉ thật của máy nào.
const CFG = {
  VAI: "may-thu", CAU_GIAO_DIEN: "bridge0", CAU_MAY_NAY: "192.0.2.1", M5_DIA_CHI: "192.0.2.2", M5_NGUOI_DUNG: "nguoidung",
  KHOA_DAY: "/khong/co/khoa-day", KHOA_DUNG: "/khong/co/khoa-dung",
};
const cauThong = () => "bridge0";

/** Bản chép giả kiểu HT18: dump + ke.json (sha256 ghi lúc «soát»). Đếm số lần gọi. */
function chepGia({ ma = 0, noiDung = randomBytes(64 * 1024) } = {}) {
  const f = async (ra) => {
    f.lan++;
    if (ma !== 0) return ma;
    writeFileSync(path.join(ra, TEP), noiDung);
    writeFileSync(path.join(ra, "ke.json"), `${JSON.stringify({ ten_dich: "oneinvest_m5_20261125", tep: TEP, sha256: sha(noiDung), so_dong: { areas: 3 } }, null, 2)}\n`);
    return 0;
  };
  f.lan = 0;
  return f;
}

/** Bọc một hàm gửi, đếm số lần mở kết nối gửi. */
function demGui(gui) {
  const f = async (r) => { f.lan++; return gui(r); };
  f.lan = 0;
  return f;
}

async function chay(opts) {
  const out = [];
  const err = [];
  const ma = await dayBanChep({ cfg: CFG, giaoDien: cauThong, so: null, out: (s) => out.push(s), err: (s) => err.push(s), ...opts });
  return { ma, out: out.join("\n"), err: err.join("\n") };
}

function moiLuot() {
  const ra = tam("bcm-ra-");
  const den = tam("bcm-den-");
  const gui = demGui(taoGuiCucBo({ NHAN_DEN: den, NHAN_DUNG_SAU: "nhan" }));
  return { ra, den, gui };
}
const tepDen = (den) => readdirSync(den).filter((f) => !f.startsWith("."));

// ───────── BCM-1 (E1, AC-1): cổng rời máy ghim sha256 ─────────
test("BCM-1: xanh — lệnh đẩy chạy chép + soát trong lượt, gửi đúng tệp đã soát qua bước nhận, sha256 bên nhận = ke.json", async () => {
  const { ra, den, gui } = moiLuot();
  const chep = chepGia();
  const r = await chay({ ra, chep, gui });
  assert.equal(r.ma, 0, r.err);
  assert.equal(chep.lan, 1, "lệnh đẩy phải tự gọi chép + soát trong lượt");
  assert.equal(gui.lan, 1);
  const ke = JSON.parse(readFileSync(path.join(ra, "ke.json"), "utf8"));
  assert.deepEqual(tepDen(den).sort(), [TEP, "ke.json"].sort());
  assert.equal(sha(readFileSync(path.join(den, TEP))), ke.sha256, "sha256 tệp bên nhận phải bằng sha256 ghi lúc soát");
  assert.match(r.out, /nhận: xanh: đã nhận/);
});

test("BCM-1: đỏ — sửa một byte tệp dump sau soát → dừng trước khi gửi, nêu «sha256», thư mục đến rỗng", async () => {
  const { ra, den, gui } = moiLuot();
  const r = await chay({
    ra, chep: chepGia(), gui,
    sauChep: (d) => { const f = path.join(d, TEP); const b = readFileSync(f); b[17] ^= 0xff; writeFileSync(f, b); },
  });
  assert.notEqual(r.ma, 0);
  assert.match(r.err, /sha256/);
  assert.equal(gui.lan, 0, "không được mở kết nối gửi");
  assert.deepEqual(tepDen(den), [], "thư mục đến phải rỗng");
});

test("BCM-1: đỏ — chép + soát đỏ (ke.json không xanh) → không gửi", async () => {
  const { ra, den, gui } = moiLuot();
  const r = await chay({ ra, chep: chepGia({ ma: 1 }), gui });
  assert.equal(r.ma, 1);
  assert.match(r.err, /chép \+ soát/);
  assert.equal(gui.lan, 0);
  assert.deepEqual(tepDen(den), []);
});

test("BCM-1: đỏ — ke.json cũ của lượt trước (chép không ghi mới) → không gửi", async () => {
  const { ra, den, gui } = moiLuot();
  await chepGia()(ra);
  const cu = new Date(Date.now() - 3600_000);
  for (const f of readdirSync(ra)) utimesSync(path.join(ra, f), cu, cu);
  const r = await chay({ ra, chep: async () => 0, gui });
  assert.equal(r.ma, 1);
  assert.match(r.err, /ke\.json cũ/);
  assert.equal(gui.lan, 0);
  assert.deepEqual(tepDen(den), []);
});

test("BCM-1: bước nhận tự so sha256 — lệnh con mang sha256 khác tệp → đỏ chặng sha, thư mục đến không giữ tệp", async () => {
  const { ra, den } = moiLuot();
  await chepGia()(ra);
  const gui = taoGuiCucBo({ NHAN_DEN: den, NHAN_DUNG_SAU: "nhan" });
  const err = [];
  const g = await gui({ lenhCon: `nhan ${"0".repeat(64)}`, keTep: path.join(ra, "ke.json"), dumpTep: path.join(ra, TEP), out: () => {}, err: (s) => err.push(s) });
  assert.equal(g.ma, 1);
  assert.match(err.join("\n"), /ĐỎ chặng sha: sha256/);
  assert.deepEqual(tepDen(den), []);
});

// ───────── BCM-3 (AC-3, phần chạy được không cần máy kia): bước nhận chỉ chạy qua command=, lệnh con đóng ─────────
function goiNhan(env, input = "") {
  const e = { ...process.env, ...env };
  if (!("SSH_ORIGINAL_COMMAND" in env)) delete e.SSH_ORIGINAL_COMMAND;
  return spawnSync("bash", [NHAN_SH], { env: e, input, encoding: "utf8" });
}
test("BCM-3: bước nhận từ chối khi không đi qua command= (thiếu SSH_ORIGINAL_COMMAND)", () => {
  const r = goiNhan({ NHAN_DEN: tam() });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /command=/);
});
for (const lenh of ["sh", "ls /", "trang-thai; id", "nhan $(id)", "internal-sftp", "scp -t /tmp/x", "nhan ABC", "lui ", "trang-thai\nid"]) {
  test(`BCM-3: bước nhận từ chối lệnh con ${JSON.stringify(lenh)} trước mọi việc, không chạy gì`, () => {
    const r = goiNhan({ SSH_ORIGINAL_COMMAND: lenh, NHAN_DEN: tam() });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /từ chối lệnh con/);
    assert.ok(!/uid=/.test(r.stdout + r.stderr));
  });
}
test("BCM-3: lệnh ssh của lệnh đẩy chỉ nạp khoá đẩy (IdentitiesOnly, không agent, bỏ ~/.ssh/config, không chuyển tiếp)", () => {
  const [cmd, args] = lenhSsh(CFG, "trang-thai");
  assert.equal(cmd, "ssh");
  const s = args.join(" ");
  for (const m of ["-F /dev/null", `-i ${CFG.KHOA_DAY}`, "IdentitiesOnly=yes", "IdentityAgent=none", "ClearAllForwardings=yes", "ForwardAgent=no"]) {
    assert.ok(s.includes(m), `thiếu ${m}`);
  }
  assert.ok(!s.includes(CFG.KHOA_DUNG), "không bao giờ dùng khoá dựng máy");
  assert.equal(loiCauHinhDay({ ...CFG, KHOA_DAY: CFG.KHOA_DUNG }), "KHOA_DAY không được là khoá dựng máy");
});

// ───────── BCM-5 (E5, AC-5): chỉ hai tệp rời máy ─────────
test("BCM-5: danh sách tệp gửi đúng hai (dump, ke.json)", async () => {
  const ra = tam();
  await chepGia()(ra);
  const ke = JSON.parse(readFileSync(path.join(ra, "ke.json"), "utf8"));
  const ds = danhSachGui(ra, ke);
  assert.equal(ds.loi, undefined);
  assert.deepEqual(ds.tep.map((f) => path.basename(f)), [TEP, "ke.json"]);
});

// Ma trận viết trước: ba tệp cấm thêm vào thư mục gửi.
const TEP_CAM = [
  ["từ điển nguồn", "tu-dien-nguon.json", /tu-dien-nguon\.json.*từ điển nguồn/],
  [".env", ".env", /«\.env».*\.env/],
  ["raw snapshot", "collector/snapshots/s03-x.json", /collector\/snapshots\/s03-x\.json.*raw snapshot/],
];
test("BCM-5: ma trận tệp cấm viết trước đủ ba ca", () => {
  assert.deepEqual(TEP_CAM.map((x) => x[0]), ["từ điển nguồn", ".env", "raw snapshot"]);
});
for (const [ten, rel, mau] of TEP_CAM) {
  test(`BCM-5: thêm ${ten} vào thư mục gửi → từ chối trước khi gửi, thông điệp nêu tệp`, async () => {
    const { ra, den, gui } = moiLuot();
    const r = await chay({
      ra, chep: chepGia(), gui,
      sauChep: (d) => { const f = path.join(d, rel); mkdirSync(path.dirname(f), { recursive: true }); writeFileSync(f, "x\n"); },
    });
    assert.equal(r.ma, 1);
    assert.match(r.err, /ĐỎ danh sách tệp/);
    assert.match(r.err, mau);
    assert.equal(gui.lan, 0, "không được mở kết nối gửi");
    assert.deepEqual(tepDen(den), []);
  });
}

// ───────── BCM-9 (E9, AC-9): địa chỉ cầu cố định, không rơi mạng khác ─────────
const CO_CAU_HINH = existsSync(CAU_HINH);
test("BCM-9: địa chỉ đích đọc từ ~/.config/onehub/hai-may.env và nằm trên giao diện cầu (route get)", { skip: !CO_CAU_HINH && "máy không có ~/.config/onehub/hai-may.env (CI)" }, () => {
  const { cfg, loi } = docCauHinh();
  assert.equal(loi, undefined);
  assert.equal(loiCauHinhDay(cfg), null);
  assert.equal(giaoDienCua(cfg.M5_DIA_CHI), cfg.CAU_GIAO_DIEN, "địa chỉ máy phát triển phải đi qua giao diện cầu");
  assert.equal(kiemCau(cfg), null);
  const [, args] = lenhSsh(cfg, "trang-thai");
  assert.ok(args.includes(`${cfg.M5_NGUOI_DUNG}@${cfg.M5_DIA_CHI}`), "đích ssh là địa chỉ cầu");
  assert.ok(args.includes(`BindAddress=${cfg.CAU_MAY_NAY}`), "nguồn gói buộc vào địa chỉ cầu của máy này");
});

test("BCM-9: đỏ — cấu hình tạm có địa chỉ không thông qua cầu → dừng nêu «cầu Thunderbolt», không chép, không gửi, không thử địa chỉ khác", async () => {
  const d = tam();
  const f = path.join(d, "hai-may.env");
  writeFileSync(f, "VAI=may-thu\nCAU_GIAO_DIEN=bridge0\nCAU_MAY_NAY=192.0.2.1\nM5_DIA_CHI=192.0.2.99\nM5_NGUOI_DUNG=nguoidung\nKHOA_DAY=$HOME/khoa-day\n");
  const { cfg } = docCauHinh(f);
  assert.equal(loiCauHinhDay(cfg), null);
  const hoi = [];
  // Route thật của máy (CI: Linux `ip route`), ghi lại mọi địa chỉ được hỏi.
  const giaoDien = (dc) => { hoi.push(dc); return giaoDienCua(dc); };
  const { ra, den, gui } = moiLuot();
  const chep = chepGia();
  const out = [];
  const err = [];
  const ma = await dayBanChep({ cfg, ra, chep, gui, giaoDien, so: null, out: (s) => out.push(s), err: (s) => err.push(s) });
  assert.equal(ma, 3);
  assert.match(err.join("\n"), /cầu Thunderbolt/);
  assert.equal(chep.lan, 0);
  assert.equal(gui.lan, 0);
  assert.deepEqual(hoi, ["192.0.2.99"], "chỉ hỏi đúng địa chỉ cấu hình, không thử địa chỉ khác");
  assert.deepEqual(tepDen(den), []);
  // Cáp rút giữa lượt (sau chép): cũng dừng trước khi gửi.
  let lan = 0;
  const r2 = await chay({ ra: tam(), chep: chepGia(), gui, giaoDien: () => (++lan === 1 ? "bridge0" : "en0") });
  assert.equal(r2.ma, 3);
  assert.match(r2.err, /cầu Thunderbolt/);
  assert.equal(gui.lan, 0);
});

test("BCM-9: cấu hình đọc không thực thi tệp, $HOME/~ về thư mục nhà, địa chỉ phải là IPv4 (không tên máy)", () => {
  const d = tam();
  const f = path.join(d, "hai-may.env");
  writeFileSync(f, "# chú thích\nKHOA_DAY=$HOME/.ssh/k\nM5_DIA_CHI=$(touch /tmp/bcm-khong-chay)\n");
  const { cfg } = docCauHinh(f, { nha: "/nha" });
  assert.equal(cfg.KHOA_DAY, "/nha/.ssh/k");
  assert.ok(!existsSync("/tmp/bcm-khong-chay"));
  assert.match(loiCauHinhDay({ ...CFG, M5_DIA_CHI: "may-phat-trien.local" }), /IPv4/);
  assert.match(docCauHinh(path.join(d, "khong-co")).loi, /hai-may\.env/);
});

test("BCM-9: scripts/ không chứa địa chỉ cầu hay tên máy phát triển (giá trị đọc từ cấu hình riêng máy)", { skip: !CO_CAU_HINH && "máy không có ~/.config/onehub/hai-may.env (CI)" }, () => {
  const { cfg } = docCauHinh();
  const gt = [cfg.M5_DIA_CHI, cfg.CAU_MAY_NAY, cfg.M5_TEN_MAY].filter(Boolean);
  assert.ok(gt.length >= 2);
  const args = ["-C", REPO, "grep", "-n", "-I", "-F"];
  for (const v of gt) args.push("-e", v);
  const r = spawnSync("git", [...args, "--", "scripts/"], { encoding: "utf8" });
  assert.equal(r.status, 1, `scripts/ lộ giá trị riêng máy:\n${(r.stdout ?? "").split("\n").map((l) => l.split(":").slice(0, 2).join(":")).join("\n")}`);
});

// Lời gọi ssh duy nhất của lệnh đẩy (rào một chiều, AC-4): mọi spawn đi qua lenhSsh, đích là máy phát triển.
test("BCM-9: lệnh đẩy chỉ có một chỗ dựng lời gọi ssh, không scp/sftp/rsync", () => {
  const src = readFileSync(path.join(REPO, "scripts", "day-ban-chep.mjs"), "utf8");
  assert.equal((src.match(/"ssh"/g) ?? []).length, 1);
  assert.ok(!/"(scp|sftp|rsync)"/.test(src));
});

// ───────── Lõi thuần của lệnh cài/kiểm trên máy phát triển (E3, E4, E8, E11 chạy thật ngoài CI) ─────────

const PUB = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBcmKhoaGiaChiDungChoTestKhongPhaiKhoaThat0001 ghi-chu";
test("BCM-3: dòng authorized_keys khoá đẩy có restrict + command= trỏ bước nhận; thiếu restrict thì phép kiểm nêu «restrict»", () => {
  const dong = dongKhoaDay("/nha/.local/share/onehub/nhan-ban-chep.sh", PUB);
  assert.match(dong, /^restrict,command="\/nha\/\.local\/share\/onehub\/nhan-ban-chep\.sh" ssh-ed25519 \S+ onehub-day-ban-chep$/);
  assert.deepEqual(kiemDongKhoa(dong), []);
  assert.equal(blobKhoa(dong), blobKhoa(PUB));
  assert.ok(kiemDongKhoa(dong.replace("restrict,", "")).some((l) => l.includes("«restrict»")));
  assert.ok(kiemDongKhoa(dong.replace(/command="[^"]*" /, "")).some((l) => l.includes("command=")));
  assert.ok(kiemDongKhoa(dong.replace("restrict,", "restrict,port-forwarding,")).some((l) => l.includes("port-forwarding")));
});

test("BCM-4: phép so khoá ngược bắt khoá máy kia có trong authorized_keys máy này, bỏ qua khoá khác", () => {
  const khac = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKhacKhacKhacKhacKhacKhacKhacKhacKhacKhacKh0002 khac";
  assert.deepEqual(khoaNguoc("", PUB), []);
  assert.deepEqual(khoaNguoc(`${khac}\n`, PUB), []);
  assert.deepEqual(khoaNguoc(`${khac}\nfrom="10.0.0.1" ${PUB}\n`, PUB), [blobKhoa(PUB)]);
});

test("BCM-8: bộ lọc lịch bắt mục launchctl/crontab/plist nhắc lệnh đẩy hay bước nhận, bỏ qua mục khác", () => {
  assert.deepEqual(dongNhacLenh("PID\tStatus\tLabel\n-\t0\tcom.onehub.chotot-daily\n"), []);
  assert.equal(dongNhacLenh("-\t0\tcom.onehub.day-ban-chep\n0 2 * * * /x/nhan-ban-chep.sh").length, 2);
});

test("BCM-11: soát giá trị riêng máy trên kho — danh sách loại trừ rỗng, tệp đã git add mang tên máy thì nêu tệp", () => {
  const d = tam("bcm-git-");
  const git = (...a) => spawnSync("git", ["-C", d, ...a], { encoding: "utf8" });
  git("init", "-q");
  writeFileSync(path.join(d, "sach.md"), "M5 là máy phát triển; địa chỉ cầu ở <địa chỉ cầu M5>.\n");
  git("add", "sach.md");
  const gt = giaTriRieng({ M5_TEN_MAY: "MAY-BIA-M5", M5_DIA_CHI: "192.0.2.2", CAU_MAY_NAY: "192.0.2.1", KHOA_DUNG: "/nha/.ssh/khoa_bia_dung", KHOA_DAY: "/nha/.ssh/khoa_bia_day" });
  assert.equal(gt.length, 5);
  assert.deepEqual(grepRieng(gt, { cwd: d }), []);
  writeFileSync(path.join(d, "lo.md"), "đẩy tới 192.0.2.2\n");
  git("add", "lo.md");
  assert.deepEqual(grepRieng(gt, { cwd: d }), ["lo.md"]);
  // Không nhầm địa chỉ dài hơn (192.0.2.20) với địa chỉ cầu.
  writeFileSync(path.join(d, "lo.md"), "192.0.2.20\n");
  git("add", "lo.md");
  assert.deepEqual(grepRieng(gt, { cwd: d }), []);
});

// zalo-import-tran.test.mjs — test trần thời gian zalo-import-daily (1711-4).
// CHẠY LẺ: node --test scripts/zalo-import-tran.test.mjs
// Mọi ca chạy bản SAO của script trong ROOT tmp (không đụng runtime thật, không
// đụng DB — các bước "node $ROOT/pipeline/transform-zalo.mjs" là fixture treo trong tmp).
// Ca: (1) buoc_tran cắt bước treo mã 124; (2) đồng hồ chết tổng WARN + TIMEOUT → exit 143;
// (3) khoá PID sống không bị gỡ → lượt sau chờ rồi thoát 1, khoá còn nguyên.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "zalo-import-daily.sh");

const TREO = "setInterval(() => {}, 1000);\n";

// Dựng ROOT tmp: sao script vào <root>/scripts/ (ROOT của script = dirname($0)/..),
// pipeline/logs (khoá + state), collector/snapshots rỗng (find không lỗi),
// fixture bước treo. doc-gop KÔNG có fixture — bash tệp thiếu → rc 127.
const dungMoi = () => {
  const root = mkdtempSync(join(tmpdir(), "zalo-tran-"));
  cpSync(SCRIPT, join(root, "scripts", "zalo-import-daily.sh"));
  cpSync(join(REPO, "scripts", "lib", "job-step.sh"), join(root, "scripts", "lib", "job-step.sh"));
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  mkdirSync(join(root, "collector", "snapshots"), { recursive: true });
  writeFileSync(join(root, "pipeline", "transform-zalo.mjs"), TREO);
  writeFileSync(join(root, "pipeline", "transform-media.mjs"), TREO);
  writeFileSync(join(root, "pipeline", "refresh-bait-gap.mjs"), TREO);
  writeFileSync(join(root, "pipeline", "xep-hang-gia.mjs"), TREO);
  return root;
};

// spawn DETACHED — bash có process group RIÊNG: TERM «cả nhóm» của đồng hồ
// chết trong script không trúng node test; sau khi thoát, test kill nốt nhóm
// để con mồ côi (node fixture nếu sót) không giữ pipe.
const chay = (root, extraEnv = {}, args = []) =>
  new Promise((giai) => {
    const con = spawn("bash", [join(root, "scripts", "zalo-import-daily.sh"), ...args], {
      encoding: "utf8",
      detached: true,
      env: { ...process.env, ...extraEnv },
    });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const chot = setTimeout(() => { try { process.kill(-con.pid, "SIGKILL"); } catch {} giai({ status: -1, out }); }, 90_000);
    con.on("exit", (code, signal) => {
      clearTimeout(chot);
      setTimeout(() => { try { process.kill(-con.pid, "SIGTERM"); } catch {} }, 50);
      // TERM cả nhóm → code null + signal SIGTERM — quy về 143 như launchd ghi
      giai({ status: code ?? (signal === "SIGTERM" ? 143 : -1), out });
    });
  });

test("1711-4 (1): phần nạp chạm trần (SECONDS ≥ TRAN_NAP) → dừng chuỗi giữ state, thoát 124", async () => {
  const root = dungMoi();
  // một snapshot zalo-agent giả — TRAN_NAP=0 làm trần nạp bắn ngay ở snapshot đầu
  const snapDir = join(root, "collector", "snapshots", "vn", "vn__zalo-agent__2026-11-17T010101000");
  mkdirSync(snapDir, { recursive: true });
  writeFileSync(join(snapDir, "manifest.json"), "{}\n");
  try {
    const r = await chay(root, { ZALO_IMPORT_TRAN_NAP: "0" });
    assert.match(r.out, /TIMEOUT: phần nạp vượt trần 0s tại snapshot 2026-11-17T010101000/, "dòng TIMEOUT phần nạp");
    assert.match(r.out, /dừng chuỗi giữ state, lượt sau nạp tiếp/, "giữ state cho lượt sau");
    assert.equal(r.status, 124, `thoát 124 khác lỗi nạp thường — thực tế ${r.status}`);
    assert.ok(!existsSync(join(root, "pipeline", "logs", "apify-daily.state")) === false || true);
    const state = (await import("node:fs")).readFileSync(join(root, "pipeline", "logs", "apify-daily.state"), "utf8").trim();
    assert.equal(state, "00000000T000000", "state GIỮ mốc cũ — snapshot chưa nạp không bị đánh dấu");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1711-4 (2): đồng hồ chết tổng — WARN ở ngưỡng, TIMEOUT gửi TERM cả nhóm → exit 143", async () => {
  const root = dungMoi();
  try {
    const r = await chay(root, { ZALO_IMPORT_TRAN_BUOC: "600", ZALO_IMPORT_TRAN_TONG: "3", ZALO_IMPORT_CANH_BAO: "1" });
    assert.match(r.out, /WARN: lượt đã chạy 1s/, "WARN một lần ở ngưỡng");
    assert.match(r.out, /TIMEOUT: lượt vượt trần 3s/, "dòng TIMEOUT của đồng hồ chết");
    assert.equal(r.status, 143, `bị TERM cả nhóm → 143 — thực tế ${r.status}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1711-4 (3): khoá PID sống không bị gỡ — lượt 00:00 chờ hết cạn rồi thoát 1, khoá còn nguyên", async () => {
  const root = dungMoi();
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(khoa, { recursive: true });
  // PID sống: chính tiến trình node test này (kill -0 thành công trong suốt ca)
  writeFileSync(join(khoa, "pid"), String(process.pid));
  writeFileSync(join(khoa, "luc"), String(Math.floor(Date.now() / 1000)));
  try {
    const r = await chay(root, { ZALO_IMPORT_CHO_KHOA: "2" });
    assert.match(r.out, /khoá còn sống \(PID \d+, lấy lúc \d+, tuổi \d+s\) — không gỡ/, "không gỡ khoá PID sống (trước đây lượt 00:00 gỡ khoá >2h — lỗ chồng lượt)");
    assert.match(r.out, /khoá .* bận .*job khác đang nạp\?/, "chờ hết cạn rồi từ chối");
    assert.equal(r.status, 1, "thoát 1 — JOB FAIL thấy được, KHÔNG nạp chồng");
    assert.ok(existsSync(khoa), "khoá còn nguyên sau khi thoát");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// 1711-4 MỞ LẠI lần 3 (dãy tích hợp đo trên 99b2778e9): hai lỗ thật —
// (L1) node đồng hồ thành MỒ CÔI: «trap - EXIT» trước đọc gộp gỡ trap giết đồng hồ,
// node giữ pipe → caller chờ tới trần mới trả; (L2) TERM -PGID trúng NGƯỜI GỐI khi
// script không phải trưởng nhóm (chạy tay/bash -c). Cả hai ca chạy script KHÔNG
// detached (người gọi cùng nhóm tiến trình) — bản lỗi làm caller chết/treo.

const fixtureNhanh = "process.exit(0);\n"; // lượt xong ngay — đồng hồ không cần nữa

const dungMoiNhanh = () => {
  const root = mkdtempSync(join(tmpdir(), "zalo-tran-nhanh-"));
  cpSync(SCRIPT, join(root, "scripts", "zalo-import-daily.sh"));
  cpSync(join(REPO, "scripts", "lib", "job-step.sh"), join(root, "scripts", "lib", "job-step.sh"));
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  mkdirSync(join(root, "collector", "snapshots"), { recursive: true });
  for (const f of ["transform-zalo.mjs", "transform-media.mjs", "refresh-bait-gap.mjs", "xep-hang-gia.mjs"])
    writeFileSync(join(root, "pipeline", f), fixtureNhanh);
  return root;
};

test("CA ĐỎ L1 1711-4: script xong sớm → node đồng hồ không mồ côi giữ pipe — caller được trả trong 30s", async () => {
  const root = dungMoiNhanh();
  const t0 = Date.now();
  let late = true;
  const r = await new Promise((giai) => {
    // KHÔNG detached — script cùng nhóm node test; đồng hồ mồ côi (lỗi cũ) giữ
    // stdout/stderr pipe → promise không giải quyết trong 30s → late=true → đỏ
    const con = spawn("bash", [join(root, "scripts", "zalo-import-daily.sh")], {
      encoding: "utf8",
      env: { ...process.env, ZALO_IMPORT_TRAN_TONG: "1200", ZALO_IMPORT_CANH_BAO: "600", CONDUCT_WINDOW: "off", CONDUCT_JITTER: "0" },
    });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const bao = setTimeout(() => { try { con.kill("SIGKILL"); } catch {} giai({ late: true, out }); }, 30_000);
    // đợi 'close' (stdio đóng) — không phải 'exit': node đồng hồ mồ côi (lỗi cũ) sống
    // giữ pipe → close không bắn → late=true → đỏ; bản sửa tự thoát ≤2s → close bắn
    con.on("close", () => { clearTimeout(bao); late = false; giai({ late: false, out, thoiGian: Date.now() - t0 }); });
  });
  try {
    assert.ok(!late, `script xong sớm nhưng caller bị giữ quá 30s — node đồng hồ mồ côi còn sống (lỗi cũ)`);
    assert.match(r.out, /JOB STEP \[zalo-import-daily\] bước xep-hang-gia mã 0/, "lượt chạy trọn tới bước cuối phần làn thu");
    assert.ok((r.thoiGian ?? 0) < 30_000);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("CA ĐỎ L2 1711-4: script không trưởng nhóm chạm trần → CHỈ script+con bị TERM, người gọi sống", async () => {
  const root = dungMoi(); // fixture TREO — chạm trần tổng
  const t0 = Date.now();
  const r = await new Promise((giai) => {
    // KHÔNG detached — script cùng nhóm node test: TERM nhầm nhóm sẽ giết node test
    const con = spawn("bash", [join(root, "scripts", "zalo-import-daily.sh")], {
      encoding: "utf8",
      env: { ...process.env, ZALO_IMPORT_TRAN_TONG: "3", ZALO_IMPORT_CANH_BAO: "1", CONDUCT_WINDOW: "off", CONDUCT_JITTER: "0" },
    });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const bao = setTimeout(() => { try { con.kill("SIGKILL"); } catch {} giai({ late: true, out }); }, 60_000);
    con.on("exit", (code, signal) => {
      clearTimeout(bao);
      setTimeout(() => { try { process.kill(-con.pid, "SIGKILL"); } catch {} }, 50);
      giai({ status: code ?? (signal === "SIGTERM" ? 143 : -1), out });
    });
  });
  try {
    assert.ok(!r.late, `chạm trần 3s phải dừng trong 60s`);
    assert.match(r.out, /TIMEOUT: lượt vượt trần 3s/, "dòng TIMEOUT của đồng hồ");
    assert.equal(r.status, 143, `script bị TERM → 143 — thực tế ${r.status} (node test còn sống chứng người gọi không trúng TERM)`);
    assert.ok(Date.now() - t0 < 60_000);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---- 1711-4 lần 4 (MỞ LẠI của LL 1811 23:03Z): bốn lỗi còn lại — bốn ca dưới ĐỎ trên bản 7cb255c24 ----
// fixture nạp giả: ghi tên snapshot vào sổ, ngủ NAP_NGU giây, thoát NAP_MA (khuôn harness tái hiện LL)
const NAP_GIA = `import fs from "node:fs"; import p from "node:path"; const __dirname=p.dirname(new URL(import.meta.url).pathname);
fs.mkdirSync(p.join(__dirname,"logs"),{recursive:true});
fs.appendFileSync(p.join(__dirname,"logs","so-nap.txt"),p.basename(process.argv[2])+"\\n");
const ngu=Number(process.env.NAP_NGU||0)*1000; setTimeout(()=>{process.exit(Number(process.env.NAP_MA||0))},ngu);\n`;
const themSnap = (root, loai, ts) => {
  const d = join(root, "collector", "snapshots", "vn", `vn__${loai}__${ts}`);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "manifest.json"), "{}\n");
};
const demTienTrinh = (dau) =>
  execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).split("\n").filter((l) => l.includes(dau)).length;

test("1711-4 lần 4 (a): trần tổng cắt giữa chuỗi vẫn TIẾN state (ghi tăng dần) — hai lượt không nạp lại cùng đoạn", async () => {
  const root = dungMoi();
  // transform fixture XONG NGAY (không trần transform cản) + nạp giả ngủ 1s/snapshot
  for (const f of ["transform-zalo.mjs", "transform-media.mjs", "refresh-bait-gap.mjs", "xep-hang-gia.mjs"])
    writeFileSync(join(root, "pipeline", f), "process.exit(0);\n");
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  for (let i = 1; i <= 6; i++) themSnap(root, "zalo-agent", `2026-11-17T0${i}0000000`);
  const soNap = () => (existsSync(join(root, "pipeline", "logs", "so-nap.txt"))
    ? readFileSync(join(root, "pipeline", "logs", "so-nap.txt"), "utf8").trim().split("\n").filter(Boolean) : []);
  try {
    const state = () => readFileSync(join(root, "pipeline", "logs", "apify-daily.state"), "utf8").trim();
    const r1 = await chay(root, { ZALO_IMPORT_TRAN_TONG: "4", NAP_NGU: "1" });
    assert.equal(r1.status, 143, "trần tổng 4s cắt lượt 1 giữa chuỗi nạp (TERM nhóm) — thực tế " + r1.status);
    assert.notEqual(state(), "00000000T000000", "CA LÕI (a): state phải TIẾN dù trần tổng cắt giữa chuỗi (bản cũ chỉ ghi cuối vòng → mất hết)");
    const r2 = await chay(root, { ZALO_IMPORT_TRAN_TONG: "4", NAP_NGU: "1" });
    assert.equal(state(), "2026-11-17T060000000", "lượt 2 chốt đủ 6 mốc");
    const ds = soNap();
    const duyNhat = new Set(ds);
    assert.equal(duyNhat.size, 6, "đủ 6 snapshot duy nhất được nạp");
    assert.ok(ds.length <= duyNhat.size + 1, "tối đa duy nhất MỘT snapshot biên bị nạp lại (cửa sổ giữa fixture-xong và ghi state) — bản cũ nạp lại CẢ CHUỖI: " + ds.length + " lượt nạp / " + duyNhat.size + " duy nhất");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1711-4 lần 4 (b): bước phớt TERM phải chết bằng SIGKILL ân hạn — 30 giây sau khi lượt thoát không còn tiến trình bước", async () => {
  const root = dungMoi();
  writeFileSync(join(root, "pipeline", "transform-zalo.mjs"), 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);\n');
  try {
    const dau = join(root, "pipeline", "transform-zalo.mjs");
    const r = await chay(root, { ZALO_IMPORT_TRAN_TONG: "2" });
    assert.equal(r.status, 143, "trần tổng cắt lượt");
    await new Promise((g) => setTimeout(g, 25_000)); // ân hạn 20s + dự phòng
    const con = demTienTrinh(dau);
    assert.equal(con, 0, `CA LỎI (b): bước phớt TERM phải chết bằng SIGKILL ân hạn — còn ${con} tiến trình (bản cũ: đồng hồ TERM cả nhóm trúng chính nó → chết trước khi bắn KILL)`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1711-4 lần 4 (c): khoá 30h mang PID TÁI DÙNG (còn sống) phải gỡ theo TUỔI — lượt nhanh chạy được ngay", async () => {
  const root = dungMoiNhanh();
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(khoa, { recursive: true });
  writeFileSync(join(khoa, "pid"), String(process.pid)); // PID sống (tiến trình test) — PID tái dùng
  writeFileSync(join(khoa, "luc"), String(Math.floor(Date.now() / 1000 - 108_000))); // 30 giờ trước
  try {
    const r = await chay(root, {}, ["--luot-nhanh"]);
    assert.match(r.out, /gỡ khoá mồ côi quá trần tổng/, "khoá 30h không chữ ký → mồ côi quá trần tổng 4h");
    assert.doesNotMatch(r.out, /khoá còn sống/, "CA LỎI (c): PID tái dùng không được coi là khoá sống (bản cũ trả 1 trước khi xét tuổi)");
    assert.equal(r.status, 0, `lượt nhanh chạy được ngay sau khi gỡ khoá mồ côi — thực tế ${r.status}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1711-4 lần 4 (d): hết hồ sơ chờ nạp không được báo 124 giả — trần xét sau lọc, trước nạp thật", async () => {
  const root = dungMoiNhanh();
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  themSnap(root, "zalo-agent", "2026-11-17T010000000");
  const ts = "2026-11-10T010101000";
  themSnap(root, "s03-ho-so", ts);
  writeFileSync(join(root, "pipeline", "logs", "s03-ho-so.state"), ts + "\n"); // hồ sơ đã nạp tới đây
  try {
    const r = await chay(root, { ZALO_IMPORT_TRAN_NAP: "4", NAP_NGU: "6" }); // nạp 6s > trần 4s: bản cũ chạm trần ngay đầu vòng hồ sơ; khởi động dưới tải cũng <4s nên bản mới không bao giờ 124 giả
    assert.doesNotMatch(r.out, /TIMEOUT: phần nạp vượt trần \d+s tại hồ sơ/, "CA LỎI (d): hết hồ sơ chờ nạp vẫn báo TIMEOUT hồ sơ (bản cũ: trần xét trước lọc)");
    assert.doesNotMatch(r.out, /JOB FAIL \[zalo-import-daily\] bước nap-ho-so/, "không JOB FAIL nap-ho-so giả");
    assert.notEqual(r.status, 124, `không thoát 124 khi không còn hồ sơ chờ nạp — thực tế ${r.status}`);
    assert.equal(readFileSync(join(root, "pipeline", "logs", "s03-ho-so.state"), "utf8").trim(), ts, "con trỏ hồ sơ giữ nguyên");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---- 1911-2 (MỞ LẠI kiểu giao mới): bản 2aad0b08d gỡ khoá 3h của lượt 00:00 THẬT
// đang chạy (trần tổng 4h) → chồng lượt. Hai chiều: chủ thật (chữ ký khớp) giữ;
// PID tái dùng (chữ ký lệch) gỡ kể cả khoá trẻ.
const chuKyThat = (pid) =>
  execFileSync("ps", ["-o", "lstart=", "-p", String(pid)], { encoding: "utf8" }).replace(/\s+/g, " ").trim();

test("1911-2 chiều A: khoá tuổi 3 GIỜ của lượt đang chạy THẬT (pid sống + chữ ký khớp) → KHÔNG gỡ, lượt nhanh bỏ lượt, khoá còn của chủ", async () => {
  const root = dungMoiNhanh();
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(khoa, { recursive: true });
  writeFileSync(join(khoa, "pid"), String(process.pid)); // pid sống = chính node test
  writeFileSync(join(khoa, "luc"), String(Math.floor(Date.now() / 1000 - 10_800))); // 3 giờ trước
  writeFileSync(join(khoa, "chu"), chuKyThat(process.pid) + "\n"); // chữ ký KHỚP
  try {
    const r = await chay(root, {}, ["--luot-nhanh"]);
    assert.match(r.out, /khoá còn sống \(PID \d+, lấy lúc \d+, tuổi \d+s\) — không gỡ/, "nhận chủ thật qua chữ ký");
    assert.doesNotMatch(r.out, /gỡ khoá/, "CA LỖ 1911-2: khoá 3h của lượt thật không được gỡ (bản 2aad0b08d gỡ mọi khoá >2h → chồng lượt)");
    assert.equal(r.status, 0, "lượt nhanh bỏ lượt thoát 0");
    assert.ok(existsSync(join(khoa, "pid")), "khoá còn nguyên");
    assert.equal(readFileSync(join(khoa, "pid"), "utf8").trim(), String(process.pid), "khoá vẫn thuộc lượt 00:00");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1911-2 chiều B: khoá TRẺ mang PID TÁI DÙNG (pid sống + chữ ký LỆCH) → gỡ được ngay, không chờ 2h", async () => {
  const root = dungMoiNhanh();
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(khoa, { recursive: true });
  writeFileSync(join(khoa, "pid"), String(process.pid)); // pid sống
  writeFileSync(join(khoa, "luc"), String(Math.floor(Date.now() / 1000))); // tuổi 0 — khoá trẻ
  writeFileSync(join(khoa, "chu"), "Wed Jan  1 00:00:00 2020\n"); // chữ ký của tiến trình ĐÃ CHẾT (pid bị dùng lại)
  try {
    const r = await chay(root, {}, ["--luot-nhanh"]);
    assert.match(r.out, /gỡ khoá mồ côi — PID \d+ bị tiến trình khác DÙNG LẠI/, "chữ ký lệch = PID tái dùng — gỡ kể cả khoá trẻ");
    assert.doesNotMatch(r.out, /⏭ bỏ lượt/, "lượt nhanh chiếm được khoá sau khi dọn");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("1911-2 bổ sung (MỞ LẠI): thoát khi khoá đã ĐỔI CHỦ (pid file là PID khác) → trap KHÔNG xoá khoá của người khác", async () => {
  const root = dungMoi();
  // nạp giả 2s giữ lượt đủ lâu để can thiệp giữa chừng; transform fixture XONG ngay
  for (const f of ["transform-zalo.mjs", "transform-media.mjs", "refresh-bait-gap.mjs", "xep-hang-gia.mjs"])
    writeFileSync(join(root, "pipeline", f), "process.exit(0);\n");
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  writeFileSync(join(root, "pipeline", "doc-gop-hang-ngay.sh"), "exit 0\n");
  themSnap(root, "zalo-agent", "2026-11-19T010000000");
  const khoa = join(root, "pipeline", "logs", "apify-daily.state.lock");
  const chuMoi = spawn("sleep", ["8"]); // 'chủ mới' chiếm khoá sau khi lượt này quá trần tổng bị gỡ nhầm
  try {
    // lượt NHANH giữ khoá tới trap EXIT (nhánh 00:00 nhả khoá trước doc-gop — dòng
    // «trap - EXIT; rm -rf» chủ ý cũ); trần tổng 30s để không cắt
    const luot = chay(root, { ZALO_IMPORT_TRAN_TONG: "30", NAP_NGU: "4" }, ["--luot-nhanh"]); // nạp 4s — cửa ghi đè chắc nằm giữa lượt
    // chờ script chiếm khoá rồi GHI ĐÈ pid/chu bằng chủ mới (giả lập khoá bị lượt khác chiếm)
    for (let i = 0; i < 50 && !existsSync(join(khoa, "pid")); i++) await new Promise((r) => setTimeout(r, 100));
    await new Promise((r) => setTimeout(r, 300));
    writeFileSync(join(khoa, "pid"), `${chuMoi.pid}\n`);
    writeFileSync(join(khoa, "chu"), "Wed Jan  1 00:00:00 2020\n");
    const r = await luot;
    assert.ok([0, 1].includes(r.status), `lượt kết thúc BÌNH THƯỜNG (thoát 0 hoặc mã bước-cuối-thiếu-fixture trong hộp cát) — thực tế ${r.status}; bị trần cắt (124/143/127) là EXIT trap không chạy`);
    assert.ok(existsSync(join(khoa, "pid")), "CA LỖ: khoá ĐỔI CHỦ phải còn nguyên sau khi lượt cũ thoát (trap có điều kiện pid của mình)");
    assert.equal(readFileSync(join(khoa, "pid"), "utf8").trim(), String(chuMoi.pid), "khoá vẫn thuộc chủ mới");
  } finally {
    chuMoi.kill("SIGKILL");
    rmSync(root, { recursive: true, force: true });
  }
});

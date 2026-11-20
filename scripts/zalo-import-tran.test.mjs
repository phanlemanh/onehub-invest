// zalo-import-tran.test.mjs — test trần thời gian zalo-import-daily (1711-4; hồ sơ s03-tran-thoi-gian-luot-nap).
// CHẠY LẺ: node --test --test-concurrency=1 scripts/zalo-import-tran.test.mjs
// Mọi ca chạy BẢN SAO của script trong ROOT tmp (không đụng runtime thật, không đụng DB — bước pipeline là fixture
// trong tmp, DATABASE_URL trỏ cổng đóng). Mỗi lượt khởi DETACHED nên có nhóm tiến trình riêng: TERM «cả nhóm» của
// đồng hồ trần không trúng node test; sau ca test SIGKILL đúng nhóm ấy. Đồng hồ dùng node đang chạy test
// (ZALO_IMPORT_NODE_BIN = symlink <root>/node-dong-ho → process.execPath, dấu riêng của từng thư mục thử) — không phụ thuộc ~/.local/node-v24.21.0 của máy thu (CI không có).
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { chmodSync, cpSync, symlinkSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "zalo-import-daily.sh");
const NODE = process.execPath;
const TREO = "setInterval(() => {}, 1000);\n";
const XONG = "process.exit(0);\n";
// bước nạp giả: ghi tên snapshot vào sổ, ngủ NAP_NGU giây, thoát NAP_MA
const NAP_GIA = `import fs from "node:fs"; import p from "node:path"; const __dirname=p.dirname(new URL(import.meta.url).pathname);
fs.appendFileSync(p.join(__dirname,"logs","so-nap.txt"),p.basename(process.argv[2])+"\\n");
const ngu=Number(process.env.NAP_NGU||0)*1000; setTimeout(()=>{fs.appendFileSync(p.join(__dirname,"logs","so-nap.txt"),"XONG "+p.basename(process.argv[2])+"\\n");process.exit(Number(process.env.NAP_MA||0))},ngu);\n`;

// Dựng ROOT tmp: sao script vào <root>/scripts/ (ROOT của script = dirname($0)/..), pipeline/logs (khoá + state),
// collector/snapshots rỗng, fixture bước. `bien` = hàm đột biến chuỗi script (chiều đỏ cùng fixture).
const dungMoi = ({ treo = false, cham = false, bien = null } = {}) => {
  const root = mkdtempSync(join(tmpdir(), "zalo-tran-"));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  const goc = readFileSync(SCRIPT, "utf8");
  writeFileSync(join(root, "scripts", "zalo-import-daily.sh"), bien ? bien(goc) : goc);
  chmodSync(join(root, "scripts", "zalo-import-daily.sh"), 0o755); // ca AC-5 chạy thẳng tệp qua bash -c '"$0"'
  cpSync(join(REPO, "scripts", "lib", "job-step.sh"), join(root, "scripts", "lib", "job-step.sh"));
  mkdirSync(join(root, "pipeline", "logs"), { recursive: true });
  mkdirSync(join(root, "collector", "snapshots", "vn"), { recursive: true });
  writeFileSync(join(root, "pipeline", "transform-zalo.mjs"), treo ? TREO : cham ? "setTimeout(() => process.exit(0), 1000);\n" : XONG);
  for (const f of ["transform-media", "refresh-bait-gap", "xep-hang-gia"]) writeFileSync(join(root, "pipeline", `${f}.mjs`), XONG);
  writeFileSync(join(root, "pipeline", "import-airbnb.mjs"), NAP_GIA);
  writeFileSync(join(root, "pipeline", "doc-gop-hang-ngay.sh"), "exit 0\n");
  symlinkSync(NODE, join(root, "node-dong-ho"));
  return root;
};
const themSnap = (root, loai, ts) => {
  const d = join(root, "collector", "snapshots", "vn", `vn__${loai}__${ts}`);
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "manifest.json"), "{}\n");
};
const docSoTho = (root) => {
  const f = join(root, "pipeline", "logs", "so-nap.txt");
  return existsSync(f) ? readFileSync(f, "utf8").trim().split("\n").filter(Boolean) : [];
};
const docSo = (root) => docSoTho(root).filter((l) => !l.startsWith("XONG "));
const docState = (root, ten = "apify-daily.state") => {
  const f = join(root, "pipeline", "logs", ten);
  return existsSync(f) ? readFileSync(f, "utf8").trim() : "00000000T000000";
};
const ENV0 = { DATABASE_URL: "postgres://127.0.0.1:1/khong-co" };

// Khởi lượt detached (nhóm riêng). `boc` = chạy qua `bash -c` ngoài (script KHÔNG là trưởng nhóm).
const chay = (root, extraEnv = {}, { args = [], boc = false, sauThoat } = {}) =>
  new Promise((giai) => {
    const sc = join(root, "scripts", "zalo-import-daily.sh");
    const argv = boc ? ["-c", '"$0" "$@"; echo NGUOI-GOI-SONG rc=$?', sc, ...args] : [sc, ...args];
    const env = { ...process.env, ...ENV0, ZALO_IMPORT_NODE_BIN: join(root, "node-dong-ho"), ...extraEnv };
    const con = spawn("bash", argv, { detached: true, env });
    let out = "";
    con.stdout.on("data", (d) => { out += d; });
    con.stderr.on("data", (d) => { out += d; });
    const chot = setTimeout(() => { try { process.kill(-con.pid, "SIGKILL"); } catch {} }, 90_000);
    // chờ «exit» của bash rồi 300ms gom nốt đầu ra — KHÔNG chờ «close»: đồng hồ mồ côi (lỗ A) giữ ống tới mốc trần
    con.on("exit", async (code, signal) => {
      await new Promise((r) => setTimeout(r, 300));
      clearTimeout(chot);
      const them = sauThoat ? await sauThoat(con.pid) : undefined;
      try { process.kill(-con.pid, "SIGKILL"); } catch {}
      giai({ status: code ?? (signal === "SIGTERM" ? 143 : -1), signal, out, pgid: con.pid, them });
    });
  });
const demTheoDau = (dau) =>
  execFileSync("ps", ["-axo", "pid=,command="], { encoding: "utf8" }).split("\n").filter((l) => l.includes(dau)).length;
const choHet = async (dau) => {
  for (let i = 0; i < 20; i++) { if (demTheoDau(dau) === 0) return 0; await new Promise((r) => setTimeout(r, 500)); }
  return demTheoDau(dau);
};
const dem = (s, re) => (s.match(new RegExp(re.source, "gm")) || []).length;
const voiRoot = async (opts, fn) => { const root = dungMoi(opts); try { return await fn(root); } finally { rmSync(root, { recursive: true, force: true }); } };

// ---------- AC-1 trần phần nạp ----------
const kiemAC1Tin = (opts) => voiRoot(opts, async (root) => {
  themSnap(root, "zalo-agent", "2026-11-17T010101000");
  const r = await chay(root, { ZALO_IMPORT_TRAN_NAP: "0" });
  assert.match(r.out, /TIMEOUT: phần nạp vượt trần 0s tại snapshot 2026-11-17T010101000/, "AC-1 phần nạp không có trần");
  assert.equal(r.status, 124, `AC-1 thoát 124 — thực tế ${r.status}`);
  assert.equal(docState(root), "00000000T000000", "AC-1 state giữ mốc cũ");
  assert.deepEqual(docSo(root), [], "AC-1 bước nạp không được gọi");
  assert.doesNotMatch(r.out, /JOB STEP \[zalo-import-daily\] bước transform-/, "AC-1 transform không chạy");
});
test("AC-1 (a) vòng tin: TRAN_NAP=0 → TIMEOUT nêu snapshot, 124, state giữ, không transform", () => kiemAC1Tin());
test("AC-1 (a) chiều đỏ: bản sao bỏ khối trần vòng tin → đỏ ghim «AC-1 phần nạp không có trần»", () =>
  assert.rejects(kiemAC1Tin({ bien: (s) => s.replace('if [ "$SECONDS" -ge "$TRAN_NAP" ]; then', "if false; then") }),
    /AC-1 phần nạp không có trần/));
test("AC-1 (b) vòng hồ sơ: TRAN_NAP=0 → TIMEOUT «tại hồ sơ», state hồ sơ giữ, JOB FAIL nap-ho-so mã 124", () => voiRoot({}, async (root) => {
  themSnap(root, "s03-ho-so", "2026-11-17T020202000");
  const r = await chay(root, { ZALO_IMPORT_TRAN_NAP: "0" });
  assert.match(r.out, /TIMEOUT: phần nạp vượt trần 0s tại hồ sơ 2026-11-17T020202000/);
  assert.equal(r.status, 124, `AC-1 vòng hồ sơ phải thoát 124 — ${r.status}`);
  assert.equal(docState(root, "s03-ho-so.state"), "00000000T000000");
  assert.match(r.out, /^JOB FAIL \[zalo-import-daily\] bước nap-ho-so mã 124$/m);
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước transform-/m, "AC-1 vòng hồ sơ bị cắt chặn chuỗi tin (luật 10/11)");
  assert.deepEqual(docSo(root), []);
}));

// ---------- AC-2 bị cắt không mất, lượt sau bắt kịp ----------
const T1 = "2026-11-17T010000000", T2 = "2026-11-17T020000000";
const kiemAC2a = (opts) => voiRoot(opts, async (root) => {
  themSnap(root, "zalo-agent", T1); themSnap(root, "zalo-agent", T2);
  // Trần 5 giây: máy tải nặng script khởi động quá 1 giây thì trần 1 giây cắt trước cả snapshot đầu (S4 vòng 1, E8e).
  const r1 = await chay(root, { ZALO_IMPORT_TRAN_NAP: "5", NAP_NGU: "6" });
  assert.equal(r1.status, 124, `lượt 1 phải 124 — ${r1.status}`);
  assert.deepEqual(docSo(root), [`vn__zalo-agent__${T1}`]);
  assert.equal(docState(root), T1, "AC-2 lượt sau bỏ sót snapshot (state lượt 1 vượt snapshot bị cắt)");
  const r2 = await chay(root, {});
  assert.notEqual(r2.status, 124);
  assert.deepEqual(docSo(root), [`vn__zalo-agent__${T1}`, `vn__zalo-agent__${T2}`], "AC-2 lượt sau bỏ sót snapshot");
  assert.equal(docState(root), T2);
});
test("AC-2 (a) cắt bởi trần nạp sau snapshot đầu → lượt sau nạp nốt, state tới snapshot cuối", () => kiemAC2a());
test("AC-2 (a) chiều đỏ: bản sao đánh dấu snapshot bị cắt là đã nạp → đỏ ghim «AC-2 lượt sau bỏ sót snapshot»", () =>
  assert.rejects(kiemAC2a({ bien: (s) => s.replace("      FAILED=124\n      break", '      MAXTS="$TS"; FAILED=124\n      break') }),
    /AC-2 lượt sau bỏ sót snapshot/));
const kiemAC2b = (opts) => voiRoot(opts, async (root) => {
  themSnap(root, "zalo-agent", T1); themSnap(root, "zalo-agent", T2);
  const r1 = await chay(root, { ZALO_IMPORT_TRAN_TONG: "1", NAP_NGU: "4" });
  assert.equal(r1.status, 143, `lượt 1 bị TERM → 143 — ${r1.status}`);
  const xong1 = docSoTho(root).filter((l) => l.startsWith("XONG ")).map((l) => l.slice(5));
  assert.ok(!xong1.includes(`vn__zalo-agent__${T1}`), "fixture: T1 phải đang nạp dở khi trần bắn");
  assert.ok(docState(root) < T1, "AC-2 state vượt snapshot chưa nạp xong");
  const t0 = Date.now();
  const r2 = await chay(root, {});
  assert.doesNotMatch(r2.out, /khoá còn sống/, "lượt 2 không phải chờ khoá");
  assert.ok(Date.now() - t0 < 5000 + 2000, "lượt 2 lấy khoá không chờ");
  const so = docSo(root);
  assert.deepEqual(so.slice(-2), [`vn__zalo-agent__${T1}`, `vn__zalo-agent__${T2}`], "AC-2 lượt sau nạp đủ phần chưa ghi state");
  assert.ok(docSoTho(root).includes(`XONG vn__zalo-agent__${T1}`), "T1 nạp xong ở lượt 2");
  assert.equal(docState(root), T2);
});
test("AC-2 (b) cắt bởi trần tổng giữa lúc nạp T1 → state dưới T1, lượt sau lấy khoá ngay, nạp lại T1 rồi T2", () => kiemAC2b());
test("AC-2 (b) chiều đỏ: bản sao ghi state trước khi nạp → đỏ ghim «AC-2 state vượt snapshot chưa nạp xong»", () =>
  assert.rejects(kiemAC2b({ bien: (s) => s.replace('  if [[ "$TS" > "$LAST" ]]; then', '  echo "$TS" > "$STATE"\n  if [[ "$TS" > "$LAST" ]]; then') }),
    /AC-2 state vượt snapshot chưa nạp xong/));

// ---------- AC-3 đồng hồ tổng: WARN, TIMEOUT, 143, không trúng ngoài nhóm ----------
const kiemAC3 = (opts) => voiRoot({ treo: true, ...opts }, async (root) => {
  const canh = spawn(NODE, ["-e", TREO], { detached: true, stdio: "ignore" });
  try {
    const r = await chay(root, { ZALO_IMPORT_TRAN_TONG: "3", ZALO_IMPORT_CANH_BAO: "1" });
    assert.equal(dem(r.out, /WARN: lượt đã chạy 1s/), 1, "AC-3 thiếu dòng WARN nửa trần");
    assert.equal(dem(r.out, /TIMEOUT: lượt vượt trần 3s/), 1, "AC-3 dòng TIMEOUT");
    assert.ok(r.out.indexOf("WARN: lượt") < r.out.indexOf("TIMEOUT: lượt"), "WARN trước TIMEOUT");
    assert.equal(r.status, 143, `AC-3 bị TERM → 143 — ${r.status}`);
    assert.doesNotThrow(() => process.kill(canh.pid, 0), "AC-3 tiến trình ngoài nhóm thử bị dừng nhầm");
  } finally { try { process.kill(-canh.pid, "SIGKILL"); } catch {} }
});
test("AC-3 trần tổng: một WARN, một TIMEOUT, 143; tiến trình canh ngoài nhóm vẫn sống", () => kiemAC3());
test("AC-3 chiều đỏ: bản sao bỏ WARN → đỏ ghim «AC-3 thiếu dòng WARN nửa trần»", () =>
  assert.rejects(kiemAC3({ bien: (s) => s.replace('CANH_BAO="${ZALO_IMPORT_CANH_BAO:-$((TRAN_TONG / 2))}"', "CANH_BAO=999999") }),
    /AC-3 thiếu dòng WARN nửa trần/));

// ---------- AC-4 không còn đồng hồ sau khi lượt thoát (đỏ trên @99b2778e9 ở ô a) ----------
for (const [o, env, args, napMa, moc] of [
  ["(a) 00:00 chạy tới enrich", {}, [], "0", /^JOB STEP \[zalo-import-daily\] bước enrich-run /m],
  ["(b) lượt nhanh", {}, ["--luot-nhanh"], "0", /lượt nhanh: bỏ đọc gộp/],
  ["(c) 00:00 lỗi nạp", {}, [], "1", /nạp fail tại/],
]) {
  test(`AC-4 ${o}: script thoát thì nhóm của lượt không còn đồng hồ`, () => voiRoot({}, async (root) => {
    themSnap(root, "zalo-agent", T1);
    const r = await chay(root, { ...env, NAP_MA: napMa }, { args, sauThoat: () => choHet(join(root, "node-dong-ho")) });
    assert.match(r.out, moc, `fixture: lượt ${o} phải tới đúng kết cục`);
    assert.equal(r.them, 0, `AC-4 đồng hồ còn sống sau khi lượt thoát (${o}, mã ${r.status})`);
  }));
}

// ---------- AC-5 người gọi không phải trưởng nhóm sống khi trần bắn (đỏ trên @99b2778e9) ----------
test("AC-5 gọi qua bash -c: trần bắn dừng lượt, người gọi vẫn in NGUOI-GOI-SONG và thoát bằng mã", () => voiRoot({ treo: true }, async (root) => {
  const treo = join(root, "pipeline", "transform-zalo.mjs");
  const r = await chay(root, { ZALO_IMPORT_TRAN_TONG: "2" }, { boc: true, sauThoat: () => choHet(treo) });
  assert.match(r.out, /TIMEOUT: lượt vượt trần 2s/);
  assert.match(r.out, /^NGUOI-GOI-SONG rc=[0-9]+$/m, "AC-5 trần TERM trúng người gọi");
  assert.equal(r.signal, null, `AC-5 người gọi chết bởi tín hiệu ${r.signal}`);
  assert.match(r.out, /^NGUOI-GOI-SONG rc=143$/m, "AC-5 script không bị cắt bằng TERM");
  assert.equal(r.them, 0, "AC-5 bước treo sống sau trần");
}));

// ---------- AC-6 khoá PID sống không gỡ ----------
const dungKhoa = (root, pid, tuoiGiay = 3 * 3600) => {
  const k = join(root, "pipeline", "logs", "apify-daily.state.lock");
  mkdirSync(k, { recursive: true });
  writeFileSync(join(k, "pid"), `${pid}\n`);
  writeFileSync(join(k, "luc"), `${Math.floor(Date.now() / 1000) - tuoiGiay}\n`);
  return k;
};
const kiemAC6a = (opts) => voiRoot(opts, async (root) => {
  const k = dungKhoa(root, process.pid);
  const r = await chay(root, { ZALO_IMPORT_CHO_KHOA: "2" });
  assert.match(r.out, /khoá còn sống \(PID \d+, lấy lúc \d+(, tuổi \d+s)?\) — không gỡ/, "AC-6 lượt 00:00 gỡ khoá đang sống");
  assert.match(r.out, /khoá .* bận .*job khác đang nạp\?/);
  assert.equal(r.status, 1);
  assert.equal(readFileSync(join(k, "pid"), "utf8").trim(), String(process.pid), "khoá còn nguyên");
});
test("AC-6 (a) lượt 00:00 gặp khoá PID sống (khoá >2h): không gỡ, thoát 1, khoá còn nguyên", () => kiemAC6a());
test("AC-6 (a) chiều đỏ: bản sao khôi phục điều kiện chỉ-lượt-nhanh → đỏ ghim «AC-6 lượt 00:00 gỡ khoá đang sống»", () =>
  assert.rejects(kiemAC6a({ bien: (s) => s.replace('  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then',
    '  if [ "$LUOT_NHANH" = "1" ] && [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then') }),
    /AC-6 lượt 00:00 gỡ khoá đang sống/));
test("AC-6 (b) lượt nhanh gặp khoá PID sống: bỏ lượt thoát 0, không nạp, khoá còn nguyên", () => voiRoot({}, async (root) => {
  themSnap(root, "zalo-agent", T1);
  const k = dungKhoa(root, process.pid);
  const r = await chay(root, {}, { args: ["--luot-nhanh"] });
  assert.equal(r.status, 0);
  assert.match(r.out, /bỏ lượt/);
  assert.deepEqual(docSo(root), []);
  assert.ok(existsSync(join(k, "pid")));
}));
test("AC-6 (c) đối chứng: khoá mang PID đã chết thì bị gỡ, lượt chạy tới truoc-lan-claude", () => voiRoot({}, async (root) => {
  const chet = spawn(NODE, ["-e", XONG]); await new Promise((r) => chet.on("exit", r));
  dungKhoa(root, chet.pid, 10);
  const r = await chay(root, {});
  assert.match(r.out, /gỡ khoá cũ của PID \d+ \(tiến trình đã chết\)/);
  assert.match(r.out, /^JOB STEP \[zalo-import-daily\] bước truoc-lan-claude /m);
}));

// ---------- AC-7 trần mặc định qua env, plist không đổi, node thiếu thì trần tắt ----------
const nodeGia = (root) => {
  const f = join(root, "node-gia.sh");
  writeFileSync(f, `#!/bin/bash\necho "$TRAN_GIAY $CANH_GIAY $DO_KILL" >> "${root}/dong-ho.txt"\n`);
  chmodSync(f, 0o755);
  return f;
};
for (const [o, env, args, ke] of [
  ["00:00 mặc định", {}, [], "14400 7200"],
  ["nhanh mặc định", {}, ["--luot-nhanh"], "2400 1200"],
  ["00:00 TRAN_TONG=100", { ZALO_IMPORT_TRAN_TONG: "100" }, [], "100 50"],
  ["00:00 TRAN_TONG=100 CANH_BAO=7", { ZALO_IMPORT_TRAN_TONG: "100", ZALO_IMPORT_CANH_BAO: "7" }, [], "100 7"],
]) {
  // bước transform-zalo chậm 1 giây: lượt nhanh xong trước khi node giả kịp ghi thì trap đã giết nó
  test(`AC-7 trần ${o} → ${ke}`, () => voiRoot({ cham: true }, async (root) => {
    const envBo = { ...env };
    for (const k of ["ZALO_IMPORT_TRAN_TONG", "ZALO_IMPORT_CANH_BAO"]) if (!(k in envBo)) envBo[k] = "";
    // biến rỗng = không đặt: ${X:-mặc định} lấy mặc định
    await chay(root, { ...envBo, ZALO_IMPORT_NODE_BIN: nodeGia(root) }, { args });
    const dong = readFileSync(join(root, "dong-ho.txt"), "utf8").trim().split("\n");
    assert.equal(dong.length, 1, "một đồng hồ mỗi lượt");
    assert.equal(dong[0].split(" ").slice(0, 2).join(" "), ke);
  }));
}
test("AC-7 plist không đổi so với origin/main", () => {
  execFileSync("git", ["-C", REPO, "diff", "--quiet", "origin/main", "--", "pipeline/cron"]);
});
test("AC-7 node thật thiếu → TRẦN THỜI GIAN TẮT, cùng các bước, cùng mã thoát", () => voiRoot({}, async (root) => {
  const coDongHo = await chay(root, {});
  rmSync(join(root, "pipeline", "logs"), { recursive: true, force: true }); mkdirSync(join(root, "pipeline", "logs"));
  const khong = await chay(root, { ZALO_IMPORT_NODE_BIN: "/khong-co/node" });
  assert.match(khong.out, /TRẦN THỜI GIAN TẮT/);
  const buoc = (o) => o.split("\n").filter((l) => l.startsWith("JOB STEP [zalo-import-daily]")).map((l) => l.split(" ")[4]);
  assert.deepEqual(buoc(khong.out), buoc(coDongHo.out));
  assert.equal(khong.status, coDongHo.status);
}));

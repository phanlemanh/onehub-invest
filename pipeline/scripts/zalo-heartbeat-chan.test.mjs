// zalo-heartbeat-chan.test.mjs — test D3 heartbeat S03 phân biệt lý do DOWN (1411-30).
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_s03_hb --chay node --test pipeline/scripts/zalo-heartbeat-chan.test.mjs
// CLI giả (stub bash — KHÔNG gateway thật, KHÔNG gọi nhóm thật): channels status theo env GIA_STATUS;
// directory groups list lần 1 trả «Đăng nhập thất bại» (reason=session), lần sau trả khác (reason=stopped).
// Ca: DOWN 2 nhịp → đúng 1 cảnh báo L6(d) vào alerts log; nhịp 3 không lặp; lệnh nhóm ≤1/giờ; UP → tự đóng.
// CA ĐỎ: gỡ lời gọi song_d_down_kdai trong zalo-heartbeat.sh → cảnh báo không xuất hiện → test đỏ.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SCRIPT = join(REPO, "collector", "scripts", "zalo-heartbeat.sh");

// CA-ĐỎ tĩnh: lời gọi L6(d) + hàm (d) phải còn.
const nguonHb = readFileSync(SCRIPT, "utf8");
const nguonSong = readFileSync(join(REPO, "scripts", "lib", "s03-song.sh"), "utf8");
test("CA-ĐỎ tĩnh: heartbeat còn gọi song_d_down_kdai; s03-song còn hàm (d)", () => {
  assert.match(nguonHb, /song_d_down_kdai/, "heartbeat phải gọi L6(d)");
  assert.match(nguonSong, /song_d_down_kdai\(\)/, "s03-song phải có hàm (d)");
  assert.match(nguonHb, /directory groups list --channel zalouser/, "heartbeat phải gọi lệnh nhóm chỉ-đọc khi DOWN");
});

const stubCli = (dir) => {
  const p = join(dir, "cli");
  writeFileSync(p, `#!/bin/bash
if [ "$1" = "channels" ]; then
  if [ "$GIA_STATUS" = "up" ]; then echo "Zalo Personal default connected"; else echo "Zalo Personal default disconnected"; fi
  exit 0
fi
if [ "$1" = "directory" ]; then
  if [ ! -f "$GIA_DEM" ]; then echo "Lỗi: Đăng nhập thất bại — phiên hết hạn"; : > "$GIA_DEM"; exit 0; fi
  echo "lan-$(date -u +%s)" >> "$GIA_DEM"; echo "groups: ok (không in danh sách)"; exit 0
fi
exit 9
`);
  chmodSync(p, 0o755);
  return p;
};

const chayHb = ({ home, cli, state, alerts, moc, up = false, them = {} }) => spawnSync("bash", [SCRIPT], {
  encoding: "utf8", timeout: 60_000,
  env: {
    ...process.env,
    GIA_STATUS: up ? "up" : "down",
    GIA_DEM: join(home, "dem"),
    ZALO_OPENCLAW_CLI: cli,
    ZALO_HEARTBEAT_STATE: state,
    ZALO_HEARTBEAT_ALERTS: alerts,
    ZALO_HEARTBEAT_LINH_MUC: moc,
    HOME: home,
    ZALO_HEARTBEAT_ROOT: REPO,
    S03_SONG_OSASCRIPT: "/usr/bin/true",
    ...them,
  },
});
const docDem = (home) => { try { return (readFileSync(join(home, "dem"), "utf8").match(/lan-/g) ?? []).length; } catch { return 0; } };
const docAlerts = (alerts) => { try { return readFileSync(alerts, "utf8"); } catch { return ""; } }; // nhịp 1 chưa có cảnh báo → tệp chưa tồn tại

test("D3-1: DOWN 2 nhịp → đúng 1 cảnh báo L6(d); nhịp 3 không lặp; lệnh nhóm ≤1/giờ; reason=session", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb-"));
  const cli = stubCli(home);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  const chay = () => chayHb({ home, cli, state, alerts, moc });
  chay(); // nhịp 1 — gọi nhóm lần 1: «Đăng nhập thất bại» → reason=session; chưa cảnh báo
  let stateNd = readFileSync(state, "utf8");
  assert.match(stateNd, /nhip=1/, "nhịp 1");
  assert.match(stateNd, /reason=session/, "lần đầu Đăng nhập thất bại → reason=session");
  assert.doesNotMatch(docAlerts(alerts), /S03-SỐNG \[d\]/, "nhịp 1 chưa cảnh báo");
  assert.equal(docDem(home), 0, "lần đầu KHÔNG ghi lan- (stub session không ghi) — lời gọi chứng minh qua reason=session + mốc");
  assert.equal(require0(moc), true, "mốc 1/giờ đã ghi sau lần gọi đầu");
  chay(); // nhịp 2 — cảnh báo MỘT lần; không gọi nhóm lại (trần 1/giờ)
  stateNd = readFileSync(state, "utf8");
  assert.match(stateNd, /nhip=2/, "nhịp 2");
  assert.match(stateNd, /d/, "cờ d đánh dấu đã cảnh báo");
  assert.equal((docAlerts(alerts).match(/S03-SỐNG \[d\]/g) ?? []).length, 1, "đúng 1 cảnh báo L6(d)");
  assert.equal(docDem(home), 0, "lệnh nhóm KHÔNG gọi lại ở nhịp 2 (trần 1/giờ — ai bỏ trần thì stub ghi lan- và test đỏ)");
  chay(); // nhịp 3 — không lặp cảnh báo, không gọi nhóm
  assert.equal((docAlerts(alerts).match(/S03-SỐNG \[d\]/g) ?? []).length, 1, "nhịp 3 không lặp cảnh báo");
  assert.equal(docDem(home), 0, "lệnh nhóm vẫn không gọi ở nhịp 3");
  // dòng heartbeat cuối mang reason
  const log = readFileSync(join(home, ".openclaw", "logs", "oneinvest-zalo-pipe.log"), "utf8");
  assert.match(log.trim().split("\n").pop(), /DOWN accs=0\/1 reason=session/, "dòng DOWN kèm reason");
  rmSync(home, { recursive: true, force: true });
});

test("D3-2: up lại → tự đóng (state xoá); sự cố kế sau khi hồi sẽ báo lại", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb2-"));
  const cli = stubCli(home);
  writeFileSync(join(home, "drift.sh"), "#!/bin/bash\nexit 0\n"); chmodSync(join(home, "drift.sh"), 0o755); // mọi ca UP bơm drift giả
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  chayHb({ home, cli, state, alerts, moc }); // nhịp 1
  chayHb({ home, cli, state, alerts, moc }); // nhịp 2 — cảnh báo
  chayHb({ home, cli, state, alerts, moc, up: true, them: { ZALO_DRIFT_SH: join(home, "drift.sh") } }); // up → tự đóng
  assert.equal(require0(state), false, "state xoá khi up");
  assert.equal((docAlerts(alerts).match(/S03-SỐNG \[d\]/g) ?? []).length, 1, "vẫn đúng 1 cảnh báo của sự cố cũ");
  // 1411-30 vòng 3(1): sự cố MỚI sau khi hồi phải được BÁO LẠI — hai nhịp DOWN nữa → 2 dòng [d]
  chayHb({ home, cli, state, alerts, moc });
  chayHb({ home, cli, state, alerts, moc });
  assert.equal((docAlerts(alerts).match(/S03-SỐNG \[d\]/g) ?? []).length, 2, "sự cố mới sau khi hồi báo lại (2 dòng [d])");
  rmSync(home, { recursive: true, force: true });
});

test("D3-3: directory lỗi khác (không phải Đăng nhập thất bại) → reason=stopped", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb3-"));
  const cli = stubCli(home);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  // lần gọi đầu đã tiêu trước test này (mốc 1/giờ trong home riêng nên lần đầu vẫn chạy) —
  // ép stub trả «không phải Đăng nhập thất bại» ngay lần đầu bằng cách ghi sẵn dem có 1 dòng.
  writeFileSync(join(home, "dem"), "lan-da-co\n");
  chayHb({ home, cli, state, alerts, moc });
  assert.match(readFileSync(state, "utf8"), /reason=stopped/, "lỗi khác → reason=stopped");
  rmSync(home, { recursive: true, force: true });
});

test("D3-4 (1411-20 MỞ LẠI): UP → zalo-drift.sh (giả) ĐƯỢC gọi; DOWN → không được gọi. CA ĐỎ: ai thêm lại exit 0 ở nhánh UP thì ca này đỏ (drift không được gọi)", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb4-"));
  const cli = stubCli(home);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  const dau = join(home, "drift-dau"); // stub drift ghi tệp đánh dấu
  // stub drift nhận đường tệp đánh dấu qua $1 (heartbeat truyền ZALO_DRIFT_DAU)
  writeFileSync(join(home, "drift.sh"), `#!/bin/bash\necho called >> "$1"\n`);
  chmodSync(join(home, "drift.sh"), 0o755);
  const env = { GIA_DEM: join(home, "dem"), ZALO_OPENCLAW_CLI: cli, ZALO_HEARTBEAT_STATE: state,
    ZALO_HEARTBEAT_ALERTS: alerts, ZALO_HEARTBEAT_LINH_MUC: moc, HOME: home, ZALO_HEARTBEAT_ROOT: REPO,
    S03_SONG_OSASCRIPT: "/usr/bin/true", ZALO_DRIFT_SH: join(home, "drift.sh"), ZALO_DRIFT_DAU: dau };
  // nhịp DOWN — không drift (env stub drift vẫn truyền để chứng minh exit trước drift)
  chayHb({ home, cli, state, alerts, moc, them: { ZALO_DRIFT_SH: join(home, "drift.sh"), ZALO_DRIFT_DAU: dau } });
  const khong = spawnSync("bash", [SCRIPT], { encoding: "utf8", env: { ...env, GIA_STATUS: "down", HOME: home }, timeout: 60_000 });
  assert.equal(khong.status, 0);
  assert.equal(require0(dau), false, "DOWN không gọi drift");
  // nhịp UP — drift được gọi (mốc alert drift chưa có → RUN_DRIFT=1)
  chayHb({ home, cli, state, alerts, moc, up: true, them: { ZALO_DRIFT_SH: join(home, "drift.sh"), ZALO_DRIFT_DAU: dau } });
  assert.equal(require0(dau), true, "UP gọi drift (mã chết nếu ai thêm lại exit 0 nhánh UP)");
  rmSync(home, { recursive: true, force: true });
});

test("D3-5: UP mà post 202 cuối cũ hơn 24 giờ → có dòng alert silent-gate", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb5-"));
  const cli = stubCli(home);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  const dau = join(home, "drift-dau");
  writeFileSync(join(home, "drift.sh"), "#!/bin/bash\nexit 0\n"); chmodSync(join(home, "drift.sh"), 0o755);
  // 1411-30 vòng 3(2): giờ phải ĐÚNG ISO như log thật (có «T» — bản trước ghi
  // «YYYY-MM-DD HH:MM:SS» không T làm mốc parse 0 → ca xanh VÌ LỖI).
  const cu = new Date(Date.now() - 25 * 3600_000).toISOString();
  const logDir = join(home, ".openclaw", "logs");
  mkdirSync(logDir, { recursive: true });
  writeFileSync(join(logDir, "oneinvest-zalo-pipe.log"), `${cu} post 202 hi-1\n${cu} heartbeat zalouser up accs=1/1\n`);
  chayHb({ home, cli, state, alerts, moc, up: true, them: { ZALO_DRIFT_SH: join(home, "drift.sh") } });
  const log = readFileSync(join(logDir, "oneinvest-zalo-pipe.log"), "utf8");
  assert.match(log, /alert silent-gate/, "up + không tin 24h → alert silent-gate");
  // ca âm: post 202 cách 1 giờ → KHÔNG có alert silent-gate (mốc parse đúng mới qua ca này)
  const gan = new Date(Date.now() - 1 * 3600_000).toISOString();
  writeFileSync(join(logDir, "oneinvest-zalo-pipe.log"), `${gan} post 202 hi-2\n`);
  chayHb({ home, cli, state, alerts, moc, up: true, them: { ZALO_DRIFT_SH: join(home, "drift.sh") } });
  const log2 = readFileSync(join(logDir, "oneinvest-zalo-pipe.log"), "utf8");
  assert.doesNotMatch(log2, /alert silent-gate/, "post 202 cách 1 giờ → KHÔNG alert (ca âm — giờ sai cũ sẽ làm ca này đỏ)");
  rmSync(home, { recursive: true, force: true });
});

test("D3-6 (vòng 3-3): CLI directory treo quá trần 20s → heartbeat kết thúc < ~25s, reason=unknown, VẪN cảnh báo L6(d)", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb6-"));
  const cli = join(home, "cli");
  writeFileSync(cli, `#!/bin/bash
if [ "$1" = "channels" ]; then echo "Zalo Personal default disconnected"; exit 0; fi
if [ "$1" = "directory" ]; then sleep 40; echo "groups: ok"; exit 0; fi
exit 9`);
  chmodSync(cli, 0o755);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  const t0 = Date.now();
  // nhịp 1: directory treo → hết 20s → reason=unknown (cảnh báo L6(d) tính từ nhịp 2 theo luật ≥2 nhịp)
  const r1 = chayHb({ home, cli, state, alerts, moc });
  assert.match(readFileSync(state, "utf8"), /reason=unknown/, "hết giờ → reason=unknown");
  // nhịp 2: directory trả ngay (lần gọi sau bị trần 1/giờ chặn — không treo) → đủ 2 nhịp → cảnh báo
  const r2 = chayHb({ home, cli, state, alerts, moc });
  const matS = (Date.now() - t0) / 1000;
  assert.equal(r1.status, 0, `rc 0 nhịp treo — thực tế ${r1.status}`);
  assert.equal(r2.status, 0, `rc 0 nhịp 2 — thực tế ${r2.status}`);
  assert.ok(matS < 25, `hai nhịp phải kết thúc dưới ~25 giây (trần 20s + nhịp nhanh) — thực tế ${matS.toFixed(1)}s`);
  assert.match(docAlerts(alerts), /S03-SỐNG \[d\]/, "vẫn chạy cảnh báo L6(d) khi lý do unknown");
  rmSync(home, { recursive: true, force: true });
});

test("D3-7 (vòng 4): CLI status ngủ quá trần → heartbeat < ~25s, DOWN reason=unknown, nhịp tăng, lần 2 có [d]. CA ĐỎ: gỡ bọc trần status (gọi trực tiếp) → ca này timeout đỏ", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb7-"));
  const cli = join(home, "cli");
  writeFileSync(cli, `#!/bin/bash
if [ "$1" = "channels" ]; then sleep 40; echo "Zalo Personal default disconnected"; exit 0; fi
exit 9`);
  chmodSync(cli, 0o755);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  const chay = () => chayHb({ home, cli, state, alerts, moc, them: { ZALO_DRIFT_SH: join(home, "drift.sh") } });
  const t0 = Date.now();
  chay();
  const mat1 = (Date.now() - t0) / 1000;
  assert.ok(mat1 < 25, `nhịp 1 phải xong dưới ~25s (trần 20s) — thực tế ${mat1.toFixed(1)}s`);
  assert.match(readFileSync(state, "utf8"), /nhip=1/, "nhịp 1");
  assert.match(readFileSync(state, "utf8"), /reason=unknown/, "status hết giờ → reason=unknown");
  const t1 = Date.now();
  chay();
  const mat2 = (Date.now() - t1) / 1000;
  assert.ok(mat2 < 25, `nhịp 2 cũng phải xong dưới ~25s — thực tế ${mat2.toFixed(1)}s`);
  assert.match(readFileSync(state, "utf8"), /nhip=2/, "nhịp tăng qua hai lần chạy");
  assert.match(docAlerts(alerts), /S03-SỐNG \[d\]/, "lần 2 có cảnh báo L6(d)");
  rmSync(home, { recursive: true, force: true });
});

test("D3-8 (vòng 4): lệnh nhóm in MỘT PHẦN output rồi ngủ quá trần → reason=unknown (không phải stopped). CA ĐỎ: đảo ưu tiên kiểm stopped trước unknown → ca này đỏ", () => {
  const home = mkdtempSync(join(tmpdir(), "s03-hb8-"));
  const cli = join(home, "cli");
  writeFileSync(cli, `#!/bin/bash
if [ "$1" = "channels" ]; then echo "Zalo Personal default disconnected"; exit 0; fi
if [ "$1" = "directory" ]; then echo "groups: ok (một phần output)"; sleep 40; exit 0; fi
exit 9`);
  chmodSync(cli, 0o755);
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  chayHb({ home, cli, state, alerts, moc, them: { ZALO_DRIFT_SH: join(home, "drift.sh") } });
  assert.match(readFileSync(state, "utf8"), /reason=unknown/, "bị kill giữa chừng → LUÔN unknown dù có phần output");
  rmSync(home, { recursive: true, force: true });
});

function require0(p) { try { readFileSync(p); return true; } catch { return false; } }

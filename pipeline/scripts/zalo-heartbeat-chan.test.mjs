// zalo-heartbeat-chan.test.mjs — test D3 heartbeat S03 phân biệt lý do DOWN (1411-30).
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_s03_hb --chay node --test pipeline/scripts/zalo-heartbeat-chan.test.mjs
// CLI giả (stub bash — KHÔNG gateway thật, KHÔNG gọi nhóm thật): channels status theo env GIA_STATUS;
// directory groups list lần 1 trả «Đăng nhập thất bại» (reason=session), lần sau trả khác (reason=stopped).
// Ca: DOWN 2 nhịp → đúng 1 cảnh báo L6(d) vào alerts log; nhịp 3 không lặp; lệnh nhóm ≤1/giờ; UP → tự đóng.
// CA ĐỎ: gỡ lời gọi song_d_down_kdai trong zalo-heartbeat.sh → cảnh báo không xuất hiện → test đỏ.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync } from "node:fs";
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

const chayHb = ({ home, cli, state, alerts, moc, up = false }) => spawnSync("bash", [SCRIPT], {
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
  const state = join(home, "state"), alerts = join(home, "alerts.log"), moc = join(home, "moc");
  chayHb({ home, cli, state, alerts, moc }); // nhịp 1
  chayHb({ home, cli, state, alerts, moc }); // nhịp 2 — cảnh báo
  chayHb({ home, cli, state, alerts, moc, up: true }); // up → tự đóng
  assert.equal(require0(state), false, "state xoá khi up");
  assert.equal((docAlerts(alerts).match(/S03-SỐNG \[d\]/g) ?? []).length, 1, "vẫn đúng 1 cảnh báo của sự cố cũ");
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

function require0(p) { try { readFileSync(p); return true; } catch { return false; } }

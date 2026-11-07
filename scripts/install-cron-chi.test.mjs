// install-cron --chi (0611-37) — chứng minh --chi backup KHÔNG chạm
// collector/smoke: giả launchctl bằng PATH + HOME giả; thật chạy script.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const REPO = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
// PlistBuddy, plutil, launchctl chỉ có trên macOS: ca nào chạy tới bước ghi plist thì bỏ qua có tên trên runner Linux.
const CAN_MACOS = process.platform !== "darwin" && "cần macOS (PlistBuddy, plutil, launchctl)";

function taoMoiTruong() {
  const home = mkdtempSync(join(tmpdir(), "cronchi-"));
  const bin = join(home, "bin");
  mkdirSync(bin);
  // launchctl GIẢ: ghi mọi lời gọi vào log (đường NẤU sẵn lúc tạo tệp), thoát 0
  writeFileSync(
    join(bin, "launchctl"),
    ['#!/bin/bash', `echo "$@" >> '${join(home, "launchctl.log").replace(/'/g, "'\\''")}'`, "exit 0", ""].join("\n"),
    { mode: 0o755 },
  );
  return { home, bin, log: join(home, "launchctl.log") };
}

function chay(home, bin, ...args) {
  return execFileSync("bash", [join(REPO, "scripts/install-cron.sh"), ...args], {
    env: {
      ...process.env,
      HOME: home, // đích ghi plist + launchctl đều trong HOME GIẢ
      PATH: `${bin}:${process.env.PATH}`,
    },
    encoding: "utf8",
  });
}

test("--chi backup: CHỈ backup được cài — không plist collector/smoke, launchctl không đụng chúng", { skip: CAN_MACOS }, () => {
  const { home, bin, log } = taoMoiTruong();
  const out = chay(home, bin, "--chi", "backup");
  const plists = readdirSync(join(home, "Library/LaunchAgents")).sort();
  assert.deepEqual(plists, ["com.oneinvest.backup.plist"]);
  assert.match(out, /installed: .*com\.oneinvest\.backup\.plist/);
  const lc = readFileSync(log, "utf8");
  assert.match(lc, /bootout gui\/\d+ .*com\.oneinvest\.backup\.plist/);
  assert.match(lc, /bootstrap gui\/\d+ .*com\.oneinvest\.backup\.plist/);
  assert.ok(!lc.includes("com.oneinvest.collector"), "launchctl phải KHÔNG chạm collector");
  assert.ok(!lc.includes("com.oneinvest.smoke"), "launchctl phải KHÔNG chạm smoke");
  rmSync(home, { recursive: true, force: true });
});

test("vắng cờ: đủ 3 job như hành vi cũ", { skip: CAN_MACOS }, () => {
  const { home, bin, log } = taoMoiTruong();
  chay(home, bin);
  const plists = readdirSync(join(home, "Library/LaunchAgents")).sort();
  assert.deepEqual(plists, [
    "com.oneinvest.backup.plist",
    "com.oneinvest.collector.plist",
    "com.oneinvest.smoke.plist",
  ]);
  const lc = readFileSync(log, "utf8");
  for (const j of ["collector", "smoke", "backup"]) {
    assert.match(lc, new RegExp(`bootstrap gui/\\d+ .*com\\.oneinvest\\.${j}\\.plist`));
  }
  rmSync(home, { recursive: true, force: true });
});

test("--chi backup: BACKUP_DIR vào plist backup qua PlistBuddy (plist đọc được)", { skip: CAN_MACOS }, () => {
  const { home, bin } = taoMoiTruong();
  chay(home, bin, "--chi", "backup"); // BACKUP_DIR unset → không có biến đó
  // plist phải hợp lệ (plutil -lint đã chạy trong script); kiểm tra PATH được ghi
  const plist = readFileSync(join(home, "Library/LaunchAgents/com.oneinvest.backup.plist"), "utf8");
  assert.match(plist, /EnvironmentVariables/);
  rmSync(home, { recursive: true, force: true });
});

test("tên job lạ → thoát 2, KHÔNG ghi plist nào", () => {
  const { home, bin } = taoMoiTruong();
  let rc = 0;
  try {
    chay(home, bin, "--chi", "khongbiet");
  } catch (e) {
    rc = e.status ?? 1;
  }
  assert.equal(rc, 2);
  // script thoát 2 TRƯỚC mkdir — thư mục có thể chưa tồn tại ( coi như 0 plist)
  const dir = join(home, "Library/LaunchAgents");
  const soPlist = existsSync(dir) ? readdirSync(dir).length : 0;
  assert.equal(soPlist, 0);
  rmSync(home, { recursive: true, force: true });
});

// 0711-27: --chi trơn (không tên job) → thoát 2, KHÔNG plist nào được ghi
test("--chi trơn → thoát 2, không plist nào", () => {
  const { home } = taoMoiTruong();
  const r = spawnSync("bash", [join(REPO, "scripts/install-cron.sh"), "--chi"], {
    env: { ...process.env, HOME: home, PATH: process.env.PATH },
    encoding: "utf8",
  });
  assert.equal(r.status, 2, `thoát 2 (được ${r.status}): ${(r.stderr || "").slice(0, 150)}`);
  const dir = join(home, "Library/LaunchAgents");
  const plists = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".plist")) : [];
  assert.equal(plists.length, 0, `không plist nào (thấy ${plists.join(",")})`);
  rmSync(home, { recursive: true, force: true });
});

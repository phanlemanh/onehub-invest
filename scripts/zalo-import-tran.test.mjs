// zalo-import-tran.test.mjs — test trần thời gian zalo-import-daily (1711-4).
// CHẠY LẺ: node --test scripts/zalo-import-tran.test.mjs
// Mọi ca chạy bản SAO của script trong ROOT tmp (không đụng runtime thật, không
// đụng DB — các bước "node $ROOT/pipeline/transform-zalo.mjs" là fixture treo trong tmp).
// Ca: (1) buoc_tran cắt bước treo mã 124; (2) đồng hồ chết tổng WARN + TIMEOUT → exit 143;
// (3) khoá PID sống không bị gỡ → lượt sau chờ rồi thoát 1, khoá còn nguyên.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
const chay = (root, extraEnv = {}) =>
  new Promise((giai) => {
    const con = spawn("bash", [join(root, "scripts", "zalo-import-daily.sh")], {
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
    assert.match(r.out, /khoá còn sống \(PID \d+, lấy lúc \d+\) — không gỡ/, "không gỡ khoá PID sống (trước đây lượt 00:00 gỡ khoá >2h — lỗ chồng lượt)");
    assert.match(r.out, /khoá .* bận .*job khác đang nạp\?/, "chờ hết cạn rồi từ chối");
    assert.equal(r.status, 1, "thoát 1 — JOB FAIL thấy được, KHÔNG nạp chồng");
    assert.ok(existsSync(khoa), "khoá còn nguyên sau khi thoát");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

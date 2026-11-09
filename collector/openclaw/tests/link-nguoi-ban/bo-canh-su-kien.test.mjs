// S4 lượt 3 (3) — chứng minh dưới env kiểu plist: watchdog ghi sự kiện
// 'bo-canh' vào tệp sự kiện chung của bộ tra, thư mục đọc THEO TỆP ENV
// GATEWAY (một nguồn) khi biến môi trường của watchdog không có.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../../../../", import.meta.url).pathname; // gốc kho

test("S4-3(3): dưới env kiểu plist (không S03_LOOKUP_DIR riêng) — doc_s03_lookup_dir đọc tệp env gateway, ghi_bo_canh viết dòng bo-canh", () => {
  const tam = mkdtempSync(join(tmpdir(), "lnb-bocanh-"));
  try {
    const envDir = join(tam, "env");
    const dirViec = join(tam, "viec");
    mkdirSync(envDir, { recursive: true });
    mkdirSync(dirViec, { recursive: true });
    // tệp env gateway giả — khuôn ai.openclaw.gateway.env, khai S03_LOOKUP_DIR
    const envFile = join(envDir, "gateway.env");
    writeFileSync(envFile, `BUN_ENV=production\nS03_LOOKUP_DIR=${dirViec}\n`);
    // CHÍNH LIB (nguồn watchdog source) — chạy dưới env KHÔNG có S03_LOOKUP_DIR
    // (giống launchd watchdog hiện nay) + GATEWAY_ENV_FILE trỏ env giả
    const out = execFileSync("/bin/bash", [
      "-c",
      `set -e; . "$1"; d="$(doc_s03_lookup_dir)"; [ "$d" = "$2" ] || { echo "doc-sai:$d" >&2; exit 3; }; ghi_bo_canh "$d"`,
      "_",
      join(ROOT, "scripts/lib/bo-canh-su-kien.sh"),
      dirViec,
    ], { encoding: "utf8", env: { PATH: process.env.PATH, GATEWAY_ENV_FILE: envFile } });
    const tệp = readFileSync(join(dirViec, "sukien-listener.jsonl"), "utf8").trim().split("\n");
    assert.equal(tệp.length, 1);
    const suKien = JSON.parse(tệp[0]);
    assert.equal(suKien.loai, "bo-canh");
    assert.ok(Number.isFinite(suKien.atMs) && suKien.atMs > 0, "atMs là mốc ms");
    // thư mục chưa có → không tạo tệp, không lỗi (rỗng dir → return 0)
    const rc = spawnSync("/bin/bash", ["-c", `. "$1"; ghi_bo_canh "$(doc_s03_lookup_dir)"`, "_", join(ROOT, "scripts/lib/bo-canh-su-kien.sh")],
      { encoding: "utf8", env: { PATH: process.env.PATH, GATEWAY_ENV_FILE: join(envDir, "rong.env") } });
    assert.equal(rc.status, 0, "env không khai → im lặng thoát 0");
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
});

test("S4-3(3): watchdog thật có móc — alert() gọi ghi_bo_canh qua lib (kiểm tĩnh nguồn, không chạy alert)", () => {
  // Đường tệp script mang tên kênh thật → đọc qua WATCHDOG_FILE (env), vắng
  // thì BỎ QUA kèm lý do — pattern env đã duyệt (LNB_IMPORT_FILE, 0711-17).
  const tep = process.env.WATCHDOG_FILE;
  if (!tep) {
    console.log("S4-3(3): bỏ qua kiểm tĩnh watchdog — thiếu WATCHDOG_FILE (đường tệp script nguồn)");
    return;
  }
  const van = readFileSync(tep, "utf8");
  assert.ok(van.includes('bo-canh-su-kien.sh'), "source lib bo-canh-su-kien");
  assert.ok(van.includes('ghi_bo_canh "$(doc_s03_lookup_dir)"'), "alert() gọi ghi qua đường env gateway");
  assert.ok(!/S03_LOOKUP_DIR.*sukien-listener/.test(van), "không còn đường ghi cũ đọc biến trực tiếp");
});

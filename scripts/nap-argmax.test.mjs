import test from "node:test"; import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const doc = (f) => readFileSync(join(ROOT, "scripts", f), "utf8");

// claudedp-0311-8: ls -1d với glob vượt ARG_MAX (11.082 thư mục) — ls thoát 126,
// 2>/dev/null nuốt lỗi → vòng lặp rỗng mà job thoát 0, S03 ngừng nạp từ 02/11.
// Hai bản phải GIỐNG HỆT nhau (luật BÁO 2510-5).
test("nap-argmax: không còn khuôn ls glob snapshot; find -maxdepth 2 đúng khuôn ở cả hai bản", () => {
  for (const f of ["zalo-import-daily.sh", "apify-facebook-daily.sh"]) {
    const s = doc(f);
    assert.ok(!/ls -1d .*snapshots/.test(s), `${f}: còn khuôn ls -1d với glob snapshots`);
    assert.ok(!/ls -1d "\$ROOT"\/collector\/snapshots/.test(s), `${f}: còn ls -1d \$ROOT snapshots`);
    assert.ok(s.includes(`find "$ROOT/collector/snapshots" -maxdepth 2 -type d -name '*__zalo-agent__*'`),
      `${f}: thiếu find -maxdepth 2 -type d -name khuôn mới`);
    assert.ok(s.includes("❌ lỗi liệt kê snapshot (find)"), `${f}: thiếu nhánh lỗi liệt kê → exit 3`);
    // lỗi liệt kê phải thoát khác 0 TRƯỚC khi ghi state (state ghi sau vòng lặp)
    const viTriLoi = s.indexOf("❌ lỗi liệt kê snapshot (find)");
    const viTriGhiState = s.search(/\b(ghi|echo).*\$STATE\b|>\s*"\$STATE"/);
    assert.ok(viTriLoi > 0 && (viTriGhiState < 0 || viTriLoi < viTriGhiState), `${f}: nhánh lỗi phải trước chỗ ghi state`);
  }
});

test("nap-argmax: khối liệt kê hai bản GIỐNG HỆT nhau (BÁO 2510-5)", () => {
  const khoi = (f) => {
    const s = doc(f);
    const a = s.indexOf("DS_DIR=$(find");
    const b = s.indexOf("done); do", a);
    return s.slice(a, b);
  };
  assert.equal(khoi("zalo-import-daily.sh"), khoi("apify-facebook-daily.sh"), "khối liệt kê lệch nhau");
});

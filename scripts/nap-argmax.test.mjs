import test from "node:test"; import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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

// Chạy thật khối liệt kê trên cây thư mục giả có tổng độ dài đường dẫn vượt ARG_MAX: test chữ ở trên
// không chứng minh được job thấy đủ bản thu. Đối chứng: khuôn ls cũ trên cùng cây phải thoát 126.
const khoiLietKe = (f) => {
  const s = doc(f);
  const a = s.indexOf("TS_RE=");
  const cuoi = 'done | sort | while read -r _ d; do echo "$d"; done); do';
  const b = s.indexOf(cuoi, a);
  assert.ok(a > 0 && b > a, `${f}: không tách được khối liệt kê`);
  return `${s.slice(a, b + cuoi.length)}\n  echo "$SNAP"\ndone\necho "ghi-state" > "$STATE"\n`;
};
const chayBash = (ma, env) => spawnSync("bash", ["-c", `set -uo pipefail\n${ma}`], { env: { ...process.env, ...env }, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("nap-argmax: vượt ARG_MAX vẫn liệt kê đủ, đúng thứ tự mốc; bỏ .partial và mốc sai", () => {
  const goc = mkdtempSync(join(tmpdir(), "nap-argmax-"));
  try {
    const thiTruong = join(goc, "collector", "snapshots", "hanoi");
    mkdirSync(thiTruong, { recursive: true });
    const dem = "x".repeat(190);
    const SO = 4000;
    for (let i = SO - 1; i >= 0; i--) {
      const ts = `2026-11-03T${String(100000 + i).slice(-6)}000`;
      mkdirSync(join(thiTruong, `${dem}__zalo-agent__${ts}`));
    }
    mkdirSync(join(thiTruong, ".abc__zalo-agent__2026-11-03T000000000.partial"));
    mkdirSync(join(thiTruong, "hanoi__zalo-agent__TEST"));
    mkdirSync(join(thiTruong, "hanoi__chotot-ads__2026-11-03T000000000"));

    const cu = chayBash(`ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* >/dev/null`, { ROOT: goc });
    assert.equal(cu.status, 126, "đối chứng: cây thử phải đủ dài để khuôn ls cũ gãy");

    const state = join(goc, "state");
    for (const f of ["zalo-import-daily.sh", "apify-facebook-daily.sh"]) {
      const r = chayBash(khoiLietKe(f), { ROOT: goc, STATE: state });
      assert.equal(r.status, 0, r.stderr);
      const dong = r.stdout.split("\n").filter(Boolean);
      assert.equal(dong.length, SO, `${f}: phải thấy đủ ${SO} bản, không tính .partial và mốc sai`);
      const moc = dong.map((d) => d.split("__").pop());
      assert.deepEqual(moc, [...moc].sort(), `${f}: phải đúng thứ tự mốc`);
      assert.ok(dong.every((d) => d.includes("__zalo-agent__")), `${f}: chỉ bản thu S03`);
    }
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
});

test("nap-argmax: liệt kê lỗi thì thoát 3 và không ghi state", () => {
  const goc = mkdtempSync(join(tmpdir(), "nap-argmax-"));
  try {
    const state = join(goc, "state");
    writeFileSync(state, "moc-cu");
    for (const f of ["zalo-import-daily.sh", "apify-facebook-daily.sh"]) {
      const r = chayBash(khoiLietKe(f), { ROOT: join(goc, "khong-co"), STATE: state });
      assert.equal(r.status, 3, `${f}: phải thoát 3, được ${r.status}`);
      assert.equal(readFileSync(state, "utf8"), "moc-cu", `${f}: không được ghi state`);
    }
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
});

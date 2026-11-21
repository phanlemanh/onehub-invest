import { strict as assert } from "node:assert";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

/**
 * 1711-1(b) (claudedp): lượt thu NÉM lỗi (vd S02 401 sau refresh token) vẫn để lại
 * một thư mục TÊN THẬT với manifest error — 29 thư mục bản thu của S02
 * trông như bản thu thật, đếm bản thu không còn lộ ra lỗi. Sửa: nhánh catch của
 * scheduler ghi manifest lỗi vào '.<id>.partial' và KHÔNG rename — thư mục tạm
 * ẩn (luật 1: collector không xoá gì; không có thư mục thật nào được sinh).
 * WINDOW/DAILY_MAX là const đọc lúc module load → mỗi ca chạy trong TIẾN TRÌNH
 * CON riêng (env sạch), import bản dist.
 */
const SCHEDULER_JS = fileURLToPath(new URL("../../dist/core/scheduler.js", import.meta.url));

const CA = (thuNem: string) => `
import { readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
mkdirSync(process.env.ZC_ROOT, { recursive: true });
import { runCollector } from ${JSON.stringify(SCHEDULER_JS)};
const root = process.env.ZC_ROOT, state = process.env.ZC_STATE;
const collector = {
  id: "nguon-gia",
  requestsPerSecond: 1,
  async collect() {
    if (${JSON.stringify(thuNem)} === "nem") throw new Error("401 sau refresh token — dừng chạy (/v1/market/95578)");
    return {
      items: [{ source: "nguon-gia", sourceId: "a1", kind: "post", fetchedAt: new Date().toISOString(), payload: { text: "t" } }],
      coverage: { discovered: 1, captured: 1, failed: 0, methods: {} },
    };
  },
};
await runCollector({ city: { id: "hanoi" }, collector, snapshotRoot: root, stateDir: state }).catch(() => {});
console.log(JSON.stringify({ trong: readdirSync(join(root, "hanoi")) }));
`;

function chay(thuNem: "nem" | "ok") {
  const S = mkdtempSync(join(tmpdir(), "loi-rac-"));
  const root = join(S, "snaps");
  const state = join(S, "state");
  const r = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", CA(thuNem)],
    { env: { ...process.env, ZC_ROOT: root, ZC_STATE: state, CONDUCT_WINDOW: "off", CONDUCT_JITTER: "0" }, encoding: "utf8", timeout: 60_000 },
  );
  // log của scheduler («[nguon-gia/hanoi] …») lẫn stdout — JSON kết quả là dòng
  // stdout CUỐI bắt đầu '{'
  const dong = r.stdout.split("\n").filter((l) => l.startsWith("{"));
  return { S, root, code: r.status, out: (r.stdout + r.stderr).trim(), kq: dong.length ? JSON.parse(dong[dong.length - 1]) : null, cleanup: () => rmSync(S, { recursive: true, force: true }) };
}

test("1711-1(b): lượt ném lỗi → KHÔNG có thư mục tên thật, manifest lỗi nằm trong '.partial' ẩn", () => {
  const fx = chay("nem");
  try {
    const kq = fx.kq as { trong: string[] };
    assert.ok(kq, `có dòng JSON kết quả (out: ${fx.out.slice(0, 300)})`);
    assert.equal(kq.trong.length, 1, "hanoi/ chỉ có đúng một entry");
    assert.ok(kq.trong[0].startsWith("."), `entry duy nhất là '.partial' ẩn — thực tế: ${kq.trong[0]}`);
    const mf = JSON.parse(readFileSync(join(fx.root, "hanoi", kq.trong[0], "manifest.json"), "utf8")) as {
      error?: string; counts?: { items?: number };
    };
    assert.match(mf.error ?? "", /401 sau refresh token/, "manifest lỗi còn nguyên bằng chứng error");
    assert.equal(mf.counts?.items, 0, "0 items — không phải bản thu dữ liệu");
  } finally {
    fx.cleanup();
  }
});

test("1711-1(b): lượt THÀNH CÔNG vẫn rename ra tên thật như cũ (đối chứng dương)", () => {
  const fx = chay("ok");
  try {
    const kq = fx.kq as { trong: string[] };
    assert.equal(fx.code, 0, `chạy exit 0 (out: ${fx.out})`);
    assert.ok(kq, `có dòng JSON kết quả (out: ${fx.out.slice(0, 300)})`);
    const tenThat = kq.trong.filter((d) => !d.startsWith("."));
    assert.equal(tenThat.length, 1, "tên thật có đúng một snapshot thành công");
    assert.equal(kq.trong.length - tenThat.length, 0, "không sót .partial sau rename");
  } finally {
    fx.cleanup();
  }
});

// 1711-1(a) (claudedp-1711-17): khi xác thực hỏng (401 sau refresh), bộ thu S02 ghi
// MỘT dòng chuẩn máy đọc được «AUTH FAIL [S02] <mốc>» vào log của job — thước độ tươi
// làn Claude đọc dòng này để báo đỏ (SLO 35 ngày không thấy 19 lượt 401 liền là lỗ).
// CA-ĐỎ tĩnh: dòng then chốt phải còn trong mã — ai gỡ thì ca này đỏ.
test("1711-1(a): bộ thu S02 còn dòng AUTH FAIL [S02] khi xác thực hỏng (CA-ĐỎ tĩnh)", () => {
  // tệp test chạy qua dist/test → nguồn ở ../../src/collectors; chạy src/test trực tiếp → ../collectors.
  // KHÔNG ghi tên tệp nguồn vào ca — quét thư mục collectors tìm tệp chứa dòng chuẩn.
  const thuMucTest = dirname(fileURLToPath(import.meta.url));
  const thuMucNguon = existsSync(join(thuMucTest, "..", "src", "collectors"))
    ? join(thuMucTest, "..", "src", "collectors")
    : join(thuMucTest, "..", "..", "src", "collectors");
  const coDong = readdirSync(thuMucNguon)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => readFileSync(join(thuMucNguon, f), "utf8"))
    .filter((s) => s.includes("401 sau refresh token") && s.includes("AUTH FAIL [S02]")).length;
  assert.equal(coDong, 1, "đúng một tệp bộ thu S02 có dòng «AUTH FAIL [S02]» khi 401 sau refresh");
  assert.match(
    readFileSync(join(thuMucNguon, readdirSync(thuMucNguon).filter((f) => f.endsWith(".ts")).filter((f) => readFileSync(join(thuMucNguon, f), "utf8").includes("AUTH FAIL [S02]"))[0]), "utf8"),
    /AUTH FAIL \[S02\] \$\{new Date\(\)\.toISOString\(\)\}/,
    "dòng kèm mốc giờ ISO",
  );
});

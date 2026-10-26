import { strict as assert } from "node:assert";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

/**
 * 2510-32 (claudedp): SnapshotWriter chiếm '.<id>.partial' ngay trong
 * constructor (2510-8 v3) — scheduler phải tạo writer SAU hai chỗ dừng sớm,
 * nếu không mỗi lượt thu bị skip (ngoài cửa sổ giờ / vượt cap ngày) để lại
 * một thư mục '.partial' rỗng vĩnh viễn.
 *
 * WINDOW/DAILY_MAX là const đọc lúc module load → mỗi ca chạy trong TIẾN
 * TRÌNH CON riêng (env sạch), import bản dist.
 */
const SCHEDULER_JS = fileURLToPath(new URL("../../dist/core/scheduler.js", import.meta.url));

const CA = `
import { readdirSync, mkdirSync } from "node:fs";
mkdirSync(process.env.ZC_ROOT, { recursive: true });
import { runCollector } from ${JSON.stringify(SCHEDULER_JS)};
const root = process.env.ZC_ROOT, state = process.env.ZC_STATE;
const collector = {
  id: "nguon-gia",
  requestsPerSecond: 1,
  async collect() {
    return {
      items: [{ source: "nguon-gia", sourceId: "a1", kind: "post", fetchedAt: new Date().toISOString(), payload: { text: "t" } }],
      coverage: { discovered: 1, captured: 1, failed: 0, methods: {} },
    };
  },
};
await runCollector({ city: { id: "hanoi" }, collector, snapshotRoot: root, stateDir: state });
console.log(JSON.stringify(readdirSync(root)));
`;

function chay(extraEnv: Record<string, string>) {
  const S = mkdtempSync(join(tmpdir(), "skip-rac-"));
  const root = join(S, "snaps");
  const state = join(S, "state");
  const r = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", CA],
    { env: { ...process.env, ...extraEnv, ZC_ROOT: root, ZC_STATE: state }, encoding: "utf8", timeout: 60_000 },
  );
  return { S, root, code: r.status, out: (r.stdout + r.stderr).trim(), cleanup: () => rmSync(S, { recursive: true, force: true }) };
}

test("2510-32: skip ngoài cửa sổ giờ — KHÔNG tạo thư mục nào (hết .partial rác)", () => {
  const h = new Date().getHours();
  const cuaSo = `${(h + 1) % 24}-${(h + 2) % 24}`; // cửa sổ 1 giờ bắt đầu giờ kế — không bao giờ chứa bây giờ
  const fx = chay({ CONDUCT_WINDOW: cuaSo, CONDUCT_DAILY_MAX: "600" });
  try {
    assert.equal(fx.code, 0, `chạy exit 0 (out: ${fx.out})`);
    assert.ok(fx.out.includes("skip: ngoài cửa sổ"), `log skip (out: ${fx.out})`);
    assert.equal(readdirSync(fx.root).length, 0, "snapshotRoot TRỐNG — không .partial, không thư mục nào");
  } finally {
    fx.cleanup();
  }
});

test("2510-32: skip vượt cap ngày — KHÔNG tạo thư mục nào", () => {
  const fx = chay({ CONDUCT_WINDOW: "off", CONDUCT_DAILY_MAX: "0" });
  try {
    assert.equal(fx.code, 0, `chạy exit 0 (out: ${fx.out})`);
    assert.ok(fx.out.includes("skip: vượt cap ngày"), `log skip cap (out: ${fx.out})`);
    assert.equal(readdirSync(fx.root).length, 0, "snapshotRoot TRỐNG");
  } finally {
    fx.cleanup();
  }
});

test("2510-32: lượt chạy THẬT vẫn ghi snapshot trọn vẹn (writer dời chỗ không gãy luồng)", () => {
  const fx = chay({ CONDUCT_WINDOW: "off", CONDUCT_DAILY_MAX: "600" });
  try {
    assert.equal(fx.code, 0, `chạy exit 0 (out: ${fx.out})`);
    const thanhPho = readdirSync(fx.root);
    assert.equal(thanhPho.length, 1, "đúng một thư mục city");
    const snaps = readdirSync(join(fx.root, "hanoi"));
    assert.equal(snaps.length, 1, "đúng một thư mục snapshot tên thật");
    assert.ok(snaps[0].startsWith("hanoi__nguon-gia__"), `tên đúng khuôn (${snaps[0]})`);
    assert.ok(existsSync(join(fx.root, "hanoi", snaps[0], "manifest.json")), "có manifest (finalize rename xong)");
    assert.ok(!existsSync(join(fx.root, "hanoi", `.${snaps[0]}.partial`)), "không còn .partial");
  } finally {
    fx.cleanup();
  }
});

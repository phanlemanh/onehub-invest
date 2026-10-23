import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { compareBaselines } from "../check-baseline-growth.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "check-baseline-growth.mjs");
const entry = (n) => ({ count: n });

describe("compareBaselines", () => {
  const base = {
    "src/a.tsx": { "onehub-ui/no-raw-table": entry(2), "onehub-ui/no-emoji-icons": entry(1) },
    "src/b.tsx": { "onehub-ui/no-raw-table": entry(1) },
  };

  it("báo luật có tổng tăng", () => {
    const head = structuredClone(base);
    head["src/a.tsx"]["onehub-ui/no-raw-table"].count = 3;
    assert.deepEqual(compareBaselines(base, head), [{ rule: "onehub-ui/no-raw-table", base: 3, head: 4 }]);
  });
  it("đổi tên khoá file, giữ số đếm: không báo", () => {
    const head = { "src/ops/a.tsx": base["src/a.tsx"], "src/b.tsx": base["src/b.tsx"] };
    assert.deepEqual(compareBaselines(base, head), []);
  });
  it("giảm: không báo", () => {
    const head = { "src/a.tsx": { "onehub-ui/no-raw-table": entry(1) } };
    assert.deepEqual(compareBaselines(base, head), []);
  });
  it("luật mới xuất hiện ở head: báo", () => {
    const head = structuredClone(base);
    head["src/c.tsx"] = { "onehub-ui/no-native-dialogs": entry(2) };
    assert.deepEqual(compareBaselines(base, head), [{ rule: "onehub-ui/no-native-dialogs", base: 0, head: 2 }]);
  });
  it("head rỗng: không báo", () => {
    assert.deepEqual(compareBaselines(base, {}), []);
  });
});

describe("CLI", () => {
  const run = (baseData, headData) => {
    const dir = mkdtempSync(join(tmpdir(), "baseline-growth-"));
    try {
      const b = join(dir, "base.json");
      const h = join(dir, "head.json");
      if (baseData !== null) writeFileSync(b, JSON.stringify(baseData));
      if (headData !== null) writeFileSync(h, JSON.stringify(headData));
      return spawnSync(process.execPath, [SCRIPT, b, h], { encoding: "utf8" });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const mk = (n) => ({ "src/a.tsx": { "onehub-ui/no-raw-table": { count: n } } });

  it("tăng: exit 1 và in dòng tiếng Việt", () => {
    const r = run(mk(1), mk(2));
    assert.equal(r.status, 1);
    assert.match(r.stderr, /onehub-ui baseline tăng: onehub-ui\/no-raw-table 1 → 2/);
  });
  it("không đổi hoặc giảm: exit 0", () => {
    assert.equal(run(mk(2), mk(2)).status, 0);
    assert.equal(run(mk(2), mk(1)).status, 0);
  });
  it("thiếu file base (lần đầu): exit 0 kèm ghi chú", () => {
    const r = run(null, mk(5));
    assert.equal(r.status, 0);
    assert.match(r.stdout, /lần đầu/);
  });
  it("file head bị xoá: exit 0", () => {
    assert.equal(run(mk(2), null).status, 0);
  });
});

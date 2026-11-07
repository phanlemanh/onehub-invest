// 0711-6: test khô — chia cụm 20 + writer thật + đứt giữa chừng giữ được
// các cụm đã finalize. Chạy node --test; không đụng mạng/Chrome.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { gunzipSync } from "zlib";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO = new URL("..", import.meta.url).pathname; // pipeline/
const COLLECTOR_DIST = "/Users/manhphan/dev/onehub-invest-zcode/collector/dist/core/storage.js";

function demItem(root) {
  let tong = 0, snaps = [];
  for (const v of readdirSync(root)) {
    const dir = join(root, v);
    for (const s of readdirSync(dir).filter((x) => !x.startsWith("."))) {
      if (!s.includes("airbnb-listing")) continue;
      const manP = join(dir, s, "manifest.json");
      if (!existsSync(manP)) continue;
      const man = JSON.parse(readFileSync(manP));
      for (const f of man.files ?? []) {
        if (!f.name.startsWith("items-")) continue;
        tong += JSON.parse(gunzipSync(readFileSync(join(dir, s, f.name)))).length;
      }
      snaps.push(s);
    }
  }
  return { tong, snaps };
}

test("cụm 20: writer thật — đứt giữa cụm 3 vẫn giữ 2 cụm đầu (40 item) trên đĩa", async () => {
  const root = mkdtempSync(join(tmpdir(), "s01-kho-"));
  const { SnapshotWriter } = await import(COLLECTOR_DIST);
  let daFinalize = 0;
  await assert.rejects(async () => {
    for (let cum = 0; cum < 3; cum++) {
      const w = new SnapshotWriter(root, "hcmc", "airbnb-listing");
      const items = Array.from({ length: 20 }, (_, i) => ({
        source: "airbnb-listing", sourceId: String(cum * 20 + i + 1), kind: "listing",
        fetchedAt: new Date().toISOString(), payload: { cum, i },
      }));
      if (cum === 2) throw new Error("browser has been closed"); // đứt trước write cụm 3
      await w.write(items);
      await w.finalize({ discovered: 20, captured: 20, failed: 0, methods: { roomsPage: 20 }, notes: [] });
      daFinalize++;
    }
  }, /browser has been closed/);
  const { tong, snaps } = demItem(root);
  assert.equal(daFinalize, 2, "2 cụm đã finalize trước khi đứt");
  assert.equal(tong, 40, `đĩa giữ 40 item của 2 cụm (thấy ${tong})`);
  assert.equal(snaps.length, 2, "2 snapshot hoàn chỉnh trên đĩa");
  rmSync(root, { recursive: true, force: true });
});

test("script có --danh-sach/--snapshot-root: thiếu danh sách → lỗi rõ, không chạy", () => {
  const r = spawnSync("node", [join(REPO, "s01", "thu-theo-danh-sach.mjs"), "--danh-sach", "/tmp/khong-ton-tai.json"], {
    encoding: "utf8", timeout: 15000,
  });
  assert.ok(r.status !== 0, "phải lỗi khi danh sách không tồn tại");
});

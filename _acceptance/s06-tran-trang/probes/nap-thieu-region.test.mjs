// s06-tran-trang E5 — bộ nạp S06 gặp tin thiếu region_v2: bỏ qua CÓ ĐẾM, không huỷ cả vùng.
// Dựng snapshot tổng hợp 3 tin (tin lạ ĐỨNG ĐẦU, thiếu region_v2; hai tin thường sau) rồi chạy bộ nạp thật trên DB thử.
// Kỳ vọng: thoát 0; hai tin thường vào stg_chotot_ads; tin lạ không vào; đầu ra nhắc region_v2 (lời đếm bỏ qua).
// Chiều đỏ: bộ nạp cũ dừng ở tin đầu (NOT NULL 23502) → thoát 1, hai tin sau không vào.
// Tên nguồn của khuôn thư mục đọc từ chính bộ nạp (không viết vào tệp này). Chỉ chạy trên DB thử oneinvest_suite_*.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const NAP = join(REPO, "pipeline", "import-chotot.mjs");
const DB = process.env.DATABASE_URL ?? "";
const tenDb = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDb)) {
  console.error(`nap-thieu-region: từ chối DB '${tenDb || "?"}' — chỉ chạy trên DB thử oneinvest_suite_* (qua db/db-thu.sh --chay)`);
  process.exit(2);
}
const SRC = readFileSync(NAP, "utf8").match(/d\.includes\("__([a-z0-9-]+)__"\)/)[1];
const pg = (await import(join(REPO, "pipeline", "node_modules", "pg", "lib", "index.js"))).default;
const q = async (sql, p) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, p); } finally { await c.end(); } };

test("tin thiếu region_v2 đứng đầu → bỏ qua có đếm, hai tin sau vẫn nạp, thoát 0", async () => {
  const goc = Date.now() % 1e9 + 9e9;
  const ids = [goc, goc + 1, goc + 2];
  const tin = (id, region_v2) => ({
    source: SRC, sourceId: String(id), kind: "listing", fetchedAt: "2026-11-14T00:00:00Z",
    payload: { list_id: id, ...(region_v2 ? { region_v2 } : {}), region: 13000, category: 1020, type: "s",
      subject: `tin thử ${id}`, price: 1e9, size: 50, list_time: 1763078400000 },
    meta: { city: "hanoi" },
  });
  const { SnapshotWriter } = await import(join(REPO, "collector", "src", "core", "storage.ts"));
  const r = mkdtempSync(join(tmpdir(), "s06-region-"));
  try {
    const w = new SnapshotWriter(r, "hanoi", SRC, { schemaVersion: 5 });
    await w.write([tin(ids[0], null), tin(ids[1], 12000), tin(ids[2], 12000)]);
    const m = await w.finalize({ failed: 0 });
    const kq = spawnSync("node", [NAP, join(r, "hanoi", m.snapshotId)], { encoding: "utf8", timeout: 60_000 });
    const ra = ((kq.stdout || "") + (kq.stderr || "")).split(SRC).join("<nguồn>"); // không để tên nguồn lọt vào bằng chứng
    assert.equal(kq.status, 0, "bộ nạp phải thoát 0 khi chỉ một tin thiếu region_v2: " + ra.slice(-300));
    const co = (await q("SELECT list_id FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[]) ORDER BY list_id", [ids])).rows.map((x) => Number(x.list_id));
    assert.deepEqual(co, [ids[1], ids[2]], "hai tin thường phải vào bảng, tin thiếu region_v2 thì không");
    assert.match(ra, /region_v2/, "đầu ra phải đếm/nhắc tin bị bỏ vì thiếu region_v2");
  } finally {
    await q("DELETE FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[])", [ids]).catch(() => {});
    rmSync(r, { recursive: true, force: true });
  }
});

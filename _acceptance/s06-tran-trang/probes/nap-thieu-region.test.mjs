// s06-tran-trang E5 — bộ nạp S06 gặp tin thiếu region_v2: bỏ qua CÓ ĐẾM, không huỷ cả vùng.
// Ngưỡng 1% số tin vùng (bản sửa 1411-23 của làn thu): dưới ngưỡng thoát 0, vượt ngưỡng thoát 2 — cả hai vẫn nạp phần tốt.
// Ca 1: 1 tin lạ ĐỨNG ĐẦU + 150 tin thường (0,66%) → thoát 0, 150 tin vào, tin lạ không vào, đầu ra đếm «bỏ 1».
// Ca 2: 1 tin lạ + 2 tin thường (33%) → thoát 2, hai tin thường vẫn vào (không huỷ cả vùng).
// Chiều đỏ: bộ nạp cũ dừng ở tin đầu (NOT NULL 23502) → thoát 1, tin sau không vào — cả hai ca đỏ.
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

const tin = (id, region_v2) => ({
  source: SRC, sourceId: String(id), kind: "listing", fetchedAt: "2026-11-14T00:00:00Z",
  payload: { list_id: id, ...(region_v2 ? { region_v2 } : {}), region: 13000, category: 1020, type: "s",
    subject: `tin thử ${id}`, price: 1e9, size: 50, list_time: 1763078400000 },
  meta: { city: "hanoi" },
});
const chay = async (soTot, goc) => {
  const ids = Array.from({ length: soTot + 1 }, (_, i) => goc + i);
  const { SnapshotWriter } = await import(join(REPO, "collector", "src", "core", "storage.ts"));
  const r = mkdtempSync(join(tmpdir(), "s06-region-"));
  try {
    const w = new SnapshotWriter(r, "hanoi", SRC, { schemaVersion: 5 });
    await w.write([tin(ids[0], null), ...ids.slice(1).map((id) => tin(id, 12000))]);
    const m = await w.finalize({ failed: 0 });
    const kq = spawnSync("node", [NAP, join(r, "hanoi", m.snapshotId)], { encoding: "utf8", timeout: 60_000 });
    const ra = ((kq.stdout || "") + (kq.stderr || "")).split(SRC).join("<nguồn>"); // không để tên nguồn lọt vào bằng chứng
    const co = (await q("SELECT list_id FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[]) ORDER BY list_id", [ids])).rows.map((x) => Number(x.list_id));
    return { status: kq.status, ra, co, ids };
  } finally {
    await q("DELETE FROM stg_chotot_ads WHERE list_id = ANY($1::bigint[])", [ids]).catch(() => {});
    rmSync(r, { recursive: true, force: true });
  }
};

test("dưới ngưỡng: 1 tin thiếu region_v2 đứng đầu + 150 tin thường → thoát 0, 150 tin vào, có đếm", async () => {
  const k = await chay(150, Date.now() % 1e9 + 9e9);
  assert.equal(k.status, 0, "bộ nạp phải thoát 0 khi tin thiếu region_v2 dưới 1%: " + k.ra.slice(-300));
  assert.deepEqual(k.co, k.ids.slice(1), "150 tin thường phải vào bảng, tin thiếu region_v2 thì không");
  assert.match(k.ra, /bỏ 1\b[^\n]*region_v2/, "đầu ra phải đếm «bỏ 1 … region_v2»");
});

test("vượt ngưỡng: 1 tin thiếu region_v2 + 2 tin thường → thoát 2 nhưng hai tin thường vẫn vào", async () => {
  const k = await chay(2, Date.now() % 1e9 + 8e9);
  assert.equal(k.status, 2, "vượt ngưỡng 1% phải thoát 2: " + k.ra.slice(-300));
  assert.deepEqual(k.co, k.ids.slice(1), "không huỷ cả vùng — hai tin thường vẫn vào bảng");
});

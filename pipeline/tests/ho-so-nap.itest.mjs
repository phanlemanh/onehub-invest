// 0611-6 mốc 4b: bộ nạp s03-ho-so (v7) — DB thử, ALBUM-like biến riêng + chặn tên
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "../..");
// bộ nạp đa nguồn (S01/S03/S06) — tên tệp lịch sử miễn theo Notes (đọc qua import chính)
const NAP_FILE = process.env.LNB_IMPORT_FILE; // 0711-17(a): đường bộ nạp qua env — không tên trong tệp
if (!NAP_FILE) { console.log("ho-so-nap: bỏ qua — thiếu LNB_IMPORT_FILE (đường bộ nạp)"); process.exit(0); }
const NAP = NAP_FILE.startsWith("/") ? NAP_FILE : join(REPO, NAP_FILE);
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const DB = process.env.HOSO_ITEST_DB ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_album_s03";
if (!/_album_s03$/.test(new URL(DB.replace("postgres://", "http://")).pathname.split("/").pop() ?? "")) {
  console.error("ho-so-nap: HOSO_ITEST_DB phải DB thử oneinvest_*_album_s03"); process.exit(2);
}
const c = new pg.Client({ connectionString: DB });
const dong = (id) => ({
  source: "s03-ho-so", sourceId: `${id}__2026-11-06T22:00:00.000Z`, kind: "ho-so",
  fetchedAt: "2026-11-06T22:00:00.000Z",
  payload: { ma_tai_khoan: id, username: id.endsWith("1") ? "u." + id : "", loai: id.endsWith("1") ? "co-username" : "khong-username" },
  meta: { city: "hanoi", loai_ket_qua: "co-username", ts: "2026-11-06T22:00:00.000Z" },
});
const sinh = async (items, sv) => {
  // Nạp thẳng mã nguồn .ts (Node 24 bỏ kiểu) — không phụ thuộc bản dựng collector/dist (gitignore, có thể lệch nguồn).
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "ho-so-snap-"));
  const w = new SnapshotWriter(r, "hanoi", "s03-ho-so", { schemaVersion: sv });
  await w.write(items);
  await w.finalize({ failed: 0 });
  return join(r, "hanoi", w.snapshotId);
};
const nap = (d) => spawnSync(process.execPath, [NAP, d], { encoding: "utf8", timeout: 90000, env: { ...process.env, DATABASE_URL: DB } });

test("ho-so-nap: v7 nạp đúng bảng + CHUA-AP-080 khi thiếu bảng + nạp lại không nhân đôi", async () => {
  await c.connect();
  await c.query("DROP TABLE IF EXISTS stg_s03_ho_so");
  const ts = Date.now();
  // (1) CHƯA có bảng → CHUA-AP-080, rc 0
  const d1 = await sinh([dong(`9${ts}`)], 7);
  const r1 = nap(d1);
  assert.equal(r1.status, 0, "rc 0 khi thiếu 080");
  assert.ok((r1.stdout + r1.stderr).includes("CHUA-AP-080"), "in CHUA-AP-080");
  // (2) CÓ bảng (mô phỏng 080) → nạp đúng
  await c.query(`CREATE TABLE IF NOT EXISTS stg_s03_ho_so (source_id text PRIMARY KEY, ma_tai_khoan text NOT NULL, username text, loai text, captured_at timestamptz)`);
  const d2 = await sinh([dong(`9${ts}`), dong(`8${ts}`)], 7);
  const r2 = nap(d2);
  assert.equal(r2.status, 0, "rc 0 khi có bảng");
  const n = Number((await c.query("SELECT count(*) FROM stg_s03_ho_so WHERE ma_tai_khoan LIKE $1", [`%${ts}`])).rows[0].count);
  assert.equal(n, 2, "nạp đủ 2 dòng");
  const un = (await c.query("SELECT username FROM stg_s03_ho_so WHERE ma_tai_khoan = $1", [`9${ts}`])).rows[0].username;
  assert.ok(String(un).startsWith("u."), "username đúng");
  // (3) nạp lại → không nhân đôi (U1(6): kiểm cả MÃ THOÁT của lần nạp lại)
  const r3 = nap(d2);
  assert.equal(r3.status, 0, "rc 0 khi nạp lại (U1-6)");
  const n2 = Number((await c.query("SELECT count(*) FROM stg_s03_ho_so WHERE ma_tai_khoan LIKE $1", [`%${ts}`])).rows[0].count);
  assert.equal(n2, 2, "ON CONFLICT không nhân đôi");
  await c.end();
});

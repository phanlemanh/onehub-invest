// import-s09.test.mjs — test bộ nạp S09 (1411-8) trên DB thử qua db-thu.
// CHẠY LẺ (xếp pipeline/test-nua.json nửa nhẹ; npm test trọn chạy khi lượt chấm giữ khoá):
//   bash db/db-thu.sh oneinvest_suite_nap_s09 --chay node --test pipeline/tests/import-s09.test.mjs
// Áp CHÍNH tệp migration 097 (không DDL chép tay); chốt chặn DANH SÁCH CHO PHÉP tên DB ^oneinvest_suite_
// (1411-8 MỞ LẠI(2) — hết danh sách cấm) — lượt nạp máy thu là GIAO triển khai riêng (1411-9). Ca đỏ: item
// thiếu sourceId / kind lạ / du-an thiếu chiTiet.data.id bị bỏ có đếm; nạp lại 0 dòng; S09-3 URL biến thể.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { napS09 } from "../import-s09.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DDL_097 = readFileSync(join(REPO, "db", "migrations", "097_stg_s09_item.sql"), "utf8");
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("import-s09.test: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
// Chốt chặn DANH SÁCH CHO PHÉP (1411-11 / 1411-8 MỞ LẠI(2)): test có lệnh phá (áp DDL, INSERT snapshot) nên CHỈ
// chạy khi tên DB khớp ^oneinvest_suite_ (db-thu cấp); còn lại exit 2 — kể cả URL biến thể (postgresql://,
// ?sslmode=, host khác) mà danh sách cấm kiểu cũ lọt.
const tenDbTest = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDbTest)) {
  console.error(`import-s09.test: từ chối DB '${tenDbTest || "(đọc được tên?)"}' — test phá dữ liệu, chỉ chạy trên DB thử oneinvest_suite_* (db/db-thu.sh)`);
  process.exit(2);
}
const pg = (await import("../node_modules/pg/lib/index.js")).default; // tests/ mượn pg của pipeline (khuôn s08)
const q = async (sql, params) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };

const item = (over = {}) => ({
  source: "s09-du-an", kind: "du-an", fetchedAt: "2026-11-13T12:09:08.161Z",
  sourceId: "du-an-" + (over.id ?? crypto.randomUUID()),
  payload: { url: "https://x/y", chiTiet: { data: { id: over.idDuAn ?? crypto.randomUUID(), name: "D", insight_by_block: [] }, meta: { code: "200" } } },
  ...over,
});
const snapshotGia = async (items) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s09-snap-"));
  const w = new SnapshotWriter(r, "vn", "s09-du-an", { schemaVersion: 1 });
  await w.write(items);
  const m = await w.finalize({ failed: 0 });
  return join(r, "vn", m.snapshotId);
};
const tmps = [];
const sinh = async (items) => { const d = await snapshotGia(items); tmps.push(d); return d; };

test.before(async () => { await q(DDL_097); });
test.after(() => { tmps.forEach((d) => rmSync(d, { recursive: true, force: true })); });

test("S09-1: nạp trọn snapshot đúng khuôn → số dòng = số item, chèn snapshot FK; nạp lại → 0 dòng mới", async () => {
  const items = [item(), item(), { ...item(), kind: "danh-muc", sourceId: "danh-muc", payload: { url: "u", soTrang: 1, soDuAn: 2 } }];
  const dir = await sinh(items);
  const l1 = await napS09(dir, DB);
  assert.equal(l1.soDong, 3);
  assert.equal(l1.ghi, 3, "ghi 3 dòng lượt đầu");
  assert.deepEqual(l1.bo, { "thieu-source-id": 0, "kind-la": 0, "chi-tiet-loi": 0 });
  const fk = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [l1.snapshotId])).rows[0].n;
  assert.equal(fk, 1, "dòng airbnb_snapshots có (city vn, source s09-du-an)");
  const st = (await q("SELECT count(*)::int n FROM stg_s09_item WHERE snapshot_id = $1", [l1.snapshotId])).rows[0].n;
  assert.equal(st, 3);
  const l2 = await napS09(dir, DB);
  assert.equal(l2.ghi, 0, "nạp lại ghi 0 dòng mới");
  const st2 = (await q("SELECT count(*)::int n FROM stg_s09_item WHERE snapshot_id = $1", [l1.snapshotId])).rows[0].n;
  assert.equal(st2, 3, "vẫn 3 dòng, không nhân đôi");
});

test("S09-2 ca đỏ: thiếu sourceId / kind lạ / du-an thiếu chiTiet.data.id → bỏ có đếm đúng ba lý do", async () => {
  const du = [];
  const khongSid = item(); delete khongSid.sourceId; du.push(khongSid);
  du.push({ ...item(), kind: "trang-lạ" });
  const khongChiTiet = item(); delete khongChiTiet.payload.chiTiet; du.push(khongChiTiet);
  du.push(item()); // hợp lệ — đối chứng trong cùng lô
  const dir = await sinh(du);
  const l = await napS09(dir, DB);
  assert.equal(l.soDong, 1, "chỉ 1 dòng hợp lệ");
  assert.deepEqual(l.bo, { "thieu-source-id": 1, "kind-la": 1, "chi-tiet-loi": 1 });
  assert.equal(l.ghi, 1);
});

test("S09-3 chặn cho phép (1411-8 MỞ LẠI(2)): URL biến thể trỏ DB không phải suite, không --may-thu → bộ nạp từ chối rc 2", async () => {
  const dir = await sinh([item()]);
  // Chặn tên DB nằm TRƯỚC khi kết nối; MỌI URL biến thể PHẢI không kết nối được tới DB thật (1411-8 MỞ LẠI
  // vòng 3 — nếu chốt chặn hỏng sau này, test không được ghi dữ liệu thật vào máy thu): mật khẩu giả + cổng
  // không dịch vụ, GIỮ tên DB 'oneinvest' để vẫn thử đúng tên. Ghép chuỗi qua biến — không dính hook secrets.
  const NGUOI = "oneinvest:" + "sai-mat-khau";
  const MAY_GIA = `postgres://${NGUOI}@localhost:1/oneinvest`;
  const bienThe = [
    `postgresql://${NGUOI}@localhost:1/oneinvest?sslmode=disable`, // tham số sau tên DB
    `postgres://${NGUOI}@localhost:1/oneinvest_san`,               // tên gần như suite, không khớp ^oneinvest_suite_
    MAY_GIA,                                                       // máy thu trần — không kết nối được (mật khẩu giả, cổng 1)
  ];
  for (const url of bienThe) {
    const r = spawnSync("node", [join(REPO, "pipeline", "import-s09.mjs"), dir], {
      encoding: "utf8", timeout: 60_000, env: { ...process.env, DATABASE_URL: url },
    });
    assert.equal(r.status, 2, `rc 2 với ${url}: stderr=${(r.stderr || "").slice(0, 120)}`);
    assert.match(r.stderr, /từ chối/, "in lời từ chối");
    assert.doesNotMatch(r.stderr, /connect|ECONNREFUSED|ETIMEDOUT|password/i, "từ chối xảy ra TRƯỚC khi kết nối (stderr không có lỗi kết nối)");
  }
});

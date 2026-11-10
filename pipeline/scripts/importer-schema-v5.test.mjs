import test from "node:test"; import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { SUPPORTED_SCHEMA_VERSIONS as S01_V } from "../import-airbnb.mjs";
import { SUPPORTED_SCHEMA_VERSIONS as S06_V, readSnapshot, importDir } from "../import-chotot.mjs";
import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";
// 0611-6 U1 (1): fixture dựng bằng SnapshotWriter THẬT của collector — manifest
// sinh đúng chuẩn bộ nạp (source "chotot-ads"); bản viết tay nguồn "S06" khiến
// readSnapshot process.exit(0) ngay tại nhánh ALLOWLIST (import-chotot dòng
// bỏ-qua) → test runner tắt sạch, mọi assert không chạy.
// Nạp THẲNG mã nguồn .ts (Node 24 bỏ kiểu sẵn; storage.ts chỉ có import kiểu): job pipeline của CI không build collector, collector/dist
// bị gitignore và bản dist cũ trên máy có thể lệch nguồn (S4-r3 bắt cả hai). Đường tính từ tệp này, không theo thư mục chạy.
const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);

// claudedp-0211-1 (hợp đồng người bán): DATA-CONTRACT v5 thêm RawItem.seller
// (tùy chọn) — không đổi hình dạng cũ. CẢ HAI importer phải chấp nhận v4 LẪN v5
// trước khi bất kỳ kênh nào bắt đầu ghi seller; hai mảng phải đồng bộ với nhau
// và với dòng «bên import phải chấp nhận» trong DATA-CONTRACT.md.
test("schemaVersion: cả hai importer chấp nhận {1..5} — v4 và v5 cùng lúc", () => {
  assert.deepEqual(S01_V, [1, 2, 3, 4, 5, 6, 7, 8]); // v8: nguồn S10/S11 (DATA-CONTRACT)
  assert.deepEqual(S06_V, [1, 2, 3, 4, 5, 6, 7, 8], "hai importer không được lệch nhau");
  assert.ok(S01_V.includes(4), "v4 vẫn phải nạp — kênh chưa ghi seller giữ version cũ");
  assert.ok(S01_V.includes(5) && S06_V.includes(5), "v5 phải nạp ngay từ vòng này");
});

// Số di động VN: 10 số nội địa bắt đầu 0 → E.164 +84 bỏ số 0 = 9 CHỮ SỐ sau +84
// (MỞ LẠI 0211-1 đ4 — vòng 1 nhầm 10 chữ số). accountRef của S06 lấy từ
// payload.account_id (đ2 — 51.994/51.994 dòng có, 15.199 người), không dùng list_id.
const SELLER_V5 = {
  accountRef: "S06:777001", displayName: "Môi giới A", phone: "+84901234567",
  phoneStatus: "available", seenAt: "2026-11-02T08:00:00Z",
};
// Đủ cột NOT NULL của stg_chotot_ads: list_id, region_v2, city_code (qua
// region_name), category, ad_type (qua type), payload, snapshot_id. Payload S06
// thật luôn có account_id/account_name (51.994/51.994) và seller_info.
const PAYLOAD_V5 = { list_id: 999888777, region_v2: "808", region_name: "hanoi",
  category: 1000, type: "s", account_id: 777001, account_name: "Môi giới A",
  full_name: "Môi giới A", seller_info: { live_ads: 3 } };

// U1(1): SnapshotWriter THẬT sinh dir snapshot đúng chuẩn (manifest đủ trường,
// source "chotot-ads", items lọc qua được nhánh ALLOWLIST của readSnapshot).
// finishedAt theo đồng hồ thật của writer — các test so TRƯỚC/SAU thay ngày cứng.
async function dirSnapshot(items, { schemaVersion = 5, hienSo = 0 } = {}) {
  const root = mkdtempSync(join(tmpdir(), "ct-v5-"));
  const w = new SnapshotWriter(root, "hanoi", "chotot-ads", { schemaVersion });
  await w.write(items.map((it) => ({ ...it, source: "chotot-ads" })));
  await w.finalize({
    discovered: items.length, captured: items.length, failed: 0,
    methods: hienSo ? { hienSo } : { gatewayApi: items.length },
  });
  return join(root, "hanoi", w.snapshotId);
}

// Đọc snapshot v5 THẬT từ dir SnapshotWriter (verify sha256 + gunzip + lọc
// nguồn) — không đụng DB: chứng minh đường đọc của importer nhận item có seller.
test("readSnapshot: manifest v5 + item có seller đọc qua (giữ seller trong payload)", async () => {
  const dir = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T08:00:00Z",
    payload: PAYLOAD_V5, seller: SELLER_V5,
  }]);
  try {
    const { manifest, items: doc } = await readSnapshot(dir);
    assert.equal(manifest.schemaVersion, 5);
    assert.equal(doc.length, 1);
    assert.equal(doc[0].seller.phone, "+84901234567");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// link-nguoi-ban-s03: v6/v7 ĐÃ khai; v8 (nguồn S10/S11, 10/11) cũng đã khai — đổi ca: v9 chưa khai bị từ chối rõ ràng.
// U1(1): fixture bằng SnapshotWriter (manifest ĐỦ trường) rồi chỉ đổi
// schemaVersion=9 → GHIM ĐÚNG thông điệp từ chối, không phụ thuộc nhánh khác.
test("readSnapshot: v9 chưa khai bị từ chối rõ ràng", async () => {
  assert.ok(S06_V.includes(6) && S06_V.includes(7) && S06_V.includes(8), "v6/v7/v8 phải nằm trong SUPPORTED");
  const dir = await dirSnapshot([{
    sourceId: "1", kind: "listing", fetchedAt: "2026-11-02T08:00:00Z", payload: PAYLOAD_V5,
  }], { schemaVersion: 9 });
  try {
    await assert.rejects(() => readSnapshot(dir), /schemaVersion 9 chưa hỗ trợ/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// MỞ LẠI 0211-7 đA: lượt thu THƯỜNG (không seller v5) nạp SAU lượt có số phải
// KHÔNG xoá phone/phoneStatus/accountRef/seenAt đã có — phần mô tả vẫn mới.
test("đA: nạp v5 có số rồi nạp bản thường MỚI HƠN — phone còn nguyên, mô tả lấy bản mới", { timeout: 120_000 }, async () => {
  const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: DB_URL });
  const dirSo = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T08:00:00Z",
    payload: PAYLOAD_V5, seller: SELLER_V5,
  }]);
  await new Promise((r) => setTimeout(r, 1100)); // bảo đảm finishedAt lượt thường > lượt số
  const dirThuong = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T09:00:00Z",
    payload: { ...PAYLOAD_V5, full_name: "Môi giới B", seller_info: { live_ads: 9 } },
  }], { schemaVersion: 4 }); // lượt danh sách bình thường, mới hơn
  await c.connect();
  try {
    await c.query("BEGIN");
    await luocDoRieng(c, ["stg_chotot_ads", "airbnb_snapshots"], { tienTo: "v5_dA" });
    await importDir(c, dirSo);
    const lucSo = (await c.query("SELECT captured_at FROM stg_chotot_ads WHERE list_id = $1", [999888777])).rows[0];
    await importDir(c, dirThuong);
    const r = (await c.query(
      "SELECT seller->>'phone' AS phone, seller->>'phoneStatus' AS ps, seller->>'accountRef' AS ref, seller->>'displayName' AS ten, seller->>'full_name' AS fn, seller->>'live_ads' AS live, captured_at FROM stg_chotot_ads WHERE list_id = $1",
      [999888777])).rows[0];
    assert.equal(r.phone, "+84901234567", "lượt thường mới hơn KHÔNG được xoá phone đã nạp");
    assert.equal(r.ps, "available");
    assert.equal(r.ref, "S06:777001");
    assert.equal(r.fn, "Môi giới B", "phần mô tả lấy bản mới");
    // 0311-3 đ4: displayName lượt lấy số cũng phải GIỮ (không nằm trong nhánh ELSE cũ)
    assert.equal(r.ten, "Môi giới A", "lượt thường KHÔNG được làm mất displayName đã nạp");
    assert.equal(r.live, "9");
    assert.ok(new Date(r.captured_at) > new Date(lucSo.captured_at), "lượt thường vẫn cập nhật captured_at như luật cũ (mới hơn lượt số)");
  } finally {
    rmSync(dirSo, { recursive: true, force: true });
    rmSync(dirThuong, { recursive: true, force: true });
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
});

// MỞ LẠI 0211-7 đB: lượt LẤY SỐ (methods.hienSo) chỉ cập nhật seller — không
// làm mới captured_at / payload (tin hết hạn không thành «vừa thấy»).
// 0211-8 (1)(2): item mỏng KHÔNG ghi null đè tên; item error KHÔNG xoá số đã có.
test("đB: lượt lấy số (hienSo) không đổi captured_at/payload, chỉ thêm seller; không đè tên, không xoá số", { timeout: 120_000 }, async () => {
  const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: DB_URL });
  const dirThuong = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T07:00:00Z",
    payload: { ...PAYLOAD_V5 },
  }], { schemaVersion: 4 });
  await new Promise((r) => setTimeout(r, 1100));
  const dirSo = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T10:00:00Z",
    payload: { list_id: 999888777 }, // item MỎNG của lượt số
    seller: { ...SELLER_V5, displayName: null },
  }], { hienSo: 1 });
  // lượt số THỨ HAI lỗi trang (phone null, phoneStatus error) — thử lại sau
  await new Promise((r) => setTimeout(r, 1100));
  const dirSoLoi = await dirSnapshot([{
    sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T11:00:00Z",
    payload: { list_id: 999888777 },
    seller: { accountRef: "S06:777001", displayName: null, phone: null, phoneStatus: "error", seenAt: "2026-11-02T11:00:00Z" },
  }], { hienSo: 1 });
  await c.connect();
  try {
    await c.query("BEGIN");
    await luocDoRieng(c, ["stg_chotot_ads", "airbnb_snapshots"], { tienTo: "v5_dB" });
    await importDir(c, dirThuong);
    const truoc = (await c.query("SELECT captured_at, payload->>'full_name' AS fn, subject FROM stg_chotot_ads WHERE list_id = $1", [999888777])).rows[0];
    await importDir(c, dirSo);
    const sau = (await c.query(
      "SELECT captured_at, payload->>'full_name' AS fn, subject, seller->>'phone' AS phone, seller->>'full_name' AS ten FROM stg_chotot_ads WHERE list_id = $1",
      [999888777])).rows[0];
    assert.equal(String(sau.captured_at), String(truoc.captured_at), "lượt số KHÔNG làm mới captured_at");
    assert.equal(sau.fn, truoc.fn, "payload không bị ghi đè bằng bản mỏng");
    assert.equal(sau.subject, truoc.subject);
    assert.equal(sau.phone, "+84901234567", "số vẫn vào cột seller");
    assert.equal(sau.ten, "Môi giới A", "0211-8(1): item mỏng KHÔNG ghi null đè tên người bán đang có");
    await importDir(c, dirSoLoi);
    const sauLoi = (await c.query(
      "SELECT seller->>'phone' AS phone, seller->>'phoneStatus' AS ps, seller->>'full_name' AS ten FROM stg_chotot_ads WHERE list_id = $1",
      [999888777])).rows[0];
    assert.equal(sauLoi.phone, "+84901234567", "0211-8(2): item error phone-null KHÔNG xoá số đã nạp");
    assert.equal(sauLoi.ps, "error", "phoneStatus vẫn ghi được trạng thái lỗi");
    assert.equal(sauLoi.ten, "Môi giới A", "tên vẫn còn nguyên sau lượt lỗi");
  } finally {
    rmSync(dirThuong, { recursive: true, force: true });
    rmSync(dirSo, { recursive: true, force: true });
    rmSync(dirSoLoi, { recursive: true, force: true });
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
});

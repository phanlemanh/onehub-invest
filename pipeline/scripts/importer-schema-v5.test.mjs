import test from "node:test"; import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { SUPPORTED_SCHEMA_VERSIONS as AIRBNB_V } from "../import-airbnb.mjs";
import { SUPPORTED_SCHEMA_VERSIONS as CHOTOT_V, readSnapshot, importDir } from "../import-chotot.mjs";
import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";

// claudedp-0211-1 (hợp đồng người bán): DATA-CONTRACT v5 thêm RawItem.seller
// (tùy chọn) — không đổi hình dạng cũ. CẢ HAI importer phải chấp nhận v4 LẪN v5
// trước khi bất kỳ kênh nào bắt đầu ghi seller; hai mảng phải đồng bộ với nhau
// và với dòng «bên import phải chấp nhận» trong DATA-CONTRACT.md.
test("schemaVersion: cả hai importer chấp nhận {1..5} — v4 và v5 cùng lúc", () => {
  assert.deepEqual(AIRBNB_V, [1, 2, 3, 4, 5]);
  assert.deepEqual(CHOTOT_V, [1, 2, 3, 4, 5], "hai importer không được lệch nhau");
  assert.ok(AIRBNB_V.includes(4), "v4 vẫn phải nạp — kênh chưa ghi seller giữ version cũ");
  assert.ok(AIRBNB_V.includes(5) && CHOTOT_V.includes(5), "v5 phải nạp ngay từ vòng này");
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

function dirSnapshot(items, { schemaVersion = 5 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "ct-v5-"));
  const gz = gzipSync(Buffer.from(JSON.stringify(items)));
  const sha = createHash("sha256").update(gz).digest("hex");
  writeFileSync(join(dir, "items-0001.json.gz"), gz);
  writeFileSync(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion, snapshotId: "hanoi__chotot-ads__20261102T080000000",
    city: "hanoi", source: "chotot-ads",
    startedAt: "2026-11-02T08:00:00Z", finishedAt: "2026-11-02T08:05:00Z",
    counts: { items: items.length, failed: 0 },
    files: [{ name: "items-0001.json.gz", sha256: sha, bytes: gz.length }],
  }));
  return dir;
}

// Đọc snapshot v5 THẬT từ dir tạm (verify sha256 + gunzip + lọc nguồn) — không
// đụng DB: chứng minh đường đọc của importer nhận item có seller.
test("readSnapshot: manifest v5 + item có seller đọc qua (giữ seller trong payload)", async () => {
  const dir = dirSnapshot([{
    source: "chotot-ads", sourceId: "999888777", kind: "listing",
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

test("readSnapshot: v6 chưa khai vẫn bị từ chối rõ ràng", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ct-v6-"));
  try {
    writeFileSync(join(dir, "manifest.json"), JSON.stringify({ schemaVersion: 6, source: "chotot-ads" }));
    await assert.rejects(() => readSnapshot(dir), /schemaVersion 6 chưa hỗ trợ/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// MỞ LẠI 0211-1 đ1 (điểm CHẶN): importDir phải gộp RawItem.seller vào cột
// seller có sẵn của stg_chotot_ads — không thì SĐT thu về mất ở bước nạp. Chạy
// importDir THẬT trên lược đồ tạm (luoc-do-rieng — bản chép rỗng chỉ đủ bảng,
// BEGIN…ROLLBACK không chạm public), đọc lại dòng trong bảng.
test("importDir: it.seller gộp vào cột seller stg_chotot_ads; snapshot không seller ra như cũ", { timeout: 120_000 }, async () => {
  const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: DB_URL });
  const dirMoi = dirSnapshot([{
    source: "chotot-ads", sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T08:00:00Z",
    payload: PAYLOAD_V5, seller: SELLER_V5,
  }]);
  // Cùng list_id, KHÔNG seller — đường v4 cũ phải ra giá trị y như trước v5
  const dirCu = dirSnapshot([{
    source: "chotot-ads", sourceId: "999888777", kind: "listing",
    fetchedAt: "2026-11-02T07:00:00Z",
    payload: { ...PAYLOAD_V5, account_id: undefined },
  }], { schemaVersion: 4 });
  await c.connect();
  try {
    await c.query("BEGIN");
    await luocDoRieng(c, ["stg_chotot_ads", "airbnb_snapshots"], { tienTo: "v5_import" });
    // Nạp bản CŨ trước (không seller) rồi bản MỚI (có seller) — cùng list_id
    await importDir(c, dirCu);
    const cu = (await c.query("SELECT seller FROM stg_chotot_ads WHERE list_id = $1", [999888777])).rows[0];
    assert.deepEqual(cu.seller, { full_name: "Môi giới A", company_ad: null, live_ads: 3 },
      "snapshot không seller → giá trị y hệt trước v5");
    await importDir(c, dirMoi);
    const moi = (await c.query(
      "SELECT seller->>'phone' AS phone, seller->>'accountRef' AS ref, seller->>'displayName' AS ten, seller->>'live_ads' AS live FROM stg_chotot_ads WHERE list_id = $1",
      [999888777])).rows[0];
    assert.equal(moi.phone, "+84901234567", "SĐT phải vào cột seller — điểm chặn vòng 1");
    assert.equal(moi.ref, "S06:777001");
    assert.equal(moi.ten, "Môi giới A");
    assert.equal(moi.live, "3", "trường seller_info cũ vẫn giữ khi gộp");
  } finally {
    rmSync(dirMoi, { recursive: true, force: true });
    rmSync(dirCu, { recursive: true, force: true });
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
});

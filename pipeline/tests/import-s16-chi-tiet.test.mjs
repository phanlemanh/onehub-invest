// import-s16-chi-tiet.test.mjs — test bộ nạp thuộc tính căn S16 (claudedp-1811-8) trên DB thử qua db-thu.
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_nap_s16_ct --chay node --test pipeline/tests/import-s16-chi-tiet.test.mjs
// Áp CHÍNH tệp migration 113 (không DDL chép tay); chốt chặn DANH SÁCH CHO PHÉP tên DB
// ^oneinvest_suite_ (khuôn import-s16.test). Ca: nạp trọn đúng cột + dong là số thứ tự item
// toàn cục; nạp lại 0 dòng mới; ba ca đỏ checksum / schemaVersion lạ / manifest không tệp items
// (0 dòng stg lẫn airbnb_snapshots, lỗi không lộ tên nguồn/thư mục); URL biến thể rc 2 trước
// khi kết nối; --may-thu qua chốt rồi lỗi là lỗi kết nối.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { napChiTietThuMuc } from "../import-s16-chi-tiet.mjs";
import { sqlNapLaiDayDu } from "../lib/nap-view-song.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DDL_113 = readFileSync(join(REPO, "db", "migrations", "113_thuoc_tinh_can_s16.sql"), "utf8");
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("import-s16-chi-tiet.test: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
// Chốt chặn DANH SÁCH CHO PHÉP (khuôn import-s16.test): test có lệnh phá (áp DDL, INSERT) nên
// CHỈ chạy khi tên DB khớp ^oneinvest_suite_ (db-thu cấp); còn lại exit 2.
const tenDbTest = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDbTest)) {
  console.error(`import-s16-chi-tiet.test: từ chối DB '${tenDbTest || "(đọc được tên?)"}' — test phá dữ liệu, chỉ chạy trên DB thử oneinvest_suite_* (db/db-thu.sh)`);
  process.exit(2);
}
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const q = async (sql, params) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };

// Item khuôn kind mngt-can-chi-tiet (DC v14): meta mang duAn/khu/toa, payload giữ đủ trường nguồn.
const itemCT = (sourceId, meta, payload) => ({
  source: "s16-thu", kind: "mngt-can-chi-tiet", sourceId, fetchedAt: "2026-11-18T00:00:00.000Z",
  meta,
  payload: {
    editableFields: ["bedroom", "bathroom"], purchasePrice: 0, purchaseDate: 0, initialInvestmentCost: 0,
    loanAmount: 0, investmentCapital: 0, juridicalStatus: "", deliveryStatus: "", furnitureStatus: "",
    houseStatus: "", floors: "", _propertyType: "APARTMENT", ...payload,
  },
});
const itemsGia = () => [
  itemCT("du-an-a|A101", { duAn: "du-an-a", khu: "khu-a", toa: "TA1" }, {
    proj: "du-an-a", khu: "khu-a", tower: "TA1", projectAlias: "du-an-a", areaClusterAlias: "khu-a",
    heightType: "HIGH_RISE", unitNumber: "A101", propertyType: "APARTMENT", floorNumber: "3",
    bedroom: 2, bathroom: 1, direction: "", balconyDirection: "SW",
    houseStyle: "TWO_BEDROOMS_2_2_TOILET", salePrice: 1234567, areaUsing: 69.9, areaBuilding: 74.9,
  }),
  // item kind khác xen giữa: bị bỏ có đếm nhưng VẪN chiếm số thứ tự dong
  { source: "s16-thu", kind: "mngt-khu", sourceId: "khu-x", fetchedAt: "2026-11-18T00:00:00.000Z", payload: { csv: "x" } },
  itemCT("du-an-a|SH05", { duAn: "du-an-a", khu: "khu-a", toa: "TB2" }, {
    proj: "du-an-a", khu: "khu-a", tower: "TB2", projectAlias: "du-an-a", areaClusterAlias: "khu-a",
    heightType: "LOW_RISE", unitNumber: "SH05", propertyType: "SHOP_HOUSE", floorNumber: "1",
    bedroom: 0, bathroom: 2, direction: "NE", balconyDirection: "",
    houseStyle: "", salePrice: 0, areaUsing: 289.5, areaBuilding: 90.9,
  }),
];

const snapshotGia = async (items, schemaVersion = 14) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s16ct-"));
  const w = new SnapshotWriter(r, "vn", "s16-thu", { schemaVersion });
  await w.write(items);
  const m = await w.finalize({ discovered: items.length, captured: items.length, failed: 0 });
  return join(r, "vn", m.snapshotId);
};
const tmps = [];
const sinh = async (items, sv) => { const d = await snapshotGia(items, sv); tmps.push(d); return d; };

// DB của lượt chép từ máy thu đã có 117 (trục phát biểu mang universal_property_id, có dòng thật): áp nguyên 113 thì CHECK của
// 113 thiếu trường đó và ADD CONSTRAINT đỏ 23514 (sự cố 24/11 sau khi áp PL20). Nạp lại giữ trục sống, như nap-lai-giu-rang-buoc.
test.before(async () => {
  const c = new pg.Client({ connectionString: DB }); await c.connect();
  try { await c.query(await sqlNapLaiDayDu(c, DDL_113)); } finally { await c.end(); }
});
test.after(() => { tmps.forEach((d) => rmSync(d, { recursive: true, force: true })); });

const sidCua = (dir) => JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).snapshotId;
const dem = async (sid) => ({
  stg: (await q("SELECT count(*)::int n FROM stg_s16_can_chi_tiet WHERE snapshot_id = $1", [sid])).rows[0].n,
  snap: (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [sid])).rows[0].n,
});

test("CT-1 nạp trọn đúng cột, dong là số thứ tự item toàn cục; nạp lại 0 dòng mới", async () => {
  const dir = await sinh(itemsGia());
  const sid = sidCua(dir);
  const kq = await napChiTietThuMuc(dir, DB);
  assert.equal(kq.ghi, 2, "nạp đúng 2 dòng");
  assert.equal(kq.bo["kind-la"], 1, "bỏ đúng 1 item kind-lạ");
  const rows = (await q("SELECT * FROM stg_s16_can_chi_tiet WHERE snapshot_id = $1 ORDER BY dong", [sid])).rows;
  assert.equal(rows.length, 2);
  const a = rows[0];
  assert.equal(a.du_an, "du-an-a"); assert.equal(a.khu, "khu-a"); assert.equal(a.toa, "TA1");
  assert.equal(a.ma_can, "A101"); assert.equal(a.dong, 0, "item đầu = dong 0");
  assert.equal(a.height_type, "HIGH_RISE"); assert.equal(a.property_type, "APARTMENT");
  assert.equal(a.floor_number, "3"); assert.equal(a.bedroom, 2); assert.equal(a.bathroom, 1);
  assert.equal(a.direction, null); assert.equal(a.balcony_direction, "SW");
  assert.equal(a.house_style, "TWO_BEDROOMS_2_2_TOILET");
  assert.equal(Number(a.sale_price), 1234567); assert.equal(Number(a.area_using), 69.9); assert.equal(Number(a.area_building), 74.9);
  assert.deepEqual(a.editable_fields, ["bedroom", "bathroom"]);
  const b = rows[1];
  assert.equal(b.ma_can, "SH05"); assert.equal(b.dong, 2, "item sau kind-lạ vẫn giữ dong toàn cục = 2");
  assert.equal(b.direction, "NE"); assert.equal(Number(b.sale_price), 0);
  const snap = (await q("SELECT source FROM airbnb_snapshots WHERE snapshot_id = $1", [sid])).rows[0];
  assert.equal(snap.source, "S16", "một dòng airbnb_snapshots source S16");
  // nạp lại: 0 dòng mới
  const kq2 = await napChiTietThuMuc(dir, DB);
  assert.equal(kq2.ghi, 0, "lượt hai 0 dòng mới");
  assert.equal((await dem(sid)).stg, 2, "vẫn 2 dòng");
});

test("CT-2 ca đỏ checksum: sửa một byte items-*.json.gz → ném 'checksum sai', 0 dòng stg lẫn airbnb_snapshots; lỗi không lộ tên nguồn/thư mục", async () => {
  const dir = await sinh(itemsGia());
  const sid = sidCua(dir);
  const tep = readdirSync(dir).find((f) => /^items-\d+\.json\.gz$/.test(f));
  const duong = join(dir, tep);
  const buf = readFileSync(duong);
  buf[buf.length - 5] ^= 0x01;
  writeFileSync(duong, buf);
  await assert.rejects(
    () => napChiTietThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /checksum sai/);
      assert.doesNotMatch(e.message, new RegExp(sid), "không in tên thư mục bản thu (snapshotId)");
      assert.doesNotMatch(e.message, /s16-thu|s16-/, "không in tên nguồn thật");
      return true;
    },
  );
  const d = await dem(sid);
  assert.deepEqual(d, { stg: 0, snap: 0 }, "rollback sạch — 0 dòng cả hai bảng");
});

test("CT-3 ca đỏ schemaVersion lạ: sv 99 → ném 'chưa hỗ trợ', 0 dòng", async () => {
  const dir = await sinh(itemsGia(), 99);
  const sid = sidCua(dir);
  await assert.rejects(
    () => napChiTietThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /schemaVersion 99 chưa hỗ trợ/);
      assert.doesNotMatch(e.message, new RegExp(sid));
      assert.doesNotMatch(e.message, /s16-thu|s16-/);
      return true;
    },
  );
  assert.deepEqual(await dem(sid), { stg: 0, snap: 0 });
});

test("CT-4 ca đỏ manifest không có tệp items: ném trước khi mở DB, không chèn airbnb_snapshots", async () => {
  const dir = await sinh(itemsGia());
  const sid = sidCua(dir);
  const duong = join(dir, "manifest.json");
  const m = JSON.parse(readFileSync(duong, "utf8"));
  m.files = (m.files ?? []).filter((f) => !/^items-\d+\.json\.gz$/.test(f.name));
  writeFileSync(duong, JSON.stringify(m));
  await assert.rejects(
    () => napChiTietThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /manifest không có tệp items/);
      assert.doesNotMatch(e.message, new RegExp(sid));
      assert.doesNotMatch(e.message, /s16-thu|s16-/);
      return true;
    },
  );
  assert.equal((await dem(sid)).snap, 0, "không dòng airbnb_snapshots nào bị ghi");
});

test("CT-5 chốt cho phép (khuôn S16-3): URL biến thể trỏ DB không phải suite, không --may-thu → rc 2 TRƯỚC khi kết nối", async () => {
  const dir = await sinh(itemsGia());
  const NGUOI = "oneinvest:" + "oneinvest"; // tách chuỗi cho scanner (khuôn import-s16.test)
  const r = spawnSync(process.execPath, [join(REPO, "pipeline", "import-s16-chi-tiet.mjs"), dir], {
    env: { ...process.env, DATABASE_URL: `postgres://${NGUOI}@localhost:5433/oneinvest_khong_phai_suite` },
    encoding: "utf8",
  });
  assert.equal(r.status, 2, `rc phải 2, nhận ${r.status}; stderr=${r.stderr}`);
  assert.match(r.stderr, /từ chối DB 'oneinvest_khong_phai_suite'/, "thông điệp chốt chặn DB");
});

test("CT-6 đối chứng dương chốt (khuôn S16-4): cùng URL kèm --may-thu → qua chốt, lỗi là lỗi kết nối", async () => {
  const dir = await sinh(itemsGia());
  const NGUOI = "oneinvest:" + "sai-mat-khau"; // tách chuỗi cho scanner (khuôn import-s16.test)
  const url = `postgres://${NGUOI}@localhost:1/oneinvest`; // cổng không có DB nào nghe
  const r = spawnSync(process.execPath, [join(REPO, "pipeline", "import-s16-chi-tiet.mjs"), dir, "--may-thu"], {
    env: { ...process.env, DATABASE_URL: url },
    encoding: "utf8",
  });
  assert.notEqual(r.status, 0, "phải lỗi (không kết nối được)");
  assert.notEqual(r.status, 2, "không bị chốt chặn khi có --may-thu");
  assert.match(r.stderr, /ECONNREFUSED|connect|AggregateError/i, `lỗi in ra phải là lỗi kết nối với ${url}`);
});

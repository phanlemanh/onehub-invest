// import-s16.test.mjs — test bộ nạp S16 (1711-6) trên DB thử qua db-thu.
// CHẠY LẺ: bash db/db-thu.sh oneinvest_suite_nap_s16 --chay node --test pipeline/tests/import-s16.test.mjs
// Áp CHÍNH tệp migration 103 (không DDL chép tay); chốt chặn DANH SÁCH CHO PHÉP tên DB
// ^oneinvest_suite_ (khuôn import-s09 1411-11); ghi ĐÚNG napS16(c, dongS16(items, id)) —
// eval E1/E2 của DA33 đo chính hàm đó. Ca đỏ: thiếu sourceId / kind lạ / csv-jsonl lỗi
// bị bỏ có đếm; nạp lại 0 dòng mới; URL biến thể rc 2 trước khi kết nối.
// Ca đỏ manifest (claudedp-1711-20): (a) sửa một byte items-*.json.gz → lỗi checksum,
// rollback 0 dòng ở bốn bảng stg_s16_* lẫn airbnb_snapshots; (b) schemaVersion lạ → lỗi, 0 dòng.
// MỞ LẠI (2): manifest.files không còn tệp items nào → ném trước khi mở DB (S16-7).
// Thông điệp lỗi không in tên nguồn thật (s16-thu) hay tên thư mục bản thu (snapshotId).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { napS16ThuMuc } from "../import-s16.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "../..");
const DDL_103 = readFileSync(join(REPO, "db", "migrations", "103_stg_s16.sql"), "utf8");
const DB = process.env.DATABASE_URL ?? "";
if (!DB) { console.log("import-s16.test: bỏ qua — thiếu DATABASE_URL (chạy lẻ qua db/db-thu.sh … --chay)"); process.exit(0); }
// Chốt chặn DANH SÁCH CHO PHÉP (khuôn import-s09): test có lệnh phá (áp DDL, INSERT snapshot)
// nên CHỈ chạy khi tên DB khớp ^oneinvest_suite_ (db-thu cấp); còn lại exit 2.
const tenDbTest = (() => { try { return decodeURIComponent(new URL(DB.replace(/^postgresql:/, "postgres:")).pathname.replace(/^\//, "")); } catch { return ""; } })();
if (!/^oneinvest_suite_[a-z0-9_]+$/.test(tenDbTest)) {
  console.error(`import-s16.test: từ chối DB '${tenDbTest || "(đọc được tên?)"}' — test phá dữ liệu, chỉ chạy trên DB thử oneinvest_suite_* (db/db-thu.sh)`);
  process.exit(2);
}
const pg = (await import("../node_modules/pg/lib/index.js")).default;
const q = async (sql, params) => { const c = new pg.Client({ connectionString: DB }); await c.connect(); try { return await c.query(sql, params); } finally { await c.end(); } };

// Item snapshot S16 đúng khuôn từng kind (csv/jsonl nằm trong payload như nguồn).
const item = (kind, sourceId, payload) => ({
  source: "s16-thu", kind, sourceId, fetchedAt: "2026-11-13T14:00:00.000Z",
  payload: { url: "https://x/y", ...payload },
});
const itemsGia = () => [
  item("mngt-khu", "khu-1", { csv: "du_an_alias,du_an,khu_id,khu_ten,khu_alias,so_can\npk-a,khu-a,K1,Khu Mot,alias-k1,12" }),
  item("mngt-toa", "toa-1", { csv: "du_an_alias,khu_alias,toa_id,toa_ten,so_can\npk-a,alias-k1,T1,Toa Mot,12" }),
  item("mngt-can", "can-1", { csv: "du_an_alias,khu_alias,toa_ten,ma_can\npk-a,alias-k1,Toa Mot,A101" }),
  item("mngt-can", "can-2", { csv: "du_an_alias,khu_alias,toa_ten,ma_can\npk-a,alias-k1,Toa Mot,A102" }),
  item("mngt-toa-khong-alias", "toa-ka-1", { toaKhongAlias: { "pk-a|K9": { khu: { name: "Khu Chin", docCount: 3 }, toa: [{ value: "T9", name: "Toa Chin", docCount: 3 }] } } }),
  // jsonl là CHUỖI nhiều dòng (lib docJsonl split \n rồi JSON.parse từng dòng — mảng stringify một dòng sẽ parse ra mảng, không đúng khuôn nguồn)
  item("mngt-can-moi", "can-moi-1", {
    theoTang: [
      JSON.stringify({ toa: "pk-a|K9|T9", toaTen: "Toa Chin", tongKhai: 2, can: [{ toa: "Toa Chin", tang: "Tang 1", ma_can: "c9-1" }, { toa: "Toa Chin", tang: "Tang 1", ma_can: "c9-2" }] }),
    ].join("\n"),
    khongTang: "",
  }),
  item("mngt-can-pha3", "can-pha3-1", {
    jsonl: JSON.stringify({ toa: "pk-a|K9|T9", toaTen: "Toa Chin", tongKhai: 1, can: [{ toa: "Toa Chin", tang: "Tang 2", ma_can: "c9-3" }] }),
  }),
  item("tin-niem-yet", "tny-1", { url: "https://x/z" }),
];
const snapshotGia = async (items, schemaVersion = 12) => {
  const { SnapshotWriter } = await import(new URL("../../collector/src/core/storage.ts", import.meta.url).href);
  const r = mkdtempSync(join(tmpdir(), "s16-snap-"));
  const w = new SnapshotWriter(r, "vn", "s16-thu", { schemaVersion });
  await w.write(items);
  const m = await w.finalize({ failed: 0 });
  return join(r, "vn", m.snapshotId);
};
const tmps = [];
const sinh = async (items, schemaVersion) => { const d = await snapshotGia(items, schemaVersion); tmps.push(d); return d; };

test.before(async () => { await q(DDL_103); });
test.after(() => { tmps.forEach((d) => rmSync(d, { recursive: true, force: true })); });

const demCacBang = async (sid) => {
  const mot = async (s) => (await q(s, [sid])).rows[0].n;
  return {
    item: await mot("SELECT count(*)::int n FROM stg_s16_item WHERE snapshot_id = $1"),
    khu: await mot("SELECT count(*)::int n FROM stg_s16_khu WHERE snapshot_id = $1"),
    toa: await mot("SELECT count(*)::int n FROM stg_s16_toa WHERE snapshot_id = $1"),
    can: await mot("SELECT count(*)::int n FROM stg_s16_can WHERE snapshot_id = $1"),
  };
};

test("S16-1: nạp trọn snapshot đúng khuôn → bốn bảng đúng số dòng, snapshot source S16; nạp lại → 0 dòng mới", async () => {
  const dir = await sinh(itemsGia());
  const l1 = await napS16ThuMuc(dir, DB);
  assert.deepEqual(l1.ghi, { item: 8, khu: 2, toa: 2, can: 5 }, "ghi đúng số dòng bốn bảng lượt đầu");
  assert.deepEqual(l1.bo, { "thieu-source-id": 0, "kind-la": 0, "csv-loi": 0, "jsonl-loi": 0 });
  assert.equal(l1.soDoc, 8);
  const fk = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1 AND source = 'S16' AND city = 'vn'", [l1.snapshotId])).rows[0].n;
  assert.equal(fk, 1, "một dòng airbnb_snapshots source 'S16' (mẫu danh-ba 1711-7(2)(a))");
  const d1 = await demCacBang(l1.snapshotId);
  assert.deepEqual(d1, { item: 8, khu: 2, toa: 2, can: 5 }, "bốn bảng có đủ dòng sau lượt một");
  const l2 = await napS16ThuMuc(dir, DB); // lượt hai không ném lỗi
  assert.deepEqual(l2.ghi, { item: 0, khu: 0, toa: 0, can: 0 }, "nạp lại ghi 0 dòng mới ở cả bốn bảng");
  assert.equal(l2.snapshotId, l1.snapshotId, "lần hai nhận cùng snapshot_id");
  const d2 = await demCacBang(l1.snapshotId);
  assert.deepEqual(d2, d1, "không nhân đôi dòng sau lượt hai");
  const moCoi = (await q(`SELECT count(*)::int n FROM stg_s16_item s LEFT JOIN airbnb_snapshots a USING (snapshot_id)
                          WHERE a.snapshot_id IS NULL`)).rows[0].n;
  assert.equal(moCoi, 0, "không dòng stg_s16_item nào trỏ snapshot không có");
});

test("S16-2 ca đỏ: thiếu sourceId / kind lạ / csv số cột lệch / jsonl hỏng → bỏ có đếm đúng bốn lý do", async () => {
  const du = [];
  const khongSid = item("mngt-khu", "x", { csv: "du_an_alias,khu_id\npk-a,K1" }); delete khongSid.sourceId; du.push(khongSid);
  du.push({ ...item("mngt-khu", "y", { csv: "du_an_alias,khu_id\npk-a,K1" }), kind: "trang-lạ" });
  du.push(item("mngt-can", "csv-lỗi", { csv: "du_an_alias,khu_alias,toa_ten\npk-a,k1,toa" })); // dòng 3 cột ≠ header 4 cột → csv-loi
  du.push(item("mngt-can-pha3", "jsonl-lỗi", { jsonl: "{khong-phai-json\n" }));
  du.push(item("tin-niem-yet", "hop-le", { url: "u" })); // hợp lệ — đối chứng trong cùng lô
  const dir = await sinh(du);
  const l = await napS16ThuMuc(dir, DB);
  assert.deepEqual(l.bo, { "thieu-source-id": 1, "kind-la": 1, "csv-loi": 1, "jsonl-loi": 1 });
  // bảng stg_s16_item ghi nguyên văn MỌI item kind hợp lệ (kể cả payload csv/jsonl lỗi —
  // lỗi chỉ loại dòng ở cấp khu/toa/can): csv-lỗi + jsonl-lỗi + hop-le = 3
  assert.equal(l.ghi.item, 3, "item kind hợp lệ đều được ghi nguyên văn");
  assert.equal(l.soDoc, 5);
});

test("S16-3 chặn cho phép (khuôn S09-3): URL biến thể trỏ DB không phải suite, không --may-thu → rc 2 TRƯỚC khi kết nối", async () => {
  const dir = await sinh(itemsGia());
  const NGUOI = "oneinvest:" + "sai-mat-khau";
  const bienThe = [
    `postgresql://${NGUOI}@localhost:1/oneinvest?sslmode=disable`,
    `postgres://${NGUOI}@localhost:1/oneinvest_san`,
    `postgres://${NGUOI}@localhost:1/oneinvest`,
  ];
  for (const url of bienThe) {
    const r = spawnSync("node", [join(REPO, "pipeline", "import-s16.mjs"), dir], {
      encoding: "utf8", timeout: 60_000, env: { ...process.env, DATABASE_URL: url },
    });
    assert.equal(r.status, 2, `rc 2 với ${url}: stderr=${(r.stderr || "").slice(0, 120)}`);
    assert.match(r.stderr, /từ chối/, "in lời từ chối");
    assert.doesNotMatch(r.stderr, /connect|ECONNREFUSED|ETIMEDOUT|password/i, "từ chối xảy ra TRƯỚC khi kết nối");
  }
});

test("S16-4 đối chứng dương chốt chặn (khuôn S09-4): cùng URL kèm --may-thu → qua chốt, lỗi là lỗi kết nối", async () => {
  const dir = await sinh(itemsGia());
  const { createConnection } = await import("node:net");
  const dong = await new Promise((ok) => {
    const s = createConnection({ host: "localhost", port: 1 });
    s.once("connect", () => { s.destroy(); ok(false); });
    s.once("error", () => ok(true));
  });
  assert.ok(dong, "cổng localhost:1 đang mở — dừng ca để không ghi nhầm DB thật");
  const NGUOI = "oneinvest:" + "sai-mat-khau";
  const bienThe = [
    `postgresql://${NGUOI}@localhost:1/oneinvest?sslmode=disable`,
    `postgres://${NGUOI}@localhost:1/oneinvest_san`,
    `postgres://${NGUOI}@localhost:1/oneinvest`,
  ];
  for (const url of bienThe) {
    const r = spawnSync("node", [join(REPO, "pipeline", "import-s16.mjs"), dir, "--may-thu"], {
      encoding: "utf8", timeout: 60_000, env: { ...process.env, DATABASE_URL: url },
    });
    assert.doesNotMatch(r.stderr, /từ chối/, `--may-thu không bị chốt chặn từ chối với ${url}`);
    assert.equal(r.status, 1, `qua chốt rồi lỗi kết nối phải thoát 1 với ${url}: stderr=${(r.stderr || "").slice(0, 120)}`);
    assert.match(r.stderr, /ECONNREFUSED|connect|AggregateError/i, `lỗi in ra phải là lỗi kết nối với ${url}`);
  }
});

// ---------- ca đỏ manifest (claudedp-1711-20) ----------
const sidCua = (dir) => JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")).snapshotId;

test("S16-5 ca đỏ checksum (1711-20): sửa một byte items-*.json.gz → ném 'checksum sai', 0 dòng mới ở bốn bảng stg lẫn airbnb_snapshots; lỗi không lộ tên nguồn/thư mục", async () => {
  const dir = await sinh(itemsGia());
  const sid = sidCua(dir);
  const tep = readdirSync(dir).find((f) => /^items-\d+\.json\.gz$/.test(f));
  const duong = join(dir, tep);
  const buf = readFileSync(duong);
  buf[buf.length - 5] ^= 0x01; // sửa đúng MỘT byte trong phần cuối tệp nén
  writeFileSync(duong, buf);
  await assert.rejects(
    () => napS16ThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /checksum sai/, "thông điệp phải là lỗi checksum");
      assert.doesNotMatch(e.message, new RegExp(sid), "không in tên thư mục bản thu (snapshotId)");
      assert.doesNotMatch(e.message, /s16-thu|s16-/, "không in tên nguồn thật");
      return true;
    },
  );
  const dem = await demCacBang(sid);
  assert.deepEqual(dem, { item: 0, khu: 0, toa: 0, can: 0 }, "rollback sạch — bốn bảng stg 0 dòng");
  const snap = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [sid])).rows[0].n;
  assert.equal(snap, 0, "không dòng airbnb_snapshots nào bị ghi");
});

test("S16-6 ca đỏ schemaVersion lạ (1711-20): sv 99 → ném 'chưa hỗ trợ', 0 dòng ở bốn bảng lẫn airbnb_snapshots; lỗi không lộ tên nguồn/thư mục", async () => {
  const dir = await sinh(itemsGia(), 99);
  const sid = sidCua(dir);
  await assert.rejects(
    () => napS16ThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /schemaVersion 99 chưa hỗ trợ/, "thông điệp nêu phiên bản chưa hỗ trợ");
      assert.doesNotMatch(e.message, new RegExp(sid), "không in tên thư mục bản thu (snapshotId)");
      assert.doesNotMatch(e.message, /s16-thu|s16-/, "không in tên nguồn thật");
      return true;
    },
  );
  const dem = await demCacBang(sid);
  assert.deepEqual(dem, { item: 0, khu: 0, toa: 0, can: 0 }, "bốn bảng stg 0 dòng");
  const snap = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [sid])).rows[0].n;
  assert.equal(snap, 0, "không dòng airbnb_snapshots nào bị ghi");
});

test("S16-7 ca đỏ manifest không có tệp items (1711-20 MỞ LẠI): manifest.files bỏ hết items-* → ném 'manifest không có tệp items' trước khi mở DB, không chèn airbnb_snapshots", async () => {
  const dir = await sinh(itemsGia());
  const sid = sidCua(dir);
  const duong = join(dir, "manifest.json");
  const m = JSON.parse(readFileSync(duong, "utf8"));
  m.files = (m.files ?? []).filter((f) => !/^items-\d+\.json\.gz$/.test(f.name));
  writeFileSync(duong, JSON.stringify(m));
  await assert.rejects(
    () => napS16ThuMuc(dir, DB),
    (e) => {
      assert.match(e.message, /manifest không có tệp items/, "thông điệp nêu thiếu tệp items");
      assert.doesNotMatch(e.message, new RegExp(sid), "không in tên thư mục bản thu (snapshotId)");
      assert.doesNotMatch(e.message, /s16-thu|s16-/, "không in tên nguồn thật");
      return true;
    },
  );
  const snap = (await q("SELECT count(*)::int n FROM airbnb_snapshots WHERE snapshot_id = $1", [sid])).rows[0].n;
  assert.equal(snap, 0, "không dòng airbnb_snapshots nào bị ghi");
});

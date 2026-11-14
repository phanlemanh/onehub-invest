// danh-ba-s16.itest.mjs — hồ sơ nap-s16-vao-danh-ba (DA33): ca «DA33-AC-*» trên DB thử dựng từ db/migrations.
// DB thử oneinvest_dbv_s16_<pid> (và _b cho AC-7) ở :5433, tạo đầu tệp, xoá cuối tệp; tên qua danh sách cho phép
// oneinvest_dbv_* của db-thu-dbv.mjs; không đọc, không ghi DB `oneinvest`. Fixture tổng hợp viết trước (mã tiền tố Q).
// Ngoài glob test của CI (cần :5433); chạy: node --test --test-concurrency=1 pipeline/scripts/danh-ba-s16.itest.mjs
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import pg from "pg";
import { GOC, apTep, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";
import { FIXTURE } from "./s16-fixture.mjs";
import { CAU_CHEN_S16_ITEM, chonToa, dongS16, napS16 } from "../lib/s16-danh-muc.mjs";

export const TEN = `oneinvest_dbv_s16_${process.pid}`;
const SNAP = "q__s16__2026-11-14T000000000";
const MIG103 = join(GOC, "db/migrations/103_stg_s16.sql");
let db;

before(async () => {
  const u = await taoDbThu(TEN);
  db = new pg.Client({ connectionString: u });
  await db.connect();
});
after(async () => {
  await db?.end().catch(() => {});
  await xoaDbThu(TEN);
});

const bam = (x) => createHash("sha256").update(JSON.stringify(x)).digest("hex");
const luocDo = async (c) => (await c.query(
  `SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns
    WHERE table_name LIKE 'stg_s16%' OR table_name LIKE 'v_s16%' ORDER BY 1, 2`)).rows;
const rangBuoc = async (c) => (await c.query(
  `SELECT conname, pg_get_constraintdef(oid) AS d FROM pg_constraint
    WHERE conrelid::regclass::text IN ('registry_aliases') OR conrelid::regclass::text LIKE 'stg_s16%' ORDER BY 1`)).rows;

test("DA33-AC-1 nạp fixture 11 kind hai lần: lần một đúng số dòng, lần hai 0; url không host; 103 áp lại không đổi lược đồ", async () => {
  await db.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'vn', 'S16', '{}'::jsonb)`, [SNAP]);
  const kq = dongS16(FIXTURE, SNAP);
  assert.deepEqual(kq.bo, { "thieu-source-id": 1, "kind-la": 1, "csv-loi": 1, "jsonl-loi": 1 }, "DA33-AC-1 đếm bỏ theo lý do");
  await db.query("BEGIN");
  const lan1 = await napS16(db, kq);
  await db.query("COMMIT");
  assert.deepEqual(lan1, { item: 11, khu: 3, toa: 3, can: 5 }, "DA33-AC-1 lần một");
  const lan2 = await napS16(db, kq);
  assert.deepEqual(lan2, { item: 0, khu: 0, toa: 0, can: 0 }, "DA33-AC-1 nạp lại ghi thêm dòng");
  const { rows: url } = await db.query("SELECT count(*)::int AS n FROM stg_s16_item WHERE payload::text ~ '\"url\": ?\"[a-z]+://'");
  assert.equal(url[0].n, 0, "DA33-AC-1 url còn host");
  const truoc = bam([await luocDo(db), await rangBuoc(db)]);
  apTep(TEN, MIG103);
  assert.equal(bam([await luocDo(db), await rangBuoc(db)]), truoc, "DA33-AC-1 103 áp lần hai đổi lược đồ");
});

test("DA33-AC-1 bí danh nguồn S16 chèn được, S1A bị từ chối", async () => {
  const k = `bld_${"1".padStart(26, "0")}`;
  await db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QX', 'S16')", [k]);
  await assert.rejects(
    db.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'ten', 'QY', 'S1A')", [k]),
    (e) => e.code === "23514", "DA33-AC-1 nguồn S1A lọt ràng buộc");
});

test("DA33-AC-1 chiều đỏ: câu chèn không ON CONFLICT thì nạp lại lỗi khoá trùng", async () => {
  const cau = CAU_CHEN_S16_ITEM.replace(/ON CONFLICT DO NOTHING/, "");
  const r = dongS16(FIXTURE, SNAP).item[0];
  await assert.rejects(db.query(cau, [r.snapshot_id, r.source_id, r.kind, r.payload, r.fetched_at]),
    (e) => e.code === "23505", "DA33-AC-1 nạp lại: thiếu ON CONFLICT mà không lỗi");
});

// ---- AC-3 qua view: cùng ma trận năm ô như pipeline/lib/s16-danh-muc.test.mjs ----
const O = [
  { o: "ô1 khác-khu", dong: [["qv1", "k1", "QS2.08", "QS2.081101"], ["qv1", "k2", "QS2.08", "QS2.081101"]], ma: "QS2.081101" },
  { o: "ô2 hoa-thuong", dong: [["qv2", "k1", "QS2.08", "qs2.081101 "], ["qv2", "k1", "QS2.08", "QS2.081101"]], ma: "QS2.081101" },
  { o: "ô3 nhan-gom", dong: [["qv3", "k1", "QS2.05", "QS2.051101"], ["qv3", "k1", "QRAINBOW", "QS2.051101"]], ma: "QS2.051101" },
  { o: "ô4 hai-tien-to", dong: [["qv4", "k1", "QS2.05", "QS2.051101"], ["qv4", "k1", "QS2.0", "QS2.051101"]], ma: "QS2.051101" },
  { o: "ô5 khong-tien-to", dong: [["qv5", "k1", "QA", "QX1"], ["qv5", "k1", "QB", "QX1"]], ma: "QX1" },
];
test("DA33-AC-3 v_s16_can ra cùng kết quả với chonToa trên ma trận năm ô", async () => {
  for (const x of O) {
    for (const [du_an, khu, toa, ma] of x.dong) {
      await db.query(`INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
                      VALUES ($1, $2, $3, NULL, $4, NULL, $5, 1) ON CONFLICT DO NOTHING`, [SNAP, du_an, khu, toa, ma]);
    }
    const { rows } = await db.query("SELECT ma_can, toa_ten, mo_ho FROM v_s16_can WHERE du_an = $1", [x.dong[0][0]]);
    assert.equal(rows.length, 1, `DA33-AC-3 ${x.o}: không phải một căn`);
    const js = chonToa(x.ma, x.dong.map((d) => d[2]));
    assert.equal(rows[0].mo_ho, "mo_ho" in js, `DA33-AC-3 ${x.o}: view và chonToa lệch về mơ hồ`);
    assert.equal(rows[0].toa_ten, js.toa ?? null, `DA33-AC-3 ${x.o}: view và chonToa lệch toà`);
  }
});

export { db };

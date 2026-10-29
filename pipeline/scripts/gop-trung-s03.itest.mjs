// gop-trung-s03.itest.mjs — cả lượt transform S03 tách bài nhiều người đăng khi khoá thiếu phường/diện tích, giữ gộp khi
// đủ (hồ sơ _acceptance/s03-gop-trung-dung). Chạy trong BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { napPhatBieu } from "../lib/nap-045.mjs";
import { S03_POSTS_SQL } from "../lib/ops-flow.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const MIG_044 = readFileSync(join(import.meta.dirname, "../../db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const SNAP = "hanoi__zalo-agent__2099-01-02T000000";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)"); // cùng khoá với test-posts / write-offers (đối soát)
    if (!(await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`)).rows[0].ok) await c.query(MIG_044);
    await napPhatBieu(c);
    await c.query(
      `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}')
       ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

let seq = 0;
const tag = `gt_${process.pid}`;
async function post(c, sender, text, posted_at) {
  const id = `t_${tag}_${++seq}`;
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name)
     VALUES ($1, $2, 'openclaw-hook', 'Nhóm thật X', $3, $4, $5, $5)`,
    [id, SNAP, text, posted_at, `${tag}_${sender}`]);
  return id;
}
const offerOf = async (c, id) =>
  (await c.query(`SELECT offer_id, n_reposts, post_ids FROM sale_offers WHERE $1 = ANY(post_ids)`, [id])).rows;

// Giá lạ để nhóm fixture không chạm nhóm thật (khoá thiếu trường có người đăng nên vốn đã tách khỏi bài thật).
const THIEU = "Cho thuê căn hộ 2PN full đồ, giá 17.3 triệu/tháng";
const DU = "Bán căn hộ 2PN 66.7m2 Nghĩa Đô, giá 3.17 tỷ";

test("GT-AC-4 lượt transform: thiếu trường tách theo người đăng, đủ trường vẫn gộp, tin cũ không bị cho nghỉ", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const a1 = await post(c, "A", THIEU, "2026-10-25T01:00:00Z");
    const a2 = await post(c, "A", THIEU, "2026-10-25T05:00:00Z");
    const b1 = await post(c, "B", THIEU, "2026-10-25T03:00:00Z");
    const d1 = await post(c, "A", DU, "2026-10-25T02:00:00Z");
    const d2 = await post(c, "B", DU, "2026-10-25T04:00:00Z");
    const r = await runTransformZalo(c);

    const [oa1] = await offerOf(c, a1), [oa2] = await offerOf(c, a2), [ob1] = await offerOf(c, b1);
    assert.ok(oa1 && ob1, "bài fixture không thành tin");
    assert.equal(oa1.offer_id, oa2.offer_id, "một người đăng lại bị tách");
    assert.equal(oa1.n_reposts, 2);
    assert.notEqual(oa1.offer_id, ob1.offer_id, "hai người đăng cùng nội dung thiếu trường bị gộp");
    assert.equal(ob1.n_reposts, 1);

    const [od1] = await offerOf(c, d1), [od2] = await offerOf(c, d2);
    assert.equal(od1?.offer_id, od2?.offer_id, "nội dung đủ phường + diện tích của hai người không còn gộp");
    assert.equal(od1.n_reposts, 2);
    // Tách nhóm không làm tin nào biến mất khỏi lượt: mảnh lớn thừa kế offer_id cũ (PL14), mảnh mới nhận id mới.
    assert.equal(r.reconcile.stale, 0, "đổi khoá gom cho nghỉ tin đang sống");
  });
});

// Cột «Bài nhận» của Luồng 7 ngày đếm đúng tập bài transform S03 đọc (loadStgPosts + testMarker). Ma trận viết trước:
// [snapshot, agent_id, group_name, có đếm?] — đặt ở một ngày 2099 riêng nên không lẫn bài thật.
const MA_TRAN = [
  ["hanoi__zalo-agent__2099-01-05T000000", "openclaw-hook", "Nhóm thật X", true],
  ["hanoi__zalo-hook__2099-01-05T000000", "openclaw-hook", "Nhóm thật X", true], // nguồn snapshot thật khác tên
  ["hanoi__zalo-agent__2099-01-05T000000", null, "Nhóm thật X", true],
  ["hanoi__zalo-agent__2099-01-05T000000", "openclaw-hook", "TESTING ROOM", true],
  ["hanoi__zalo-mock__2099-01-05T000000", null, "Nhóm thật X", false],
  ["hanoi__example__2099-01-05T000000", null, null, false],
  ["hcmc__zalo-e2e__2099-01-05T000000", "openclaw-hook", "Nhóm A", false],
  ["hanoi__zalo-agent__2099-01-05T000000", "e2e-agent", "Nhóm A", false],
  ["hanoi__zalo-agent__2099-01-05T000000", "openclaw-hook", "TEST-G1", false],
  ["hanoi__zalo-agent__2099-01-05T000000", "apify-facebook", "Nhóm FB", false],
];
const NGAY = "2099-01-05T00:00:00+07:00";

test("GT-AC-5 «Bài nhận» S03 đếm đúng tập bài transform đọc", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    for (const [snap] of MA_TRAN)
      await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', $2, '{}')
        ON CONFLICT (snapshot_id) DO NOTHING`, [snap, snap.split("__")[1]]);
    const ids = [];
    for (const [snap, agent, group] of MA_TRAN) {
      const id = `t_${tag}_${++seq}`;
      ids.push(id);
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at)
        VALUES ($1, $2, $3, $4, 'bài ma trận', '2099-01-05T03:00:00Z')`, [id, snap, agent, group]);
    }
    const dem = async (sql) => (await c.query(sql, [NGAY])).rows.reduce((s, r) => s + r.n, 0);
    const { posts } = await loadStgPosts(c, "zalo");
    const doc = new Set(posts.map((p) => p.post_id));
    assert.deepEqual(ids.map((id) => doc.has(id)), MA_TRAN.map((r) => r[3]), "đáp án viết trước lệch loadStgPosts");
    assert.equal(await dem(S03_POSTS_SQL), MA_TRAN.filter((r) => r[3]).length, "cột bài nhận lệch tập transform đọc");
    // Đối chứng: bản lọc snapshot cũ (`LIKE '%zalo-agent%'`) bỏ sót bài của nguồn snapshot thật khác tên.
    const cu = S03_POSTS_SQL.replace(/split_part\(snapshot_id, '__', 2\) <> 'example' AND split_part\(snapshot_id, '__', 2\) !~\* '\(mock\|test\|e2e\)'/,
      "snapshot_id LIKE '%zalo-agent%'");
    assert.notEqual(cu, S03_POSTS_SQL, "đột biến phải thay được lọc snapshot");
    assert.equal(await dem(cu), MA_TRAN.filter((r) => r[3]).length - 1);
  });
});

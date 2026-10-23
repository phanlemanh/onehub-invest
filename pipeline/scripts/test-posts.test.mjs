// test-posts.test.mjs — vòng canonical-khong-tin-gia (PL2): transform gạt post thử, dọn qua đối soát.
// Ca DB chạy trong BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";

import { TEST_MARKERS, testMarker } from "../lib/test-posts.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Snapshot fixture (năm 2099 — không trùng snapshot thật).
const AGENT_SNAP = "hanoi__zalo-agent__2099-01-01T000000";
const MOCK_SNAP = "hanoi__zalo-mock__2099-01-01T000000";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // stg_zalo_posts.snapshot_id có khoá ngoại tới airbnb_snapshots — đăng ký hai snapshot fixture.
    for (const [id, source] of [[AGENT_SNAP, "zalo-agent"], [MOCK_SNAP, "zalo-mock"]]) {
      await c.query(
        `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', $2, '{}')
         ON CONFLICT (snapshot_id) DO NOTHING`,
        [id, source],
      );
    }
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

let seq = 0;
const pid = (tag) => `t_pl2_${tag}_${process.pid}_${++seq}`;

/** Chèn một post stg như importer ghi (kênh Zalo trừ khi đổi agent_id). */
async function insertPost(c, { post_id, snapshot_id = AGENT_SNAP, agent_id = "openclaw-hook", group_name = "Nhóm thật X", text, posted_at = "2026-10-22T08:00:00Z" }) {
  await c.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [post_id, snapshot_id, agent_id, group_name, text, posted_at],
  );
  return post_id;
}

/** Tin bán đủ trường (giá + diện tích + phường có thước) — số lạ để băm không trùng offer thật. */
const saleText = (area, phone) => `Bán căn hộ 2PN ${area}m2 Nghĩa Đô, giá 3.17 tỷ. LH ${phone}`;

const offersWith = async (c, postId) =>
  (await c.query(`SELECT * FROM sale_offers WHERE $1 = ANY(post_ids) ORDER BY offer_id`, [postId])).rows;

const auditSince = async (c, minId, action) =>
  (await c.query(`SELECT detail FROM ops_audit WHERE id > $1 AND action = $2 ORDER BY id`, [minId, action])).rows;

const maxAuditId = async (c) => Number((await c.query(`SELECT coalesce(max(id), 0) AS m FROM ops_audit`)).rows[0].m);

/** Vân tay toàn bảng stg (AC-9). */
const stgPrint = async (c) =>
  (await c.query(
    `SELECT count(*)::int AS n,
            md5(string_agg(post_id || snapshot_id || coalesce(group_name, '') || text, '|' ORDER BY post_id, snapshot_id)) AS h
     FROM stg_zalo_posts`,
  )).rows[0];

// Ma trận viết trước (E1): hàng lấy nguyên dạng cột stg_zalo_posts thật ngày 23/10.
const AC1_MATRIX = [
  [{ snapshot_id: "hanoi__zalo-mock__2026-10-18T034152", agent_id: null, group_name: "BĐS Hà Nội" }, "snapshot-source"],
  [{ snapshot_id: "hanoi__example__2026-10-17T153258", agent_id: null, group_name: null }, "snapshot-source"],
  [{ snapshot_id: "hcmc__zalo-e2e__2026-10-20T010101", agent_id: "openclaw-hook", group_name: "Nhóm A" }, "snapshot-source"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-19T073318", agent_id: "e2e-agent", group_name: "BĐS Hà Nội" }, "agent"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "test-hook", group_name: "Nhóm A" }, "agent"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TEST" }, "group"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TEST-G1" }, "group"],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "BĐS Hà Nội" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "apify-facebook", group_name: "MUA BÁN NHÀ ĐẤT HÀ NỘI" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "Hội mua bán test nhà" }, null],
  [{ snapshot_id: "hanoi__zalo-agent__2026-10-20T000000", agent_id: "openclaw-hook", group_name: "TESTING ROOM" }, null],
];

/** Thông điệp ghim của một ô ma trận. */
const ac1Message = (row, want) =>
  want === null ? `AC-1 bắt nhầm nhóm thật: ${row.group_name}` : `AC-1 không nhận ra dấu ${want}: ${JSON.stringify(row)}`;

test("AC-1 ma trận dấu", () => {
  let n = 0;
  for (const [row, want] of AC1_MATRIX) {
    assert.equal(testMarker(row), want, ac1Message(row, want));
    n++;
  }
  assert.equal(n, 11, "AC-1 ma trận phải đủ 11 ô");
  assert.deepEqual([...TEST_MARKERS], ["snapshot-source", "agent", "group"]);
});

test("AC-1 chiều đỏ: luật nhóm lỏng bị ma trận bắt", () => {
  // Bản sao luật nhóm bỏ ràng buộc ký tự theo sau — ô «TESTING ROOM» phải đỏ.
  const loose = (row) => (/^test/i.test(row.group_name ?? "") ? "group" : testMarker(row));
  const failed = AC1_MATRIX.filter(([row, want]) => loose(row) !== want).map(([row, want]) => ac1Message(row, want));
  assert.deepEqual(failed, ["AC-1 bắt nhầm nhóm thật: TESTING ROOM"]);
});

test("AC-2 transform S03 từ chối post thử", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const pReal = await insertPost(c, { post_id: pid("real"), text: saleText("61.3", "0912 000 111"), posted_at: "2026-10-22T08:00:00Z" });
    const pOnly = await insertPost(c, { post_id: pid("only"), snapshot_id: MOCK_SNAP, agent_id: null, text: saleText("58.7", "0912 000 333") });

    // Lượt A: chưa có p_test.
    await c.query("SAVEPOINT a");
    await runTransformZalo(c);
    const [offerA] = await offersWith(c, pReal);
    assert.ok(offerA, "AC-2 post thật không thành offer — fixture hỏng");
    await c.query("ROLLBACK TO SAVEPOINT a");

    // Lượt B: thêm p_test cùng tin (cùng băm), khác SĐT, đăng sớm hơn.
    const pTest = await insertPost(c, { post_id: pid("test"), group_name: "TEST-G9", text: saleText("61.3", "0912 000 222"), posted_at: "2026-10-20T08:00:00Z" });
    await runTransformZalo(c);
    const [offerB] = await offersWith(c, pReal);
    assert.deepEqual(offerB.post_ids, [pReal], `AC-2 offer mang post thử: ${pTest}`);
    assert.equal(offerB.n_reposts, 1);
    for (const col of Object.keys(offerA)) {
      assert.deepEqual(offerB[col], offerA[col], `AC-2 offer trộn mang trường của post thử: ${col}`);
    }
    assert.equal((await offersWith(c, pTest)).length, 0, `AC-2 offer mang post thử: ${pTest}`);
    assert.equal((await offersWith(c, pOnly)).length, 0, `AC-2 offer mang post thử: ${pOnly}`);

    // Đối chứng dương: bỏ dấu của p_only → nó thành offer (thước không xanh vì parser bỏ).
    await c.query(`UPDATE stg_zalo_posts SET snapshot_id = $2, agent_id = 'openclaw-hook' WHERE post_id = $1`, [pOnly, AGENT_SNAP]);
    await runTransformZalo(c);
    assert.equal((await offersWith(c, pOnly)).length, 1, "AC-2 đối chứng: p_only bỏ dấu phải thành offer");
  });
});

test("AC-4 rút offer giả qua đối soát", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const p = await insertPost(c, { post_id: pid("ac4"), text: saleText("63.9", "0912 000 444") });
    const first = await runTransformZalo(c);
    const [o] = await offersWith(c, p);
    assert.ok(o, "AC-4 fixture: post thường phải thành offer");
    const { rows: k } = await c.query(
      `INSERT INTO review_queue (item_type, item_id, title, evidence)
       VALUES ('agent_output', $1, $2, $3) RETURNING id`,
      [`enrich:${o.offer_id}`, `Bổ sung dữ liệu: ${o.offer_id}`, { offer_id: o.offer_id }],
    );
    const minId = await maxAuditId(c);

    await c.query(`UPDATE stg_zalo_posts SET group_name = 'TEST' WHERE post_id = $1`, [p]);
    const second = await runTransformZalo(c);

    const left = await c.query(`SELECT 1 FROM sale_offers WHERE offer_id = $1`, [o.offer_id]);
    assert.equal(left.rowCount, 0, `AC-4 offer giả không bị rút: ${o.offer_id}`);
    const card = (await c.query(`SELECT status, decision_note FROM review_queue WHERE id = $1`, [k[0].id])).rows[0];
    assert.equal(card.status, "rejected", "AC-4 thẻ chờ trên tin giả không được đóng");
    assert.ok(card.decision_note, "AC-4 thẻ đóng thiếu ghi chú");

    const rec = await auditSince(c, minId, "enrich:reconcile");
    assert.ok(rec.some((r) => r.detail.source === "S03" && r.detail.stale >= 1), "AC-4 thiếu dòng enrich:reconcile");
    const rej = await auditSince(c, minId, "transform:reject-test");
    assert.equal(rej.length, 1, "AC-4 thiếu dòng transform:reject-test");
    assert.equal(rej[0].detail.source, "S03");
    assert.ok(rej[0].detail.rejected >= 1);
    // Đối chứng cùng fixture: lượt đầu (p chưa dấu) đếm ít hơn đúng một post nhóm thử.
    assert.equal(second.rejected.by_marker.group, (first.rejected.by_marker.group ?? 0) + 1, "AC-4 đếm dấu nhóm lệch");
  });
});

test("AC-5 lượt sạch và lượt toàn thử", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    // (a) stg kênh Zalo không còn post thử (xoá trong giao dịch, ROLLBACK cuối).
    const { rows } = await c.query(
      `SELECT post_id, snapshot_id, agent_id, group_name FROM stg_zalo_posts
       WHERE agent_id IS NULL OR agent_id <> 'apify-facebook'`,
    );
    const testIds = rows.filter((r) => testMarker(r)).map((r) => r.post_id);
    await c.query(`DELETE FROM stg_zalo_posts WHERE post_id = ANY($1)`, [testIds]);
    let minId = await maxAuditId(c);
    const clean = await runTransformZalo(c);
    assert.equal(clean.rejected.total, 0);
    assert.equal((await auditSince(c, minId, "transform:reject-test")).length, 0, "AC-5 lượt sạch vẫn ghi dòng từ chối");
    // Đối chứng: một post thử → đúng một dòng.
    await insertPost(c, { post_id: pid("ac5"), group_name: "TEST", text: saleText("66.1", "0912 000 555") });
    minId = await maxAuditId(c);
    await runTransformZalo(c);
    assert.equal((await auditSince(c, minId, "transform:reject-test")).length, 1, "AC-5 lượt có post thử không ghi dòng từ chối");

    // (b) mọi post kênh Zalo là post thử → dừng, không xoá nguồn.
    const before = Number((await c.query(`SELECT count(*) AS n FROM sale_offers WHERE source = 'S03'`)).rows[0].n);
    await c.query("SAVEPOINT allTest");
    await c.query(`UPDATE stg_zalo_posts SET group_name = 'TEST' WHERE agent_id IS NULL OR agent_id <> 'apify-facebook'`);
    await assert.rejects(runTransformZalo(c), /lượt nạp rỗng/, "AC-5 lượt toàn thử xoá nguồn");
    await c.query("ROLLBACK TO SAVEPOINT allTest");
    const after = Number((await c.query(`SELECT count(*) AS n FROM sale_offers WHERE source = 'S03'`)).rows[0].n);
    assert.equal(after, before, "AC-5 lượt toàn thử xoá nguồn");
  });
});

test("AC-9 stg không đổi", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const before = await stgPrint(c);
    await runTransformZalo(c);
    assert.deepEqual(await stgPrint(c), before, "AC-9 transform sửa stg");
    // Đối chứng: phép đo nhạy với một dòng sửa.
    await c.query(`UPDATE stg_zalo_posts SET text = text || ' ' WHERE post_id = (SELECT min(post_id) FROM stg_zalo_posts)`);
    assert.notDeepEqual(await stgPrint(c), before, "AC-9 vân tay stg không nhạy");
  });
});

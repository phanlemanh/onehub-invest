// test-posts.test.mjs — vòng canonical-khong-tin-gia (PL2): transform gạt post thử, dọn qua đối soát.
// Ca DB chạy trong BEGIN…ROLLBACK trên Postgres local :5433 — không để lại dòng nào.
import { strict as assert } from "node:assert";
import { test } from "node:test";

import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import { TEST_MARKERS, scanStgWriters, testMarker } from "../lib/test-posts.mjs";
import { scanDeleteAll } from "../lib/write-offers.mjs";
import { refreshBaitGap } from "../refresh-bait-gap.mjs";
import { exitCodeFor, measureResidue } from "./test-data-residue.mjs";
import { runTransformFb } from "../transform-fb.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Snapshot fixture (năm 2099 — không trùng snapshot thật).
const ROOT = join(import.meta.dirname, "../..");
const MIG_044 = readFileSync(join(ROOT, "db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const AGENT_SNAP = "hanoi__zalo-agent__2099-01-01T000000";
const MOCK_SNAP = "hanoi__zalo-mock__2099-01-01T000000";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // Cùng khoá với write-offers.test.mjs / agent tests: bộ đó nạp lại hàm 039 trong giao dịch —
    // chạy song song với một lượt đối soát là deadlock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    // PL14: transform ghi vào bảng bản ghi của 044 — DB chưa áp thì nạp 044 trong giao dịch.
    if (!(await c.query(`SELECT to_regclass('sale_offer_records') IS NOT NULL AS ok`)).rows[0].ok) await c.query(MIG_044);
    // PL15: transform/writeOffers đi qua phát biểu + phân xử — nạp 045 và mở cổng cắt chuyển trong giao dịch.
    await napPhatBieu(c);
    await napSdtE164(c); // SD3: sellers là view trên bí danh sdt — nạp 060 trong giao dịch khi DB chưa áp
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
    // PL15: field_provenance mang id phát biểu — id cấp lại ở mỗi lượt (lượt A đã ROLLBACK), so phần còn lại.
    const boIds = (v) => JSON.parse(JSON.stringify(v, (k, x) => (k === "ids" ? undefined : x)));
    for (const col of Object.keys(offerA)) {
      const [a, b] = col === "field_provenance" ? [boIds(offerA[col]), boIds(offerB[col])] : [offerA[col], offerB[col]];
      assert.deepEqual(b, a, `AC-2 offer trộn mang trường của post thử: ${col}`);
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
    // PL14 (044): tin không kế nghỉ thay vì bị xoá; thẻ chờ của nó rời hàng chờ ('deferred'), không còn 'rejected'.
    assert.notEqual(card.status, "pending", "AC-4 thẻ chờ trên tin giả không được đóng");
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

    // (b) mọi post kênh Zalo là post thử → dừng, không xoá nguồn. Đếm NGAY trong savepoint, sau lời
    // gọi bị từ chối và TRƯỚC khi hoàn lại — đếm sau ROLLBACK TO SAVEPOINT thì luôn bằng.
    const s03 = async () => Number((await c.query(`SELECT count(*) AS n FROM sale_offers WHERE source = 'S03'`)).rows[0].n);
    const before = await s03();
    await c.query("SAVEPOINT allTest");
    await c.query(`UPDATE stg_zalo_posts SET group_name = 'TEST' WHERE agent_id IS NULL OR agent_id <> 'apify-facebook'`);
    const minRec = await maxAuditId(c);
    await assert.rejects(runTransformZalo(c), /lượt nạp rỗng/, "AC-5 lượt toàn thử không dừng");
    assert.equal(await s03(), before, "AC-5 lượt toàn thử xoá nguồn");
    assert.equal((await auditSince(c, minRec, "enrich:reconcile")).length, 0, "AC-5 lượt toàn thử vẫn đối soát");
    // Đối chứng cùng phép đếm: cho nghỉ một offer S03 trong savepoint con → view sống đếm lệch (PL14: không xoá tin).
    await c.query("SAVEPOINT probe");
    await c.query(
      `UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot'
        WHERE offer_id = (SELECT min(offer_id) FROM sale_offers WHERE source = 'S03')`,
    );
    assert.equal(await s03(), before - 1, "AC-5 phép đếm không nhạy với một offer rời view sống");
    await c.query("ROLLBACK TO SAVEPOINT probe");
    await c.query("ROLLBACK TO SAVEPOINT allTest");
  });
});

test("AC-9 stg không đổi", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const before = await stgPrint(c);
    await runTransformZalo(c);
    await runTransformFb(c);
    assert.deepEqual(await stgPrint(c), before, "AC-9 transform sửa stg");
    // Đối chứng: phép đo nhạy với một dòng sửa.
    await c.query(`UPDATE stg_zalo_posts SET text = text || ' ' WHERE post_id = (SELECT min(post_id) FROM stg_zalo_posts)`);
    assert.notDeepEqual(await stgPrint(c), before, "AC-9 vân tay stg không nhạy");
  });
});

test("AC-3 transform S05 dùng cùng bộ lọc", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const p = await insertPost(c, { post_id: pid("fb"), agent_id: "apify-facebook", group_name: "TEST FB", text: saleText("67.7", "0912 000 666") });
    const res = await runTransformFb(c);
    assert.equal((await offersWith(c, p)).length, 0, "AC-3 S05 nhận post thử");
    assert.ok(res.rejected.by_marker.group >= 1);
    // Đối chứng cùng fixture: nhóm thường → có offer S05.
    await c.query(`UPDATE stg_zalo_posts SET group_name = 'Mua bán nhà Hà Nội' WHERE post_id = $1`, [p]);
    await runTransformFb(c);
    const got = await offersWith(c, p);
    assert.equal(got.length, 1, "AC-3 đối chứng: post Facebook thường phải thành offer");
    assert.equal(got[0].source, "S05");
  });
});

/** Mọi tệp mã không phải test dưới các thư mục cho trước (bỏ node_modules, tests/, *.test.*). */
function codeFiles(dirs, exts) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, e.name);
      if (e.isDirectory()) {
        if (["node_modules", "tests", ".next", "dist"].includes(e.name)) continue;
        walk(full);
      } else if (exts.some((x) => e.name.endsWith(x)) && !/\.i?test\./.test(e.name)) { // tệp test (kể cả *.itest.*) dựng fixture có chủ đích
        out.push({ path: relative(ROOT, full), text: readFileSync(full, "utf8") });
      }
    }
  };
  for (const d of dirs) walk(join(ROOT, d));
  return out;
}

test("AC-3 quét quan hệ: chỉ loadStgPosts đưa stg vào canonical", () => {
  const files = codeFiles(["pipeline", "agent/src"], [".mjs", ".ts"]);
  assert.ok(files.some((f) => f.path === "pipeline/transform-zalo.mjs"), "AC-3 bộ quét không thấy transform — đường dẫn hỏng");
  assert.deepEqual(scanStgWriters(files), [], "AC-3 có đường đọc stg ghi canonical ngoài loadStgPosts");
  // Chiều đỏ: tệp mẫu đọc stg rồi gọi writeOffers.
  const bad = { path: "mau.mjs", text: "const r = await c.query('SELECT * FROM stg_zalo_posts');\nawait writeOffers(c, 'S03', r);" };
  assert.deepEqual(scanStgWriters([bad, { path: "sach.mjs", text: "// stg_zalo_posts\nawait writeOffers(c, 'S03', r);" }]), ["mau.mjs"]);
});

test("AC-4 không câu DELETE FROM sale_offers mới", () => {
  const files = codeFiles(["pipeline", "agent/src", "app/src", "data-api/src", "scripts"], [".mjs", ".ts", ".tsx", ".sh"]);
  assert.ok(files.length > 50, "AC-4 bộ quét đọc quá ít tệp — đường dẫn hỏng");
  const hit = [...new Set(scanDeleteAll(files).map((h) => h.split(":")[0]))].sort();
  assert.deepEqual(hit, ["pipeline/lib/write-offers.mjs"], "AC-4 có câu DELETE FROM sale_offers ngoài đối soát");
  assert.deepEqual(scanDeleteAll([{ path: "mau.mjs", text: "x\n  await c.query(\"DELETE FROM sale_offers WHERE source = 'S03'\");" }]), ["mau.mjs:2"]);
});

test("AC-6 bait gap tính lại", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    const ward = (await c.query(`SELECT 1 FROM v_ruler_p2_area WHERE area_id = 'vn-hanoi-nghia-do'`)).rowCount;
    assert.equal(ward, 1, "AC-6 fixture: phường Nghĩa Đô không còn thước P2 — đổi phường fixture");
    const pReal = await insertPost(c, { post_id: pid("gap_real"), text: saleText("61.9", "0912 000 777") });
    const pTest = await insertPost(c, { post_id: pid("gap_test"), snapshot_id: MOCK_SNAP, agent_id: null, text: saleText("70.1", "0912 000 888") });
    await runTransformZalo(c);
    await refreshBaitGap(c);
    const [real] = await offersWith(c, pReal);
    assert.equal(real.area_id, "vn-hanoi-nghia-do");
    assert.notEqual(real.bait_gap_pct, null, "AC-6 tin thật mất bait gap");
    assert.equal((await offersWith(c, pTest)).length, 0, `AC-6 bait gap trên tin thử: ${pTest}`);
    // Không offer S03 nào giao với tập post thử của stg mang bait gap.
    const { rows } = await c.query(`SELECT post_id, snapshot_id, agent_id, group_name FROM stg_zalo_posts`);
    const testIds = rows.filter((r) => testMarker(r)).map((r) => r.post_id);
    const leaked = (await c.query(
      `SELECT offer_id FROM sale_offers WHERE post_ids && $1::text[] AND bait_gap_pct IS NOT NULL`, [testIds],
    )).rows.map((r) => r.offer_id);
    assert.deepEqual(leaked, [], `AC-6 bait gap trên tin thử: ${leaked[0]}`);
    // Đối chứng cùng fixture: bỏ dấu của p_test → offer của nó có bait gap.
    await c.query(`UPDATE stg_zalo_posts SET snapshot_id = $2, agent_id = 'openclaw-hook' WHERE post_id = $1`, [pTest, AGENT_SNAP]);
    await runTransformZalo(c);
    await refreshBaitGap(c);
    const [ctrl] = await offersWith(c, pTest);
    assert.notEqual(ctrl?.bait_gap_pct ?? null, null, "AC-6 đối chứng: tin cùng loại phải có bait gap");
  });
});

test("AC-8 thước dư lượng bắt được tin giả", { timeout: 300_000 }, async () => {
  await withTx(async (c) => {
    // Đưa DB trong giao dịch về trạng thái đã dọn, rồi lấy mốc ngay trước khi chèn p.
    await runTransformZalo(c);
    await refreshBaitGap(c);
    const base = await measureResidue(c);

    // Fixture đi qua writer thật: post thường → offer (writeOffers) → người bán theo hash writer ghi.
    const p = await insertPost(c, { post_id: pid("res"), text: saleText("59.3", "0912 000 999") });
    await runTransformZalo(c);
    const [o] = await offersWith(c, p);
    assert.ok(o?.seller_phone_hash, "AC-8 fixture: offer phải mang hash SĐT");
    // Người theo SĐT như bộ dựng danh bạ ghi (bí danh sdt) → view sellers có dòng cho số này.
    await c.query(`INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZTP01', 'S03')`);
    await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source)
      VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZTP01', 'sdt', $1, 'S03') ON CONFLICT DO NOTHING`, [o.seller_phone]);
    // Gắn dấu thử cho p trong stg, KHÔNG chạy lại transform → offer giả còn nằm trong canonical.
    await c.query(`UPDATE stg_zalo_posts SET group_name = 'TEST' WHERE post_id = $1`, [p]);
    const dirty = await measureResidue(c);
    assert.ok(dirty.offers_from_test >= base.offers_from_test + 1, "AC-8 thước không thấy offer giả");
    assert.ok(dirty.sellers_from_test >= base.sellers_from_test + 1, "AC-8 thước không thấy người bán giả");
    assert.equal(dirty.offers_from_test, dirty.offers_from_test_sql, "AC-8 hai cách đếm lệch nhau");
    assert.equal(dirty.ok, false);
    assert.equal(exitCodeFor(dirty), 1);

    // Đối chứng cùng fixture: lượt dọn → về mốc.
    await runTransformZalo(c);
    await refreshBaitGap(c);
    const clean = await measureResidue(c);
    assert.equal(clean.offers_from_test, base.offers_from_test);
    assert.equal(clean.sellers_from_test, base.sellers_from_test);
    assert.equal(exitCodeFor({ ok: true }), 0);
  });
});

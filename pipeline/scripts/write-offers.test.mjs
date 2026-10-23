// write-offers.test.mjs — vòng enrich-hau-ky AC-1…AC-5: nạp lại S03/S05 không xoá đề xuất.
// Mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local, nạp 033+036+039 trong transaction (không
// áp migration thật), nguồn thử 'TST' để đối soát không đụng offer S03/S05 thật.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

import pg from "pg";

import { scanDeleteAll, writeOffers } from "../lib/write-offers.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const MIGRATION = ["033_enrichment_proposals.sql", "036_revert_enrichment.sql", "039_enrichment_proposals_retain.sql"]
  .map((f) => readFileSync(join(ROOT, "db/migrations", f), "utf8"))
  .join("\n");
const SRC = "TST";

async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // Cùng khoá với agent/tests/helpers/db.ts — hai bộ test nạp CREATE OR REPLACE FUNCTION song song là deadlock.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await c.query(MIGRATION);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

let seq = 0;
const now = new Date("2026-10-23T00:00:00Z");
/** Một hàng offer như transform dựng (khoá = cột sale_offers). */
const row = (id, posts, extra = {}) => ({
  offer_id: id, kind: "sale", confidence: "high", first_seen: now, last_seen: now,
  n_reposts: 1, post_ids: posts, price_tier: "P1", property_type: "unknown", ...extra,
});
const uid = (p) => `t_wo_${p}_${++seq}`;

async function proposal(c, offerId, field, value, status, extra = {}) {
  const { rows } = await c.query(
    `INSERT INTO enrichment_proposals (run_id, offer_id, field, value, value_key, source, route, status,
       decided_by, review_id, evidence)
     VALUES ('test', $1, $2, $3, lower($3), $4, $5, $6, $7, $8, $9) RETURNING id`,
    [offerId, field, value, extra.source ?? "e2_llm", extra.route ?? "review", status,
     extra.decided_by ?? null, extra.review_id ?? null,
     extra.evidence ?? { text: "đoạn tin gốc có SĐT", group_name: "Nhóm thử" }],
  );
  return Number(rows[0].id);
}
async function card(c, offerId) {
  const { rows } = await c.query(
    `INSERT INTO review_queue (item_type, item_id, title, evidence)
     VALUES ('agent_output', $1, $2, $3) RETURNING id`,
    [`enrich:${offerId}`, `Bổ sung dữ liệu: ${offerId}`, { offer_id: offerId }],
  );
  return Number(rows[0].id);
}
const props = async (c, offerId) =>
  (await c.query(`SELECT * FROM enrichment_proposals WHERE offer_id = $1 ORDER BY id`, [offerId])).rows;
const offer = async (c, id) => (await c.query(`SELECT * FROM sale_offers WHERE offer_id = $1`, [id])).rows[0];
const snap = (rows) => rows.map((p) => [Number(p.id), p.status, p.decided_by, p.review_id === null ? null : Number(p.review_id)]);

/** Khối ghi CŨ của transform (trước vòng này): DELETE toàn nguồn rồi INSERT. */
async function legacyWrite(c, offers) {
  await c.query(`DELETE FROM sale_offers WHERE source = $1`, [SRC]);
  for (const o of offers) {
    const r = { ...o, source: SRC };
    const cols = Object.keys(r);
    await c.query(`INSERT INTO sale_offers (${cols}) VALUES (${cols.map((_, i) => `$${i + 1}`)})`, cols.map((k) => r[k]));
  }
}

/** Dựng X đã enrich + đề xuất applied/rejected/queued-trên-thẻ. */
async function enrichedOffer(c, id, posts) {
  await writeOffers(c, SRC, [row(id, posts)]);
  await c.query(`UPDATE sale_offers SET property_type = 'house', street_raw = 'Quang Trung', bathrooms = 2 WHERE offer_id = $1`, [id]);
  const cardId = await card(c, id);
  const ids = {
    applied: await proposal(c, id, "property_type", "house", "applied", { decided_by: "hitl:manh" }),
    rejected: await proposal(c, id, "block_raw", "S1.03", "rejected", { decided_by: "hitl:manh" }),
    queued: await proposal(c, id, "bedrooms", "3", "queued", { review_id: cardId }),
  };
  return { cardId, ids };
}

// ── AC-1 ─────────────────────────────────────────────────────────────────────────────────
test("AC-1 nạp lại giữ đề xuất", async () => {
  await withTx(async (c) => {
    const x = uid("x");
    const { cardId } = await enrichedOffer(c, x, ["p1"]);
    const before = snap(await props(c, x));
    assert.equal(before.length, 3);

    await writeOffers(c, SRC, [row(x, ["p1", "p1b"], { n_reposts: 2 })]);

    assert.deepEqual(snap(await props(c, x)), before, "AC-1 nạp lại làm mất đề xuất");
    const o = await offer(c, x);
    assert.deepEqual([o.property_type, o.street_raw, o.bathrooms], ["house", "Quang Trung", 2],
      "AC-1 nạp lại ghi đè field đã enrich");
    assert.deepEqual([o.n_reposts, o.post_ids], [2, ["p1", "p1b"]], "AC-1 cột nguồn phải được làm mới");
    const k = (await c.query(`SELECT status, item_id FROM review_queue WHERE id = $1`, [cardId])).rows[0];
    assert.deepEqual([k.status, k.item_id], ["pending", `enrich:${x}`]);
  });
});

test("AC-1 chiều đỏ: khối ghi cũ (DELETE toàn nguồn) bị chặn", async () => {
  await withTx(async (c) => {
    const x = uid("x");
    await enrichedOffer(c, x, ["p1"]);
    await c.query("SAVEPOINT s");
    await assert.rejects(legacyWrite(c, [row(x, ["p1"])]),
      (e) => e.code === "23503" && /enrichment_proposals_offer_id_fkey/.test(e.message),
      "AC-1 nạp lại làm mất đề xuất");
    await c.query("ROLLBACK TO SAVEPOINT s");
    assert.equal((await props(c, x)).length, 3);
  });
});

// ── AC-2 ─────────────────────────────────────────────────────────────────────────────────
test("AC-2 offer kế nhận đề xuất, áp lại, thẻ trỏ sang", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const y = uid("y");
    const { cardId, ids } = await enrichedOffer(c, x, ["p1"]);
    const before = new Map(snap(await props(c, x)).map((r) => [r[0], r]));

    const { reconcile } = await writeOffers(c, SRC, [row(y, ["p1"], { price_vnd: 6_500_000_000 })]);

    assert.equal(await offer(c, x), undefined, "AC-2 offer cũ phải bị xoá");
    const ps = await props(c, y);
    assert.equal(ps.length, 3, "AC-2 đề xuất phải nằm ở offer kế");
    for (const p of ps) {
      const b = before.get(Number(p.id));
      assert.equal(p.status, b[1], `AC-2 trạng thái đổi: ${p.field}`);
      assert.equal(p.decided_by, b[2]);
    }
    assert.equal((await offer(c, y)).property_type, "house", "AC-2 giá trị đã duyệt phải áp lại lên offer kế");
    assert.equal(ps.find((p) => Number(p.id) === ids.applied).status, "applied");
    const k = (await c.query(`SELECT status, item_id, evidence FROM review_queue WHERE id = $1`, [cardId])).rows[0];
    assert.deepEqual([k.status, k.item_id, k.evidence.offer_id], ["pending", `enrich:${y}`, y]);
    assert.deepEqual(reconcile.pairs, [{ from: x, to: y }]);
    const audit = (await c.query(`SELECT detail FROM ops_audit WHERE action = 'enrich:reconcile' ORDER BY id DESC LIMIT 1`)).rows[0];
    assert.deepEqual(audit.detail.pairs, [{ from: x, to: y }]);
    assert.equal(audit.detail.moved, 3);
  });
});

test("AC-2 offer kế đã có thẻ chờ: thẻ cũ để sau, đề xuất thành lỏng", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const y = uid("y");
    const { cardId, ids } = await enrichedOffer(c, x, ["p1"]);
    await writeOffers(c, SRC, [row(x, ["p1"]), row(y, ["p9"])]);
    const yCard = await card(c, y);
    await writeOffers(c, SRC, [row(y, ["p9", "p1"])]);
    const k = (await c.query(`SELECT status, decided_by FROM review_queue WHERE id = $1`, [cardId])).rows[0];
    assert.deepEqual([k.status, k.decided_by], ["deferred", `transform:${SRC}`]);
    const q = (await c.query(`SELECT offer_id, status, review_id FROM enrichment_proposals WHERE id = $1`, [ids.queued])).rows[0];
    assert.deepEqual([q.offer_id, q.status, Number(q.review_id)], [y, "queued", cardId], "đề xuất phải lỏng (thẻ không còn chờ)");
    assert.equal((await c.query(`SELECT status FROM review_queue WHERE id = $1`, [yCard])).rows[0].status, "pending");
  });
});

test("AC-2 offer kế đã có giá trị khác: đề xuất áp lại thành skipped", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const y = uid("y");
    const { ids } = await enrichedOffer(c, x, ["p1"]);
    await writeOffers(c, SRC, [row(y, ["p1"], { property_type: "apartment" })]);
    assert.equal((await offer(c, y)).property_type, "apartment");
    const p = (await c.query(`SELECT status FROM enrichment_proposals WHERE id = $1`, [ids.applied])).rows[0];
    assert.equal(p.status, "skipped");
  });
});

test("AC-2 post tách: offer chung nhiều post nhất nhận, hoà thì mã nhỏ hơn", async () => {
  for (const [yPosts, zPosts, expect] of [[["p1", "p2"], ["p3"], "y"], [["p1"], ["p2"], "y"]]) {
    await withTx(async (c) => {
      const x = uid("x"); const y = `${uid("a")}_y`; const z = `${uid("b")}_z`; // y < z theo thứ tự chữ
      await writeOffers(c, SRC, [row(x, ["p1", "p2", "p3"])]);
      await proposal(c, x, "street_raw", "Bạch Đằng", "rejected", { decided_by: "hitl:manh" });
      await writeOffers(c, SRC, [row(y, yPosts), row(z, zPosts)]);
      const target = expect === "y" ? y : z;
      assert.equal((await props(c, target)).length, 1, `AC-2 tách post: đề xuất phải ở ${target}`);
      assert.equal((await props(c, expect === "y" ? z : y)).length, 0);
    });
  }
});

test("AC-2 chiều đỏ: offer không chung post không nhận đề xuất", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const y = uid("y");
    await enrichedOffer(c, x, ["p1"]);
    await writeOffers(c, SRC, [row(y, ["p2"])]);
    assert.equal((await props(c, y)).length, 0, "AC-2 chuyển nhầm sang offer không chung post");
  });
});

// ── AC-3: ma trận trùng khoá, viết trước ─────────────────────────────────────────────────
const COLLIDE = [
  { x: "rejected", y: "queued", keep: "rejected", from: "x" },
  { x: "applied", y: "superseded", keep: "applied", from: "x" },
  { x: "queued", y: "rejected", keep: "rejected", from: "y" },
  { x: "queued", y: "queued", keep: "queued", from: "y" },
];

test("AC-3 trùng khoá giữ dòng đã quyết", async () => {
  assert.equal(COLLIDE.length, 4);
  let cells = 0;
  for (const m of COLLIDE) {
    await withTx(async (c) => {
      const x = uid("x"); const y = uid("y");
      await writeOffers(c, SRC, [row(x, ["p1"]), row(y, ["p9"])]);
      if (m.x === "applied") await c.query(`UPDATE sale_offers SET street_raw = 'Lê Lợi' WHERE offer_id = $1`, [x]);
      const px = await proposal(c, x, "street_raw", "Lê Lợi", m.x, { decided_by: "hitl:manh" });
      const py = await proposal(c, y, "street_raw", "lê lợi", m.y);
      await writeOffers(c, SRC, [row(y, ["p9", "p1"])]);
      const rows = (await props(c, y)).filter((p) => p.field === "street_raw");
      assert.equal(rows.length, 1, `AC-3 ${m.x}/${m.y}: phải còn đúng một dòng`);
      assert.equal(rows[0].status, m.keep, "AC-3 mất quyết định của người");
      assert.equal(Number(rows[0].id), m.from === "x" ? px : py);
      cells++;
    });
  }
  assert.equal(cells, COLLIDE.length);
});

test("AC-3 hai offer cũ cùng đổ về một offer kế", async () => {
  await withTx(async (c) => {
    const x1 = uid("x"); const x2 = uid("x"); const y = uid("y");
    await writeOffers(c, SRC, [row(x1, ["p1"]), row(x2, ["p2"])]);
    await proposal(c, x1, "bathrooms", "2", "rejected", { decided_by: "hitl:manh" });
    await proposal(c, x2, "bathrooms", "2", "queued");
    await writeOffers(c, SRC, [row(y, ["p1", "p2"])]);
    const rows = await props(c, y);
    assert.deepEqual(rows.map((p) => p.status), ["rejected"]);
  });
});

// ── AC-4 ─────────────────────────────────────────────────────────────────────────────────
test("AC-4 offer không kế: xoá có ảnh chụp, khôi phục được khi tin quay lại", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const z = uid("z");
    await c.query(`SELECT 1`);
    const { cardId } = await enrichedOffer(c, x, ["p1"]);
    await c.query(`UPDATE sale_offers SET seller_phone = '0900000000', seller_name = 'Tên Thử' WHERE offer_id = $1`, [x]);
    const before = await props(c, x);

    await writeOffers(c, SRC, [row(z, ["p7"])]);

    assert.equal(await offer(c, x), undefined);
    assert.equal((await props(c, x)).length, 0);
    const k = (await c.query(`SELECT status, decision_note FROM review_queue WHERE id = $1`, [cardId])).rows[0];
    assert.equal(k.status, "rejected");
    assert.match(k.decision_note, /enrich:retire/);
    const audit = (await c.query(`SELECT detail FROM ops_audit WHERE action = 'enrich:retire' ORDER BY id DESC LIMIT 1`)).rows[0].detail;
    const raw = JSON.stringify(audit);
    assert.ok(!raw.includes("đoạn tin gốc"), "AC-4 audit mang đoạn tin gốc");
    assert.ok(!/seller|0900000000|Tên Thử/.test(raw), "AC-4 audit mang thông tin người bán");
    assert.deepEqual(audit.offers, [{ offer_id: x, enriched: {
      property_type: "house", bedrooms: null, bathrooms: 2, street_raw: "Quang Trung", block_raw: null } }]);

    // Tin quay lại (băm cũ) → X sinh lại → chèn lại đề xuất từ ảnh chụp, qua khoá ngoại RESTRICT.
    await writeOffers(c, SRC, [row(x, ["p1"])]);
    await c.query(
      `INSERT INTO enrichment_proposals SELECT * FROM jsonb_populate_recordset(NULL::enrichment_proposals, $1::jsonb)`,
      [JSON.stringify(audit.proposals)],
    );
    const after = await props(c, x);
    const strip = (p) => ({ ...p, evidence: { ...p.evidence, text: undefined } });
    assert.deepEqual(after.map(strip).map((p) => JSON.stringify(p)), before.map(strip).map((p) => JSON.stringify(p)),
      "AC-4 ảnh chụp không đủ để khôi phục");
  });
});

// ── AC-5 ─────────────────────────────────────────────────────────────────────────────────
test("AC-5 khoá ngoại RESTRICT", async () => {
  await withTx(async (c) => {
    const x = uid("x"); const free = uid("f");
    await writeOffers(c, SRC, [row(x, ["p1"]), row(free, ["p2"])]);
    await proposal(c, x, "bathrooms", "1", "queued");
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(`DELETE FROM sale_offers WHERE offer_id = $1`, [x]), (e) => e.code === "23503");
    await c.query("ROLLBACK TO SAVEPOINT s");
    assert.ok(await offer(c, x));
    // Đối chứng dương: offer không có đề xuất xoá được.
    await c.query(`DELETE FROM sale_offers WHERE offer_id = $1`, [free]);
    assert.equal(await offer(c, free), undefined);
  });
});

test("AC-5 transform không DELETE toàn nguồn", () => {
  const files = ["pipeline/transform-zalo.mjs", "pipeline/transform-fb.mjs"].map((p) => ({
    path: p, text: readFileSync(join(ROOT, p), "utf8"),
  }));
  assert.deepEqual(scanDeleteAll(files), [], "AC-5 transform còn câu DELETE FROM sale_offers");
  for (const f of files) assert.match(f.text, /import \{ writeOffers \} from "\.\/lib\/write-offers\.mjs"/, f.path);
  // Chiều đỏ: bộ quét bắt được câu cũ.
  assert.deepEqual(scanDeleteAll([{ path: "mau.mjs", text: `x\n    await client.query("DELETE FROM sale_offers WHERE source = 'S03'");` }]),
    ["mau.mjs:2"]);
});

test("AC-5 thiếu migration 039 thì dừng trước khi ghi", async () => {
  await withTx(async (c) => {
    await c.query(`DROP FUNCTION reconcile_stale_offers(text, text[], text)`);
    const x = uid("x");
    await assert.rejects(writeOffers(c, SRC, [row(x, ["p1"])]), /chưa áp migration 039/);
    assert.equal(await offer(c, x), undefined, "writeOffers đã ghi trước khi kiểm migration");
  });
});

test("lượt nạp rỗng bị từ chối", async () => {
  await withTx(async (c) => {
    const x = uid("x");
    await writeOffers(c, SRC, [row(x, ["p1"])]);
    await assert.rejects(writeOffers(c, SRC, []), /lượt nạp rỗng/);
    assert.ok(await offer(c, x), "lượt rỗng đã xoá offer của nguồn");
  });
});

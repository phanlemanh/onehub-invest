// enrich-apply.test.ts — hàm SQL apply_enrichment / decide_enrichment_review
// (migration 033) trên Postgres local, trong BEGIN…ROLLBACK.
import { test } from "node:test";
import assert from "node:assert/strict";

import { withTx, insertOffer, insertProperty, insertProposal } from "./helpers/db.js";

test("AC-5 apply điền ô trống + cascade", async () => {
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_a1" });
    const prop = await insertProperty(c, "t_offer_a1");
    const id = await insertProposal(c, { offer_id: "t_offer_a1", field: "bedrooms", value: "2" });

    const { rows: [{ n }] } = await c.query(`SELECT apply_enrichment($1, 't') AS n`, [[id]]);
    assert.equal(n, 1);
    const { rows: [o] } = await c.query(`SELECT bedrooms FROM sale_offers WHERE offer_id='t_offer_a1'`);
    assert.equal(o.bedrooms, 2);
    const { rows: [p] } = await c.query(`SELECT bedrooms, enrichment_log FROM properties WHERE id=$1`, [prop]);
    assert.equal(p.bedrooms, 2);
    const last = p.enrichment_log.at(-1);
    assert.equal(last.src, "enrich-proposals");
    assert.deepEqual(last.proposal_ids, [id]);
    assert.equal(last.actor, "t");
    const { rows: [ep] } = await c.query(`SELECT status, applied_at FROM enrichment_proposals WHERE id=$1`, [id]);
    assert.equal(ep.status, "applied");
    assert.ok(ep.applied_at);
  });
});

test("AC-5 theo thứ tự phương pháp (PL15): E2 thắng giá trị cũ (legacy), thua bộ đọc tin — skipped khi thua", async () => {
  // PL15 gỡ fill-gap: ô «đã có» không còn tự thắng; thắng thua theo lớp + thứ tự tạm (parser › e1 › e2 › legacy).
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_a2", bedrooms: 3 });   // 3 = phát biểu legacy
    const id = await insertProposal(c, { offer_id: "t_offer_a2", field: "bedrooms", value: "2" });
    const { rows: [{ n }] } = await c.query(`SELECT apply_enrichment($1, 't') AS n`, [[id]]);
    assert.equal(n, 1, "AC-5 E2 phải thắng giá trị legacy");
    const { rows: [o] } = await c.query(`SELECT bedrooms, field_provenance FROM sale_offers WHERE offer_id='t_offer_a2'`);
    assert.equal(o.bedrooms, 2);
    assert.equal(o.field_provenance.bedrooms.conflict, true, "AC-5 E2 trái legacy phải gắn cờ bất đồng");

    // chiều đỏ: bộ đọc tin (parser) đã nói 4 → E2 thua, đề xuất skipped, cột giữ 4
    await insertOffer(c, { offer_id: "t_offer_a2b", post_ids: ["p_a2b"] });
    await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at)
      VALUES ('S03:p_a2b', 'bedrooms', '4', 'observed', 'parser', now())`);
    const id2 = await insertProposal(c, { offer_id: "t_offer_a2b", field: "bedrooms", value: "2" });
    const { rows: [{ n: n2 }] } = await c.query(`SELECT apply_enrichment($1, 't') AS n`, [[id2]]);
    assert.equal(n2, 0, "AC-5 skipped: E2 thua bộ đọc tin thì không được tính là áp");
    assert.equal((await c.query(`SELECT bedrooms FROM sale_offers WHERE offer_id='t_offer_a2b'`)).rows[0].bedrooms, 4);
    const { rows: [ep] } = await c.query(`SELECT status FROM enrichment_proposals WHERE id=$1`, [id2]);
    assert.equal(ep.status, "skipped");
  });
});

test("AC-5 property_type 'unknown' tính là ô trống", async () => {
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_a3", property_type: "unknown" });
    const id = await insertProposal(c, { offer_id: "t_offer_a3", field: "property_type", value: "apartment" });
    await c.query(`SELECT apply_enrichment($1, 't')`, [[id]]);
    const { rows: [o] } = await c.query(`SELECT property_type FROM sale_offers WHERE offer_id='t_offer_a3'`);
    assert.equal(o.property_type, "apartment");
  });
});

test("AC-2 offer không property", async () => {
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_b1" });
    await insertProperty(c, "t_offer_b1");
    await insertOffer(c, { offer_id: "t_offer_b2" }); // không gắn căn nào
    const a = await insertProposal(c, { offer_id: "t_offer_b1", field: "street_raw", value: "Đinh Bộ Lĩnh" });
    const b = await insertProposal(c, { offer_id: "t_offer_b2", field: "street_raw", value: "Lê Văn Sỹ" });

    const { rows: [{ n }] } = await c.query(`SELECT apply_enrichment($1, 't') AS n`, [[a, b]]);
    assert.equal(n, 2);
    const { rows } = await c.query(
      `SELECT offer_id, street_raw FROM sale_offers WHERE offer_id IN ('t_offer_b1','t_offer_b2') ORDER BY offer_id`,
    );
    assert.deepEqual(rows.map((r) => r.street_raw), ["Đinh Bộ Lĩnh", "Lê Văn Sỹ"]);
  });
});

test("AC-6 decide rejected/deferred", async () => {
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_c1" });
    const { rows: [rq] } = await c.query(
      `INSERT INTO review_queue (item_type, item_id, title) VALUES ('agent_output', 'enrich:t_offer_c1', 't') RETURNING id`,
    );
    const id = await insertProposal(c, { offer_id: "t_offer_c1", field: "bedrooms", value: "2", review_id: rq.id });

    const { rows: [{ d }] } = await c.query(`SELECT decide_enrichment_review($1, 'deferred', 't') AS d`, [rq.id]);
    assert.equal(d, 0);
    let ep = (await c.query(`SELECT status FROM enrichment_proposals WHERE id=$1`, [id])).rows[0];
    assert.equal(ep.status, "queued");

    const { rows: [{ r }] } = await c.query(`SELECT decide_enrichment_review($1, 'rejected', 't') AS r`, [rq.id]);
    assert.equal(r, 1);
    ep = (await c.query(`SELECT status, decided_by FROM enrichment_proposals WHERE id=$1`, [id])).rows[0];
    assert.equal(ep.status, "rejected");
    assert.equal(ep.decided_by, "t");
    const { rows: [o] } = await c.query(`SELECT bedrooms FROM sale_offers WHERE offer_id='t_offer_c1'`);
    assert.equal(o.bedrooms, null);
  });
});

test("AC-6 khoá duy nhất", async () => {
  await withTx(async (c) => {
    await insertOffer(c, { offer_id: "t_offer_c2" });
    await insertProposal(c, { offer_id: "t_offer_c2", field: "property_type", value: "apartment" });
    await assert.rejects(
      insertProposal(c, { offer_id: "t_offer_c2", field: "property_type", value: "Apartment" }),
      (e: { code?: string }) => e.code === "23505",
      "AC-6 đẩy lại giá trị đã bác: cùng offer/field/giá trị (khác hoa thường)/nguồn phải bị chặn",
    );
  });
});

test("decide status lạ bị từ chối", async () => {
  await withTx(async (c) => {
    await assert.rejects(c.query(`SELECT decide_enrichment_review(1, 'maybe', 't')`), /status không hợp lệ/);
  });
});

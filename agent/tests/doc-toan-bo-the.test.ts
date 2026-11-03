// doc-toan-bo-the.test.ts — hồ sơ _acceptance/s03-llm-doc-toan-bo AC-7: thẻ và đề xuất do lệnh đọc toàn bộ ghi phải khớp từng chữ
// fixtures/ls1-the-doi-chieu.json. app/tests/the-duyet-du-can-cu.test.tsx nạp fixture này rồi duyệt qua route thật, vì job app của
// CI không có phụ thuộc của agent. Đổi đầu ghi mà không đổi fixture thì ca này đỏ. Model giả, DB trong BEGIN…ROLLBACK.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { chayLuot, docTraLoi } from "../src/enrich/doc-toan-bo.js";
import { insertOffer, withTx } from "./helpers/db.js";

const SNAP = "hanoi__zalo-agent__2099-05-05T000000";
const MA = "t_ls1_the";
const CHU = "Khách cần mua căn hộ giá 5 tỷ khu Minh Khai rộng rãi";
const TRA_LOI = JSON.stringify({
  intent: "inquiry", kind: null, confidence: 0.9, quote: "cần mua căn hộ", property_type: "apartment", quote_loai: "cần mua căn hộ",
  price_vnd: 5e9, quote_gia: "giá 5 tỷ",
});

test("LS1-AC-7 đầu ghi khớp fixture thẻ mà app duyệt qua route", async () => {
  const fixture = await readFile(join(import.meta.dirname, "fixtures/ls1-the-doi-chieu.json"), "utf8");
  await withTx(async (c) => {
    await c.query(await readFile(join(import.meta.dirname, "../../db/migrations/065_silver_labels.sql"), "utf8"));
    await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'zalo-agent', '{}') ON CONFLICT (snapshot_id) DO NOTHING`, [SNAP]);
    const post = `${MA}_p`;
    await c.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, conversation_id, text, posted_at)
       VALUES ($1, $2, 'openclaw-hook', 'Nhóm mồi LS1', 'ls1', $3, '2026-10-31T08:00:00Z')`,
      [post, SNAP, CHU],
    );
    await insertOffer(c, { offer_id: MA, source: "S03", property_type: "unknown", street_raw: null, post_ids: [post] });
    await c.query(`UPDATE sale_offers SET price_vnd = 3e9, area_m2 = 70, kind = 'sale', confidence = 'high' WHERE offer_id = $1`, [MA]);
    const kq = await chayLuot({
      client: c, runId: "ls1-the", tranUsd: 3, tranThe: 500, thu: false, cam: [], chiTin: [MA],
      hoi: async (chu) => ({ model: "gateway:anthropic/claude-haiku-5.5", ...docTraLoi(TRA_LOI, chu), error_kind: null, latency_ms: 1, cost_usd: 0 }),
      resolve: async () => ({ projectSlug: null, projectName: null, projectCandidates: [], propertyType: "land", typeBasis: "luật mồi", buildingHint: null, areaHint: null, matchedBy: "" }),
    });
    assert.deepEqual([kq.loiGhi, kq.theMoi], [[], 1], "LS1-AC-7 lệnh đọc phải ghi được đúng một thẻ");
    const { rows: [the] } = await c.query(`SELECT item_type, title, evidence FROM review_queue WHERE item_id = $1`, [`enrich:${MA}`]);
    const { rows: deXuat } = await c.query(
      `SELECT id, field, value, value_key, source, route, corroborated_by, confidence, model, trace_path, evidence, status
       FROM enrichment_proposals WHERE offer_id = $1 ORDER BY source`,
      [MA],
    );
    // Mã đề xuất đổi theo lượt: app gắn lại theo `source`.
    const theoNguon = new Map(deXuat.map((d) => [Number(d.id), d.source]));
    const thucTe = {
      ma_tin: MA,
      the: { ...the, evidence: { ...the.evidence, fields: the.evidence.fields.map((f: { proposal_id: number }) => ({ ...f, proposal_id: theoNguon.get(f.proposal_id) })) } },
      de_xuat: deXuat.map(({ id: _id, ...d }) => d),
    };
    assert.deepEqual(thucTe, JSON.parse(fixture), "LS1-AC-7 đầu ghi lệch fixture thẻ: sửa đầu ghi, hoặc cập nhật fixture và chạy lại ca route ở app");
  });
});

// enrich-revert.test.ts — vòng enrich-hau-ky: hoàn tác một lượt áp (036), CLI, migration chạy lại.
// Mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local (helpers/db.ts nạp 033+036+039).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import type pg from "pg";

import { main } from "../scripts/enrich-revert.js";
import type { ContextResult } from "../src/agents/context-resolver.js";
import { runEnrich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { withTx, insertOffer, insertProperty, insertProposal } from "./helpers/db.js";

let seq = 0;
const nextId = () => `t_rev_${++seq}`;

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "", ...o,
});
const resolveWith = (o: Partial<ContextResult> = {}): ResolveFn => async () => ctx(o);
const llmNone: LlmFn = async () => ({ result: null, model: "qwen27b", tracePath: null });

/** Một offer S03 có tin nguồn; trả offer_id. */
async function offerWithPost(c: pg.Client, o: { text?: string; group?: string; bedrooms?: number | null } = {}) {
  const id = nextId();
  await c.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
     ON CONFLICT (snapshot_id) DO NOTHING`,
  );
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, $3)`, [
    `p_${id}`, o.text ?? "Bán nhà 4 tầng ngay chợ, sổ hồng chính chủ, giá thương lượng", o.group ?? "Nhóm thử",
  ]);
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: "unknown", bedrooms: o.bedrooms ?? null });
  return id;
}

/** Áp thật một đề xuất qua apply_enrichment (đường ghi của 033); trả id đề xuất. */
async function applied(c: pg.Client, offerId: string, field: string, value: string): Promise<number> {
  const id = await insertProposal(c, { offer_id: offerId, field, value, source: "e1_rule", route: "direct", review_id: null });
  const { rows } = await c.query(`SELECT apply_enrichment($1, 'test') AS n`, [[id]]);
  assert.equal(rows[0].n, 1, `apply_enrichment phải áp ${field}`);
  return id;
}

const revert = (c: pg.Client, ids: number[], actor = "hitl:test", reason = "thử hoàn tác") =>
  c.query(`SELECT revert_enrichment($1::bigint[], $2, $3) AS n`, [ids, actor, reason]).then((r) => Number(r.rows[0].n));

const lastAudit = async (c: pg.Client) =>
  (await c.query(`SELECT * FROM ops_audit WHERE action = 'enrich:revert' ORDER BY id DESC LIMIT 1`)).rows[0];

/** md5 nội dung ba bảng — thước «không bảng nào đổi». */
const tablesHash = async (c: pg.Client) =>
  (await c.query(
    `SELECT (SELECT md5(COALESCE(string_agg(t::text, '|' ORDER BY t.id), '')) FROM enrichment_proposals t)
         || (SELECT md5(COALESCE(string_agg(t::text, '|' ORDER BY t.offer_id), '')) FROM sale_offers t)
         || (SELECT md5(COALESCE(string_agg(t::text, '|' ORDER BY t.id), '')) FROM ops_audit t) AS h`,
  )).rows[0].h as string;

// ── AC-6 ma trận: mỗi câu ghi của apply_enrichment (033) có một hiệu ứng ngược ─────────────
// Viết TRƯỚC từ 033: property_type/block_raw chỉ ghi sale_offers; bedrooms/bathrooms/street_raw
// ghi sale_offers + COALESCE sang properties.
const MATRIX: { field: string; value: string; soCol: string; empty: string | null; propCol: string | null }[] = [
  { field: "property_type", value: "house", soCol: "property_type", empty: "unknown", propCol: null },
  { field: "bedrooms", value: "3", soCol: "bedrooms", empty: null, propCol: "bedrooms" },
  { field: "bathrooms", value: "2", soCol: "bathrooms", empty: null, propCol: "bathrooms" },
  { field: "street_raw", value: "Quang Trung", soCol: "street_raw", empty: null, propCol: "street" },
  { field: "block_raw", value: "S1.03", soCol: "block_raw", empty: null, propCol: null },
];

test("AC-6 ma trận hiệu ứng ngược", async () => {
  assert.equal(MATRIX.length, 5, "ma trận phải đủ 5 field của CHECK 033");
  let checked = 0;
  for (const m of MATRIX) {
    await withTx(async (c) => {
      const a = await offerWithPost(c);
      const prop = await insertProperty(c, a);
      await c.query(`UPDATE properties SET property_type = 'house' WHERE id = $1`, [prop]);
      const id = await applied(c, a, m.field, m.value);
      if (m.propCol) {
        const before = (await c.query(`SELECT ${m.propCol}::text AS v FROM properties WHERE id = $1`, [prop])).rows[0].v;
        assert.equal(before, m.value, `tiền đề: apply_enrichment phải lan sang properties.${m.propCol}`);
      }
      assert.equal(await revert(c, [id]), 1, `AC-6 ma trận: ${m.field} không hoàn tác`);
      const so = (await c.query(`SELECT ${m.soCol}::text AS v FROM sale_offers WHERE offer_id = $1`, [a])).rows[0].v;
      assert.equal(so, m.empty, `AC-6 ma trận: sale_offers.${m.soCol}`);
      const p = (await c.query(`SELECT * FROM properties WHERE id = $1`, [prop])).rows[0];
      if (m.propCol) assert.equal(p[m.propCol], null, `AC-6 ma trận: properties.${m.propCol}`);
      assert.equal(p.property_type, "house", "AC-6 ma trận: properties.property_type không được đụng");
      const log = (p.enrichment_log as { src: string; proposal_ids: number[] }[]).filter((e) => e.src === "enrich-revert");
      assert.deepEqual(log.map((e) => e.proposal_ids), [[id]], `AC-6 ma trận: enrichment_log ${m.field}`);
      checked++;
    });
  }
  assert.equal(checked, MATRIX.length);
});

test("AC-6 hoàn tác land thật, mở lại giá trị bị lấn", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    await run(c, [a], resolveWith({ propertyType: "land", typeBasis: "luật từ khoá: «đất» trong tên nhóm «…» → land" }));
    const land = (await c.query(`SELECT * FROM enrichment_proposals WHERE offer_id = $1 AND field = 'property_type'`, [a])).rows;
    assert.deepEqual(land.map((p) => [p.source, p.value, p.status]), [["e1_rule", "land", "applied"]]);
    const house = await insertProposal(c, { offer_id: a, field: "property_type", value: "house", route: "superseded" });
    await c.query(`UPDATE enrichment_proposals SET status = 'superseded' WHERE id = $1`, [house]);

    assert.equal(await revert(c, [Number(land[0].id)], "hitl:test", "E1 suy land từ tên nhóm"), 1);
    assert.equal((await c.query(`SELECT property_type FROM sale_offers WHERE offer_id = $1`, [a])).rows[0].property_type,
      "unknown", "AC-6 không trả field về trống");
    const p = (await c.query(`SELECT * FROM enrichment_proposals WHERE id = $1`, [land[0].id])).rows[0];
    assert.equal(p.status, "reverted");
    assert.equal(p.reverted_by, "hitl:test");
    assert.ok(p.reverted_at instanceof Date);
    assert.equal(p.revert_reason, "E1 suy land từ tên nhóm");
    const h = (await c.query(`SELECT status, route, review_id FROM enrichment_proposals WHERE id = $1`, [house])).rows[0];
    assert.deepEqual([h.status, h.route, h.review_id], ["queued", "review", null], "AC-6 giá trị bị lấn phải mở lại chờ duyệt");
    const audit = await lastAudit(c);
    assert.equal(audit.actor, "hitl:test");
    assert.deepEqual(audit.detail.reverted.map((x: { id: number }) => x.id), [Number(land[0].id)]);
    assert.deepEqual(audit.detail.reopened, [house]);
    assert.equal(audit.detail.reason, "E1 suy land từ tên nhóm");
  });
});

test("AC-6 căn giữ giá trị khi offer khác còn mang", async () => {
  for (const shared of [true, false]) {
    await withTx(async (c) => {
      const a = await offerWithPost(c);
      const prop = await insertProperty(c, a);
      if (shared) {
        const b = await offerWithPost(c);
        await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [prop, b]);
        await c.query(`UPDATE sale_offers SET street_raw = 'Bạch Đằng' WHERE offer_id = $1`, [b]);
      }
      const id = await applied(c, a, "street_raw", "Bạch Đằng");
      await revert(c, [id]);
      const street = (await c.query(`SELECT street FROM properties WHERE id = $1`, [prop])).rows[0].street;
      assert.equal(street, shared ? "Bạch Đằng" : null,
        shared ? "AC-6 xoá giá trị căn mà offer khác còn mang" : "AC-6 căn không được trả về trống");
    });
  }
});

test("AC-6 bỏ qua: đã đổi, chưa áp, không tồn tại", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const changed = await applied(c, a, "street_raw", "Quang Trung");
    await c.query(`UPDATE sale_offers SET street_raw = 'Lê Lợi' WHERE offer_id = $1`, [a]);
    const queued = await insertProposal(c, { offer_id: a, field: "bathrooms", value: "2" });
    assert.equal(await revert(c, [changed, queued, 0]), 0);
    assert.equal((await c.query(`SELECT street_raw FROM sale_offers WHERE offer_id = $1`, [a])).rows[0].street_raw,
      "Lê Lợi", "AC-6 hoàn tác đè giá trị người khác đã sửa");
    const why = (await lastAudit(c)).detail.skipped.map((s: { id: number; why: string }) => [s.id, s.why]);
    assert.deepEqual(why, [[changed, "value-changed"], [queued, "not-applied"], [0, "not-found"]]);
    const st = (await c.query(`SELECT status FROM enrichment_proposals WHERE id = ANY($1) ORDER BY id`, [[changed, queued]])).rows;
    assert.deepEqual(st.map((r) => r.status), ["applied", "queued"]);
  });
});

test("AC-6 chỉ người hoàn tác được, phải có lý do", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const id = await applied(c, a, "property_type", "land");
    const h0 = await tablesHash(c);
    for (const [actor, reason] of [["enrich-run:x", "lý do"], ["hitl:", "lý do"], ["hitl:test", "  "]]) {
      await c.query("SAVEPOINT s");
      await assert.rejects(revert(c, [id], actor, reason), /revert_enrichment/, "AC-6 máy hoàn tác không cần người");
      await c.query("ROLLBACK TO SAVEPOINT s");
    }
    assert.equal(await tablesHash(c), h0, "AC-6 lần gọi bị từ chối vẫn ghi dữ liệu");
    // Đối chứng dương: người + lý do → hoàn tác được, thước băm thấy thay đổi.
    assert.equal(await revert(c, [id]), 1);
    assert.notEqual(await tablesHash(c), h0);
  });
});

test("AC-6 gọi lại không hoàn tác lần hai", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const id = await applied(c, a, "bedrooms", "4");
    assert.equal(await revert(c, [id]), 1);
    const nAudit = Number((await c.query(`SELECT count(*) FROM ops_audit WHERE action='enrich:revert'`)).rows[0].count);
    assert.equal(await revert(c, [id]), 0);
    const after = Number((await c.query(`SELECT count(*) FROM ops_audit WHERE action='enrich:revert'`)).rows[0].count);
    assert.equal(after, nAudit + 1, "AC-6 lần gọi lại vẫn phải có dòng audit");
    assert.equal((await lastAudit(c)).detail.skipped[0].why, "not-applied");
  });
});

// ── AC-7 CLI: đường thật trong transaction của test, --dry, cờ thiếu, lệnh khởi được ─────────
test("AC-7 CLI hoàn tác", async () => {
  await withTx(async (c) => {
    const a = await offerWithPost(c);
    const ids = [
      await applied(c, a, "property_type", "land"),
      await applied(c, a, "street_raw", "Quang Trung"),
      await applied(c, a, "bathrooms", "4"),
    ];
    const lines: string[] = [];
    const h0 = await tablesHash(c);
    assert.equal(await main(["--ids", `${ids[0]}, ${ids[1]}`, "--actor", "hitl:test", "--reason", "x", "--dry"], c,
      (s) => lines.push(s)), 0);
    assert.equal(await tablesHash(c), h0, "AC-7 --dry đã ghi");
    assert.deepEqual(lines.slice(0, 2), [`${ids[0]} ${a} property_type: land → unknown`, `${ids[1]} ${a} street_raw: Quang Trung → trống`]);

    assert.equal(await main(["--ids", `${ids[0]},${ids[1]}`, "--actor", "hitl:test", "--reason", "x"], c, () => {}), 0);
    const st = (await c.query(`SELECT id, status FROM enrichment_proposals WHERE id = ANY($1) ORDER BY id`, [ids])).rows;
    assert.deepEqual(st.map((r) => r.status), ["reverted", "reverted", "applied"], "AC-7 CLI hoàn tác nhầm id");
    assert.equal((await lastAudit(c)).actor, "hitl:test");

    const msgs: string[] = [];
    assert.equal(await main(["--ids", "1", "--reason", "x"], c, (s) => msgs.push(s)), 2);
    assert.equal(await main(["--ids", "1", "--actor", "hitl:test"], c, (s) => msgs.push(s)), 2);
    assert.equal(await main(["--ids", "1,abc", "--actor", "hitl:test", "--reason", "x"], c, (s) => msgs.push(s)), 2);
    assert.deepEqual(msgs.filter((m) => m.startsWith("enrich-revert:")),
      ["enrich-revert: thiếu --actor", "enrich-revert: thiếu --reason", "enrich-revert: --ids không hợp lệ: 1,abc"]);
  });
  // Lệnh thật khởi được (tiến trình con, không cờ → mã 2, không chạm DB).
  const r = spawnSync("npx", ["tsx", "scripts/enrich-revert.ts"], { cwd: join(import.meta.dirname, ".."), encoding: "utf8" });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stdout, /thiếu --ids/);
});

function run(c: pg.Client, offerIds: string[], resolve: ResolveFn, llm: LlmFn = llmNone) {
  return runEnrich({ client: c, runId: `test-rev-${seq}`, dry: false, limit: 50, offerIds, llm, resolve, buildings: [] });
}

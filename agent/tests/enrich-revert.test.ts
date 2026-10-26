// enrich-revert.test.ts — vòng enrich-hau-ky: hoàn tác một lượt áp (036), CLI, migration chạy lại.
// Mọi ca chạy trong BEGIN…ROLLBACK trên Postgres local (helpers/db.ts nạp 033+036+039).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type pg from "pg";

import { main } from "../scripts/enrich-revert.js";
import { resolveContext, type ContextResult } from "../src/agents/context-resolver.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { MIGRATIONS, withTx, insertOffer, insertProperty, insertProposal } from "./helpers/db.js";

let seq = 0;
const nextId = () => `t_rev_${++seq}`;

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "", ...o,
});
const resolveWith = (o: Partial<ContextResult> = {}): ResolveFn => async () => ctx(o);
const llmNone: LlmFn = async () => ({ result: null, model: "qwen27b", tracePath: null });

/** Một offer S03 có tin nguồn; trả offer_id. */
async function offerWithPost(
  c: pg.Client,
  o: { text?: string; group?: string; bedrooms?: number | null; source?: string } = {},
) {
  const id = nextId();
  await c.query(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
     ON CONFLICT (snapshot_id) DO NOTHING`,
  );
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, $3)`, [
    `p_${id}`, o.text ?? "Bán nhà 4 tầng ngay chợ, sổ hồng chính chủ, giá thương lượng", o.group ?? "Nhóm thử",
  ]);
  await insertOffer(c, {
    offer_id: id, source: o.source ?? "S03", post_ids: [`p_${id}`], property_type: "unknown", bedrooms: o.bedrooms ?? null,
  });
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

// ── AC-7 sau hoàn tác: hai tin S05 thật, luật E1 thật mới, đầu ra LLM thật ───────────────────
const CONFLICT: { group_name: string; cases: { text: string; output: string }[] } = JSON.parse(
  readFileSync(join(import.meta.dirname, "fixtures/e1-conflict-cases.json"), "utf8"),
);
const oldLand = resolveWith({ propertyType: "land", typeBasis: "luật từ khoá: «đất» trong tên nhóm → land" });

/** Dựng đúng trạng thái DB local 23/10: land áp thẳng, LLM house bị lấn (superseded). */
async function landApplied(c: pg.Client, i: number) {
  const cc = CONFLICT.cases[i];
  const a = await offerWithPost(c, { text: cc.text, group: CONFLICT.group_name, bedrooms: [3, 9][i] });
  await run(c, [a], oldLand);
  const land = (await c.query(`SELECT id FROM enrichment_proposals WHERE offer_id = $1 AND value = 'land'`, [a])).rows[0];
  const house = await insertProposal(c, { offer_id: a, field: "property_type", value: "house", route: "superseded" });
  await c.query(`UPDATE enrichment_proposals SET status = 'superseded' WHERE id = $1`, [house]);
  const llm = parseEnrichOutput(cc.output);
  assert.ok(llm);
  return { a, land: Number(land.id), house, llm: (async () => ({ result: llm, model: "qwen27b", tracePath: null })) as LlmFn };
}
const landRows = async (c: pg.Client, a: string) =>
  Number((await c.query(`SELECT count(*) FROM enrichment_proposals WHERE offer_id = $1 AND value = 'land'`, [a])).rows[0].count);

test("AC-7 sau hoàn tác: luật không đẩy lại land, house lên thẻ", async () => {
  for (const i of [0, 1]) {
    await withTx(async (c) => {
      const { a, land, house, llm } = await landApplied(c, i);
      assert.equal(await revert(c, [land], "hitl:test", "E1 suy land từ tên nhóm"), 1);
      await run(c, [a], resolveContext, llm);
      assert.equal(await landRows(c, a), 1, "AC-7 luật đẩy lại giá trị đã hoàn tác");
      const cards = (await c.query(`SELECT evidence FROM review_queue WHERE item_id = $1 AND status = 'pending'`, [`enrich:${a}`])).rows;
      assert.equal(cards.length, 1);
      const pt = cards[0].evidence.fields.filter((f: { field: string }) => f.field === "property_type");
      assert.deepEqual(pt.map((f: { proposal_id: number; value: string }) => [f.proposal_id, f.value]), [[house, "house"]]);
      assert.equal((await c.query(`SELECT property_type FROM sale_offers WHERE offer_id = $1`, [a])).rows[0].property_type,
        "unknown");
    });
  }
});

test("AC-7 chiều đỏ: hoàn tác xoá dòng thay vì đánh dấu thì luật đẩy lại land", async () => {
  await withTx(async (c) => {
    const { a, land } = await landApplied(c, 0);
    await revert(c, [land]);
    // Bản hoàn tác «xoá dòng» (không để lại dấu reverted) — dòng chặn của unique index biến mất.
    await c.query(`DELETE FROM enrichment_proposals WHERE id = $1`, [land]);
    await run(c, [a], oldLand);
    const back = (await c.query(
      `SELECT status FROM enrichment_proposals WHERE offer_id = $1 AND value = 'land'`, [a],
    )).rows;
    assert.ok(back.length === 1 && back[0].status !== "reverted",
      "thước phải thấy land bị đẩy lại khi dấu reverted không còn");
  });
});

// ── AC-2 (biến thể): thẻ offer kế gom đề xuất «lỏng» của offer cũ ở lượt enrich sau ─────────
test("AC-2 offer kế đã có thẻ chờ: lượt enrich sau gom vào đúng một thẻ", async () => {
  await withTx(async (c) => {
    // Nguồn thử 'TST': đối soát chỉ chạm offer của nguồn đó, không đụng S03/S05 thật.
    const x = await offerWithPost(c, { source: "TST" });
    const y = await offerWithPost(c, { source: "TST" });
    const postX = (await c.query(`SELECT post_ids FROM sale_offers WHERE offer_id = $1`, [x])).rows[0].post_ids;
    await c.query(`UPDATE sale_offers SET post_ids = post_ids || $2::text[] WHERE offer_id = $1`, [y, postX]);
    const llmStreet: LlmFn = async () => ({ result: { street: "Quang Trung" }, model: "qwen27b", tracePath: null });
    const llmBath: LlmFn = async () => ({ result: { bathrooms: 3 }, model: "qwen27b", tracePath: null });
    await run(c, [x], resolveWith(), llmStreet);
    await run(c, [y], resolveWith(), llmBath);
    await c.query(`SELECT reconcile_stale_offers('TST', ARRAY[$1]::text[], 'test')`, [y]);
    await run(c, [y], resolveWith(), llmNone);
    const cards = (await c.query(`SELECT id, evidence FROM review_queue WHERE item_id = $1 AND status = 'pending'`, [`enrich:${y}`])).rows;
    assert.equal(cards.length, 1, "AC-2 offer kế phải còn đúng một thẻ chờ");
    const fields = cards[0].evidence.fields.map((f: { field: string; value: string }) => `${f.field}=${f.value}`).sort();
    assert.deepEqual(fields, ["bathrooms=3", "street_raw=Quang Trung"], "AC-2 thẻ offer kế thiếu đề xuất của offer cũ");
  });
});

// ── AC-10: 036 + 039 áp lại không lỗi, không đổi cấu trúc, không mất/nhân dữ liệu ─────────────
const SHAPE = `
  SELECT md5(
    (SELECT string_agg(table_name || '.' || column_name || ':' || data_type, ',' ORDER BY table_name, column_name)
       FROM information_schema.columns WHERE table_schema = 'public')
    || (SELECT string_agg(pg_get_functiondef(p.oid), '|' ORDER BY p.proname)
          FROM pg_proc p WHERE p.proname IN ('revert_enrichment', 'reconcile_stale_offers', 'enrichment_status_rank'))
    || (SELECT string_agg(conname || '=' || pg_get_constraintdef(oid), '|' ORDER BY conname)
          FROM pg_constraint WHERE conrelid = 'enrichment_proposals'::regclass)) AS h`;
const COUNTS = `SELECT (SELECT count(*) FROM enrichment_proposals) || '/' || (SELECT count(*) FROM sale_offers)
  || '/' || (SELECT count(*) FROM review_queue) || '/' || (SELECT count(*) FROM ops_audit) AS n`;

test("AC-10 migration idempotent", async () => {
  // 044 (nap-lai-khong-xoa) thay phần khoá ngoại + hàm đối soát của 039 và biến sale_offers thành VIEW, nên sau 044
  // không áp lại 039 được (khoá ngoại của nó trỏ BẢNG sale_offers) — chuỗi áp lại là 036 + 044.
  const files = MIGRATIONS.filter((p) => /\/(036|044)_/.test(p));
  assert.equal(files.length, 2, "phải thấy đủ 036 và 044");
  await withTx(async (c) => {
    // withTx đã áp 033+036(+039)+044 một lần; áp 036+044 thêm hai lần nữa.
    const s1 = (await c.query(SHAPE)).rows[0].h;
    const n1 = (await c.query(COUNTS)).rows[0].n;
    for (const round of [2, 3]) {
      for (const f of files) {
        await c.query(readFileSync(f, "utf8")).catch((e: Error) => {
          throw new Error(`AC-10 không idempotent: ${f.split("/").pop()} lần ${round}: ${e.message}`);
        });
      }
      assert.equal((await c.query(SHAPE)).rows[0].h, s1, `AC-10 cấu trúc đổi ở lần ${round}`);
      assert.equal((await c.query(COUNTS)).rows[0].n, n1, `AC-10 số dòng đổi ở lần ${round}`);
    }
    const dup = Number((await c.query(
      `SELECT count(*) - count(DISTINCT (offer_id, field, value_key, source)) AS d FROM enrichment_proposals`,
    )).rows[0].d);
    assert.equal(dup, 0, "AC-10 dòng đề xuất trùng");
    // Chiều đỏ: câu không idempotent áp lần hai thì lỗi — thước bắt được.
    const bad = "ALTER TABLE enrichment_proposals ADD CONSTRAINT t_not_idem CHECK (true);";
    await c.query(bad);
    await c.query("SAVEPOINT s");
    await assert.rejects(c.query(bad), /already exists/, "AC-10 thước không bắt được câu không idempotent");
    await c.query("ROLLBACK TO SAVEPOINT s");
  });
});

function run(c: pg.Client, offerIds: string[], resolve: ResolveFn, llm: LlmFn = llmNone) {
  return runEnrich({ client: c, runId: `test-rev-${seq}`, dry: false, limit: 50, offerIds, llm, resolve, buildings: [] });
}

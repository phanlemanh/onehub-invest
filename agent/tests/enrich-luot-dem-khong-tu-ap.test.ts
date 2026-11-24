// enrich-luot-dem-khong-tu-ap.test.ts — NB11 `luot-hang-dem-khong-tu-ap-truoc-doc-lap`, E1/E2/E3/E6 ↔ AC-1/2/3/6.
// runEnrich (lượt hằng đêm) trên DB của riêng lượt trong BEGIN…ROLLBACK; model và E1 giả lập.
import { test } from "node:test";
import assert from "node:assert/strict";
import type pg from "pg";

import type { ContextResult } from "../src/agents/context-resolver.js";
import type { EnrichResult } from "../src/agents/enrich-text.js";
import { runEnrich, type LlmFn, type ResolveFn } from "../src/enrich/run.js";
import { withTx, insertOffer } from "./helpers/db.js";

const ctx = (o: Partial<ContextResult> = {}): ContextResult => ({
  projectSlug: null, projectName: null, projectCandidates: [], propertyType: null,
  buildingHint: null, areaHint: null, matchedBy: "group_name", ...o,
});
const resolveWith = (o: Partial<ContextResult> = {}): ResolveFn => async () => ctx(o);
const kq = (o: Partial<EnrichResult>): EnrichResult => ({ confidence: 0.9, ...o });
const llmWith = (r: EnrichResult | null): LlmFn => async () => ({ result: r, model: "gia-lap", tracePath: null });

let seq = 0;
async function tin(c: pg.Client, o: { property_type?: string | null; block_raw?: string | null } = {}) {
  const id = `t_nb11_${++seq}`;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
                 ON CONFLICT (snapshot_id) DO NOTHING`);
  await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, 'Nhóm thử')`,
    [`p_${id}`, "Bán căn 2pn tầng trung, sẵn sổ, giá thương lượng"]);
  await insertOffer(c, { offer_id: id, post_ids: [`p_${id}`], property_type: o.property_type ?? "unknown", bedrooms: 2, block_raw: o.block_raw ?? null });
  return id;
}
const dongTin = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT property_type, block_raw FROM sale_offers WHERE offer_id = $1`, [id])).rows[0];
const deXuat = async (c: pg.Client, id: string, field: string) =>
  (await c.query(`SELECT * FROM enrichment_proposals WHERE offer_id = $1 AND field = $2 ORDER BY id`, [id, field])).rows;
// subject_key theo apply_enrichment (066): source || ':' || coalesce(originating_system_key, post_ids[1]) — không phải offer_id.
const soFa = async (c: pg.Client, id: string) =>
  Number((await c.query(`SELECT count(*) FROM field_assertions fa JOIN sale_offers so ON so.offer_id = $1
    WHERE fa.subject_key = so.source || ':' || coalesce(so.originating_system_key, so.post_ids[1])`, [id])).rows[0].count);
const theCho = async (c: pg.Client, id: string) =>
  (await c.query(`SELECT evidence FROM review_queue WHERE item_id = $1 AND status = 'pending'`, [`enrich:${id}`])).rows[0];

const chay = (c: pg.Client, ids: string[], llm: LlmFn, resolve: ResolveFn, buildings: { slug: string; name: string; aliases: string[] }[] = []) =>
  runEnrich({ client: c, runId: `enrich-nb11-${seq}`, dry: false, limit: 50, offerIds: ids, llm, resolve, buildings });

test("E1 AC-1 LLM trùng E1 ở lượt đêm: lên thẻ, không áp", async () => {
  await withTx(async (c) => {
    const a = await tin(c);
    const faTruoc = await soFa(c, a);
    const r = await chay(c, [a], llmWith(kq({ property_type: "apartment" })), resolveWith({ propertyType: "apartment" }));
    const ps = await deXuat(c, a, "property_type");
    if (ps.some((p) => p.status === "applied")) assert.fail(`lượt hằng đêm tự áp đề xuất trùng luật: ${a}`);
    assert.deepEqual(ps.map((p) => [p.source, p.route, p.status, p.corroborated_by, p.evidence.trung_luat]),
      [["e2_llm", "review", "queued", null, "e1"]]);
    assert.equal((await dongTin(c, a)).property_type, "unknown", "ô tin không được đổi");
    assert.equal(await soFa(c, a), faTruoc, "không được ghi field_assertions");
    const the = await theCho(c, a);
    assert.ok(the?.evidence.fields.some((f: { field: string }) => f.field === "property_type"), "thẻ phải liệt ô property_type");
    assert.equal(r.chuyenThe, 1);
  });
});

test("E2 AC-2 LLM trùng toà danh bạ: tên chuẩn lên thẻ, không áp", async () => {
  await withTx(async (c) => {
    const a = await tin(c, { property_type: "apartment" });
    await chay(c, [a], llmWith(kq({ building: "LBV" })), resolveWith(),
      [{ slug: "gpk-lumiere-boulevard", name: "Lumiere Boulevard", aliases: ["lbv"] }]);
    const ps = await deXuat(c, a, "block_raw");
    assert.deepEqual(ps.map((p) => [p.value, p.route, p.status, p.corroborated_by, p.evidence.trung_luat]),
      [["Lumiere Boulevard", "review", "queued", null, "asset_nodes:gpk-lumiere-boulevard"]]);
    assert.equal((await dongTin(c, a)).block_raw, null);
    assert.ok((await theCho(c, a))?.evidence.fields.some((f: { field: string }) => f.field === "block_raw"));
  });
});

test("E3 AC-3 E1 direct ở lượt đêm vẫn áp", async () => {
  await withTx(async (c) => {
    const a = await tin(c);
    const faTruoc = await soFa(c, a);
    await chay(c, [a], llmWith(kq({})), resolveWith({ propertyType: "apartment" }));
    const ps = await deXuat(c, a, "property_type");
    assert.deepEqual(ps.map((p) => [p.source, p.route, p.status]), [["e1_rule", "direct", "applied"]]);
    assert.equal((await dongTin(c, a)).property_type, "apartment");
    assert.ok((await soFa(c, a)) > faTruoc, "đường direct phải ghi field_assertions");
  });
});

test("E5 AC-5 tham số theo lượt gọi: chanTuApCanCu=false giữ đường áp cũ (đối chứng hai phía)", async () => {
  await withTx(async (c) => {
    const a = await tin(c);
    await runEnrich({ client: c, runId: `enrich-nb11-cu`, dry: false, limit: 50, offerIds: [a], chanTuApCanCu: false,
      llm: llmWith(kq({ property_type: "apartment" })), resolve: resolveWith({ propertyType: "apartment" }) });
    assert.deepEqual((await deXuat(c, a, "property_type")).map((p) => [p.route, p.status, p.corroborated_by]),
      [["corroborated", "applied", "e1"]], "tắt chặn thì phải áp như trước");
    assert.equal((await dongTin(c, a)).property_type, "apartment");
    const b = await tin(c);
    await runEnrich({ client: c, runId: `enrich-nb11-vang`, dry: false, limit: 50, offerIds: [b],
      llm: llmWith(kq({ property_type: "apartment" })), resolve: resolveWith({ propertyType: "apartment" }) });
    assert.deepEqual((await deXuat(c, b, "property_type")).map((p) => [p.route, p.status]), [["review", "queued"]],
      "bên gọi không khai thì mặc định chặn");
  });
});

test("E6 AC-6 bản chép DB: một lượt đêm ghi 0 dòng applied có corroborated_by", async () => {
  await withTx(async (c) => {
    const { rows } = await c.query(`SELECT offer_id FROM sale_offers
      WHERE source = 'S03' AND (property_type IS NULL OR property_type = 'unknown') ORDER BY offer_id LIMIT 20`);
    const ids = rows.map((r) => r.offer_id as string);
    assert.ok(ids.length > 0, "bản chép DB không có tin S03 thiếu loại hình");
    const runId = `enrich-nb11-e6`;
    const r = await runEnrich({
      client: c, runId, dry: false, limit: 50, offerIds: ids,
      llm: llmWith(kq({ property_type: "apartment" })), resolve: resolveWith({ propertyType: "apartment" }),
    });
    const { rows: [d] } = await c.query(
      `SELECT count(*) FILTER (WHERE status = 'applied' AND corroborated_by IS NOT NULL)::int AS tu_ap,
              count(*) FILTER (WHERE evidence ? 'trung_luat')::int AS chuyen
         FROM enrichment_proposals WHERE run_id = $1`, [runId]);
    assert.equal(d.tu_ap, 0, "lượt đêm tự áp đề xuất có căn cứ");
    assert.ok(d.chuyen > 0, "tiền đề: có đề xuất trùng luật");
    assert.equal(d.chuyen, r.chuyenThe, "tổng kết lượt lệch số ghi");
  });
});

// context-resolver.test.ts — vòng enrich-hau-ky AC-8/AC-9: luật E1 loại BĐS.
// Ca thật: fixtures/e1-conflict-cases.json (hai tin nhà bị gán land vì tên nhóm «NHÀ ĐẤT»)
// và fixtures/e1-land-cases.json (hai tin đất nền thật). Luật CŨ chép đóng băng ở dưới để làm
// chiều đỏ trên cùng fixture và để đo phạm vi đổi trên dữ liệu DB local.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolveContext, resolvePropertyType } from "../src/agents/context-resolver.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type LlmFn } from "../src/enrich/run.js";
import { withTx, insertOffer } from "./helpers/db.js";
import { legacyType } from "./context-resolver-chung.js";

const fixture = (f: string) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", f), "utf8"));
const CONFLICT: { group_name: string; cases: { offer_id: string; text: string; output: string }[] } =
  fixture("e1-conflict-cases.json");
const LAND: { cases: { offer_id: string; group_name: string; text: string }[] } = fixture("e1-land-cases.json");

const NO_KEYWORD = "Cần bán gấp, giá tốt, liên hệ xem nhà trực tiếp";

test("AC-8 E1 không suy land từ tên nhóm", async () => {
  for (const text of [...CONFLICT.cases.map((c) => c.text), NO_KEYWORD]) {
    const pt = resolvePropertyType(text, CONFLICT.group_name);
    assert.notEqual(pt?.type, "land", `AC-8 suy land từ tên nhóm: «${text.slice(0, 30)}»`);
    // Chiều đỏ trên CÙNG fixture: luật cũ ra land vì chữ «ĐẤT» của tên nhóm.
    assert.equal(legacyType(text, CONFLICT.group_name), "land", "tiền đề: luật cũ phải ra land cho ca này");
  }
});

test("AC-8 enrich-run với luật thật: LLM house vào hàng duyệt, tin không đổi", async () => {
  for (const [i, cc] of CONFLICT.cases.entries()) {
    await withTx(async (c) => {
      const id = `t_ctx_${i}`;
      await c.query(
        `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ('t', 'test', 'S03', '{}')
         ON CONFLICT (snapshot_id) DO NOTHING`,
      );
      await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, group_name) VALUES ($1, 't', $2, $3)`, [
        `p_${id}`, cc.text, CONFLICT.group_name,
      ]);
      await insertOffer(c, { offer_id: id, source: "S05", post_ids: [`p_${id}`], property_type: "unknown", bedrooms: [3, 9][i] });
      const out = parseEnrichOutput(cc.output);
      assert.ok(out);
      const llm: LlmFn = async () => ({ result: out, model: "qwen27b", tracePath: "traces/t.jsonl" });
      await runEnrich({ client: c, runId: "test-ctx", dry: false, limit: 5, offerIds: [id], llm, resolve: resolveContext, buildings: [] });

      const ps = (await c.query(
        `SELECT source, value, route, status FROM enrichment_proposals WHERE offer_id = $1 AND field = 'property_type'`, [id],
      )).rows;
      assert.deepEqual(ps.map((p) => [p.source, p.value, p.route, p.status]), [["e2_llm", "house", "review", "queued"]],
        "AC-8 E1 vẫn sinh đề xuất loại BĐS");
      assert.equal((await c.query(`SELECT property_type FROM sale_offers WHERE offer_id = $1`, [id])).rows[0].property_type,
        "unknown");
    });
  }
});

// Ma trận viết trước — 5 dòng (design §2.3, AC-9).
const MATRIX: { text: string; group: string; type: string | null; where?: RegExp }[] = [
  { text: LAND.cases[0].text, group: LAND.cases[0].group_name, type: "land", where: /trong tin/ },
  { text: LAND.cases[1].text, group: LAND.cases[1].group_name, type: "land", where: /trong tin/ },
  { text: "Nhà 4 tầng trên lô đất 50m2, hẻm xe hơi, sổ hồng riêng", group: "Nhóm thử", type: null },
  { text: NO_KEYWORD, group: "Chung Cư Vin 1,2,3", type: "apartment", where: /tên nhóm/ },
  { text: "Bán nhà phố 5 tầng, diện tích đất 60m2, sổ đỏ chính chủ", group: "Nhóm thử", type: "house", where: /trong tin/ },
];

test("AC-9 E1 đất từ nội dung tin", () => {
  assert.equal(MATRIX.length, 5);
  let n = 0;
  for (const [i, m] of MATRIX.entries()) {
    const pt = resolvePropertyType(m.text, m.group);
    assert.equal(pt?.type ?? null, m.type, i === 2 ? "AC-9 phủ quyết nhiều tầng" : `AC-9 dòng ${i + 1}`);
    if (m.where) assert.match(pt!.basis, m.where, `AC-9 dòng ${i + 1}: căn cứ`);
    n++;
  }
  assert.equal(n, 5);
});

// «AC-9 chỉ kết quả land đổi trên tin thật của DB local» dời sang probes/context-resolver-that.test.ts (ngoài suite chung,
// hồ sơ l2-bao-thu-doi-probe-that); eval E9 của enrich-hau-ky khai superseded_by về AC-5 của hồ sơ đó.

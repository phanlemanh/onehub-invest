// context-resolver.test.ts — vòng enrich-hau-ky AC-8/AC-9: luật E1 loại BĐS.
// Ca thật: fixtures/e1-conflict-cases.json (hai tin nhà bị gán land vì tên nhóm «NHÀ ĐẤT»)
// và fixtures/e1-land-cases.json (hai tin đất nền thật). Luật CŨ chép đóng băng ở dưới để làm
// chiều đỏ trên cùng fixture và để đo phạm vi đổi trên dữ liệu DB local.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { resolveContext, resolvePropertyType } from "../src/agents/context-resolver.js";
import { parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type LlmFn } from "../src/enrich/run.js";
import { withTx, insertOffer } from "./helpers/db.js";

const fixture = (f: string) => JSON.parse(readFileSync(join(import.meta.dirname, "fixtures", f), "utf8"));
const CONFLICT: { group_name: string; cases: { offer_id: string; text: string; output: string }[] } =
  fixture("e1-conflict-cases.json");
const LAND: { cases: { offer_id: string; group_name: string; text: string }[] } = fixture("e1-land-cases.json");

/** Luật E1 loại BĐS TRƯỚC vòng enrich-hau-ky (context-resolver.ts @148c073) — chép đóng băng. */
function legacyType(text: string, groupName: string | null): string | null {
  const t = `${text} ${groupName ?? ""}`.toLowerCase();
  const RULES: [RegExp, string][] = [
    [/chung cư|căn hộ|cc |chcc|apartment|condo|studio/, "apartment"],
    [/nhà mặt tiền|mặt phố|biệt thự|liền kề|nhà phố|nhà riêng|nhà ngõ|nhà hẻm/, "house"],
    [/đất|nền|lô đất|diện tích đất/, "land"],
    [/phòng trọ|phòng thuê|nhà trọ/, "room"],
    [/văn phòng|mặt bằng kinh doanh|shop house/, "commercial"],
  ];
  for (const [re, type] of RULES) if (re.test(t)) return type;
  return null;
}

/** Lối khác của Hỏi-4 (bị bác): quét mọi luật trên tin trước rồi mới tới tên nhóm. */
function textFirstType(text: string, groupName: string | null): string | null {
  return resolvePropertyType(text, null)?.type ?? (groupName ? resolvePropertyType("", groupName)?.type ?? null : null);
}

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

test("AC-9 chỉ kết quả land đổi trên tin thật của DB local", async () => {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  await c.connect();
  try {
    const { rows } = await c.query(
      `SELECT z.text, z.group_name FROM sale_offers o
       JOIN LATERAL (SELECT left(s.text, 500) AS text, s.group_name FROM stg_zalo_posts s
                     WHERE s.post_id = ANY (o.post_ids) ORDER BY s.captured_at DESC NULLS LAST LIMIT 1) z ON true
       WHERE o.source IN ('S03', 'S05') AND o.kind = 'sale' AND length(z.text) > 20`,
    );
    assert.ok(rows.length > 100, `cần dữ liệu thật để đo (có ${rows.length} tin)`);
    const diff = (rule: (t: string, g: string | null) => string | null) =>
      rows.map((r) => [legacyType(r.text, r.group_name), rule(r.text, r.group_name)] as const).filter(([a, b]) => a !== b);
    const changed = diff((t, g) => resolvePropertyType(t, g)?.type ?? null);
    assert.ok(changed.length > 0, "đối chứng dương: luật mới phải đổi ít nhất một tin");
    const notLand = changed.filter(([a, b]) => a !== "land" && b !== "land");
    assert.deepEqual(notLand, [], "AC-9 đổi loại không phải land");
    // Chiều đỏ: lối khác của Hỏi-4 đổi cả loại không phải land — thước bắt được.
    const alt = diff(textFirstType).filter(([a, b]) => a !== "land" && b !== "land");
    assert.ok(alt.length > 0, "thước «chỉ land đổi» phải đỏ với luật quét-tin-trước");
  } finally {
    await c.end();
  }
});

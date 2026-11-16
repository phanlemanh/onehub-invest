// context-resolver-that.test.ts — ca «AC-9 chỉ kết quả land đổi trên tin thật của DB local» của hồ sơ enrich-hau-ky, dời khỏi
// suite chung (hồ sơ l2-bao-thu-doi-probe-that). Chỉ đọc DB máy thu.
// Chạy ở: executors.test.context_resolver_that (AC-5 hồ sơ l2-bao-thu-doi-probe-that, thay eval E9 enrich-hau-ky) và
// scripts/probe-du-lieu-that.sh (/ops-check mục B5).
import { test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { resolvePropertyType } from "../src/agents/context-resolver.js";
import { legacyType, textFirstType } from "../tests/context-resolver-chung.js";
import { giaDo } from "./chung.js";

test("AC-9 chỉ kết quả land đổi trên tin thật của DB local", async () => {
  giaDo("context-resolver-that");
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

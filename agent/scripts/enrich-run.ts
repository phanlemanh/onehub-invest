// enrich-run.ts — M-3: chạy enrichment (E1 luật → E2 LLM khi cần) trên offers P1
// (S03/S05) còn thiếu field. Từ 22/10 (vòng enrich-qua-de-xuat) mọi giá trị là ĐỀ XUẤT
// trong enrichment_proposals: luật E1 và giá trị LLM có căn cứ độc lập được áp qua hàm
// SQL apply_enrichment; giá trị LLM không căn cứ chờ người duyệt ở /ops/review.
// Logic ở agent/src/enrich/run.ts — script này chỉ nối CLI + model thật.
//
// Vị trí pipeline: chạy SAU transform-zalo/transform-fb, TRƯỚC resolve-properties.
//
// Chạy:
//   npx tsx scripts/enrich-run.ts --dry          # chỉ E1, in bảng định tuyến, 0 LLM, 0 ghi
//   npx tsx scripts/enrich-run.ts                 # batch LIMIT env (default 50)
//   LIMIT=999 npx tsx scripts/enrich-run.ts       # cả backlog (~735, LLM ~2h)
import pg from "pg";

import { resolveContext, resetContextCache } from "../src/agents/context-resolver.js";
import { enrichTextAgent, buildEnrichInput, parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type LlmFn } from "../src/enrich/run.js";
import { runAgent } from "../src/runtime/loop.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DRY = process.argv.includes("--dry");
const LIMIT = Number(process.env.LIMIT ?? 50);

const llm: LlmFn = async (text, ctx) => {
  try {
    const r = await runAgent(enrichTextAgent, buildEnrichInput(text, ctx));
    return { result: parseEnrichOutput(r.output), model: String(enrichTextAgent.model), tracePath: r.tracePath };
  } catch (e) {
    console.log(`  ✗ LLM: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
    return { result: null, model: String(enrichTextAgent.model), tracePath: null };
  }
};

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  resetContextCache();
  const runId = `enrich-${new Date().toISOString()}`;
  console.log(`═══ ENRICH RUN ${DRY ? "(DRY — E1 only, 0 LLM, 0 ghi)" : "(E1+E2 → đề xuất)"} · ${runId} ═══`);

  try {
    if (!DRY) await c.query("BEGIN");
    const { routed, summary, reviewIds } = await runEnrich({
      client: c, runId, dry: DRY, limit: Number.isFinite(LIMIT) ? LIMIT : 50,
      llm, resolve: resolveContext,
    });
    if (!DRY) await c.query("COMMIT");

    routed.forEach((rs, i) => {
      const line = rs.map((r) => `${r.field}=${r.value} [${r.source}·${r.route}]`).join(" · ");
      console.log(`  #${i + 1} ${line || "(không có đề xuất)"}`);
    });
    console.log(`\n═══ XONG ═══`);
    console.log(
      `offers: ${routed.length} | áp thẳng (E1): ${summary.direct} | có căn cứ: ${summary.corroborated}` +
        ` | chờ duyệt: ${summary.review} | xung đột E1/LLM: ${summary.xungDot}` +
        (DRY ? "" : ` | thẻ /ops/review đang chờ: ${new Set(reviewIds).size}`),
    );
  } catch (e) {
    if (!DRY) await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

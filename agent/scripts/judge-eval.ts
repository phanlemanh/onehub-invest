// judge-eval.ts — A2 eval: chạy judge trên N cặp needs_llm, in kết quả để
// user review trước khi quyết mở judge-run toàn bộ (gate ≥80% accuracy).
// Cách chạy: npx tsx scripts/judge-eval.ts [n]
import pg from "pg";
import { runAgent } from "../src/runtime/loop.js";
import { judgeEntityAgent, parseJudgeOutput, buildJudgeInput } from "../src/agents/judge-entity.js";
import { queryPair } from "../src/tools/native.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function main() {
  const n = parseInt(process.argv[2] ?? "5");
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();

  const { rows: pairs } = await c.query(
    `SELECT offer_a, offer_b, score FROM property_candidates
     WHERE status = 'needs_llm' ORDER BY score DESC LIMIT $1`,
    [n],
  );
  console.log(`── ${pairs.length} cặp needs_llm (score cao nhất)`);

  let pass = 0, fail = 0, unsure = 0;
  for (const p of pairs) {
    const pair = await queryPair(p.offer_a, p.offer_b);
    if (!pair) { console.log('  → SKIP: queryPair null'); fail++; continue; }
    const input = buildJudgeInput(pair);
    console.log(`\n── cặp score=${p.score}: ${p.offer_a.slice(0, 20)}… × ${p.offer_b.slice(0, 20)}…`);

    try {
      const result = await runAgent(judgeEntityAgent, input);
      const parsed = parseJudgeOutput(result.output);
      if (parsed) {
        console.log(`  → ${parsed.same_house} (conf ${parsed.confidence}) | ${parsed.evidence.slice(0, 2).join("; ")}`);
        if (parsed.same_house === "yes") pass++;
        else if (parsed.same_house === "unsure") unsure++;
        else fail++;
      } else {
        console.log(`  → parse FAIL: ${result.output.slice(0, 120)}`);
        fail++;
      }
    } catch (e) {
      console.log(`  → LỖI: ${e instanceof Error ? e.message : String(e)}`);
      fail++;
    }
  }

  console.log(`\n═══ KẾT QUẢ EVAL ═══`);
  console.log(`yes: ${pass} | no: ${fail} | unsure: ${unsure} | tổng: ${pairs.length}`);
  console.log(`(đây là eval exploratory — cần hand-label để tính accuracy thật)`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

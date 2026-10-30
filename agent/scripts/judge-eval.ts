// judge-eval.ts — A2/PL25 eval: chấm N cặp needs_llm bằng luật ngưỡng (`apNguong`) rồi xin model lời giải thích, in
// kết quả để user review. KHÔNG ghi DB.
// Cách chạy: npx tsx scripts/judge-eval.ts [n]
import pg from "pg";
import { runAgent } from "../src/runtime/loop.js";
import { apNguong, buildJudgeInput, judgeEntityAgent, lyDoChu, parseGiaiThich } from "../src/agents/judge-entity.js";
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

  const dem = { yes: 0, no: 0, unsure: 0 };
  for (const p of pairs) {
    const pair = await queryPair(p.offer_a, p.offer_b);
    if (!pair) { console.log("  → SKIP: queryPair null"); continue; }
    const kq = apNguong(pair);
    dem[kq.same_house]++;
    console.log(`\n── cặp score=${p.score}: ${p.offer_a.slice(0, 20)}… × ${p.offer_b.slice(0, 20)}…`);
    console.log(`  → ${lyDoChu(kq)}`);
    try {
      const result = await runAgent(judgeEntityAgent, buildJudgeInput(pair, kq));
      console.log(`  giải thích: ${parseGiaiThich(result.output) ?? `(sai khuôn) ${result.output.slice(0, 120)}`}`);
    } catch (e) {
      console.log(`  giải thích LỖI: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\n═══ KẾT QUẢ EVAL ═══`);
  console.log(`yes: ${dem.yes} | no: ${dem.no} | unsure: ${dem.unsure} | tổng: ${pairs.length}`);
  console.log(`(kết luận do luật; cần hand-label để tính accuracy thật)`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

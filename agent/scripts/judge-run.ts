// judge-run.ts — A2: chạy AI judge trên toàn bộ items pending trong
// review_queue (item_type='entity_match'). Điền ai_suggestion + reasoning
// + confidence — KHÔNG tự quyết (status vẫn pending, người quyết qua UI).
// Sau đó user vào /ops/review để phán quyết cuối.
// Chạy: npx tsx scripts/judge-run.ts
import pg from "pg";
import { runAgent } from "../src/runtime/loop.js";
import { judgeEntityAgent, parseJudgeOutput, buildJudgeInput } from "../src/agents/judge-entity.js";
import { queryPair, type PairData } from "../src/tools/native.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

function extractOffersFromItemId(itemId: string): [string, string] | null {
  // format: "pair:offer_a|offer_b"
  const m = itemId.match(/^pair:(.+)\|(.+)$/);
  return m ? [m[1], m[2]] : null;
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();

  const { rows: items } = await c.query(
    `SELECT id, item_id, title FROM review_queue
     WHERE status = 'pending' AND item_type = 'entity_match' ORDER BY id`,
  );
  console.log(`── ${items.length} items entity_match pending`);

  let ok = 0, fail = 0;
  for (const item of items) {
    const offers = extractOffersFromItemId(item.item_id);
    if (!offers) {
      console.log(`  ⚠ item ${item.id}: item_id format lạ — skip`);
      continue;
    }
    const [a, b] = offers;

    console.log(`\n── item ${item.id}: ${item.title}`);

    try {
      const pair: PairData | null = await queryPair(a, b);
      if (!pair) {
        console.log(`  ⚠ queryPair null — skip`);
        fail++;
        continue;
      }

      const input = buildJudgeInput(pair);
      const result = await runAgent(judgeEntityAgent, input);
      const parsed = parseJudgeOutput(result.output);

      if (parsed) {
        console.log(`  AI: ${parsed.same_house} (conf ${parsed.confidence}) | ${parsed.evidence.slice(0, 2).join("; ")}`);
        await c.query(
          `UPDATE review_queue SET
             ai_suggestion = $1,
             ai_reasoning = $2,
             ai_confidence = $3
           WHERE id = $4`,
          [
            parsed.same_house,
            parsed.evidence.join("; "),
            parsed.confidence,
            item.id,
          ],
        );
        ok++;
      } else {
        console.log(`  ⚠ parse fail: ${result.output.slice(0, 100)}`);
        await c.query(
          `UPDATE review_queue SET ai_suggestion = 'parse_error',
             ai_reasoning = $1 WHERE id = $2`,
          [result.output.slice(0, 200), item.id],
        );
        fail++;
      }
    } catch (e) {
      console.log(`  ❌ ${e instanceof Error ? e.message : String(e)}`);
      fail++;
    }
  }

  console.log(`\n═══ JUDGE RUN XONG ═══`);
  console.log(`AI suggestion điền: ${ok} | fail: ${fail}`);
  console.log(`→ Mở /ops/review để phán quyết (items có AI suggestion sẵn)`);

  await c.end();
}

main().catch((e) => { console.error(e); process.exit(1); });

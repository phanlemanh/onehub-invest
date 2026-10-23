// worklist-health.mjs — báo cáo sức khỏe worklist PDP Airbnb (Task 7 plan
// 2026-10-21-coverage-worklist): done/gone/delisted-rate + pending theo
// market + thời gian finalize/sync gần nhất. Gate: gone/done > 40% → DỪNG
// (Review Focus #1: id AirDNA "mờ" — giả định universe có thể sai).
//   node worklist-health.mjs
import { readFile, stat } from "node:fs/promises";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const CHECKPOINT = new URL("../collector/state/vn__airbnb-listing.json", import.meta.url).pathname;
const GONE_LIMIT = 0.4;

/** Hàm pure: verdict từ checkpoint (rate = gone/done theo plan). Export để test. */
export function healthReport(input) {
  const done = input.doneIds.length;
  const gone = input.goneIds.length;
  const rate = done > 0 ? Math.round((gone / done) * 100) : 0;
  return { done, gone, rate, verdict: rate > GONE_LIMIT * 100 ? "stop" : "ok" };
}

async function mtimeAge(path) {
  try {
    const m = await stat(path);
    const h = Math.round(((Date.now() - m.mtimeMs) / 3_600_000) * 10) / 10;
    return `${h}h trước`;
  } catch {
    return "chưa có";
  }
}

async function main() {
  let doneIds = [];
  let goneIds = [];
  try {
    const cp = JSON.parse((await readFile(CHECKPOINT, "utf8")).toString());
    doneIds = Array.isArray(cp.doneIds) ? cp.doneIds : [];
    goneIds = Array.isArray(cp.goneIds) ? cp.goneIds : [];
  } catch { /* chưa chạy lần nào */ }

  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  let pendingByMarket = {};
  try {
    const { rows } = await client.query(
      `SELECT a.airdna_market_id AS market, count(*)::int AS n
         FROM airdna_listings a LEFT JOIN listings l ON l.id = a.id
        WHERE a.id LIKE 'abnb\\_%' ESCAPE '\\' AND l.id IS NULL
        GROUP BY 1`,
    );
    pendingByMarket = Object.fromEntries(rows.map((r) => [String(r.market), r.n]));
  } finally {
    await client.end();
  }

  const r = healthReport({ doneIds, goneIds, pendingByMarket });
  const totalPending = Object.values(pendingByMarket).reduce((a, b) => a + b, 0);
  console.log(
    `worklist-health: done=${r.done} gone=${r.gone} rate=${r.rate}% pending=${totalPending} by_market=${JSON.stringify(pendingByMarket)}`,
  );
  console.log(`finalize gần nhất: ${await mtimeAge("logs/airbnb-nightly.log")} · sync gần nhất: ${await mtimeAge("logs/sync-cloud.log")}`);
  if (r.verdict === "stop") {
    console.error("DỪNG: tỉ lệ delisted bất thường — soát lại giả định id AirDNA (Review Focus #1)");
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => {
    console.error("❌", e.code ?? e.message, e instanceof AggregateError ? e.errors.map(String).join("; ") : "");
    process.exit(1);
  });
}

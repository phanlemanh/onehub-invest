// export-airdna-worklist.mjs — xuất worklist PDP Airbnb từ universe AirDNA
// (Task 2 plan 2026-10-21-coverage-worklist): listing AirDNA có id Airbnb mà
// ta CHƯA thu → file JSON cho collector airbnb-listing chế độ worklist.
// Thứ tự ưu tiên: 3 market lớn trước (47=HCMC, 48=HN, 89491=ĐN), cùng market
// thì doanh thu LTM cao trước — batch đầu đập ngay vào nơi giá trị nhất.
//   node export-airdna-worklist.mjs [out.json]
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const OUT = process.argv[2] ?? new URL("../collector/state/airbnb-worklist.json", import.meta.url).pathname;

// priority map — market lớn trước (0 = cao nhất), market khác đứng sau (9)
const PRIORITY = { "47": 0, "48": 1, "89491": 2 };

/** Hàm pure: sort theo (priority market, revenue_ltm DESC NULL cuối), dedupe,
 *  chỉ giữ id dạng abnb_*. Export để test. */
export function prioritize(rows) {
  const seen = new Set();
  const out = [];
  for (const r of [...rows].sort((a, b) => {
    const pa = PRIORITY[a.market] ?? 9;
    const pb = PRIORITY[b.market] ?? 9;
    if (pa !== pb) return pa - pb;
    const ra = a.revenue_ltm ?? -1;
    const rb = b.revenue_ltm ?? -1;
    return rb - ra;
  })) {
    if (!r.id?.startsWith("abnb_") || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r.id);
  }
  return out;
}

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  let rows;
  try {
    // universe AirDNA trừ những listing canonical đã có (LEFT JOIN … IS NULL)
    ({ rows } = await client.query(
      `SELECT a.id, a.airdna_market_id AS market, a.revenue_ltm
         FROM airdna_listings a LEFT JOIN listings l ON l.id = a.id
        WHERE a.id LIKE 'abnb\\_%' ESCAPE '\\' AND l.id IS NULL`,
    ));
  } finally {
    await client.end();
  }
  const ids = prioritize(rows);
  const byMarket = { "47": 0, "48": 0, "89491": 0, khác: 0 };
  for (const r of rows) {
    if (!r.id?.startsWith("abnb_")) continue;
    const key = r.market in byMarket ? r.market : "khác";
    byMarket[key] += 1;
  }
  const payload = { generatedAt: new Date().toISOString(), total: ids.length, ids };
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(payload));
  console.log(
    `worklist: total=${ids.length} by market 47=${byMarket["47"]} 48=${byMarket["48"]} 89491=${byMarket["89491"]} khác=${byMarket.khác} → ${OUT}`,
  );
}

// chỉ chạy main khi gọi trực tiếp (không chạy khi import để test)
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => {
    console.error("❌", e.code ?? e.message, e instanceof AggregateError ? e.errors.map(String).join("; ") : "");
    process.exit(1);
  });
}

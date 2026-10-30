// enrich-run.ts — M-3: chạy enrichment (E1 luật → E2 LLM khi cần) trên offers P1
// (S03/S05) còn thiếu field. Từ 22/10 (vòng enrich-qua-de-xuat) mọi giá trị là ĐỀ XUẤT
// trong enrichment_proposals: luật E1 và giá trị LLM có căn cứ độc lập được áp qua hàm
// SQL apply_enrichment; giá trị LLM không căn cứ chờ người duyệt ở /ops/review.
// Logic ở agent/src/enrich/run.ts — script này chỉ nối CLI + model thật.
//
// Vị trí pipeline: bước cuối của scripts/zalo-import-daily.sh (sau transform-zalo/transform-media/refresh-bait-gap,
// hồ sơ enrich-chay-sau-nap). Mỗi tin một giao dịch ngắn; lời gọi LLM nằm ngoài giao dịch.
//
// Chạy:
//   npx tsx scripts/enrich-run.ts --dry          # chỉ E1, in bảng định tuyến, 0 LLM, 0 ghi
//   npx tsx scripts/enrich-run.ts                 # batch LIMIT env (default 50)
//   npx tsx scripts/enrich-run.ts --offers a,b    # đúng các tin chỉ định (không xét dấu đã thử)
//
// Mã thoát (Hỏi-1, Mạnh duyệt 30/10): 2 = có tin ghi lỗi (thắng 3) · 3 = LLM hỏng từ một nửa số lời gọi ·
// 1 = hỏng ngoài vòng tin · 0 = còn lại.
import pg from "pg";

import { resolveContext, resetContextCache } from "../src/agents/context-resolver.js";
import { enrichTextAgent, buildEnrichInput, parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type GiaoDich, type LlmFn } from "../src/enrich/run.js";
import { dongTongKet, maThoat } from "../src/enrich/tong-ket.js";
import { runAgent } from "../src/runtime/loop.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DRY = process.argv.includes("--dry");
const LIMIT = Number(process.env.LIMIT ?? 50);
const iOffers = process.argv.indexOf("--offers");
const OFFERS = iOffers > 0 ? (process.argv[iOffers + 1] ?? "").split(",").filter(Boolean) : undefined;

const llm: LlmFn = async (text, ctx) => {
  try {
    const r = await runAgent(enrichTextAgent, buildEnrichInput(text, ctx));
    return { result: parseEnrichOutput(r.output), model: String(enrichTextAgent.model), tracePath: r.tracePath };
  } catch (e) {
    console.log(`  ✗ LLM: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
    return {
      result: null, model: String(enrichTextAgent.model), tracePath: null,
      loi: e instanceof Error ? e.name : "Error",
    };
  }
};

async function main() {
  // application_name: phép đo đầu-cuối soi phiên này trong pg_stat_activity (không giao dịch mở lúc gọi LLM).
  const c = new pg.Client({ connectionString: DB_URL, application_name: "enrich-run" });
  await c.connect();
  resetContextCache();
  const runId = `enrich-${new Date().toISOString()}`;
  console.log(`═══ ENRICH RUN ${DRY ? "(DRY — E1 only, 0 LLM, 0 ghi)" : "(E1+E2 → đề xuất)"} · ${runId} ═══`);

  // Mỗi tin một giao dịch: lỗi ở một tin chỉ lui lại tin đó.
  const giaoDich: GiaoDich = async (fn) => {
    await c.query("BEGIN");
    try {
      const r = await fn();
      await c.query("COMMIT");
      return r;
    } catch (e) {
      await c.query("ROLLBACK").catch(() => {});
      throw e;
    }
  };

  try {
    const { routed, summary, dem } = await runEnrich({
      client: c, runId, dry: DRY, limit: Number.isFinite(LIMIT) ? LIMIT : 50, offerIds: OFFERS,
      llm, resolve: resolveContext, giaoDich,
    });

    routed.forEach((rs, i) => {
      const line = rs.map((r) => `${r.field}=${r.value} [${r.source}·${r.route}]`).join(" · ");
      console.log(`  #${i + 1} ${line || "(không có đề xuất)"}`);
    });
    console.log(`\n═══ XONG ═══`);
    if (DRY) {
      console.log(
        `offers: ${routed.length} | áp thẳng (E1): ${summary.direct} | có căn cứ: ${summary.corroborated}` +
          ` | chờ duyệt: ${summary.review} | xung đột E1/LLM: ${summary.xungDot}`,
      );
      return;
    }
    for (const dong of dongTongKet(dem)) console.log(dong);
    process.exitCode = maThoat(dem);
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

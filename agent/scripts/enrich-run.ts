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
//   npx tsx scripts/enrich-run.ts --tran-usd 0.5  # trần tiền của lượt (vắng → tran_usd của enrich-text trong agent/config/model-agent.json); vượt → mã 4
//
// Mã thoát (Hỏi-1, Mạnh duyệt 30/10): 2 = có tin ghi lỗi (thắng 3) · 3 = LLM hỏng từ một nửa số lời gọi ·
// 1 = hỏng ngoài vòng tin · 0 = còn lại. MH1: 5 = thiếu khoá của mọi đường gọi được (ANTHROPIC_API_KEY, AI_GATEWAY_API_KEY theo
// bảng agent/config/model-agent.json) — dừng trước lời gọi đầu, chưa mở DB.
import pg from "pg";

import { resolveContext, resetContextCache } from "../src/agents/context-resolver.js";
import { enrichTextAgent, buildEnrichInput, parseEnrichOutput } from "../src/agents/enrich-text.js";
import { runEnrich, type GiaoDich, type LlmFn } from "../src/enrich/run.js";
import { dongChuyenThe, dongTongKetLuot, maThoat } from "../src/enrich/tong-ket.js";
import { runAgent } from "../src/runtime/loop.js";
import { LoiCauHinhModel, LoiThieuKhoa, khoaThieuAgent, modelCuaAgent, taoTran, tranTuArgv, uocTokenVao, type Tran } from "../src/runtime/model-agent.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DRY = process.argv.includes("--dry");
const LIMIT = Number(process.env.LIMIT ?? 50);
const iOffers = process.argv.indexOf("--offers");
const OFFERS = iOffers > 0 ? (process.argv[iOffers + 1] ?? "").split(",").filter(Boolean) : undefined;

/** Lời gọi model của enrich (model theo agent/config/model-agent.json). Chi phí cộng vào trần theo token thật; lời gọi ném lỗi
 * không có token thì cộng ước token vào theo chữ đầu vào (Gateway có thể vẫn tính tiền). */
const taoLlm = (gateway: string, tran: Tran): LlmFn => async (text, ctx) => {
  const vao = buildEnrichInput(text, ctx);
  try {
    const r = await runAgent(enrichTextAgent, vao);
    tran.ghi(r.usage.inputTokens ?? uocTokenVao(vao), r.usage.outputTokens);
    return { result: parseEnrichOutput(r.output), model: r.model, tracePath: r.tracePath };
  } catch (e) {
    if (e instanceof LoiCauHinhModel || e instanceof LoiThieuKhoa) throw e;
    tran.ghi(uocTokenVao(vao), 0);
    console.log(`  ✗ LLM: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
    return { result: null, model: gateway, tracePath: null, loi: e instanceof Error ? e.name : "Error" };
  }
};

async function main() {
  // Model, giá và trần đọc trước khi mở DB: tệp cấu hình sai → mã 2, chưa lời gọi nào, chưa ghi gì (MH1 AC-2).
  const m = modelCuaAgent(enrichTextAgent.name);
  const tran = taoTran(tranTuArgv(process.argv, m.tranUsd), m.gia);
  // Thiếu khoá của mọi đường gọi được → mã 5 trước lời gọi đầu, chưa mở DB (AC-2). --dry không gọi model nên không cần khoá.
  const thieu = DRY ? [] : khoaThieuAgent(m);
  if (thieu.length) throw new LoiThieuKhoa(thieu);
  const llm = taoLlm(m.gateway, tran);
  // application_name: phép đo đầu-cuối soi phiên này trong pg_stat_activity (không giao dịch mở lúc gọi LLM).
  const c = new pg.Client({ connectionString: DB_URL, application_name: "enrich-run" });
  await c.connect();
  resetContextCache();
  const runId = `enrich-${new Date().toISOString()}`;
  console.log(`═══ ENRICH RUN ${DRY ? "(DRY — E1 only, 0 LLM, 0 ghi)" : "(E1+E2 → đề xuất)"} · ${runId} ═══`);
  console.log(`model ${m.gateway} · đường ${m.duong.join(" → ")}${m.tuLui ? " (tự lùi)" : ""} · trần ${tran.tranUsd} USD`);

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
    const { routed, summary, dem, chuyenThe } = await runEnrich({
      chanTuApCanCu: true, // NB11: lượt hằng đêm không tự áp đề xuất có căn cứ tới khi NB10 làm phiếu độc lập
      client: c, runId, dry: DRY, limit: Number.isFinite(LIMIT) ? LIMIT : 50, offerIds: OFFERS,
      llm, resolve: resolveContext, giaoDich, tran,
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
      // Chế độ dry không ghi nên chuyenThe = 0; đếm từ đề xuất đã định tuyến (trungLuat) — S4-r1 t1/t3.
      console.log(dongChuyenThe(routed.flat().filter((r) => r.trungLuat).length));
      return;
    }
    for (const dong of dongTongKetLuot(dem, chuyenThe)) console.log(dong);
    process.exitCode = maThoat(dem);
  } finally {
    await c.end();
  }
}

main().catch((e) => {
  if (e instanceof LoiThieuKhoa) {
    console.error(e.message);
    process.exit(5);
  }
  if (e instanceof LoiCauHinhModel) {
    console.error(e.message);
    process.exit(2);
  }
  console.error(e);
  process.exit(1);
});

// enrich-run.ts — M-3 E3: chạy enrichment (E1 rule → E2 LLM khi cần) trên
// offers P1 (S03/S05) thiếu dữ liệu, rồi UPDATE sale_offers (fill-gap, không
// ghi đè giá trị đã có) + cascade xuống properties liên kết qua property_offers.
//
// Vị trí pipeline: chạy SAU transform-zalo/transform-fb, TRƯỚC resolve-properties
// (properties.master tổng hợp từ offers — M-2).
//
// Chạy:
//   npx tsx scripts/enrich-run.ts --dry          # chỉ E1, in hit-rate, 0 LLM
//   npx tsx scripts/enrich-run.ts                 # batch LIMIT env (default 50)
//   LIMIT=999 npx tsx scripts/enrich-run.ts       # cả backlog (~735, LLM ~2h)
import pg from "pg";
import { resolveContext, resetContextCache } from "../src/agents/context-resolver.js";
import { enrichTextAgent, buildEnrichInput, parseEnrichOutput, needsLLM } from "../src/agents/enrich-text.js";
import { runAgent } from "../src/runtime/loop.js";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const DRY = process.argv.includes("--dry");
const LIMIT = Number(process.env.LIMIT ?? 50);

// ── sanitize: LLM output → giá trị DB hợp lệ (CHECK constraint 025) ──
const PT_OK = new Set(["apartment", "house", "land", "room", "commercial"]);
const cleanType = (v: unknown): string | null => {
  const s = String(v ?? "").toLowerCase().trim();
  return PT_OK.has(s) ? s : null;
};
const cleanInt = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
};
const cleanText = (v: unknown, max = 200): string | null => {
  const s = String(v ?? "").trim().normalize("NFC");
  return s.length >= 2 && s.length <= max ? s : null;
};

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  resetContextCache();

  // Offers P1 thiếu dữ liệu — text gốc từ post mới nhất của offer
  const { rows: offers } = await c.query(`
    SELECT * FROM (
      SELECT o.offer_id, o.source, o.property_type, o.street_raw,
             o.block_raw, o.bedrooms,
             (SELECT left(z.text, 500) FROM stg_zalo_posts z
              WHERE z.post_id = ANY(o.post_ids)
              ORDER BY z.captured_at DESC LIMIT 1) AS text,
             (SELECT z.group_name FROM stg_zalo_posts z
              WHERE z.post_id = ANY(o.post_ids)
              ORDER BY z.captured_at DESC LIMIT 1) AS group_name
      FROM sale_offers o
      WHERE o.source IN ('S03','S05') AND o.kind = 'sale'
        AND o.confidence IN ('high','medium')
        AND (o.property_type = 'unknown' OR o.street_raw IS NULL OR o.bathrooms IS NULL)
    ) t
    WHERE text IS NOT NULL AND length(text) > 20
    ORDER BY random()   -- batch nhỏ vẫn đại diện mẫu
    LIMIT ${Number.isFinite(LIMIT) ? Math.max(1, LIMIT) : 50}`,
  );
  const { rows: [{ total }] } = await c.query(
    `SELECT count(*)::int AS total FROM sale_offers
     WHERE source IN ('S03','S05') AND kind='sale' AND confidence IN ('high','medium')
       AND (property_type='unknown' OR street_raw IS NULL OR bathrooms IS NULL)`,
  );
  console.log(`═══ ENRICH RUN ${DRY ? "(DRY — E1 only, 0 LLM)" : `(E1+E2)`} ═══`);
  console.log(`Backlog: ${total} offers | batch này: ${offers.length}\n`);

  const stats = { e1Only: 0, llm: 0, llmFail: 0, updated: 0, typeFilled: 0, streetFilled: 0 };
  const enrichedIds: string[] = [];

  for (const o of offers) {
    const ctx = await resolveContext(o.group_name, o.text ?? "");
    const needLLM = needsLLM(ctx, o.text ?? "");
    let enrich: ReturnType<typeof parseEnrichOutput> = null;

    if (!DRY && needLLM) {
      try {
        const r = await runAgent(enrichTextAgent, buildEnrichInput(o.text ?? "", ctx));
        enrich = parseEnrichOutput(r.output);
        if (enrich) stats.llm++;
        else stats.llmFail++;
      } catch (e) {
        console.log(`  ✗ LLM ${o.offer_id}: ${e instanceof Error ? e.message.slice(0, 80) : "?"}`);
        stats.llmFail++;
      }
    } else if (!needLLM) {
      stats.e1Only++;
    }

    // Giá trị cuối: LLM ưu tiên, E1 fallback — sanitize trước khi ghi
    const finalType = cleanType(enrich?.property_type)
      ?? (PT_OK.has(ctx.propertyType ?? "") ? ctx.propertyType : null);
    const finalBed = cleanInt(enrich?.bedrooms);
    const finalBath = cleanInt(enrich?.bathrooms);
    const finalStreet = cleanText(enrich?.street);
    const finalBlock = cleanText(enrich?.building ?? ctx.buildingHint, 30);

    if (DRY) {
      // dry: chỉ báo cáo E1 sẽ điền gì (từ E1, không LLM)
      const dryType = PT_OK.has(ctx.propertyType ?? "") ? ctx.propertyType : null;
      if (dryType || ctx.buildingHint) stats.typeFilled++;
      console.log(
        `${needLLM ? "cầnLLM" : "E1đủ "} ${o.offer_id.slice(6, 20)} | ${(o.group_name ?? "?").slice(0, 28).padEnd(28)}` +
        ` | proj=${ctx.projectSlug ?? (ctx.projectCandidates.length ? `MỜ(${ctx.projectCandidates.length})` : "-")}` +
        ` | E1type=${dryType ?? "-"} tòa=${ctx.buildingHint ?? "-"}`,
      );
      continue;
    }

    if (finalType || finalBed || finalBath || finalStreet || finalBlock) {
      // fill-gap: giá trị CŨ thắng — chỉ lấp null / thay 'unknown'
      const { rowCount } = await c.query(
        `UPDATE sale_offers SET
           property_type = CASE WHEN property_type = 'unknown'
                                THEN COALESCE($2::text, property_type)
                                ELSE property_type END,
           street_raw    = COALESCE(street_raw, $3::text),
           block_raw     = COALESCE(block_raw, $4::text),
           bathrooms     = COALESCE(bathrooms, $5::int),
           bedrooms      = COALESCE(bedrooms, $6::int)
         WHERE offer_id = $1::text
           AND ((property_type = 'unknown' AND $2::text IS NOT NULL)
             OR (street_raw IS NULL AND $3::text IS NOT NULL)
             OR (block_raw IS NULL AND $4::text IS NOT NULL)
             OR (bathrooms IS NULL AND $5::int IS NOT NULL)
             OR (bedrooms IS NULL AND $6::int IS NOT NULL))`,
        [o.offer_id, finalType, finalStreet, finalBlock, finalBath, finalBed],
      );
      if (rowCount) {
        stats.updated++;
        if (finalType) stats.typeFilled++;
        if (finalStreet) stats.streetFilled++;
        enrichedIds.push(o.offer_id);
      }
    }

    const tag = enrich ? "E2✓" : needLLM ? "E2✗" : "E1đủ";
    console.log(
      `${tag} ${o.offer_id.slice(6, 20)} | ${(o.group_name ?? "?").slice(0, 28).padEnd(28)}` +
      ` | proj=${ctx.projectSlug ?? (ctx.projectCandidates.length ? `MỜ(${ctx.projectCandidates.length})` : "-")}` +
      ` | type=${finalType ?? "-"} bed=${finalBed ?? "-"} bath=${finalBath ?? "-"}` +
      ` | tòa=${finalBlock ?? "-"} street=${finalStreet ?? "-"}`,
    );
  }

  // ── Cascade: properties liên kết nhận fields + enrichment_log (M-1) ──
  if (!DRY && enrichedIds.length > 0) {
    const { rowCount } = await c.query(
      `UPDATE properties p SET
         bedrooms = COALESCE(p.bedrooms, agg.bedrooms),
         bathrooms = COALESCE(p.bathrooms, agg.bathrooms),
         street = COALESCE(p.street, agg.street),
         enrichment_log = p.enrichment_log ||
           jsonb_build_array(jsonb_build_object(
             't', now(), 'src', 'enrich-m3', 'via', 'sale_offers E1+E2'))
       FROM (
         SELECT po.property_id,
                max(o.bedrooms) AS bedrooms, max(o.bathrooms) AS bathrooms,
                max(o.street_raw) AS street
         FROM sale_offers o
         JOIN property_offers po ON po.offer_id = o.offer_id
         WHERE o.offer_id = ANY($1::text[])
         GROUP BY po.property_id
       ) agg
       WHERE p.id = agg.property_id
         AND (p.bedrooms IS NULL OR p.bathrooms IS NULL OR p.street IS NULL)`,
      [enrichedIds],
    );
    console.log(`\nCascade properties: ${rowCount ?? 0} bản ghi nhận fields`);
  }

  console.log(`\n═══ XONG ═══`);
  console.log(
    `E1-đủ (skip LLM): ${stats.e1Only} | LLM ok: ${stats.llm} | LLM fail: ${stats.llmFail}` +
    ` | offers update: ${stats.updated} (type ${stats.typeFilled}, street ${stats.streetFilled})`,
  );
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

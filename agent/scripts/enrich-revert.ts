// enrich-revert.ts — người hoàn tác một lượt áp enrichment (vòng enrich-hau-ky, AC-7).
// Chỉ gọi hàm SQL revert_enrichment (migration 036) — không câu UPDATE nào ở đây; hàm tự từ
// chối actor không phải người (hitl:<tên>) và lý do rỗng, và ghi ops_audit enrich:revert.
//
// Chạy:
//   npx tsx scripts/enrich-revert.ts --ids 639,644 --actor hitl:manh --reason "…" --dry   # xem kế hoạch, 0 ghi
//   npx tsx scripts/enrich-revert.ts --ids 639,644 --actor hitl:manh --reason "…"         # hoàn tác thật
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

type Args = { ids: number[]; actor: string; reason: string; dry: boolean };

function parseArgs(argv: string[]): Args | string {
  const get = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length && !argv[i + 1].startsWith("--") ? argv[i + 1] : null;
  };
  const rawIds = get("--ids");
  if (!rawIds) return "thiếu --ids";
  const parts = rawIds.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0 || !parts.every((s) => /^[1-9]\d*$/.test(s))) return `--ids không hợp lệ: ${rawIds}`;
  const actor = get("--actor");
  if (!actor) return "thiếu --actor";
  const reason = get("--reason");
  if (!reason || !reason.trim()) return "thiếu --reason";
  return { ids: parts.map(Number), actor, reason, dry: argv.includes("--dry") };
}

/** Kế hoạch từng id — cùng điều kiện bỏ qua với revert_enrichment, chỉ đọc. */
async function plan(c: pg.Client, ids: number[]): Promise<string[]> {
  const { rows } = await c.query(
    `SELECT i AS id, ep.field, ep.value, ep.value_key, ep.status, ep.offer_id,
            CASE ep.field
              WHEN 'property_type' THEN o.property_type
              WHEN 'bedrooms'      THEN o.bedrooms::text
              WHEN 'bathrooms'     THEN o.bathrooms::text
              WHEN 'street_raw'    THEN o.street_raw
              WHEN 'block_raw'     THEN o.block_raw
            END AS cur
     FROM unnest($1::bigint[]) WITH ORDINALITY AS u(i, ord)
     LEFT JOIN enrichment_proposals ep ON ep.id = u.i
     LEFT JOIN sale_offers o ON o.offer_id = ep.offer_id
     ORDER BY u.ord`,
    [ids],
  );
  return rows.map((r) => {
    if (!r.field) return `${r.id} bỏ qua: not-found`;
    const head = `${r.id} ${r.offer_id} ${r.field}`;
    if (r.status !== "applied") return `${head} bỏ qua: not-applied (${r.status})`;
    if (r.cur === null || String(r.cur).toLowerCase() !== r.value_key) return `${head} bỏ qua: value-changed (${r.cur ?? "trống"})`;
    return `${head}: ${r.cur} → ${r.field === "property_type" ? "unknown" : "trống"}`;
  });
}

/** Trả mã thoát; có `client` thì không mở/đóng transaction (test gọi trong BEGIN…ROLLBACK). */
export async function main(
  argv: string[],
  client?: pg.Client,
  out: (s: string) => void = console.log,
): Promise<number> {
  const args = parseArgs(argv);
  if (typeof args === "string") {
    out(`enrich-revert: ${args}`);
    out(`dùng: enrich-revert --ids 1,2 --actor hitl:<tên> --reason "<lý do>" [--dry]`);
    return 2;
  }
  const own = !client;
  const c = client ?? new pg.Client({ connectionString: DB_URL });
  if (own) await c.connect();
  try {
    for (const line of await plan(c, args.ids)) out(line);
    if (args.dry) {
      out("(--dry: không ghi gì)");
      return 0;
    }
    if (own) await c.query("BEGIN");
    const { rows } = await c.query(`SELECT revert_enrichment($1::bigint[], $2, $3) AS n`, [
      args.ids, args.actor, args.reason,
    ]);
    if (own) await c.query("COMMIT");
    out(`đã hoàn tác ${rows[0].n}/${args.ids.length} đề xuất — ghi ở ops_audit enrich:revert`);
    return 0;
  } catch (e) {
    if (own) await c.query("ROLLBACK").catch(() => {});
    out(`enrich-revert: ${e instanceof Error ? e.message : String(e)}`);
    return 1;
  } finally {
    if (own) await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

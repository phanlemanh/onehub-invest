#!/usr/bin/env node
// test-data-residue.mjs — đo tin sinh từ post thử còn sót trong canonical (PL2, L19).
// Spec: docs/superpowers/specs/2026-10-23-canonical-khong-tin-gia-design.md §2.4
//
//   node scripts/test-data-residue.mjs              đo trạng thái hiện tại (sau lượt đêm đã dọn)
//   node scripts/test-data-residue.mjs --simulate   BEGIN → transform S03 + bait gap → đo → ROLLBACK
//
// In JSON; mã thoát 1 khi còn dư lượng. --simulate không để lại dòng nào trên DB.
import { realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { napSdtE164 } from "../lib/nap-060.mjs";

import { TEST_MARKERS, testMarker } from "../lib/test-posts.mjs";
import { refreshBaitGap } from "../refresh-bait-gap.mjs";
import { extractPhones, runTransformZalo } from "../transform-zalo.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Bảng so số dòng trước/sau --simulate: canonical + mọi bảng khoá ngoại tới sale_offers/sellers. */
export const SIM_TABLES = [
  "sale_offers", "sellers", "ops_audit", "review_queue",
  "enrichment_proposals", "property_offers", "property_candidates",
];

// Băm SĐT như transform (seller_phone_hash).
const phoneHash = (p) => createHash("sha256").update(p).digest("hex").slice(0, 32);

/**
 * Đếm dư lượng tin thử trong canonical.
 * @param {import("pg").Client} c
 */
export async function measureResidue(c) {
  const { rows: stg } = await c.query(`SELECT post_id, snapshot_id, agent_id, group_name, text FROM stg_zalo_posts`);
  const markers = Object.fromEntries(TEST_MARKERS.map((m) => [m, 0]));
  const testIds = [];
  const testHashes = new Set();
  for (const r of stg) {
    const m = testMarker(r);
    if (!m) continue;
    markers[m]++;
    testIds.push(r.post_id);
    for (const p of extractPhones(r.text)) testHashes.add(phoneHash(p));
  }

  const { rows: [o] } = await c.query(
    `SELECT count(*) FILTER (WHERE post_ids && $1::text[])::int AS offers,
            count(*) FILTER (WHERE post_ids && $1::text[] AND bait_gap_pct IS NOT NULL)::int AS gap
     FROM sale_offers`,
    [testIds],
  );
  // Người bán từ post thử = SĐT trong post thử mà không offer sạch nào mang.
  const { rows: [s] } = await c.query(
    `SELECT count(*) FILTER (WHERE x.phone_hash = ANY($1::text[]) AND NOT EXISTS (
              SELECT 1 FROM sale_offers o WHERE o.seller_phone_hash = x.phone_hash AND NOT (o.post_ids && $2::text[])))::int AS from_test,
            count(*) FILTER (WHERE NOT EXISTS (
              SELECT 1 FROM sale_offers o WHERE o.seller_phone_hash = x.phone_hash))::int AS orphan
     FROM sellers x`,
    [[...testHashes], testIds],
  );
  // Đếm độc lập bằng SQL (không qua testMarker) — đối chiếu để thước không mù cùng một lỗi.
  const { rows: [q] } = await c.query(
    `SELECT count(*)::int AS n FROM sale_offers o WHERE EXISTS (
       SELECT 1 FROM stg_zalo_posts t WHERE t.post_id = ANY(o.post_ids) AND (
         split_part(t.snapshot_id, '__', 2) ~* '(mock|test|e2e)' OR split_part(t.snapshot_id, '__', 2) = 'example'
         OR coalesce(t.agent_id, '') ~* '^(e2e|test|mock)'
         OR btrim(coalesce(t.group_name, '')) ~* '^test([^[:alpha:]]|$)'))`,
  );

  const res = {
    offers_from_test: o.offers,
    bait_gap_from_test: o.gap,
    sellers_from_test: s.from_test,
    sellers_orphan: s.orphan,
    offers_from_test_sql: q.n,
    markers,
  };
  res.ok = res.offers_from_test === 0 && res.bait_gap_from_test === 0 && res.sellers_from_test === 0 && res.sellers_orphan === 0;
  return res;
}

/** @param {{ ok: boolean }} result */
export const exitCodeFor = (result) => (result.ok ? 0 : 1);

async function countRows(c) {
  const out = {};
  for (const t of SIM_TABLES) out[t] = Number((await c.query(`SELECT count(*) AS n FROM ${t}`)).rows[0].n);
  return out;
}

/**
 * Chạy thử trọn việc dọn trong một giao dịch rồi ROLLBACK.
 * @param {import("pg").Client} c
 */
export async function simulate(c) {
  const rowsBefore = await countRows(c);
  await c.query("BEGIN");
  let before, after, audit, keep;
  try {
    // Xếp hàng với các bộ test nạp lại hàm 039 trong giao dịch (khoá 33033) — tránh deadlock khi
    // lượt chấm chạy thước này song song với suite pipeline/agent.
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    // PL15: transform/writeOffers đi qua phát biểu + phân xử — nạp 045 và mở cổng cắt chuyển trong giao dịch.
    await napPhatBieu(c);
    await napSdtE164(c); // SD3: SĐT số gốc E.164, sellers là view — như DB sau 060
    const maxId = Number((await c.query(`SELECT coalesce(max(id), 0) AS m FROM ops_audit`)).rows[0].m);
    before = await measureResidue(c);
    await runTransformZalo(c);
    await refreshBaitGap(c);
    after = await measureResidue(c);
    const { rows } = await c.query(
      `SELECT action, count(*)::int AS n FROM ops_audit WHERE id > $1 GROUP BY action`, [maxId],
    );
    const by = Object.fromEntries(rows.map((r) => [r.action, r.n]));
    audit = {
      reconcile: by["enrich:reconcile"] ?? 0,
      reject_test: by["transform:reject-test"] ?? 0,
      sellers_orphan: by["bait-gap:sellers-orphan"] ?? 0,
    };
    const rowsMid = await countRows(c);
    keep = {
      sale_offers: rowsBefore.sale_offers ? rowsMid.sale_offers / rowsBefore.sale_offers : null,
      sellers: rowsBefore.sellers ? rowsMid.sellers / rowsBefore.sellers : null,
    };
  } finally {
    await c.query("ROLLBACK");
  }
  const rowsAfter = await countRows(c);
  const markerTotal = Object.values(before.markers).reduce((a, b) => a + b, 0);
  const checks = {
    after_clean: after.ok,
    rows_unchanged: SIM_TABLES.every((t) => rowsBefore[t] === rowsAfter[t]),
    before_matches_sql: before.offers_from_test === before.offers_from_test_sql,
    reconcile_logged: before.offers_from_test === 0 || audit.reconcile >= 1,
    reject_logged: markerTotal === 0 || audit.reject_test >= 1,
  };
  return {
    before, after, audit, keep_ratio: keep,
    rows_before: rowsBefore, rows_after: rowsAfter,
    checks, ok: Object.values(checks).every(Boolean),
  };
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    // Log của transform/bait gap đi stderr để stdout chỉ còn JSON.
    const log = console.log;
    console.log = (...a) => console.error(...a);
    const res = process.argv.includes("--simulate") ? await simulate(c) : await measureResidue(c);
    console.log = log;
    console.log(JSON.stringify(res, null, 2));
    process.exitCode = exitCodeFor(res);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });

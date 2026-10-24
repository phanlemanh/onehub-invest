// resolve-properties.mjs — M-2: Match existing + create NEW properties
// (property-master-record.md — KHÔNG TRUNCATE, persistent)
//
// Stage A: S06 clusters → match existing properties qua stable_key,
//          tạo NEW (pending) nếu chưa có, enrich existing nếu match.
// Stage B: cặp ứng viên P1↔P2 (giữ nguyên logic cũ).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const CLUSTER_EXPR = `
  floor(s.latitude / 0.0005)::text || '|' || floor(s.longitude / 0.0005)::text
    || '|' || o.kind || '|' || COALESCE(o.property_type, '?')
    || '|' || round(o.area_m2)::text
    || '|' || round(o.price_vnd / 1e6)::text`;

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    // ── Stage A: match existing + create NEW ──
    // M-1: KHÔNG TRUNCATE — properties persistent vĩnh viễn.
    const { rows: clusters } = await c.query(`
      WITH g AS (
        SELECT o.offer_id, o.area_id, o.kind, o.property_type,
               o.first_seen, o.last_seen, s.latitude, s.longitude,
               ${CLUSTER_EXPR} AS cluster_key
        FROM sale_offers o
        JOIN stg_chotot_ads s
          ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
        WHERE o.source = 'S06' AND s.latitude IS NOT NULL
          AND o.area_m2 IS NOT NULL AND o.price_vnd > 0)
      SELECT cluster_key, count(*)::int n,
             min(first_seen) fs, max(last_seen) ls,
             (array_agg(area_id ORDER BY last_seen DESC))[1] area_id,
             (array_agg(kind ORDER BY last_seen DESC))[1] kind,
             (array_agg(property_type ORDER BY last_seen DESC))[1] pt,
             round(avg(latitude)::numeric, 6) lat, round(avg(longitude)::numeric, 6) lng
      FROM g GROUP BY cluster_key`);

    let nEvidence = 0, nNew = 0, nMatched = 0;
    for (const cl of clusters) {
      // MATCH existing qua stable_key (= cluster_key)
      const { rows: existing } = await c.query(
        `SELECT id FROM properties WHERE stable_key = $1`, [cl.cluster_key],
      );
      let pid;
      if (existing.length > 0) {
        pid = existing[0].id;
        nMatched++;
        // ENRICH existing: cập nhật last_seen + n_evidence
        await c.query(
          `UPDATE properties SET last_seen = GREATEST(last_seen, $2), n_evidence = $3 WHERE id = $1`,
          [pid, cl.ls, cl.n],
        );
      } else {
        // CREATE NEW (pending — chờ HITL verify)
        const { rows: ins } = await c.query(
          `INSERT INTO properties (geo, area_id, property_type, kind, cluster_key, stable_key,
                                   n_evidence, first_seen, last_seen, resolved_by, verification)
           VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3, $4, $5, $6, $6,
                   $7, $8, $9, 'stage-ab', 'pending')
           RETURNING id`,
          [cl.lng, cl.lat, cl.area_id, cl.pt, cl.kind, cl.cluster_key, cl.n, cl.fs, cl.ls],
        );
        pid = ins[0].id;
        nNew++;
      }
      await c.query(
        `INSERT INTO property_offers (property_id, offer_id, score, signals)
         SELECT $1, o.offer_id, 1.0, '{"geo":1,"price":1,"area":1}'::jsonb
         FROM sale_offers o
         JOIN stg_chotot_ads s
           ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
         WHERE o.source='S06' AND s.latitude IS NOT NULL
           AND o.area_m2 IS NOT NULL AND o.price_vnd > 0
           AND ${CLUSTER_EXPR} = $2
         ON CONFLICT (property_id, offer_id) DO NOTHING`,
        [pid, cl.cluster_key],
      );
      nEvidence += cl.n;
    }
    console.log(
      `Stage A: ${clusters.length} clusters → ${nMatched} match existing + ${nNew} NEW (pending) | ${nEvidence} offers`,
    );

    // ── Stage B: cặp ứng viên P1↔P2 (cùng phường, DT ±15%, giá/m² ±20%) ──
    await c.query(`DELETE FROM property_candidates WHERE status IN ('pending','needs_llm')`);
    const { rows: pairs } = await c.query(`
      WITH p1 AS (
        SELECT o.offer_id, o.area_id, o.area_m2, o.price_perm2
        FROM sale_offers o
        WHERE o.source IN ('S03','S05') AND o.kind='sale'
          AND o.confidence IN ('high','medium')
          AND o.area_m2 BETWEEN 20 AND 500 AND o.price_perm2 BETWEEN 10e6 AND 300e6),
      p2 AS (
        SELECT o.offer_id, o.area_id, o.area_m2, o.price_perm2
        FROM sale_offers o
        WHERE o.source='S06' AND o.kind='sale'
          AND o.property_type IN ('apartment','house')
          AND o.area_m2 BETWEEN 20 AND 500 AND o.price_perm2 BETWEEN 10e6 AND 300e6),
      scored AS (
        SELECT p1.offer_id a, p2.offer_id b,
          round((0.5 * (1 - abs(p1.area_m2 - p2.area_m2)::numeric / GREATEST(p1.area_m2, p2.area_m2))
               + 0.5 * (1 - abs(p1.price_perm2 - p2.price_perm2)::numeric / GREATEST(p1.price_perm2, p2.price_perm2))
               )::numeric, 3) s,
          p1.area_m2 a_m2, p1.price_perm2 a_p2, p2.price_perm2 b_p2
        FROM p1 JOIN p2 ON p1.area_id = p2.area_id
          AND abs(p1.area_m2 - p2.area_m2)::numeric / GREATEST(p1.area_m2, p2.area_m2) < 0.15
          AND abs(p1.price_perm2 - p2.price_perm2)::numeric / GREATEST(p1.price_perm2, p2.price_perm2) < 0.20)
      INSERT INTO property_candidates (offer_a, offer_b, score, signals, status)
      SELECT a, b, s,
        jsonb_build_object('rule','same-ward+area15+perm2_20',
          'area_p1', a_m2, 'perm2_p1', a_p2, 'perm2_p2', b_p2),
        CASE WHEN s >= 0.90 THEN 'needs_llm' ELSE 'pending' END
      FROM scored
      ON CONFLICT (offer_a, offer_b) DO NOTHING
      RETURNING 1`);
    const nLlm = pairs.length
      ? (await c.query(`SELECT count(*)::int n FROM property_candidates WHERE status='needs_llm'`)).rows[0].n
      : 0;
    console.log(`Stage B: ${pairs.length} cặp P1↔P2 (${nLlm} needs_llm)`);
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });

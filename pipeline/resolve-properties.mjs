// resolve-properties.mjs — G-2 Stage A/B: gộp offers thành "một căn nhà"
// (docs/research/unified-property-pipeline.md §4 Lớp 2)
//
// Stage A (blocking, deterministic — S06 tự gộp): cluster_key = grid geo
// ~55m + kind + property_type + DT chạm + giá chạm → đo 375/8.645 trùng
// repost Chợ Tốt. Rebuild mỗi đêm (idempotent).
// Stage B (P1↔P2 candidates, KHÔNG auto-merge): cùng phường + DT ±15% +
// giá/m² ±20% → điểm; ≥0.85 = 'needs_llm' (G-3 judge quyết), còn lại
// 'pending' chờ tín hiệu mạnh hơn (pHash/phone).
import { pathToFileURL } from "node:url";
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
    // ── Stage A: S06 clusters → properties ──
    await c.query(`TRUNCATE property_offers, properties RESTART IDENTITY CASCADE`);

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

    let nEvidence = 0;
    for (const cl of clusters) {
      const { rows: ins } = await c.query(
        `INSERT INTO properties (geo, area_id, property_type, kind, cluster_key,
                                 n_evidence, first_seen, last_seen, resolved_by)
         VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3, $4, $5, $6, $7, $8, $9, 'stage-ab')
         RETURNING id`,
        [cl.lng, cl.lat, cl.area_id, cl.pt, cl.kind, cl.cluster_key, cl.n, cl.fs, cl.ls],
      );
      await c.query(
        `INSERT INTO property_offers (property_id, offer_id, score, signals)
         SELECT $1, o.offer_id, 1.0, '{"geo":1,"price":1,"area":1}'::jsonb
         FROM sale_offers o
         JOIN stg_chotot_ads s
           ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
         WHERE o.source='S06' AND s.latitude IS NOT NULL
           AND o.area_m2 IS NOT NULL AND o.price_vnd > 0
           AND ${CLUSTER_EXPR} = $2`,
        [ins[0].id, cl.cluster_key],
      );
      nEvidence += cl.n;
    }
    console.log(
      `Stage A: ${clusters.length} căn nhà từ ${nEvidence} offers S06 (gộp ${nEvidence - clusters.length} repost)`,
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
          -- phường là ĐIỀU KIỆN blocking (không cộng điểm); score = độ gần
          -- DT + giá/m² — cặp cực gần mới đáng G-3 judge
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
    console.log(`Stage B: ${pairs.length} cặp ứng viên P1↔P2 (trong đó ${nLlm} needs_llm chờ G-3 judge)`);
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });

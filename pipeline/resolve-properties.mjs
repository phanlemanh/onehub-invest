// resolve-properties.mjs — M-2: Match existing + create NEW properties
// (property-master-record.md — KHÔNG TRUNCATE, persistent)
//
// Stage A: S06 clusters → match existing properties qua stable_key,
//          tạo NEW (pending) nếu chưa có, enrich existing nếu match.
// Stage B: đóng băng (V7) — không dựng hay xoá cặp property_candidates.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { dienDuongCan, goSdtKhoiCan, hoanTacDuong } from "./lib/duong-can.mjs";
import { boc } from "./lib/thu-lai-deadlock.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

const CLUSTER_EXPR = `
  floor(s.latitude / 0.0005)::text || '|' || floor(s.longitude / 0.0005)::text
    || '|' || o.kind || '|' || COALESCE(o.property_type, '?')
    || '|' || round(o.area_m2)::text
    || '|' || round(o.price_vnd / 1e6)::text`;

// Tin cấp thị trường (s03-len-cong AC-3) không dựng căn: căn mang mã thị trường là thước giá có dòng cấp thị trường.
// Tin chưa có area_id vẫn dựng như cũ, nên không JOIN.
/** Dòng log thay khối Stage B (V7). */
export const STAGE_B_DONG_BANG = "Stage B: đóng băng (V7) — không dựng cặp mới";

const KHONG_CAP_THI_TRUONG = `
  NOT EXISTS (SELECT 1 FROM areas x WHERE x.id = o.area_id AND x.region_type = 'market')`;

/** Một lượt resolve trên client đã kết nối. Mọi câu đi qua bộ thử lại deadlock (hồ sơ resolve-thu-lai-deadlock):
 *  câu bị Postgres huỷ vì 40P01 được chạy lại, tối đa 3 lần. opts tiêm cho test; mặc định là chạy thật. */
export async function chayResolve(c, { ghi = console.log, ...opts } = {}) {
  const q = boc(c, opts);
  {
    // ── Stage A: match existing + create NEW ──
    // M-1: KHÔNG TRUNCATE — properties persistent vĩnh viễn.
    const { rows: clusters } = await q.query(`
      WITH g AS (
        SELECT o.offer_id, o.area_id, o.kind, o.property_type,
               o.first_seen, o.last_seen, s.latitude, s.longitude,
               ${CLUSTER_EXPR} AS cluster_key
        FROM sale_offers o
        JOIN stg_chotot_ads s
          ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
        WHERE o.source = 'S06' AND s.latitude IS NOT NULL
          AND o.area_m2 IS NOT NULL AND o.price_vnd > 0
          AND ${KHONG_CAP_THI_TRUONG})
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
      const { rows: existing } = await q.query(
        `SELECT id FROM properties WHERE stable_key = $1`, [cl.cluster_key],
      );
      let pid;
      if (existing.length > 0) {
        pid = existing[0].id;
        nMatched++;
        // ENRICH existing: cập nhật last_seen + n_evidence
        await q.query(
          `UPDATE properties SET last_seen = GREATEST(last_seen, $2), n_evidence = $3 WHERE id = $1`,
          [pid, cl.ls, cl.n],
        );
      } else {
        // CREATE NEW (pending — chờ HITL verify)
        const { rows: ins } = await q.query(
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
      await q.query(
        `INSERT INTO property_offers (property_id, offer_id, score, signals)
         SELECT $1, o.offer_id, 1.0, '{"geo":1,"price":1,"area":1}'::jsonb
         FROM sale_offers o
         JOIN stg_chotot_ads s
           ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
         WHERE o.source='S06' AND s.latitude IS NOT NULL
           AND o.area_m2 IS NOT NULL AND o.price_vnd > 0
           AND ${KHONG_CAP_THI_TRUONG}
           AND ${CLUSTER_EXPR} = $2
         ON CONFLICT (property_id, offer_id) DO NOTHING`,
        [pid, cl.cluster_key],
      );
      nEvidence += cl.n;
    }
    ghi(
      `Stage A: ${clusters.length} clusters → ${nMatched} match existing + ${nNew} NEW (pending) | ${nEvidence} offers`,
    );
    ghi(`Stage A: gỡ ${await goSdtKhoiCan(q)} ô đường mang số`);
    ghi(`Stage A: điền đường ${await dienDuongCan(q)} căn đang trống`);

    // ── Stage B: ĐÓNG BĂNG (V7, Mạnh chốt Q1 08/11 — gắn căn = nhận diện duy nhất, FRAMING §3.4) ──
    // Luật cặp cũ (cùng phường, DT ±15%, giá/m² ±20%) đo «giống nhau», không phải «là cùng một». Không dựng cặp mới,
    // không xoá cặp cũ: property_candidates giữ nguyên làm lịch sử. Thay thế: danh bạ vật thể (DB1) + gắn căn GC0–GC3.
    ghi(STAGE_B_DONG_BANG);
  }
  if (q.soLanThuLai > 0) ghi(`resolve-properties: thử lại sau deadlock ${q.soLanThuLai} lần`);
  return { soLanThuLai: q.soLanThuLai, soCauGui: q.soCauGui };
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    if (process.argv.includes("--hoan-tac-duong")) {
      console.log(`resolve-properties: trả về trống ${await hoanTacDuong(boc(c))} ô đường`);
    } else {
      await chayResolve(c);
    }
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });

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
    // Hàng resolve-stage-a-theo-tap (15/11): chạy THEO TẬP, không còn vòng mỗi cụm. Vòng cũ gửi mỗi cụm một câu nối lại cả
    // stg_chotot_ads và tính sha256 từng dòng — ~90 nghìn cụm × bảng stg là bình phương (lượt 14/11 chạy quá 3 giờ). Nay
    // khoá cụm và offer_id tính MỘT lần vào bảng tạm của phiên (không DDL trên lược đồ), rồi bốn câu cho mọi cụm. Luật gom
    // giữ nguyên: mỗi tin đúng một cụm (list_id là khoá của stg), cụm khớp căn theo stable_key, n_chua_gan đếm trước khi gắn.
    // Mốc giờ cắt về mili giây như đường cũ (giá trị đi qua Date của JS).
    await q.query(`DROP TABLE IF EXISTS pg_temp.stage_a_tin, pg_temp.stage_a_cum`);
    await q.query(`
      CREATE TEMP TABLE stage_a_tin AS
        SELECT o.offer_id, o.area_id, o.kind, o.property_type,
               o.first_seen, o.last_seen, s.latitude, s.longitude,
               ${CLUSTER_EXPR} AS cluster_key,
               NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = o.offer_id) AS chua_gan
        FROM sale_offers o
        JOIN stg_chotot_ads s
          ON o.offer_id = 'offer_' || substr(encode(digest('S06|' || s.list_id::text, 'sha256'), 'hex'), 1, 16)
        WHERE o.source = 'S06' AND s.latitude IS NOT NULL
          AND o.area_m2 IS NOT NULL AND o.price_vnd > 0
          AND ${KHONG_CAP_THI_TRUONG}`);
    await q.query(`
      CREATE TEMP TABLE stage_a_cum AS
        SELECT cluster_key, count(*)::int n,
               date_trunc('milliseconds', min(first_seen)) fs, date_trunc('milliseconds', max(last_seen)) ls,
               (array_agg(area_id ORDER BY last_seen DESC))[1] area_id,
               (array_agg(kind ORDER BY last_seen DESC))[1] kind,
               (array_agg(property_type ORDER BY last_seen DESC))[1] pt,
               round(avg(latitude)::numeric, 6) lat, round(avg(longitude)::numeric, 6) lng,
               count(*) FILTER (WHERE chua_gan)::int n_chua_gan,
               EXISTS (SELECT 1 FROM properties p WHERE p.stable_key = t.cluster_key) co_can
        FROM stage_a_tin t GROUP BY cluster_key`);
    await q.query(`CREATE INDEX ON stage_a_tin (cluster_key)`);
    await q.query(`ANALYZE stage_a_tin, stage_a_cum`);
    const { rows: [dem] } = await q.query(`
      SELECT count(*)::int n_cum,
             count(*) FILTER (WHERE co_can)::int n_khop,
             count(*) FILTER (WHERE NOT co_can AND n_chua_gan > 0)::int n_moi,
             count(*) FILTER (WHERE NOT co_can AND n_chua_gan = 0)::int n_bo_qua,
             COALESCE(sum(n) FILTER (WHERE co_can OR n_chua_gan > 0), 0)::int n_evidence
      FROM stage_a_cum`);

    // DA6 (ADR-0013 câu 3): tin đã gắn căn giữ căn của nó dù giá, diện tích, vị trí đổi. Cụm không khớp căn nào mà mọi tin
    // đều đã gắn (vd một tin vừa đổi giá rơi sang bậc giá mới) thì không sinh căn; link chỉ chèn cho tin chưa gắn căn nào.
    // ENRICH existing: cập nhật last_seen + n_evidence
    await q.query(`
      UPDATE properties p SET last_seen = GREATEST(p.last_seen, c.ls), n_evidence = c.n
      FROM stage_a_cum c WHERE c.co_can AND p.stable_key = c.cluster_key`);
    // CREATE NEW (pending — chờ HITL verify)
    await q.query(`
      INSERT INTO properties (geo, area_id, property_type, kind, cluster_key, stable_key,
                              n_evidence, first_seen, last_seen, resolved_by, verification)
      SELECT ST_SetSRID(ST_MakePoint(c.lng, c.lat), 4326)::geography, c.area_id, c.pt, c.kind, c.cluster_key, c.cluster_key,
             c.n, c.fs, c.ls, 'stage-ab', 'pending'
      FROM stage_a_cum c WHERE NOT c.co_can AND c.n_chua_gan > 0
      ORDER BY c.cluster_key`);
    await q.query(`
      INSERT INTO property_offers (property_id, offer_id, score, signals)
      SELECT p.id, t.offer_id, 1.0, '{"geo":1,"price":1,"area":1}'::jsonb
      FROM stage_a_tin t
      JOIN stage_a_cum c ON c.cluster_key = t.cluster_key AND (c.co_can OR c.n_chua_gan > 0)
      JOIN properties p ON p.stable_key = t.cluster_key
      WHERE NOT EXISTS (SELECT 1 FROM property_offers po WHERE po.offer_id = t.offer_id)
      ON CONFLICT DO NOTHING`);
    await q.query(`DROP TABLE IF EXISTS pg_temp.stage_a_tin, pg_temp.stage_a_cum`);
    ghi(
      `Stage A: ${dem.n_cum} clusters → ${dem.n_khop} match existing + ${dem.n_moi} NEW (pending) + bỏ ${dem.n_bo_qua} cụm toàn tin đã gắn | ${dem.n_evidence} offers`,
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

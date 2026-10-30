// media-roundtrip.ts — NH1 media-canonical-reso AC-7 (E8): bên ghi (pipeline/transform-media.mjs) → bảng media →
// loader thật (loadFlowMedia, loadReviewMedia) trên bản chép DB máy thu. Thay roundtrip cũ của review-media-backend
// (E8, đọc bài qua stg_zalo_posts). CHỈ chạy trên DB thử (bash db/db-thu.sh oneinvest_p2_media): lượt này GHI bảng media.
// Chạy: cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media node --import tsx scripts/media-roundtrip.ts
//   --moi-the  in id một thẻ entity_match đang chờ có tin S06 (thiếu thì ghi bền một thẻ vào DB thử) cho bước chụp E9.
import { Client } from "pg";

import { chotDbThu } from "../../pipeline/media-rows.mjs";
import { NGUON, runTransformMedia } from "../../pipeline/transform-media.mjs";
import type { User } from "../src/lib/auth";
import { loadFlowMedia } from "../src/lib/data-flow-queries";
import { pool } from "../src/lib/db";
import { loadReviewMedia, type ReviewMediaItem } from "../src/lib/ops/review-media";

const url = process.env.DATABASE_URL ?? "";
const ADMIN: User = { id: "0", email: "media-roundtrip@local.test", plan: "pro", role: "admin" };
const HONG: string[] = [];
const dong = (s: string) => console.log(s);
const ghi = (ten: string, k: number, n: number) => {
  dong(`${ten}: ${k}/${n}`);
  if (k !== 0) HONG.push(ten);
};

// Mảng ảnh của dòng bảng nạp S06 (dạng object {images:[…]} hoặc mảng) — tính ĐỘC LẬP bằng SQL, không gọi bên ghi.
const MANG_S06 = `CASE WHEN jsonb_typeof(a.images) = 'array' THEN a.images ELSE coalesce(a.images->'images', '[]') END`;
const SQL_S06_CO_ANH = `
  SELECT o.offer_id, x.urls FROM sale_offers o
  JOIN stg_chotot_ads a ON a.list_id::text = o.originating_system_key
  CROSS JOIN LATERAL (
    SELECT array_agg(u ORDER BY ord) AS urls FROM (
      SELECT DISTINCT ON (e) e AS u, ord FROM jsonb_array_elements_text(${MANG_S06}) WITH ORDINALITY t(e, ord)
      WHERE e ~ '^https?://' ORDER BY e, ord) d) x
  WHERE o.source = 'S06' AND x.urls IS NOT NULL`;
// Tin S03 có ≥ 1 entry media_files tải được — cùng khuôn route /api/zalo-media, viết bằng SQL.
const SQL_S03_DA_TAI = `
  SELECT DISTINCT o.offer_id FROM sale_offers o
  CROSS JOIN LATERAL unnest(o.post_ids) AS u(post_id)
  JOIN stg_zalo_posts p ON p.post_id = u.post_id
  CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.media_files) = 'array' THEN p.media_files ELSE '[]' END) e
  WHERE o.source = 'S03' AND e->'error' IS NULL
    AND e->>'file' ~ '^media/[A-Za-z0-9][A-Za-z0-9_.-]*$' AND position('..' IN e->>'file') = 0
    AND coalesce(e->>'snapshotId', p.snapshot_id) ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]*$'
    AND position('..' IN coalesce(e->>'snapshotId', p.snapshot_id)) = 0`;
const SQL_THE_S06 = `
  SELECT r.id, r.item_type, r.evidence FROM review_queue r
  JOIN sale_offers o ON o.offer_id IN (r.evidence->'offer_a'->>'offer_id', r.evidence->'offer_b'->>'offer_id')
  JOIN media m ON m.resource_record_key = o.offer_id
  WHERE r.item_type = 'entity_match' AND r.status = 'pending' AND o.source = 'S06'
  ORDER BY r.id LIMIT 1`;

async function luot(c: Client) {
  await c.query("BEGIN");
  try {
    const r = await runTransformMedia(c, NGUON);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  }
}

/** Thẻ entity_match có tin S06 đang chờ; DB thử chưa có thì ghi bền một thẻ (chỉ --moi-the). */
async function moiThe(c: Client): Promise<number> {
  const co = await c.query<{ id: string }>(SQL_THE_S06);
  if (co.rows[0]) return Number(co.rows[0].id);
  const { rows: [o] } = await c.query<{ a: string; b: string }>(`
    SELECT (SELECT resource_record_key FROM media WHERE originating_system_name = 'S06' ORDER BY 1 LIMIT 1) AS a,
           (SELECT resource_record_key FROM media WHERE originating_system_name = 'S06' ORDER BY 1 DESC LIMIT 1) AS b`);
  const { rows: [t] } = await c.query<{ id: string }>(
    `INSERT INTO review_queue (item_type, item_id, title, evidence) VALUES ('entity_match', $1, 'Thẻ thử NH1 (DB thử)', $2::jsonb) RETURNING id`,
    [`nh1-${o.a}-${o.b}`, JSON.stringify({ offer_a: { offer_id: o.a, source: "S06" }, offer_b: { offer_id: o.b, source: "S06" } })],
  );
  return Number(t.id);
}

async function main() {
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    const { rows: [db] } = await c.query<{ db: string; m: string | null }>(
      "SELECT current_database() AS db, to_regclass('public.media')::text AS m",
    );
    const loi = chotDbThu(db.db, Boolean(db.m)) ?? (db.db === "oneinvest" ? "probe GHI bảng media — chỉ chạy trên DB thử" : null);
    if (loi) throw new Error(loi);
    if (!db.m) throw new Error(`DB ${db.db} chưa có bảng media — áp db/migrations/053_media.sql trước`);

    if (process.argv.includes("--moi-the")) {
      await luot(c);
      dong(`thẻ duyệt có tin S06: id ${await moiThe(c)}`);
      return;
    }

    const r1 = await luot(c);
    dong(`lượt một: ${r1.rows} ảnh · thêm ${r1.inserted} · đổi ${r1.updated} · xoá ${r1.deleted} · đã tải ${r1.local}`);
    const r2 = await luot(c);
    dong(`lượt hai: thêm ${r2.inserted} · xoá ${r2.deleted} · đổi ${r2.updated}`);
    if (r2.inserted + r2.deleted + r2.updated !== 0) HONG.push("lượt hai");

    const s06 = (await c.query<{ offer_id: string; urls: string[] }>(SQL_S06_CO_ANH)).rows;
    if (s06.length === 0) throw new Error("bảng nạp S06 không có tin nào có ảnh — đo trên DB rỗng không chứng gì");
    const flow = await loadFlowMedia(s06.map((x) => ({ offerId: x.offer_id, source: "S06" })), ADMIN);
    ghi("S06 hụt ảnh ở loader", s06.filter((x) => (flow[x.offer_id] ?? []).length === 0).length, s06.length);

    const { rows: m06 } = await c.query<{ offer_id: string; urls: string[]; ords: number[] }>(`
      SELECT resource_record_key AS offer_id, array_agg(media_url ORDER BY media_order) AS urls,
             array_agg(media_order ORDER BY media_order) AS ords
      FROM media WHERE originating_system_name = 'S06' GROUP BY 1`);
    const theoTin = new Map(m06.map((x) => [x.offer_id, x]));
    const lech = s06.filter((x) => {
      const m = theoTin.get(x.offer_id);
      return !m || JSON.stringify(m.urls) !== JSON.stringify(x.urls) || m.ords.some((v, i) => v !== i);
    });
    ghi("S06 lệch số ảnh", lech.length, s06.length);
    if (lech.length) dong(`  ví dụ lệch: ${lech.slice(0, 3).map((x) => x.offer_id).join(", ")}`);

    const s03 = (await c.query<{ offer_id: string }>(SQL_S03_DA_TAI)).rows.map((x) => x.offer_id);
    if (s03.length === 0) throw new Error("không tin S03 nào có ảnh đã tải — đo trên DB rỗng không chứng gì");
    const f03 = await loadFlowMedia(s03.map((offerId) => ({ offerId, source: "S03" })), ADMIN);
    ghi("S03 hụt ảnh đã tải ở loader", s03.filter((id) => !(f03[id] ?? []).some((i) => i.origin === "local")).length, s03.length);

    const the = (await c.query<ReviewMediaItem & { id: string }>(SQL_THE_S06)).rows[0];
    let taoTam = false;
    let item: ReviewMediaItem;
    if (the) item = { ...the, id: Number(the.id) };
    else {
      // DB thử chưa có thẻ như vậy: dựng trong giao dịch của probe, đọc ảnh, rồi ROLLBACK.
      taoTam = true;
      await c.query("BEGIN");
      item = { id: await moiThe(c), item_type: "entity_match", evidence: {} };
      item.evidence = (await c.query("SELECT evidence FROM review_queue WHERE id = $1", [item.id])).rows[0].evidence;
    }
    const rv = (await loadReviewMedia([item], ADMIN))[item.id] ?? {};
    const k = Math.max((rv.offer_a ?? []).length, (rv.offer_b ?? []).length);
    dong(`thẻ duyệt S06 (id ${item.id}${taoTam ? ", tạo tạm" : ""}): ${k} ảnh`);
    if (k < 1) HONG.push("thẻ duyệt S06");
    if (taoTam) {
      await c.query("ROLLBACK");
      const { rows: [n] } = await c.query<{ n: number }>("SELECT count(*)::int AS n FROM review_queue WHERE id = $1", [item.id]);
      dong(`dọn: còn ${n.n} dòng`);
      if (n.n !== 0) HONG.push("dọn");
    } else dong("dọn: còn 0 dòng (thẻ có sẵn, không tạo)");

    const motTin = s06.find((x) => (flow[x.offer_id] ?? []).length > 0);
    dong(`hồ sơ tin S06 (${motTin?.offer_id ?? "—"}): ${motTin ? flow[motTin.offer_id].length : 0} ảnh`);
    if (!motTin) HONG.push("hồ sơ tin S06");

    if (HONG.length) throw new Error(`ROUNDTRIP FAIL: ${HONG.join(", ")}`);
    dong("ROUNDTRIP PASS");
  } finally {
    await c.end();
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

#!/usr/bin/env node
// transform-media.mjs — NH1 `media-canonical-reso`: dựng lại bảng `media` (RESO Media, migration 053) cho tin SỐNG của
// các nguồn được gọi. Chạy bằng job_run ngay sau transform của nguồn: `node transform-media.mjs S06` (chotot-daily),
// `node transform-media.mjs S03 S05` (zalo-import-daily); không đối số = cả ba nguồn.
//   - S03/S05: bài theo thứ tự sale_offers.post_ids → stg_zalo_posts.media_files + media (media-rows.mjs).
//   - S06: stg_chotot_ads.images của dòng có list_id = originating_system_key.
// Một giao dịch mỗi lượt, khoá advisory riêng: upsert theo media_key (dòng không đổi giữ nguyên dấu thời gian), xoá dòng
// của đúng các nguồn được gọi mà lượt này không sinh ra (bài gom sang tin khác, tin nghỉ, ảnh bị gỡ). Mỗi nguồn một dòng
// dq_check_results `media:local-file` (ADR-0011 điều 6 cho cột ngoài DD local_file).
// PL28: S03 còn nối ảnh của bài chỉ-ảnh vào offer của bài chữ gần nhất cùng người (baiAnhCuaTin, lib/gop-anh.mjs).
// Bảng chỉ ở máy thu — KHÔNG sync cloud (media_url S06 mang tên miền nguồn, tầng A).
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { ganBaiAnh, laChiAnh } from "./lib/gop-anh.mjs";
import { loadStgPosts } from "./lib/test-posts.mjs";
import { mediaRowsFromAd, mediaRowsFromPosts } from "./media-rows.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
export const NGUON_BAI = ["S03", "S05"];
export const NGUON = [...NGUON_BAI, "S06"];
/** Khoá advisory của bảng media — mọi bên chạm bảng trong giao dịch lấy khoá này TRƯỚC (tránh deadlock với lượt song song). */
export const KHOA = 53053;
const LO = 5000;
const COT = [
  "media_key",
  "resource_record_key",
  "originating_system_name",
  "originating_system_resource_record_key",
  "media_url",
  "media_order",
  "local_file",
];

const SQL_BAI = `
  SELECT o.offer_id, o.source, u.post_id, p.snapshot_id, p.media, p.media_files
  FROM sale_offers o
  CROSS JOIN LATERAL unnest(o.post_ids) WITH ORDINALITY AS u(post_id, ord)
  JOIN stg_zalo_posts p ON p.post_id = u.post_id
  WHERE o.source = ANY($1::text[])
  ORDER BY o.offer_id, u.ord`;

const SQL_QC = `
  SELECT o.offer_id, a.list_id::text AS list_id, a.images
  FROM sale_offers o
  JOIN stg_chotot_ads a ON a.list_id::text = o.originating_system_key
  WHERE o.source = 'S06'`;

const SQL_MEDIA_BAI = `
  SELECT DISTINCT ON (post_id) post_id, snapshot_id, media, media_files
  FROM stg_zalo_posts WHERE post_id = ANY($1::text[])
  ORDER BY post_id, captured_at DESC`;

/**
 * Bài chỉ-ảnh S03 đã gán vào offer (PL28 `gop-tin-chi-anh-o-transform`): mỗi bài chỉ-ảnh theo bài chữ gần nhất cùng người,
 * cùng nhóm, dưới 2 phút (lib/gop-anh.mjs); bài chữ ấy nằm trong post_ids của một offer S03 thì bài ảnh thuộc offer đó.
 * Bài chữ gần nhất không thuộc offer nào → ảnh không vào đâu. Trả offer_id → bài ảnh theo posted_at (cột như SQL_BAI).
 */
export async function baiAnhCuaTin(c) {
  const { rows: tin } = await c.query(`SELECT offer_id, post_ids FROM sale_offers WHERE source = 'S03'`);
  const offerCua = new Map();
  for (const t of tin) for (const id of t.post_ids ?? []) offerCua.set(id, t.offer_id);
  const { posts } = await loadStgPosts(c, "zalo");
  const chu = posts.filter((p) => !laChiAnh(p.text));
  const anh = posts.filter((p) => laChiAnh(p.text));
  const luc = new Map(anh.map((p) => [p.post_id, new Date(p.posted_at).getTime()]));
  const theoTin = new Map();
  for (const [anhId, chuId] of ganBaiAnh(chu, anh)) {
    const offerId = offerCua.get(chuId);
    if (!offerId) continue;
    if (!theoTin.has(offerId)) theoTin.set(offerId, []);
    theoTin.get(offerId).push(anhId);
  }
  const ids = [...theoTin.values()].flat();
  const media = new Map((await c.query(SQL_MEDIA_BAI, [ids])).rows.map((r) => [r.post_id, r]));
  const out = new Map();
  for (const [offerId, ds] of theoTin) {
    ds.sort((a, b) => luc.get(a) - luc.get(b) || a.localeCompare(b));
    out.set(offerId, ds.map((id) => media.get(id)).filter(Boolean));
  }
  return out;
}

/**
 * PL28: ảnh của bài chỉ-ảnh xếp SAU mọi ảnh của chính các bài chữ của offer — kể cả khi bài chữ chỉ có ảnh từ xa còn bài
 * ảnh có ảnh đã tải (luật ghép NH1 đưa ảnh đã tải của mọi bài lên trước, nên không trộn chung một danh sách bài). Bỏ ảnh
 * trùng tệp hay URL với ảnh đã có; media_order nối tiếp.
 */
function noiSau(cua, them) {
  const tep = new Set(cua.map((r) => r.local_file).filter(Boolean));
  const url = new Set(cua.map((r) => r.media_url).filter(Boolean));
  return them
    .filter((r) => !(r.local_file && tep.has(r.local_file)) && !(r.media_url && url.has(r.media_url)))
    .map((r, i) => ({ ...r, media_order: cua.length + i }));
}

/** Tập dòng muốn có của các nguồn (tin sống). */
async function dungDong(c, sources) {
  const rows = [];
  const bai = sources.filter((s) => NGUON_BAI.includes(s));
  if (bai.length) {
    const { rows: r } = await c.query(SQL_BAI, [bai]);
    const theoTin = new Map();
    for (const x of r) {
      if (!theoTin.has(x.offer_id)) theoTin.set(x.offer_id, { source: x.source, posts: [] });
      theoTin.get(x.offer_id).posts.push(x);
    }
    const anhGan = bai.includes("S03") ? await baiAnhCuaTin(c) : new Map();
    for (const [offerId, { source, posts }] of theoTin) {
      const cua = mediaRowsFromPosts(offerId, source, posts);
      const gop = source === "S03" ? noiSau(cua, mediaRowsFromPosts(offerId, source, anhGan.get(offerId) ?? [])) : [];
      rows.push(...cua, ...gop);
    }
  }
  if (sources.includes("S06")) {
    const { rows: r } = await c.query(SQL_QC);
    for (const x of r) rows.push(...mediaRowsFromAd(x.offer_id, x.list_id, x.images));
  }
  return rows;
}

/**
 * Dựng lại ảnh của các nguồn trong giao dịch của NGƯỜI GỌI (CLI mở BEGIN/COMMIT; test mở BEGIN/ROLLBACK).
 * Trả số dòng muốn có, số thêm / đổi / xoá, số dòng có ảnh đã tải.
 */
export async function runTransformMedia(c, sources = NGUON) {
  const la = sources.filter((s) => !NGUON.includes(s));
  if (la.length || sources.length === 0) throw new Error(`transform-media: nguồn không hỗ trợ: ${la.join(",") || "(rỗng)"}`);
  await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
  const rows = await dungDong(c, sources);

  await c.query("DROP TABLE IF EXISTS pg_temp.media_moi");
  await c.query(`CREATE TEMP TABLE media_moi (
      media_key text PRIMARY KEY, resource_record_key text, originating_system_name text,
      originating_system_resource_record_key text, media_url text, media_order integer, local_file text
    ) ON COMMIT DROP`);
  for (let i = 0; i < rows.length; i += LO) {
    const lo = rows.slice(i, i + LO);
    await c.query(
      `INSERT INTO media_moi (${COT.join(", ")})
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::int[], $7::text[])`,
      COT.map((k) => lo.map((r) => r[k])),
    );
  }

  const deleted = (
    await c.query(
      `DELETE FROM media x WHERE x.originating_system_name = ANY($1::text[])
         AND NOT EXISTS (SELECT 1 FROM media_moi m WHERE m.media_key = x.media_key)`,
      [sources],
    )
  ).rowCount;
  const updated = (
    await c.query(`UPDATE media x SET
        resource_record_key = m.resource_record_key, originating_system_name = m.originating_system_name,
        originating_system_resource_record_key = m.originating_system_resource_record_key,
        media_url = m.media_url, media_order = m.media_order, local_file = m.local_file,
        media_modification_timestamp = now()
      FROM media_moi m
      WHERE x.media_key = m.media_key
        AND (x.resource_record_key, x.originating_system_name, x.originating_system_resource_record_key,
             x.media_url, x.media_order, x.local_file)
        IS DISTINCT FROM (m.resource_record_key, m.originating_system_name, m.originating_system_resource_record_key,
             m.media_url, m.media_order, m.local_file)`)
  ).rowCount;
  const inserted = (
    await c.query(`INSERT INTO media (${COT.join(", ")})
      SELECT ${COT.map((k) => `m.${k}`).join(", ")} FROM media_moi m
      WHERE NOT EXISTS (SELECT 1 FROM media x WHERE x.media_key = m.media_key)`)
  ).rowCount;

  let local = 0;
  for (const src of sources) {
    const cua = rows.filter((r) => r.originating_system_name === src);
    const loc = cua.filter((r) => r.local_file).length;
    local += loc;
    const tin = new Set(cua.map((r) => r.resource_record_key)).size;
    await c.query(
      `INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ('media:local-file', $1, $2, $3)`,
      [src, cua.length ? "pass" : "skip", `rows=${cua.length} local=${loc} offers_with_media=${tin}`],
    );
  }
  return { rows: rows.length, inserted, updated, deleted, local };
}

async function main() {
  const sources = process.argv.slice(2);
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const r = await runTransformMedia(c, sources.length ? sources : NGUON);
    await c.query("COMMIT");
    console.log(
      `transform-media ${sources.join(" ") || NGUON.join(" ")}: ${r.rows} ảnh · thêm ${r.inserted} · đổi ${r.updated} · xoá ${r.deleted} · đã tải ${r.local}`,
    );
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });

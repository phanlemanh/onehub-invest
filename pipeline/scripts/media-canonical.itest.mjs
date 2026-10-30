// media-canonical.itest.mjs — NH1 `media-canonical-reso` (NH-AC-n ↔ _acceptance/media-canonical-reso/evals.yaml E1, E3, E5).
// Cần DB có sale_offer_records + bảng nạp thật; mỗi ca BEGIN … ROLLBACK. Chạy trên DB thử riêng (DATABASE_URL, mặc định
// executor là oneinvest_p2_media), không trên DB `oneinvest` dùng chung khi 053 chưa áp (luật đo của đợt dot0-cam-mau).
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { chotDbThu } from "../media-rows.mjs";
import { KHOA, runTransformMedia } from "../transform-media.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_053 = readFileSync(path.join(ROOT, "db/migrations/053_media.sql"), "utf8");
const COT_053 = [
  "media_key",
  "resource_record_key",
  "originating_system_name",
  "originating_system_resource_record_key",
  "media_url",
  "media_order",
  "local_file",
  "media_modification_timestamp",
];
const SNAP = "hcmc__zalo-agent__2026-10-23T000000";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — trỏ vào DB thử riêng (bash db/db-thu.sh oneinvest_p2_media)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db, to_regclass('public.media')::text AS m");
  const loi = chotDbThu(r.db, Boolean(r.m));
  if (loi) throw new Error(loi);
});
after(async () => {
  await c?.end();
});

/** Chạy fn trong một giao dịch luôn ROLLBACK, với 053 đã nạp (idempotent). Khoá advisory của bảng media lấy TRƯỚC khi
 * áp 053 (053 giữ khoá bảng media) — cùng thứ tự với runTransformMedia, nên lượt chạy song song (probe, mồi thẻ) chỉ xếp
 * hàng chứ không deadlock (S4 round 1: 40P01). */
export async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    await c.query(SQL_053);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Tên ràng buộc chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function rangBuocChan(sql, values) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, values);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return e.constraint ?? e.message;
  }
}

test("NH-AC-1 chốt DB: không chạy trên oneinvest dùng chung khi chưa có bảng media", () => {
  assert.match(chotDbThu("oneinvest", false) ?? "", /DATABASE_URL trỏ DB oneinvest dùng chung/);
  assert.equal(chotDbThu("oneinvest", true), null, "sau gộp (053 đã áp) oneinvest được phép");
  assert.equal(chotDbThu("oneinvest_p2_media", false), null);
});

test("NH-AC-1 053 chạy hai lần", async () => {
  await trongGiaoDich(async (db) => {
    await db.query(SQL_053); // lần hai (trongGiaoDich đã nạp lần một)
    const { rows } = await db.query(
      `SELECT column_name AS c FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'media' ORDER BY ordinal_position`,
    );
    assert.deepEqual(rows.map((r) => r.c), COT_053);
  });
});

test("NH-AC-1 ràng buộc", async () => {
  await trongGiaoDich(async (db) => {
    const { rows: [o] } = await db.query("SELECT offer_id FROM sale_offer_records LIMIT 1");
    assert.ok(o, "DB thử không có tin nào — đo trên DB rỗng không chứng gì");
    const ins = `INSERT INTO media (media_key, resource_record_key, originating_system_name,
        originating_system_resource_record_key, media_url, media_order, local_file)
      VALUES ($1, $2, 'S03', 'p1', $3, $4, $5)`;
    const ca = [
      ["k1", o.offer_id, "javascript:x", 0, null, "media_url_http"],
      ["k2", o.offer_id, null, 0, null, "media_has_source"],
      ["k3", o.offer_id, null, 0, "a/../media/x.jpg", "media_local_file_shape"],
      ["k4", o.offer_id, null, 0, "snap/x.jpg", "media_local_file_shape"],
      ["k5", o.offer_id, "https://img.example.test/1.jpg", -1, null, "media_order_nonneg"],
      ["k6", "khong-co-tin-nay", "https://img.example.test/1.jpg", 0, null, "media_offer_fk"],
    ];
    for (const [key, offer, url, order, file, mong] of ca) {
      assert.equal(await rangBuocChan(ins, [key, offer, url, order, file]), mong, `${key} phải bị ${mong} chặn`);
    }
    // Đối chứng dương: dòng hợp lệ (snapshotId có ':' và '.', khuôn route cho phép) vào được.
    assert.equal(
      await rangBuocChan(ins, ["ok", o.offer_id, "https://img.example.test/1.jpg", 0, `${SNAP}/media/1.jpg`]),
      null,
      "dòng hợp lệ phải vào được",
    );
    assert.equal(
      await rangBuocChan(ins, ["ok2", o.offer_id, null, 1, "hanoi__zalo-agent__2026-10-22T07:06.51/media/a.b.jpg"]),
      null,
      "snapshotId có ':' và '.' phải vào được",
    );
  });
});

// ---- NH-AC-2, NH-AC-4: bên ghi transform-media ----
const P = `nh1t${process.pid}`;
const URL_ = (n) => `https://img.example.test/${P}/${n}.jpg`;
let listSeq = 9_900_000_000_000 + (process.pid % 100_000) * 100;

async function themTin(db, { id, source, postIds = [], key = null }) {
  await db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key)
     VALUES ($1, 'sale', now(), now(), $2, $3::text[], $4)`,
    [id, source, postIds, key],
  );
}
/** snapshot_id có thật của bảng nạp (khoá ngoại tới airbnb_snapshots). */
const snapCua = async (db, bang) => (await db.query(`SELECT snapshot_id FROM ${bang} LIMIT 1`)).rows[0].snapshot_id;
async function themQc(db, images) {
  const listId = String(++listSeq);
  await db.query(
    `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, images)
     VALUES ($1::bigint, 13000, 'hcmc', 1010, 's', '{}'::jsonb, $2, $3::jsonb)`,
    [listId, await snapCua(db, "stg_chotot_ads"), JSON.stringify(images)],
  );
  return listId;
}
async function themBai(db, postId, { media = null, mediaFiles = null } = {}) {
  await db.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, media, media_files) VALUES ($1, $2, 'bài thử NH1', $3::jsonb, $4::jsonb)`,
    [postId, await snapCua(db, "stg_zalo_posts"), media && JSON.stringify(media), mediaFiles && JSON.stringify(mediaFiles)],
  );
}
const anhCua = async (db, ids) =>
  (
    await db.query(
      `SELECT resource_record_key AS o, media_url AS u, local_file AS f, media_order AS n,
              originating_system_resource_record_key AS k, media_key, media_modification_timestamp AS t
       FROM media WHERE resource_record_key = ANY($1::text[]) ORDER BY resource_record_key, media_order`,
      [ids],
    )
  ).rows;
const demDq = async (db, src) =>
  (await db.query(`SELECT count(*)::int AS n FROM dq_check_results WHERE check_name = 'media:local-file' AND entity = $1`, [src])).rows[0].n;

test("NH-AC-2 S06: mỗi URL http(s) khác nhau một dòng, đúng thứ tự; tin không ảnh 0 dòng; một dòng DQ", async () => {
  await trongGiaoDich(async (db) => {
    const la = await themQc(db, { images: [URL_(1), URL_(2), URL_(1), "ftp://x"], thumbnails: [] });
    const lb = await themQc(db, [URL_(3)]);
    const lc = await themQc(db, { images: [] });
    await themTin(db, { id: `${P}-A`, source: "S06", key: la });
    await themTin(db, { id: `${P}-B`, source: "S06", key: lb });
    await themTin(db, { id: `${P}-C`, source: "S06", key: lc });
    const dq = await demDq(db, "S06");
    await runTransformMedia(db, ["S06"]);
    const r = await anhCua(db, [`${P}-A`, `${P}-B`, `${P}-C`]);
    const a = r.filter((x) => x.o === `${P}-A`);
    assert.deepEqual(a.map((x) => [x.u, x.n]), [[URL_(1), 0], [URL_(2), 1]], "URL trùng chỉ một dòng; ftp bị bỏ");
    assert.deepEqual(r.filter((x) => x.o === `${P}-B`).map((x) => [x.u, x.n, x.k, x.f]), [[URL_(3), 0, lb, null]]);
    assert.equal(r.filter((x) => x.o === `${P}-C`).length, 0, "tin C không ảnh phải 0 dòng");
    assert.ok(a.every((x) => x.k === la && x.f === null));
    assert.equal(await demDq(db, "S06"), dq + 1, "đúng một dòng DQ media:local-file cho S06 mỗi lượt");
  });
});

test("NH-AC-2 dòng bảng nạp thật: số dòng và thứ tự bằng danh sách URL tính bằng SQL jsonb", async () => {
  await trongGiaoDich(async (db) => {
    const { rows: mau } = await db.query(`
      SELECT DISTINCT ON (jsonb_typeof(a.images)) jsonb_typeof(a.images) AS dang, o.offer_id, a.list_id
      FROM sale_offers o JOIN stg_chotot_ads a ON a.list_id::text = o.originating_system_key
      WHERE o.source = 'S06' AND jsonb_array_length(CASE WHEN jsonb_typeof(a.images) = 'array' THEN a.images
              ELSE coalesce(a.images->'images', '[]') END) >= 2
      ORDER BY jsonb_typeof(a.images), a.list_id`);
    assert.ok(mau.length >= 1, "DB thử không có tin S06 nào có ≥ 2 ảnh");
    console.log(`dạng images gặp: ${mau.map((m) => m.dang).join(", ")}`);
    await runTransformMedia(db, ["S06"]);
    for (const m of mau) {
      const { rows: [k] } = await db.query(
        `SELECT coalesce(array_agg(u ORDER BY ord), '{}') AS urls FROM (
           SELECT DISTINCT ON (e) e AS u, ord
           FROM stg_chotot_ads a,
                jsonb_array_elements_text(CASE WHEN jsonb_typeof(a.images) = 'array' THEN a.images
                  ELSE coalesce(a.images->'images', '[]') END) WITH ORDINALITY t(e, ord)
           WHERE a.list_id = $1 AND e ~ '^https?://' ORDER BY e, ord) s`,
        [m.list_id],
      );
      const r = await anhCua(db, [m.offer_id]);
      assert.deepEqual(r.map((x) => x.u), k.urls, `tin ${m.offer_id} (dạng ${m.dang}): danh sách ảnh lệch bảng nạp`);
      assert.deepEqual(r.map((x) => x.n), k.urls.map((_, i) => i));
    }
  });
});

test("NH-AC-2 phần tử ảnh rác bị bỏ, không ném", async () => {
  await trongGiaoDich(async (db) => {
    const le = await themQc(db, { images: [null, {}, 42, URL_(9)] });
    await themTin(db, { id: `${P}-E`, source: "S06", key: le });
    await runTransformMedia(db, ["S06"]);
    assert.deepEqual((await anhCua(db, [`${P}-E`])).map((x) => x.u), [URL_(9)]);
  });
});

async function dungS03(db) {
  await themBai(db, `${P}-p1`, {
    mediaFiles: [
      { url: URL_(11), file: "media/11.jpg", snapshotId: SNAP },
      { url: URL_(12), file: null, error: "http-500", snapshotId: SNAP },
    ],
    media: [{ url: URL_(11) }, { url: URL_(12) }],
  });
  await themBai(db, `${P}-p2`, { media: [{ url: URL_(21) }, { url: URL_(22) }] });
  await themBai(db, `${P}-p3`, { mediaFiles: [{ url: URL_(31), file: "media/31.jpg", snapshotId: SNAP }] });
  await themTin(db, { id: `${P}-T1`, source: "S03", postIds: [`${P}-p1`, `${P}-p2`] });
  await themTin(db, { id: `${P}-T2`, source: "S03", postIds: [`${P}-p3`] });
}

test("NH-AC-4 chạy lại không đổi: thêm 0 · đổi 0 · xoá 0, giữ media_key và dấu thời gian", async () => {
  await trongGiaoDich(async (db) => {
    await dungS03(db);
    const la = await themQc(db, { images: [URL_(41)] });
    await themTin(db, { id: `${P}-Q`, source: "S06", key: la });
    await runTransformMedia(db, ["S03", "S06"]);
    const ids = [`${P}-T1`, `${P}-T2`, `${P}-Q`];
    await db.query(`UPDATE media SET media_modification_timestamp = '2000-01-01T00:00:00Z' WHERE resource_record_key = ANY($1::text[])`, [ids]);
    const truoc = await anhCua(db, ids);
    const r = await runTransformMedia(db, ["S03", "S06"]);
    assert.deepEqual([r.inserted, r.updated, r.deleted], [0, 0, 0], "lượt hai trên cùng dữ liệu phải 0 thay đổi");
    const sau = await anhCua(db, ids);
    assert.deepEqual(sau, truoc, "lượt hai không được đổi media_modification_timestamp hay media_key");
    assert.equal(truoc.length, 6, "T1 có 11 (đã tải), 12, 21, 22; T2 có 31 (đã tải); Q có 41");
  });
});

test("NH-AC-4 bài gom sang tin khác: ảnh đi theo tin mới, tin cũ không còn", async () => {
  await trongGiaoDich(async (db) => {
    await dungS03(db);
    await runTransformMedia(db, ["S03"]);
    await db.query(`UPDATE sale_offer_records SET post_ids = $2::text[] WHERE offer_id = $1`, [`${P}-T1`, [`${P}-p1`]]);
    await db.query(`UPDATE sale_offer_records SET post_ids = $2::text[] WHERE offer_id = $1`, [`${P}-T2`, [`${P}-p3`, `${P}-p2`]]);
    await runTransformMedia(db, ["S03"]);
    const r = await anhCua(db, [`${P}-T1`, `${P}-T2`]);
    assert.deepEqual(r.filter((x) => x.o === `${P}-T1`).map((x) => x.u), [URL_(11), URL_(12)], "T1 không còn ảnh của p2");
    assert.deepEqual(
      r.filter((x) => x.o === `${P}-T2`).map((x) => [x.u, x.k]),
      [[URL_(31), `${P}-p3`], [URL_(21), `${P}-p2`], [URL_(22), `${P}-p2`]],
      "ảnh của p2 khoá theo T2",
    );
  });
});

test("NH-AC-4 tin nghỉ: dòng media của tin bị xoá", async () => {
  await trongGiaoDich(async (db) => {
    await dungS03(db);
    await runTransformMedia(db, ["S03"]);
    assert.ok((await anhCua(db, [`${P}-T1`])).length > 0);
    await db.query(`UPDATE sale_offer_records SET retired_at = now() WHERE offer_id = $1`, [`${P}-T1`]);
    await runTransformMedia(db, ["S03"]);
    assert.equal((await anhCua(db, [`${P}-T1`])).length, 0, "tin nghỉ phải 0 dòng media");
  });
});

test("NH-AC-4 nguồn khác không bị chạm: chạy S06 giữ nguyên từng cột dòng S03", async () => {
  await trongGiaoDich(async (db) => {
    await dungS03(db);
    await runTransformMedia(db, ["S03"]);
    const truoc = (await db.query(`SELECT * FROM media WHERE originating_system_name = 'S03' ORDER BY media_key`)).rows;
    assert.ok(truoc.length > 0);
    await runTransformMedia(db, ["S06"]);
    const sau = (await db.query(`SELECT * FROM media WHERE originating_system_name = 'S03' ORDER BY media_key`)).rows;
    assert.deepEqual(sau, truoc, "lượt S06 không được chạm dòng S03");
  });
});

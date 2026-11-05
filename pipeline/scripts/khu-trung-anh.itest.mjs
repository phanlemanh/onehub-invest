// khu-trung-anh.itest.mjs — hồ sơ _acceptance/khu-trung-anh-tin (GT1) AC-3, AC-4, AC-6: transform-media thật trên DB thử
// (DATABASE_URL oneinvest_<dãy>_<việc>), mỗi ca BEGIN … ROLLBACK. Ca đỏ: bản sao đột biến chép cạnh tệp thật, nạp rồi xoá ngay.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { mediaKey, mediaRowsFromAd } from "../media-rows.mjs";
import { KHOA, runTransformMedia } from "../transform-media.mjs";

const PIPE = join(import.meta.dirname, "..");
const P = `kta${process.pid}`;
const T0 = Date.parse("2026-10-28T03:00:00Z");
const luc = (giay) => new Date(T0 + giay * 1000).toISOString();
const sha = (c) => c.repeat(64);
const URL_ = (n) => `https://img.example.test/${P}/${n}.jpg`;

let c;
before(async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/oneinvest_[a-z0-9_]+$/.test(url)) throw new Error("khu-trung-anh.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  c = new pg.Client({ connectionString: url });
  await c.connect();
});
after(async () => {
  await c?.end();
});

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

async function banSao(tep, thay) {
  let src = readFileSync(join(PIPE, tep), "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(PIPE, `.kta-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

const snapCua = async (db) => (await db.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)'
                   AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id;
const tepCua = (snap, n, s) => ({ url: URL_(n), file: `media/${P}-${n}.jpg`, snapshotId: snap, sha256: s });
const local = (snap, n) => `${snap}/media/${P}-${n}.jpg`;
async function themBai(db, id, giay, tep, chu = "Bán căn hộ 2PN giá 3 tỷ") {
  const snap = await snapCua(db);
  await db.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, media, media_files, posted_at, sender_id, conversation_id)
     VALUES ($1, $2, $3, '[]'::jsonb, $4::jsonb, $5, $6, $7)`,
    [`${P}-${id}`, snap, chu, JSON.stringify(tep(snap)), luc(giay), `nguoi-${P}`, `nhom-${P}`],
  );
  return snap;
}
const themTin = (db, id, postIds, source = "S03", key = null) =>
  db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids, originating_system_key)
     VALUES ($1, 'sale', now(), now(), $2, $3::text[], $4)`,
    [`${P}-${id}`, source, postIds.map((x) => `${P}-${x}`), key],
  );
const dongCua = async (db, id) =>
  (
    await db.query(
      `SELECT media_key, media_order, local_file, media_url, media_modification_timestamp AS t FROM media WHERE resource_record_key = $1 ORDER BY media_order`,
      [`${P}-${id}`],
    )
  ).rows;

/** AC-3: bài chữ có ảnh A; bài chỉ-ảnh 30 giây sau có A đăng lại (URL, tệp mới) và ảnh B khác nội dung. */
async function dungAc3(db) {
  await themBai(db, "chu", 0, (s) => [tepCua(s, "a", sha("a"))]);
  const snap = await themBai(db, "anh", 30, (s) => [tepCua(s, "a2", sha("a")), tepCua(s, "b", sha("b"))], URL_("b"));
  await themTin(db, "t3", ["chu"]);
  return snap;
}
function kiemAc3(dong, snap) {
  assert.deepEqual(dong.map((r) => [r.local_file, r.media_order]), [[local(snap, "a"), 0], [local(snap, "b"), 1]], "KTA-AC-3 ảnh của tin sai");
}
test("KTA-AC-3 ảnh trùng băm của bài chỉ-ảnh không thêm dòng, ảnh khác nối sau", { timeout: 120_000 }, async () => {
  await trongGiaoDich(async (db) => {
    const snap = await dungAc3(db);
    await runTransformMedia(db, ["S03"]);
    kiemAc3(await dongCua(db, "t3"), snap);
  });
});
test("KTA-AC-3 ca đỏ: noiSau không xét băm", { timeout: 120_000 }, async () => {
  const dot = await banSao("transform-media.mjs", [[" && !(r.sha256 && sha.has(r.sha256))", ""]]);
  await trongGiaoDich(async (db) => {
    const snap = await dungAc3(db);
    await dot.runTransformMedia(db, ["S03"]);
    const dong = await dongCua(db, "t3");
    assert.throws(() => kiemAc3(dong, snap), /KTA-AC-3 ảnh của tin sai/);
  });
});

test("KTA-AC-4 dòng S06 đúng từng cột với mediaRowsFromAd, kể cả bỏ URL trùng", { timeout: 120_000 }, async () => {
  const kiem = async (fn) => {
    await trongGiaoDich(async (db) => {
      const listId = String(9_000_000_000 + (process.pid % 100_000));
      const snap = (await db.query("SELECT snapshot_id FROM stg_chotot_ads LIMIT 1")).rows[0].snapshot_id;
      const images = [URL_("x"), URL_("y"), URL_("x")];
      await db.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, images)
         VALUES ($1::bigint, 13000, 'hcmc', 1010, 's', '{}'::jsonb, $2, $3::jsonb)`, [listId, snap, JSON.stringify({ images })]);
      await themTin(db, "t6", [], "S06", listId);
      await fn(db, ["S06"]);
      const mong = mediaRowsFromAd(`${P}-t6`, listId, { images }).map((r) => [r.media_key, r.media_order, r.media_url, r.local_file]);
      assert.deepEqual((await dongCua(db, "t6")).map((r) => [r.media_key, r.media_order, r.media_url, r.local_file]), mong, "KTA-AC-4 dòng S06 lệch");
    });
  };
  await kiem(runTransformMedia);
  const dot = await banSao("transform-media.mjs", [["for (const x of r) rows.push(...mediaRowsFromAd(x.offer_id, x.list_id, x.images));", "for (const x of r) rows.push(...mediaRowsFromAd(x.offer_id, x.list_id, x.images).reverse().map((d, i) => ({ ...d, media_order: i })));"]]);
  await assert.rejects(() => kiem(dot.runTransformMedia), /KTA-AC-4 dòng S06 lệch/);
});

test("KTA-AC-6 lượt đầu xoá đúng dòng trùng cũ, dòng dời chỗ có dấu mới, chạy lại không đổi", { timeout: 180_000 }, async () => {
  await trongGiaoDich(async (db) => {
    // Bốn ảnh: trùng ở đầu cụm (a2 ngay sau a), giữa (b2 giữa b và c), cuối (c2); d đứng sau mọi dòng trùng ở tin thứ hai.
    const snap = await themBai(db, "p1", 0, (s) => [tepCua(s, "a", sha("a")), tepCua(s, "a2", sha("a")), tepCua(s, "b", sha("b")), tepCua(s, "b2", sha("b")), tepCua(s, "c", sha("c")), tepCua(s, "c2", sha("c"))]);
    await themTin(db, "t", ["p1"]);
    const off = `${P}-t`;
    const cu = ["a", "a2", "b", "b2", "c", "c2"];
    for (const [i, n] of cu.entries()) {
      await db.query(
        `INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order, local_file, media_modification_timestamp)
         VALUES ($1, $2, 'S03', $3, $4, $5, $6, '2000-01-01T00:00:00Z')`,
        [mediaKey(off, local(snap, n), URL_(n)), off, `${P}-p1`, URL_(n), i, local(snap, n)],
      );
    }
    await runTransformMedia(db, ["S03"]);
    const sau = await dongCua(db, "t");
    assert.deepEqual(sau.map((r) => r.local_file), [local(snap, "a"), local(snap, "b"), local(snap, "c")], "KTA-AC-6 xoá sai dòng");
    assert.deepEqual(sau.map((r) => r.media_order), [0, 1, 2], "KTA-AC-6 thứ tự không liền nhau");
    assert.deepEqual(sau.map((r) => r.media_key), ["a", "b", "c"].map((n) => mediaKey(off, local(snap, n), URL_(n))), "KTA-AC-6 đổi khoá");
    const nam = (r) => r.t.getUTCFullYear();
    assert.equal(nam(sau[0]), 2000, "KTA-AC-6 dòng không dời phải giữ dấu cũ");
    assert.notEqual(nam(sau[1]), 2000, "KTA-AC-6 dòng dời chỗ phải có dấu mới");
    assert.notEqual(nam(sau[2]), 2000, "KTA-AC-6 dòng dời chỗ phải có dấu mới");
    const lai = await runTransformMedia(db, ["S03"]);
    assert.deepEqual([lai.inserted, lai.updated, lai.deleted], [0, 0, 0], "KTA-AC-6 lượt hai còn đổi");
  });
});

test("KTA-AC-6 ca đỏ: khoá dòng theo băm thì đổi khoá", { timeout: 60_000 }, async () => {
  const dot = await banSao("media-rows.mjs", [["media_key: mediaKey(offerId, local, url),", "media_key: mediaKey(offerId, sha256 ?? local, url),"]]);
  const r = dot.mediaRowsFromPosts("o", "S03", [{ post_id: "p", snapshot_id: "s", media_files: [{ file: "media/a.jpg", url: "https://x.example/a.jpg", sha256: sha("a") }] }]);
  assert.notEqual(r[0].media_key, mediaKey("o", "s/media/a.jpg", "https://x.example/a.jpg"), "KTA-AC-6 thước không thấy đổi khoá");
});

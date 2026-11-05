// khu-trung-anh.itest.mjs — hồ sơ _acceptance/khu-trung-anh-tin (GT1) AC-3, AC-4, AC-6: transform-media thật trên DB thử
// (DATABASE_URL oneinvest_<dãy>_<việc>), mỗi ca BEGIN … ROLLBACK. Ca đỏ: bản sao đột biến chép cạnh tệp thật, nạp rồi xoá ngay.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

/** Bản sao transform-media dùng bản sao media-rows đột biến: đo đi qua đúng đường ghi. */
async function transformVoiMediaRows(thay) {
  let mr = readFileSync(join(PIPE, "media-rows.mjs"), "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(mr.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    mr = mr.replace(cu, moi);
  }
  const f = join(PIPE, `.kta-mr-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(f, mr);
  try {
    return await banSao("transform-media.mjs", [['from "./media-rows.mjs"', `from "./${f.split("/").pop()}"`]]);
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

/**
 * AC-3: bài chữ có ảnh A và A đăng lại (A1, đã khử); bài chỉ-ảnh 30 giây sau có A đăng lại (URL, tệp mới), ảnh B khác nội
 * dung, và URL của A1 chưa có tệp: URL ấy không được quay lại.
 */
async function dungAc3(db) {
  await themBai(db, "chu", 0, (s) => [tepCua(s, "a", sha("a")), tepCua(s, "a1", sha("a"))]);
  const snap = await themBai(db, "anh", 30, (s) => [tepCua(s, "a2", sha("a")), tepCua(s, "b", sha("b")), { url: URL_("a1"), error: "http-500" }], URL_("b"));
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
for (const [ten, thay] of [
  ["noiSau không xét băm", [[" && !(r.sha256 && sha.has(r.sha256))", ""]]],
  ["URL của tệp đã khử quay lại", [["cua.flatMap((r) => [r.media_url, ...(r.url_da_khu ?? [])])", "cua.map((r) => r.media_url)"]]],
]) {
  test(`KTA-AC-3 ca đỏ: ${ten}`, { timeout: 120_000 }, async () => {
    const dot = await banSao("transform-media.mjs", thay);
    await trongGiaoDich(async (db) => {
      const snap = await dungAc3(db);
      await dot.runTransformMedia(db, ["S03"]);
      const dong = await dongCua(db, "t3");
      assert.throws(() => kiemAc3(dong, snap), /KTA-AC-3 ảnh của tin sai/);
    });
  });
}

const md5 = (x) => createHash("md5").update(x).digest("hex");
test("KTA-AC-4 dòng S06 giữ đúng cột như trước, kể cả bỏ URL trùng", { timeout: 120_000 }, async () => {
  const kiem = async (fn) => {
    await trongGiaoDich(async (db) => {
      const listId = String(9_000_000_000 + (process.pid % 100_000));
      const snap = (await db.query("SELECT snapshot_id FROM stg_chotot_ads LIMIT 1")).rows[0].snapshot_id;
      await db.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, images)
         VALUES ($1::bigint, 13000, 'hcmc', 1010, 's', '{}'::jsonb, $2, $3::jsonb)`, [listId, snap, JSON.stringify({ images: [URL_("x"), URL_("y"), URL_("x"), URL_("z")] })]);
      await themTin(db, "t6", [], "S06", listId);
      await fn(db, ["S06"]);
      // Đáp án viết tay theo luật trước vòng này (NH1), không rút từ hàm đang đo.
      const o = `${P}-t6`;
      const mong = [[md5(`${o}|${URL_("x")}`), 0, URL_("x"), null], [md5(`${o}|${URL_("y")}`), 1, URL_("y"), null], [md5(`${o}|${URL_("z")}`), 2, URL_("z"), null]];
      assert.deepEqual((await dongCua(db, "t6")).map((r) => [r.media_key, r.media_order, r.media_url, r.local_file]), mong, "KTA-AC-4 dòng S06 lệch");
    });
  };
  await kiem(runTransformMedia);
  const dot = await transformVoiMediaRows([["const arr = Array.isArray(images) ? images : list(record(images).images);", "const arr = [...(Array.isArray(images) ? images : list(record(images).images))].reverse();"]]);
  await assert.rejects(() => kiem(dot.runTransformMedia), /KTA-AC-4 dòng S06 lệch/);
});

// [tên, tệp theo thứ tự với băm, tệp còn lại, tệp giữ dấu cũ]. Mỗi dòng một tin, cùng một lượt transform.
const AC6 = [
  ["trùng ở đầu", [["a", "a"], ["a2", "a"], ["b", "b"], ["c", "c"]], ["a", "b", "c"], ["a"]],
  ["trùng ở giữa", [["a", "a"], ["b", "b"], ["b2", "b"], ["c", "c"]], ["a", "b", "c"], ["a", "b"]],
  ["trùng ở cuối", [["a", "a"], ["b", "b"], ["c", "c"], ["c2", "c"]], ["a", "b", "c"], ["a", "b", "c"]],
  ["không trùng", [["a", "a"], ["b", "b"]], ["a", "b"], ["a", "b"]],
];
/** Dựng mọi tin của ma trận với dòng cũ dấu 2000, chạy `fn`, trả snapshot. */
async function dungAc6(db) {
  let snap;
  for (const [i, [, tep]] of AC6.entries()) {
    const ten = (n) => `t${i}${n}`;
    snap = await themBai(db, `p6${i}`, 1000 + i * 1000, (s) => tep.map(([n, h]) => tepCua(s, ten(n), sha(h))));
    await themTin(db, `t6${i}`, [`p6${i}`]);
    const off = `${P}-t6${i}`;
    for (const [j, [n]] of tep.entries()) {
      await db.query(
        `INSERT INTO media (media_key, resource_record_key, originating_system_name, originating_system_resource_record_key, media_url, media_order, local_file, media_modification_timestamp)
         VALUES ($1, $2, 'S03', $3, $4, $5, $6, '2000-01-01T00:00:00Z')`,
        [mediaKey(off, local(snap, ten(n)), URL_(ten(n))), off, `${P}-p6${i}`, URL_(ten(n)), j, local(snap, ten(n))],
      );
    }
  }
  return snap;
}
async function kiemAc6(db, snap) {
  assert.equal(AC6.length, 4, "KTA-AC-6 ma trận đổi số dòng");
  for (const [i, [nhan, , con, giuDau]] of AC6.entries()) {
    const ten = (n) => `t${i}${n}`;
    const off = `${P}-t6${i}`;
    const sau = await dongCua(db, `t6${i}`);
    assert.deepEqual(sau.map((r) => r.media_key), con.map((n) => mediaKey(off, local(snap, ten(n)), URL_(ten(n)))), `KTA-AC-6 đổi khoá hoặc xoá sai: ${nhan}`);
    assert.deepEqual(sau.map((r) => r.media_order), con.map((_, j) => j), `KTA-AC-6 thứ tự không liền nhau: ${nhan}`);
    assert.deepEqual(sau.filter((r) => r.t.getUTCFullYear() === 2000).map((r) => r.media_key), giuDau.map((n) => mediaKey(off, local(snap, ten(n)), URL_(ten(n)))), `KTA-AC-6 dấu thời gian sai: ${nhan}`);
  }
}
test("KTA-AC-6 lượt đầu xoá đúng dòng trùng cũ, dòng dời chỗ có dấu mới, chạy lại không đổi", { timeout: 180_000 }, async () => {
  await trongGiaoDich(async (db) => {
    const snap = await dungAc6(db);
    await runTransformMedia(db, ["S03"]);
    await kiemAc6(db, snap);
    const lai = await runTransformMedia(db, ["S03"]);
    assert.deepEqual([lai.inserted, lai.updated, lai.deleted], [0, 0, 0], "KTA-AC-6 lượt hai còn đổi");
  });
});

test("KTA-AC-6 ca đỏ: khoá dòng theo băm thì đổi khoá", { timeout: 180_000 }, async () => {
  const dot = await transformVoiMediaRows([["media_key: mediaKey(offerId, local, url),", "media_key: mediaKey(offerId, sha256 ?? local, url),"]]);
  await trongGiaoDich(async (db) => {
    const snap = await dungAc6(db);
    await dot.runTransformMedia(db, ["S03"]);
    await assert.rejects(() => kiemAc6(db, snap), /KTA-AC-6 đổi khoá hoặc xoá sai: trùng ở đầu/);
  });
});

test("KTA-AC-6 ca đỏ: ghi đè dấu thời gian mọi dòng", { timeout: 180_000 }, async () => {
  const dot = await banSao("transform-media.mjs", [["        AND (x.resource_record_key, x.originating_system_name, x.originating_system_resource_record_key,\n             x.media_url, x.media_order, x.local_file)\n        IS DISTINCT FROM (m.resource_record_key, m.originating_system_name, m.originating_system_resource_record_key,\n             m.media_url, m.media_order, m.local_file)`", "`"]]);
  await trongGiaoDich(async (db) => {
    const snap = await dungAc6(db);
    await dot.runTransformMedia(db, ["S03"]);
    await assert.rejects(() => kiemAc6(db, snap), /KTA-AC-6 dấu thời gian sai: trùng ở đầu/);
  });
});

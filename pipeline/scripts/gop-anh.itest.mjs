// gop-anh.itest.mjs — hồ sơ _acceptance/gop-tin-chi-anh-o-transform (PL28) AC-3, AC-4, AC-5: transform-media nối ảnh của
// bài chỉ-ảnh S03 vào offer của bài chữ gần nhất cùng người. Chạy trên DB thử (DATABASE_URL oneinvest_<dãy>_<việc>), mỗi ca
// BEGIN … ROLLBACK. Ca đỏ: bản sao đột biến transform-media.mjs chép cạnh tệp thật, nạp rồi xoá ngay.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { KHOA, runTransformMedia } from "../transform-media.mjs";

const PIPE = join(import.meta.dirname, "..");
const TM = join(PIPE, "transform-media.mjs");
const P = `ga${process.pid}`;
const NGUOI = `nguoi-${P}`;
const NHOM = `nhom-${P}`;
const T0 = Date.parse("2026-10-28T03:00:00Z");
const luc = (giay) => new Date(T0 + giay * 1000).toISOString();
const URL_ = (n) => `https://img.example.test/${P}/${n}.jpg`;

let c;
before(async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/oneinvest_[a-z0-9_]+$/.test(url)) throw new Error("gop-anh.itest: cần DATABASE_URL trỏ DB thử oneinvest_<dãy>_<việc> (bash db/db-thu.sh …)");
  c = new pg.Client({ connectionString: url });
  await c.connect();
});
after(async () => {
  await c?.end();
});

let nMut = 0;
async function banSaoDotBien(thay) {
  let src = readFileSync(TM, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(PIPE, `.ga-tm-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}
const BO_NOI = [['const gop = source === "S03" ? noiSau(cua, mediaRowsFromPosts(offerId, source, anhGan.get(offerId) ?? [])) : [];', "const gop = [];"]];
const TRON_CHUNG = [["rows.push(...cua, ...gop);", "rows.push(...mediaRowsFromPosts(offerId, source, [...posts, ...(anhGan.get(offerId) ?? [])]));"]];
const BO_XOA = [["`DELETE FROM media x WHERE x.originating_system_name", "`SELECT 1 FROM media x WHERE x.originating_system_name"]];
const LOC_OFFER = [["const chu = posts.filter((p) => !laChiAnh(p.text));", "const chu = posts.filter((p) => !laChiAnh(p.text) && offerCua.has(p.post_id));"]];

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK");
  }
}

const snapCua = async (db) => (await db.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)'
                   AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id;
/** Bài chữ (chữ thật) hay bài chỉ-ảnh (chữ là URL ảnh) của cùng một người trong cùng một nhóm. */
async function themBai(db, id, giay, { chu = null, anh, daTai = false }) {
  const snap = await snapCua(db);
  const tep = daTai ? JSON.stringify([{ url: URL_(anh), file: `media/${P}-${anh}.jpg`, snapshotId: snap }]) : null;
  await db.query(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, media, media_files, posted_at, sender_id, conversation_id)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8)`,
    [`${P}-${id}`, snap, chu ?? URL_(anh), JSON.stringify([{ url: URL_(anh) }]), tep, luc(giay), NGUOI, NHOM],
  );
}
async function themTin(db, id, postIds) {
  await db.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, post_ids)
     VALUES ($1, 'sale', now(), now(), 'S03', $2::text[])`,
    [`${P}-${id}`, postIds.map((x) => `${P}-${x}`)],
  );
}
/** Ảnh của các offer: [offer, bài nguồn, media_order], theo offer rồi thứ tự. */
const anhCua = async (db, ids) =>
  (
    await db.query(
      `SELECT resource_record_key AS o, originating_system_resource_record_key AS k, media_order AS n
       FROM media WHERE resource_record_key = ANY($1::text[]) ORDER BY resource_record_key, media_order`,
      [ids.map((x) => `${P}-${x}`)],
    )
  ).rows.map((r) => [r.o.slice(P.length + 1), r.k.slice(P.length + 1), r.n]);
const dongCuaBai = async (db, baiId) =>
  (await db.query(`SELECT resource_record_key AS o FROM media WHERE originating_system_resource_record_key = $1`, [`${P}-${baiId}`])).rows.map((r) => r.o.slice(P.length + 1));

/** Offer T: hai bài chữ c1 (t=0), c2 (t=10); bài chỉ-ảnh a1 (−50), a2 (−20), a3 (+60) trong cửa sổ, a4 (+300) ngoài. */
async function dungTin(db) {
  await themBai(db, "c1", 0, { chu: "Bán căn 2PN giá 3 tỷ", anh: 1 });
  await themBai(db, "c2", 10, { chu: "Bán căn 2PN giá 3 tỷ, sổ hồng", anh: 2 });
  await themBai(db, "a1", -50, { anh: 11 });
  await themBai(db, "a2", -20, { anh: 12 });
  await themBai(db, "a3", 60, { anh: 13 });
  await themBai(db, "a4", 300, { anh: 14 });
  await themTin(db, "T", ["c1", "c2"]);
}

test("GA-AC-3 ảnh của 3 bài chỉ-ảnh trong cửa sổ vào offer, sau ảnh của chính bài chữ; lượt hai 0 thay đổi", async () => {
  await trongGiaoDich(async (db) => {
    await dungTin(db);
    await runTransformMedia(db, ["S03"]);
    assert.deepEqual((await anhCua(db, ["T"])).map(([, k]) => k), ["c1", "c2", "a1", "a2", "a3"], "GA-AC-3 offer T phải có ảnh c1, c2 rồi 3 bài chỉ-ảnh a1, a2, a3 (không a4)");
    const r = await runTransformMedia(db, ["S03"]);
    assert.deepEqual([r.inserted, r.updated, r.deleted], [0, 0, 0], "GA-AC-3 lượt hai trên cùng dữ liệu phải 0 thay đổi");
  });
});

test("GA-AC-3b bài chữ gần hơn tới sau: lượt ba gỡ ảnh khỏi offer cũ (sang offer khác, hoặc không vào đâu)", async () => {
  await trongGiaoDich(async (db) => {
    await dungTin(db);
    await runTransformMedia(db, ["S03"]);
    await themBai(db, "d", 70, { chu: "Cho thuê 1PN 6tr", anh: 3 }); // gần a3 (10 giây) hơn c2 (50 giây), thuộc offer T2
    await themTin(db, "T2", ["d"]);
    await themBai(db, "e", -15, { chu: "Ai có căn 2PN tầm 3 tỷ không ạ", anh: 4 }); // gần a2 (5 giây) hơn c1 (20 giây), không offer
    await runTransformMedia(db, ["S03"]);
    assert.deepEqual(await dongCuaBai(db, "a3"), ["T2"], "GA-AC-3b ảnh a3 phải sang T2 và không còn ở T");
    assert.deepEqual(await dongCuaBai(db, "a2"), [], "GA-AC-3b ảnh a2 theo tin chữ không offer — không offer nào còn dòng của nó");
  });
});

test("GA-AC-3 đột biến: bỏ bước nối bài ảnh → offer chỉ còn ảnh của bài chữ", async () => {
  const m = await banSaoDotBien(BO_NOI);
  await trongGiaoDich(async (db) => {
    await dungTin(db);
    await m.runTransformMedia(db, ["S03"]);
    assert.deepEqual((await anhCua(db, ["T"])).map(([, k]) => k), ["c1", "c2"], "GA-AC-3 đột biến vẫn có 3 bài chỉ-ảnh — thước không đo bước nối");
  });
});

test("GA-AC-3b đột biến: bỏ bước xoá dòng không còn sinh → ảnh a3 còn ở offer cũ", async () => {
  const m = await banSaoDotBien(BO_XOA);
  await trongGiaoDich(async (db) => {
    await dungTin(db);
    await m.runTransformMedia(db, ["S03"]);
    await themBai(db, "d", 70, { chu: "Cho thuê 1PN 6tr", anh: 3 });
    await themTin(db, "T2", ["d"]);
    await m.runTransformMedia(db, ["S03"]);
    assert.deepEqual((await dongCuaBai(db, "a3")).sort(), ["T", "T2"], "GA-AC-3b đột biến đã gỡ ảnh a3 khỏi T — thước không đo bước xoá");
  });
});

/** Bài chữ chỉ có ảnh từ xa (c1, c2), bài chỉ-ảnh có ảnh ĐÃ TẢI (a1) — luật ghép NH1 đưa ảnh đã tải lên trước nếu trộn chung. */
async function dungTronTep(db) {
  await themBai(db, "c1", 0, { chu: "Bán căn 2PN giá 3 tỷ", anh: 1 });
  await themBai(db, "c2", 10, { chu: "Bán căn 2PN giá 3 tỷ, sổ hồng", anh: 2 });
  await themBai(db, "a1", 40, { anh: 11, daTai: true });
  await themTin(db, "T", ["c1", "c2"]);
}

test("GA-AC-3c bài chữ chỉ có ảnh từ xa, bài chỉ-ảnh có ảnh đã tải: ảnh gộp vẫn xếp SAU", async () => {
  await trongGiaoDich(async (db) => {
    await dungTronTep(db);
    await runTransformMedia(db, ["S03"]);
    assert.deepEqual((await anhCua(db, ["T"])).map(([, k, n]) => [k, n]), [["c1", 0], ["c2", 1], ["a1", 2]], "GA-AC-3c ảnh đã tải của bài chỉ-ảnh phải đứng sau ảnh của hai bài chữ");
  });
});

test("GA-AC-3c đột biến: trộn chung một danh sách bài → ảnh đã tải của bài chỉ-ảnh lên đầu", async () => {
  const m = await banSaoDotBien(TRON_CHUNG);
  await trongGiaoDich(async (db) => {
    await dungTronTep(db);
    await m.runTransformMedia(db, ["S03"]);
    assert.equal((await anhCua(db, ["T"]))[0][1], "a1", "GA-AC-3c đột biến ảnh a1 vẫn không lên đầu — thước không đo thứ tự khi trộn tệp");
  });
});

/** Bài chữ offer c (t=0), bài chữ không offer n (t=50), bài chỉ-ảnh b (t=45) gần n hơn. */
async function dungGanTinKhongOffer(db) {
  await themBai(db, "c", 0, { chu: "Bán căn 3PN giá 5 tỷ", anh: 5 });
  await themBai(db, "n", 50, { chu: "Liên hệ em xem nhà nhé", anh: 6 });
  await themBai(db, "b", 45, { anh: 15 });
  await themTin(db, "U", ["c"]);
}

test("GA-AC-4 bài chỉ-ảnh gần tin chữ không offer → 0 dòng media", async () => {
  await trongGiaoDich(async (db) => {
    await dungGanTinKhongOffer(db);
    await runTransformMedia(db, ["S03"]);
    assert.deepEqual(await dongCuaBai(db, "b"), [], "GA-AC-4 ảnh b phải không vào offer nào");
  });
});

test("GA-AC-4 đột biến: chỉ xét bài chữ thuộc offer → ảnh b vào offer U", async () => {
  const m = await banSaoDotBien(LOC_OFFER);
  await trongGiaoDich(async (db) => {
    await dungGanTinKhongOffer(db);
    await m.runTransformMedia(db, ["S03"]);
    assert.deepEqual(await dongCuaBai(db, "b"), ["U"], "GA-AC-4 đột biến ảnh b vẫn không vào U — thước không đo luật gần nhất trên mọi tin chữ");
  });
});

const BAM_STG = `SELECT md5(string_agg(post_id || '|' || snapshot_id || '|' || md5(text) || '|' || coalesce(media::text, '') || '|' ||
                   coalesce(media_files::text, '') || '|' || coalesce(posted_at::text, ''), ',' ORDER BY post_id, snapshot_id, captured_at)) AS h
                 FROM stg_zalo_posts`;
const BAM_TIN = `SELECT md5(string_agg(offer_id || '|' || array_to_string(post_ids, ',') || '|' || coalesce(n_reposts::text, ''), ',' ORDER BY offer_id)) AS h
                 FROM sale_offer_records`;

test("GA-AC-5 bảng nạp và sale_offers không đổi qua transform-media; đối chứng: sửa thử bảng nạp thì băm lệch", async () => {
  await trongGiaoDich(async (db) => {
    await dungTin(db);
    const bam = async () => [(await db.query(BAM_STG)).rows[0].h, (await db.query(BAM_TIN)).rows[0].h];
    const truoc = await bam();
    await runTransformMedia(db, ["S03"]);
    assert.deepEqual(await bam(), truoc, "GA-AC-5 băm bảng nạp hoặc sale_offers đổi sau transform-media");
    await db.query(`UPDATE stg_zalo_posts SET text = text || ' ' WHERE post_id = $1`, [`${P}-c1`]);
    assert.notEqual((await bam())[0], truoc[0], "GA-AC-5 đối chứng: sửa bảng nạp mà băm không đổi — thước không đo bảng nạp");
  });
});

// kev-phat-bieu.itest.mjs — PL5 cột Kev ở bảng nạp + phát biểu Kev (KP-AC-n ↔ _acceptance/meta-kev-thanh-phat-bieu/evals.yaml).
// Chạy trên DB thử (bash db/db-thu.sh oneinvest_p1_n1), mọi ca trong BEGIN … ROLLBACK, nạp 045 + 057 trong giao dịch
// (napKev giữ pg_advisory_xact_lock(33033)). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { napPhatBieu } from "../lib/nap-045.mjs";
import { MIG_057, napKev } from "../lib/nap-057.mjs";
import { loadStgPosts } from "../lib/test-posts.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { runTransformZalo } from "../transform-zalo.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p1_n1";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

/** BEGIN, nạp 045 + 057, chạy fn, ROLLBACK. */
async function trongGiaoDich(fn, { sql057 } = {}) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napKev(c, sql057 ? { sql: sql057 } : {});
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

/** Thông điệp lỗi chặn lệnh, hoặc null khi lệnh vào được. Mỗi lệnh một SAVEPOINT. */
async function chan(sql, vals = []) {
  await c.query("SAVEPOINT ca");
  try {
    await c.query(sql, vals);
    await c.query("RELEASE SAVEPOINT ca");
    return null;
  } catch (e) {
    await c.query("ROLLBACK TO SAVEPOINT ca");
    return `${e.constraint ?? ""} ${e.message}`;
  }
}

const SQL_PHAT_BIEU = `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, evidence, observed_at)
  VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, now())`;
// snapshot_id có khoá ngoại tới bảng snapshot: mượn một snapshot có sẵn (dòng ghi trong giao dịch, ROLLBACK).
const SQL_STG = `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, kev_intent, kev_kind)
  SELECT $1, (SELECT snapshot_id FROM stg_zalo_posts LIMIT 1), 'bài giả', $2, $3`;

const COT_KEV = [
  ["kev_p", "real"], ["kev_intent", "text"], ["kev_intent_p", "real"], ["kev_kind", "text"], ["kev_kind_p", "real"],
  ["kev_model", "text"], ["kev_at", "timestamp with time zone"],
];

async function kiemLuocDo() {
  const { rows } = await c.query(`SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'stg_zalo_posts' AND column_name LIKE 'kev\\_%' ORDER BY ordinal_position`);
  assert.deepEqual(rows.map((r) => [r.column_name, r.data_type]), COT_KEV, "bảy cột kev_* đúng kiểu");
  assert.equal(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "inquiry", "inferred", "kev"]), null, "listing_intent/kev/inferred bị chặn");
  assert.equal(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "kind", "rent_lt", "inferred", "kev"]), null, "kind/kev/inferred bị chặn");
  for (const tier of ["observed", "fact"]) {
    assert.match(await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "offer", tier, "kev"]) ?? "vào được",
      /cặp lớp\/phương pháp/, `kev/${tier} không bị hàm canh từ chối`);
  }
  assert.match(await chan(SQL_STG, ["kp-stg-1", "mua", null]) ?? "vào được", /stg_zalo_posts_kev_intent_chk/, "kev_intent='mua' vào được");
  assert.match(await chan(SQL_STG, ["kp-stg-2", null, "rent_lt"]) ?? "vào được", /stg_zalo_posts_kev_kind_chk/, "kev_kind='rent_lt' vào được");
  assert.equal(await chan(SQL_STG, ["kp-stg-3", "inquiry", "rent"]), null, "dòng hợp lệ bị chặn");
}

test("KP-AC-1 057 áp hai lần: bảy cột kev_*, CHECK trường/phương pháp, kev chỉ đi với inferred, CHECK bảng nạp", async () => {
  await trongGiaoDich(async () => {
    await napKev(c); // lần áp thứ hai trong cùng giao dịch — không lỗi
    await kiemLuocDo();
  });
});

test("KP-AC-1 đối chứng: bản sao 057 bỏ kev khỏi nhánh inferred của hàm canh → (kev, inferred) bị từ chối", async () => {
  const goc = readFileSync(MIG_057, "utf8");
  const dotBien = goc.replace("NEW.method IN ('e1_rule', 'e2_llm', 'kev'))) THEN", "NEW.method IN ('e1_rule', 'e2_llm'))) THEN");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  await trongGiaoDich(async () => {
    const m = await chan(SQL_PHAT_BIEU, ["S03:kp-1", "listing_intent", "inquiry", "inferred", "kev"]);
    assert.match(m ?? "vào được", /cặp lớp\/phương pháp không hợp lệ \(inferred \/ kev\)/, "ca đỏ không ghim «kev / inferred»");
  }, { sql057: dotBien });
});

test("KP-AC-1b vai người: CHECK nhận kev theo sổ nhưng hàm canh party_roles (055) vẫn từ chối kev ở mọi lớp", async () => {
  await trongGiaoDich(async () => {
    if (!(await c.query("SELECT to_regclass('party_roles') AS t")).rows[0].t) return; // DB chưa áp 055: không có gì để kiểm
    for (const tier of ["fact", "observed", "inferred"]) {
      const m = await chan(`INSERT INTO party_roles (party_key, role, subject_key, evidence_tier, method, evidence, observed_at, run_id)
        VALUES ('pty_01ARZ3NDEKTSV4RRFFQ69G5FAV', 'nguoi_dang', 'S03:kp-1', $1, 'kev', '{}'::jsonb, now(), 'kp-test')`, [tier]);
      assert.match(m ?? "vào được", /cặp lớp\/phương pháp/, `party_roles nhận kev/${tier}`);
    }
  });
});

// ---- Task 4: transform-zalo ghi phát biểu Kev (KP-AC-4/5/6) — bài tổng hợp, chữ giả, chạy cùng dữ liệu DB thử ----
const P = `kp${process.pid}`;
const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const AT = "2026-10-30T01:00:00Z";
const im = async (fn) => { const log = console.log; const dong = []; console.log = (...a) => dong.push(a.join(" ")); try { return { kq: await fn(), dong }; } finally { console.log = log; } };

/** Năm bài S03: tin rao bán, Yêu cầu thuê (không giá — không thành offer), «không phải tin» theo Kev (có giá — thành offer),
 *  gate down, bài thử (nhóm TEST) mang điểm. */
const BAI = [
  ["ban", "Bán căn hộ 2PN 68m2 giá 3,2 tỷ, sổ hồng chính chủ", null, { kev_p: 0.97, kev_intent: "offer", kev_intent_p: 0.91, kev_kind: "sale", kev_kind_p: 0.88 }],
  ["yeucau", "Khách tìm thuê căn 2pn gần trung tâm, ai có nhà inbox em", null, { kev_p: 0.81, kev_intent: "inquiry", kev_intent_p: 0.62, kev_kind: "rent", kev_kind_p: 0.7 }],
  ["khongtin", "Cho thuê căn hộ 1PN 45m2 giá 8 triệu/tháng", null, { kev_p: 0.2, kev_intent: "not_listing", kev_intent_p: 0.55 }],
  ["gate", "Bán đất 50m2 giá 2 tỷ", null, null],
  ["thu", "Bán căn hộ 3PN 90m2 giá 5 tỷ", "TEST", { kev_p: 0.95, kev_intent: "offer", kev_intent_p: 0.9, kev_kind: "sale", kev_kind_p: 0.9 }],
];
async function dungBai(db) {
  const snap = (await db.query(`SELECT snapshot_id FROM stg_zalo_posts WHERE split_part(snapshot_id, '__', 2) !~* '(mock|test|e2e)'
                     AND split_part(snapshot_id, '__', 2) <> 'example' LIMIT 1`)).rows[0].snapshot_id;
  for (const [id, text, nhom, k] of BAI) {
    await db.query(
      `INSERT INTO stg_zalo_posts (post_id, snapshot_id, text, posted_at, sender_id, conversation_id, group_name,
                                   kev_p, kev_intent, kev_intent_p, kev_kind, kev_kind_p, kev_model, kev_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [`${P}-${id}`, snap, text, AT, `${P}-nguoi-${id}`, `${P}-nhom`, nhom, k?.kev_p ?? null, k?.kev_intent ?? null,
        k?.kev_intent_p ?? null, k?.kev_kind ?? null, k?.kev_kind_p ?? null, k ? "kev-4b@v5" : null, k ? AT : null]);
  }
}
/** Phát biểu Kev sống của bài fixture: { ban: ["kind=sale", "listing_intent=offer"], … } (bài không có thì vắng). */
async function phatBieuSong(db) {
  const { rows } = await db.query(`SELECT subject_key, field, value FROM field_assertions
     WHERE method = 'kev' AND retracted_at IS NULL AND subject_key LIKE $1 ORDER BY subject_key, field`, [`S03:${P}-%`]);
  const m = {};
  for (const r of rows) (m[r.subject_key.slice(`S03:${P}-`.length)] ??= []).push(`${r.field}=${r.value}`);
  return m;
}
const MONG_DOI_4 = { ban: ["kind=sale", "listing_intent=offer"], yeucau: ["kind=rent_lt", "listing_intent=inquiry"], khongtin: ["listing_intent=not_listing"] };
const kiem4 = async (db) => assert.deepEqual(await phatBieuSong(db), MONG_DOI_4, "phát biểu Kev sống theo bài");

let nBan = 0;
/** Chép các tệp (đường tương đối pipeline/) với chỗ đổi cạnh tệp thật, import tệp đầu, xoá sau. */
async function banSao(tep, fn) {
  const n = ++nBan;
  const ten = (t) => t.replace(/\.mjs$/, `.kp-db-${process.pid}-${n}.mjs`);
  const ghi = [];
  try {
    for (const [t, doi] of tep) {
      let src = readFileSync(join(PIPE, t), "utf8");
      for (const [tu, thanh] of doi) { assert.ok(src.includes(tu), `bản sao ${t}: không thấy «${tu.slice(0, 60)}»`); src = src.replace(tu, thanh); }
      writeFileSync(join(PIPE, ten(t)), src); ghi.push(join(PIPE, ten(t)));
    }
    return await fn(await import(pathToFileURL(join(PIPE, ten(tep[0][0]))).href));
  } finally {
    for (const f of ghi) rmSync(f, { force: true });
  }
}

test("KP-AC-4 transform-zalo hai lượt: mọi bài có điểm đúng một phát biểu mỗi trường (kể cả bài Yêu cầu không thành offer), lượt hai 0 thay đổi", async () => {
  await trongGiaoDich(async () => {
    await dungBai(c);
    const { kq: r1 } = await im(() => runTransformZalo(c));
    await kiem4(c);
    const laOffer = (await c.query(`SELECT count(*)::int AS n FROM sale_offers WHERE $1 = ANY(post_ids)`, [`${P}-yeucau`])).rows[0].n;
    assert.equal(laOffer, 0, "bài Yêu cầu thành offer — ca không còn đo «không thành offer vẫn có phát biểu»");
    assert.ok(r1.kev.inserted >= 5, `lượt một thêm ${r1.kev.inserted}`);
    const { kq: r2 } = await im(() => runTransformZalo(c));
    assert.deepEqual([r2.kev.inserted, r2.kev.retracted], [0, 0], "lượt hai thêm/rút dòng sống");
    await kiem4(c);
    // Lượt sau Kev chỉ còn ý định (kind trống): phát biểu kind cũ giữ nguyên — khoá replaceOwn có trường.
    await c.query(`UPDATE stg_zalo_posts SET kev_kind = NULL, kev_kind_p = NULL WHERE post_id = $1`, [`${P}-ban`]);
    const { kq: r3 } = await im(() => runTransformZalo(c));
    assert.equal(r3.kev.retracted, 0, "kind bị rút khi lượt sau chỉ có ý định");
    await kiem4(c);
  });
});

test("KP-AC-4c Kev đổi ý cho cùng bài: phát biểu cũ rút 'thay-boi-luot', đúng một phát biểu sống", async () => {
  await trongGiaoDich(async () => {
    await dungBai(c);
    await im(() => runTransformZalo(c));
    await c.query(`UPDATE stg_zalo_posts SET kev_intent = 'inquiry' WHERE post_id = $1`, [`${P}-ban`]);
    const { kq } = await im(() => runTransformZalo(c));
    assert.equal(kq.kev.retracted, 1);
    assert.deepEqual((await phatBieuSong(c)).ban, ["kind=sale", "listing_intent=inquiry"]);
    const rut = (await c.query(`SELECT value, retract_reason FROM field_assertions WHERE subject_key = $1 AND method = 'kev' AND retracted_at IS NOT NULL`,
      [`S03:${P}-ban`])).rows;
    assert.deepEqual(rut, [{ value: "offer", retract_reason: "thay-boi-luot" }]);
  });
});

test("KP-AC-4 đối chứng: transform chỉ ghi phát biểu cho bài thành offer → bài «khách tìm thuê» trượt", async () => {
  await banSao([["transform-zalo.mjs", [["const kev = await ghiPhatBieuKev(client, posts);",
    "const kev = await ghiPhatBieuKev(client, posts.filter((p) => nhom.some((o) => o.postIds.includes(p.post_id))));"]]]], async (m) => {
    await trongGiaoDich(async () => {
      await dungBai(c);
      await im(() => m.runTransformZalo(c));
      await assert.rejects(kiem4(c), (e) => { assert.match(e.message, /yeucau/); return true; });
    });
  });
});

test("KP-AC-4 đối chứng: replaceOwn khoá (chủ thể, phương pháp) bỏ trường → «kind bị rút» khi lượt sau chỉ có ý định", async () => {
  const doiAssert = [["AND fa.field = k.f ", ""], ["x.f = k.f AND ", ""]];
  await banSao([["lib/kev-phat-bieu.mjs", [['from "./assert.mjs"', `from "./assert.kp-db-${process.pid}-${nBan + 1}.mjs"`]]], ["lib/assert.mjs", doiAssert]], async (m) => {
    await trongGiaoDich(async () => {
      await dungBai(c);
      await im(() => runTransformZalo(c));
      await c.query(`UPDATE stg_zalo_posts SET kev_kind = NULL, kev_kind_p = NULL WHERE post_id = $1`, [`${P}-ban`]);
      const { posts } = await loadStgPosts(c, "zalo");
      const { kq } = await im(() => m.ghiPhatBieuKev(c, posts));
      assert.equal(kq.retracted, 1, "bản sao đột biến không rút kind — ca đỏ không ghim được");
      assert.deepEqual((await phatBieuSong(c)).ban, ["listing_intent=offer"], "kind bị rút");
    });
  });
});

/** Tập offer S03 so được: (offer_id, post_ids, kind, price_vnd) + năm cột canonical. */
async function tapOffer(db) {
  const { rows } = await db.query(`SELECT offer_id, post_ids, kind, price_vnd::text, ${VOCAB.enrich_field.join(", ")}
     FROM sale_offers WHERE source = 'S03' ORDER BY offer_id`);
  return rows.map((r) => ({ ...r, post_ids: [...(r.post_ids ?? [])].sort() }));
}
const lechOffer = (a, b) => {
  const k = (x) => JSON.stringify(x);
  const A = new Set(a.map(k)), B = new Set(b.map(k));
  return [...a.filter((x) => !B.has(k(x))), ...b.filter((x) => !A.has(k(x)))].flatMap((x) => x.post_ids);
};
async function kiem5(runT) {
  await trongGiaoDich(async () => {
    await dungBai(c);
    await im(() => runT(c));
    const coKev = await tapOffer(c);
    await c.query(`UPDATE stg_zalo_posts SET kev_p = NULL, kev_intent = NULL, kev_intent_p = NULL, kev_kind = NULL, kev_kind_p = NULL,
                     kev_model = NULL, kev_at = NULL WHERE post_id LIKE $1`, [`${P}-%`]);
    await im(() => runT(c));
    const trang = await tapOffer(c);
    assert.ok(coKev.length > 800, `chỉ ${coKev.length} offer S03`);
    assert.deepEqual(lechOffer(coKev, trang), [], "offer khác nhau giữa có Kev và xoá trắng Kev");
  });
}

test("KP-AC-5 có Kev hay xoá trắng cột Kev: tập offer S03 và năm cột canonical bằng nhau — không tin nào bị loại theo Kev", async () => {
  await kiem5(runTransformZalo);
});

test("KP-AC-5 đối chứng: transform bỏ bài Kev chấm not_listing khỏi luồng offer → lệch đúng bài ấy", async () => {
  await banSao([["transform-zalo.mjs", [
    ['import { ghiPhatBieuKev } from "./lib/kev-phat-bieu.mjs";', 'import { docDiemKev, ghiPhatBieuKev } from "./lib/kev-phat-bieu.mjs";'],
    ['const { posts, rejected } = await loadStgPosts(client, "zalo");',
      'const { posts: _p, rejected } = await loadStgPosts(client, "zalo"); const _k = new Map(((await docDiemKev(client, _p.map((p) => p.post_id))) ?? []).map((r) => [r.post_id, r.kev_intent])); const posts = _p.filter((p) => _k.get(p.post_id) !== "not_listing");'],
  ]]], async (m) => {
    await assert.rejects(kiem5(m.runTransformZalo), (e) => { assert.match(e.message, new RegExp(`${P}-khongtin`)); return true; });
  });
});

test("KP-AC-6 DB chưa áp 057 (xoá bảy cột trong giao dịch): transform chạy hết, offer như cũ, 0 phát biểu Kev, đúng một dòng «chưa áp 057»", async () => {
  await trongGiaoDich(async () => {
    await dungBai(c);
    await c.query("SAVEPOINT co_cot");
    const { kq: co } = await im(() => runTransformZalo(c));
    await c.query("ROLLBACK TO SAVEPOINT co_cot");
    await c.query(`ALTER TABLE stg_zalo_posts ${COT_KEV.map(([t]) => `DROP COLUMN ${t}`).join(", ")}`);
    const { kq, dong } = await im(() => runTransformZalo(c));
    assert.equal(kq.offers, co.offers, "số offer khác lượt có cột");
    assert.equal(kq.kev, null);
    assert.deepEqual(await phatBieuSong(c), {}, "có phát biểu Kev khi thiếu cột");
    assert.equal(dong.filter((d) => d.includes("chưa áp 057")).length, 1, `dòng log «chưa áp 057»: ${dong.join(" | ")}`);
  });
});

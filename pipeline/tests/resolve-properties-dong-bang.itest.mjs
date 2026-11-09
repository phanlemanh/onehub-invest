// resolve-properties-dong-bang.itest.mjs — hồ sơ dong-bang-stage-b-resolve E1 (AC-1): Stage B đóng băng (V7).
// Chạy trên DB của riêng lượt (lược đồ + dữ liệu thật chép từ máy thu), mọi thứ trong MỘT giao dịch ROLLBACK:
//   cd pipeline && bash ../db/db-thu.sh oneinvest_suite_dbs_rs --chay node --test --test-concurrency=1 tests/resolve-properties-dong-bang.itest.mjs
// Đối chứng: bản resolve-properties.mjs của origin/main (git show) chạy trên cùng mồi trong một SAVEPOINT riêng — phép đếm câu
// phải thấy nó chạm property_candidates, và Stage A của hai bản phải ra cùng căn, cùng tin.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";
import { chayResolve, STAGE_B_DONG_BANG } from "../resolve-properties.mjs";

const URL_DB = process.env.DATABASE_URL;
const PIPE = join(import.meta.dirname, "..");
const GOC = join(PIPE, "..");

/** Bản resolve-properties.mjs của origin/main, đặt ở thư mục tạm, import lib trỏ tuyệt đối về pipeline/lib. */
async function banNhanhChinh() {
  const src = execFileSync("git", ["show", "origin/main:pipeline/resolve-properties.mjs"], { cwd: GOC, encoding: "utf8" })
    .replaceAll('from "./lib/', `from "${pathToFileURL(join(PIPE, "lib")).href}/`);
  const dir = mkdtempSync(join(tmpdir(), "dbs-rs-"));
  const f = join(dir, "resolve-main.mjs");
  writeFileSync(f, src);
  // pg của pipeline: tệp tạm không có node_modules cạnh nó.
  writeFileSync(f, src.replace('import pg from "pg";', `import pg from "${pathToFileURL(join(PIPE, "node_modules/pg/lib/index.js")).href}";`));
  const mod = await import(pathToFileURL(f).href);
  return { chay: mod.chayResolve, don: () => rmSync(dir, { recursive: true, force: true }) };
}

const LIST = [9900001, 9900002, 9900003, 9900004, 9900005, 9900006];
const S06 = (id) => `'offer_' || substr(encode(digest('S06|' || ${id}::text, 'sha256'), 'hex'), 1, 16)`;

/** Mồi trong giao dịch: stg S06 chỉ còn 6 dòng của ca (TRUNCATE trong giao dịch, ROLLBACK trả lại), 6 tin S06 ở 3 ô lưới,
 *  3 tin S03 cùng phường đủ điều kiện cặp của luật cũ, 4 cặp cũ đủ bốn trạng thái. */
async function moi(c) {
  const { rows: [p] } = await c.query(`SELECT id FROM areas WHERE region_type <> 'market' AND id LIKE 'vn-%' ORDER BY id LIMIT 1`);
  assert.ok(p, "DB thử không có phường nào");
  const { rows: [snap] } = await c.query(`SELECT snapshot_id FROM stg_chotot_ads LIMIT 1`);
  assert.ok(snap, "DB thử không có dòng stg_chotot_ads nào để mượn snapshot_id");
  await c.query(`TRUNCATE stg_chotot_ads`);
  const toaDo = [[21.0001, 105.8001], [21.0002, 105.8002], [21.0101, 105.8101], [21.0102, 105.8102], [21.0201, 105.8201], [21.0202, 105.8202]];
  for (const [i, l] of LIST.entries()) {
    await c.query(`INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, latitude, longitude)
                   VALUES ($1, 0, 'x', 1010, 's', '{}'::jsonb, $4, $2, $3)`, [l, toaDo[i][0], toaDo[i][1], snap.snapshot_id]);
    await c.query(`INSERT INTO sale_offer_records (offer_id, source, kind, property_type, area_id, area_m2, price_vnd, price_perm2,
                     confidence, first_seen, last_seen)
                   VALUES (${S06("$1::bigint")}, 'S06', 'sale', 'apartment', $2, 60, 3e9, 50e6, 'high', now() - interval '20 days', now())`,
      [l, p.id]);
  }
  for (const [k, m2, gia] of [["a", 60, 3e9], ["b", 62, 3.41e9], ["c", 55, 2.31e9]])
    await c.query(`INSERT INTO sale_offer_records (offer_id, source, kind, property_type, area_id, area_m2, price_vnd, price_perm2,
                     confidence, first_seen, last_seen)
                   VALUES ($1, 'S03', 'sale', 'apartment', $2, $3::numeric, $4::numeric, $4::numeric / $3::numeric, 'high', now() - interval '5 days', now())`,
      [`offer_dbs_s03_${k}`, p.id, m2, gia]);
  const { rows: s06 } = await c.query(`SELECT ${S06("l")} AS id FROM unnest($1::bigint[]) l ORDER BY 1`, [LIST]);
  const cap = [["pending", 0.8], ["needs_llm", 0.95], ["merged", 0.92], ["rejected", 0.85]];
  for (const [i, [st, sc]] of cap.entries())
    await c.query(`INSERT INTO property_candidates (offer_a, offer_b, score, status) VALUES ($1, $2, $3, $4)`,
      [`offer_dbs_s03_${"abca"[i]}`, s06[i].id, sc, st]);
  return { s06: s06.map((r) => r.id) };
}

/** Client ghi lại mọi câu gửi đi. */
const spy = (c) => {
  const cau = [];
  return { cau, query: (sql, params) => { cau.push(String(sql)); return c.query(sql, params); } };
};

const anhCap = async (c) => (await c.query(`SELECT id, offer_a, offer_b, score, signals, status, decided_by FROM property_candidates ORDER BY id`))
  .rows.map((r) => JSON.stringify(r));
/** Stage A của các tin trong ca: căn (khoá ổn định, số bằng chứng) và tin của căn. */
const anhStageA = async (c, ids) => (await c.query(
  `SELECT p.stable_key, p.n_evidence, po.offer_id FROM property_offers po JOIN properties p ON p.id = po.property_id
    WHERE po.offer_id = ANY($1) ORDER BY 1, 3`, [ids])).rows.map((r) => JSON.stringify(r));

const kiemKhongCham = (cau) => {
  const cham = cau.filter((s) => s.includes("property_candidates"));
  if (cham.length) throw new Error("DBS-AC-1 Stage B còn chạm property_candidates");
};

test("DBS-AC-1 Stage B đóng băng: không câu nào chạm property_candidates, cặp cũ nguyên, Stage A như nhánh chính", async () => {
  assert.ok(URL_DB && /\/oneinvest_suite_/.test(URL_DB), `chỉ chạy trên DB của riêng lượt (db-thu --chay), DATABASE_URL=${URL_DB}`);
  const c = new pg.Client({ connectionString: URL_DB });
  await c.connect();
  const cu = await banNhanhChinh();
  try {
    await c.query("BEGIN");
    const { s06 } = await moi(c);
    const truoc = await anhCap(c);
    assert.equal(truoc.length >= 4, true);

    // Bản mới.
    await c.query("SAVEPOINT moi");
    const s = spy(c);
    const out = [];
    await chayResolve(s, { ghi: (d) => out.push(d) });
    kiemKhongCham(s.cau);
    assert.deepEqual(await anhCap(c), truoc, "DBS-AC-1 cặp cũ đổi");
    assert.equal(out.filter((d) => d === STAGE_B_DONG_BANG).length, 1, out.join("\n"));
    assert.equal(STAGE_B_DONG_BANG, "Stage B: đóng băng (V7) — không dựng cặp mới");
    const aMoi = await anhStageA(c, s06);
    assert.equal(aMoi.length, 6, "Stage A phải gắn đủ 6 tin S06 của ca");
    await c.query("ROLLBACK TO SAVEPOINT moi");

    // Bản nhánh chính trên cùng mồi: đối chứng phép đếm câu và Stage A.
    const s2 = spy(c);
    await cu.chay(s2, { ghi: () => {} });
    assert.throws(() => kiemKhongCham(s2.cau), /^Error: DBS-AC-1 Stage B còn chạm property_candidates$/);
    assert.deepEqual(aMoi, await anhStageA(c, s06), "DBS-AC-1 Stage A lệch nhánh chính");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
    cu.don();
  }
});

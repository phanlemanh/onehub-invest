// judge-lo-that.itest.ts — hồ sơ `judge-evidence-du-truong` AC-6 (E6): ngưỡng «gieo lại một lô thẻ» đo trên lô
// needs_llm THẬT của kho local. Chép từ oneinvest CHỈ BẰNG SELECT sang DB thử riêng (tạo đầu tệp, xoá cuối tệp):
// cặp needs_llm, hàng sale_offers của hai tin, thẻ entity_match đang chờ của các cặp đó. Không ghi vào oneinvest.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: node --import tsx --test tests/judge-lo-that.itest.ts
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { queryPair } from "../src/tools/native.js";
import { chamMotLuot } from "../scripts/judge-run.js";
import { COT_QUERY_PAIR, dungSaleOffers, khuonBen, kiemKhuonThe } from "./judge-chung.js";

const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p3_lo_that_${process.pid}`;
const MIG = (f: string) => join(import.meta.dirname, "../../db/migrations", f);
const BON = { street: "street_raw", block: "block_raw", floor: "floor_raw", bathrooms: "bathrooms" } as const;

type Hang = Record<string, unknown>;
let db: pg.Client;
let lo: { caps: Hang[]; tin: Map<string, Hang>; theCu: Hang[] };

before(async () => {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  await admin.end();
  db = new pg.Client({ connectionString: `${SERVER}/${TEN_DB}` });
  await db.connect();
  await dungSaleOffers(db, "JE-AC-6");
  await db.query((await readFile(MIG("029_review_queue.sql"), "utf8")).split("-- Seed")[0]);
  await db.query(await readFile(MIG("052_ai_calls.sql"), "utf8"));

  // chép lô — chỉ SELECT trên oneinvest
  const goc = new pg.Client({ connectionString: `${SERVER}/oneinvest` });
  await goc.connect();
  try {
    const caps = (await goc.query(`SELECT * FROM property_candidates WHERE status = 'needs_llm' ORDER BY offer_a, offer_b`)).rows;
    const ids = [...new Set(caps.flatMap((c) => [c.offer_a, c.offer_b]))];
    const tin = (await goc.query(`SELECT ${COT_QUERY_PAIR.join(", ")} FROM sale_offers WHERE offer_id = ANY($1)`, [ids])).rows;
    const itemIds = caps.flatMap((c) => [`pair:${c.offer_a}|${c.offer_b}`, `pair:${c.offer_b}|${c.offer_a}`]);
    const theCu = (await goc.query(
      `SELECT * FROM review_queue WHERE item_type = 'entity_match' AND status = 'pending' AND item_id = ANY($1)`, [itemIds],
    )).rows;
    lo = { caps, tin: new Map(tin.map((t) => [t.offer_id as string, t])), theCu };
  } finally {
    await goc.end();
  }
  const nap = (bang: string, rows: Hang[]) =>
    db.query(`INSERT INTO ${bang} SELECT * FROM json_populate_recordset(null::${bang}, $1::json)`, [JSON.stringify(rows)]);
  await nap("sale_offers", [...lo.tin.values()]);
  await nap("property_candidates", lo.caps);
  await nap("review_queue", lo.theCu);
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.end();
});

const anhTheCu = async () =>
  new Map((await db.query(`SELECT item_id, evidence->'offer_a' AS a, evidence->'offer_b' AS b FROM review_queue
    WHERE item_type = 'entity_match'`)).rows.map((r) => [r.item_id as string, { a: r.a, b: r.b }]));
const kiemTheCu = (truoc: Map<string, { a: unknown; b: unknown }>, sau: Map<string, { a: unknown; b: unknown }>) => {
  for (const [id, t] of truoc) {
    assert.deepEqual(sau.get(id)?.a, t.a, `JE-AC-6 thẻ cũ bị sửa dữ liệu tin: offer_a (${id})`);
    assert.deepEqual(sau.get(id)?.b, t.b, `JE-AC-6 thẻ cũ bị sửa dữ liệu tin: offer_b (${id})`);
  }
};
/** Giá trị bốn trường của một bên bằng cột của chính tin đó trong hàng đã chép. */
const kiemGiaTri = (ev: Hang, tin: Hang | undefined, ben: string) => {
  assert.ok(tin, `JE-AC-6 thẻ trỏ tin không có trong lô: ${String(ev.offer_id)}`);
  for (const [k, cot] of Object.entries(BON))
    assert.equal(ev[k], tin[cot] ?? null, `JE-AC-6 thẻ sai giá trị: ${ben}.${k} (${String(ev.offer_id)})`);
};

test("JE-AC-6 lô thật — chấm lại giữ thẻ cũ, gieo lại sinh thẻ đủ trường đúng giá trị", async () => {
  assert.ok(lo.caps.length > 0, "JE-AC-6 kho không có cặp needs_llm");
  const deps = { queryPair: (a: string, b: string) => queryPair(a, b, db), recordCall: async () => {}, khongLlm: true };

  // Lượt 1 — thẻ cũ: dữ liệu hai tin không đổi
  const truoc = await anhTheCu();
  await chamMotLuot(db, deps);
  const sau = await anhTheCu();
  kiemTheCu(truoc, sau);

  // Lượt 2 — gieo lại lô trên DB thử
  await db.query(`DELETE FROM review_queue WHERE item_type = 'entity_match'`);
  const dem = await chamMotLuot(db, deps);
  const the = (await db.query(`SELECT item_id, evidence FROM review_queue WHERE item_type = 'entity_match'`)).rows;
  assert.equal(the.length, lo.caps.length, `JE-AC-6 số thẻ mới ${the.length} khác số cặp ${lo.caps.length} (lỗi đọc ${dem.loi})`);
  const mauA = await khuonBen("offer_a");
  const mauB = await khuonBen("offer_b");
  const khacNull: Record<string, number> = { street: 0, block: 0, floor: 0, bathrooms: 0 };
  for (const t of the) {
    kiemKhuonThe(Object.keys(t.evidence.offer_a).sort(), mauA, "JE-AC-6");
    kiemKhuonThe(Object.keys(t.evidence.offer_b).sort(), mauB, "JE-AC-6");
    for (const ben of ["offer_a", "offer_b"]) {
      kiemGiaTri(t.evidence[ben], lo.tin.get(t.evidence[ben].offer_id), ben);
      for (const k of Object.keys(BON)) if (t.evidence[ben][k] !== null) khacNull[k]++;
    }
  }
  console.log(`JE-AC-6 lô: ${lo.caps.length} cặp · ${truoc.size} thẻ cũ giữ nguyên · ${the.length}/${the.length} thẻ mới đủ khuôn · ` +
    `giá trị khác null: ${Object.entries(khacNull).map(([k, n]) => `${k}=${n}`).join(", ")}`);

  // đối chứng đỏ (1): thẻ bỏ khoá 'street'
  const { street: _bo, ...thieu } = the[0].evidence.offer_a;
  assert.throws(() => kiemKhuonThe(Object.keys(thieu).sort(), mauA, "JE-AC-6"), /JE-AC-6 thẻ lệch khuôn: street/);
  // đối chứng đỏ (2): ảnh sau có offer_a bị thay bằng evidence lượt mới
  if (truoc.size > 0) {
    const [id, t] = [...truoc][0];
    const hong = new Map(truoc);
    hong.set(id, { ...t, a: the[0].evidence.offer_a });
    assert.throws(() => kiemTheCu(truoc, hong), /JE-AC-6 thẻ cũ bị sửa dữ liệu tin: offer_a/);
  }
});

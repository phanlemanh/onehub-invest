// judge-roi-kho.itest.ts — hồ sơ `the-ghep-can-tin-roi-kho` AC-9 (E9): rút thẻ có tin rời kho đo trên lô thẻ THẬT của kho
// local. Chép từ oneinvest CHỈ BẰNG SELECT sang DB thử riêng (tạo đầu tệp, xoá cuối tệp): mọi thẻ entity_match, hàng
// sale_offers còn sống của mọi khoá trên thẻ, cặp property_candidates needs_llm. Tập thẻ rời kho kỳ vọng tính trước lượt
// chạy bằng một câu SELECT riêng trên oneinvest. Không ghi vào oneinvest.
// Tệp nằm ngoài glob tests/*.test.ts — CI (DB trống) không chạy; chạy: node --import tsx --test tests/judge-roi-kho.itest.ts
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import { queryPair } from "../src/tools/native.js";
import { chamMotLuot } from "../scripts/judge-run.js";
import { COT_QUERY_PAIR, dungSaleOffers } from "./judge-chung.js";

const SERVER = process.env.SCA_PG_SERVER ?? "postgres://oneinvest:oneinvest@localhost:5433";
const TEN_DB = `oneinvest_p3_roi_kho_${process.pid}`;
const MIG = (f: string) => join(import.meta.dirname, "../../db/migrations", f);
const khoa = (itemId: string) => String(itemId).match(/^pair:(.+)\|(.+)$/)!.slice(1, 3);

type Hang = Record<string, any>;
let db: pg.Client;
let lo: { the: Hang[]; tin: Hang[]; caps: Hang[]; roiKho: Set<string> };

before(async () => {
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.query(`CREATE DATABASE ${TEN_DB}`);
  await admin.end();
  db = new pg.Client({ connectionString: `${SERVER}/${TEN_DB}` });
  await db.connect();
  await dungSaleOffers(db, "RK-AC-9");
  await db.query((await readFile(MIG("029_review_queue.sql"), "utf8")).split("-- Seed")[0]);
  await db.query(await readFile(MIG("052_ai_calls.sql"), "utf8"));
  await db.query(await readFile(MIG("018_ops_audit.sql"), "utf8"));

  // chép lô — chỉ SELECT trên oneinvest
  const goc = new pg.Client({ connectionString: `${SERVER}/oneinvest` });
  await goc.connect();
  try {
    const the = (await goc.query(`SELECT * FROM review_queue WHERE item_type = 'entity_match' ORDER BY id`)).rows;
    const ids = [...new Set(the.flatMap((t) => khoa(t.item_id)))];
    const tin = (await goc.query(`SELECT ${COT_QUERY_PAIR.join(", ")} FROM sale_offers WHERE offer_id = ANY($1)`, [ids])).rows;
    const caps = (await goc.query(`SELECT * FROM property_candidates WHERE status = 'needs_llm' ORDER BY id`)).rows;
    const capIds = [...new Set(caps.flatMap((c) => [c.offer_a, c.offer_b]))].filter((k) => !ids.includes(k));
    const tinCap = capIds.length
      ? (await goc.query(`SELECT ${COT_QUERY_PAIR.join(", ")} FROM sale_offers WHERE offer_id = ANY($1)`, [capIds])).rows
      : [];
    // tập kỳ vọng — câu riêng, không đọc lại từ DB thử
    const roi = (await goc.query(
      `SELECT r.item_id FROM review_queue r WHERE r.item_type = 'entity_match' AND EXISTS (
         SELECT 1 FROM unnest(regexp_match(r.item_id, '^pair:(.+)\\|(.+)$')) k
          WHERE NOT EXISTS (SELECT 1 FROM sale_offers s WHERE s.offer_id = k))`,
    )).rows;
    lo = { the, tin: [...tin, ...tinCap], caps, roiKho: new Set(roi.map((r) => r.item_id as string)) };
  } finally {
    await goc.end();
  }
});

after(async () => {
  await db?.end();
  const admin = new pg.Client({ connectionString: `${SERVER}/postgres` });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEN_DB}`);
  await admin.end();
});

/** Nạp lại lô vào DB thử; `datLai` → mọi thẻ về chờ (nhánh b). */
async function napLo(datLai: boolean) {
  await db.query(`TRUNCATE review_queue, property_candidates, sale_offers, ops_audit, ai_calls RESTART IDENTITY CASCADE`);
  const nap = (bang: string, rows: Hang[]) =>
    db.query(`INSERT INTO ${bang} SELECT * FROM json_populate_recordset(null::${bang}, $1::json)`, [JSON.stringify(rows)]);
  await nap("sale_offers", lo.tin);
  await nap("property_candidates", lo.caps);
  await nap("review_queue", lo.the);
  if (datLai)
    await db.query(`UPDATE review_queue SET status = 'pending', decided_by = NULL, decided_at = NULL, decision_note = NULL
      WHERE item_type = 'entity_match'`);
}
const deps = { queryPair: (a: string, b: string) => queryPair(a, b, db), recordCall: async () => {}, khongLlm: true };
const tatCa = async () => (await db.query(`SELECT * FROM review_queue WHERE item_type = 'entity_match' ORDER BY id`)).rows;
const choRoiKho = (rows: Hang[]) => rows.filter((t) => t.status === "pending" && lo.roiKho.has(t.item_id));
const kiemKhongCho = (rows: Hang[]) => {
  const con = choRoiKho(rows);
  assert.equal(con.length, 0, `RK-AC-9 thẻ rời kho còn chờ: ${con[0]?.item_id}`);
};

test("RK-AC-9 lô thật", async (t) => {
  if (lo.roiKho.size === 0) return t.skip("kho không có thẻ entity_match nào có bên rời kho");

  // (a) nguyên trạng
  await napLo(false);
  const truocA = await tatCa();
  const choTruoc = choRoiKho(truocA).length;
  await chamMotLuot(db, deps);
  const sauA = await tatCa();
  kiemKhongCho(sauA);
  const daQuyet = truocA.filter((x) => x.status !== "pending");
  for (const x of daQuyet) {
    const y = sauA.find((s) => s.id === x.id)!;
    assert.deepEqual([y.status, y.decided_by], [x.status, x.decided_by], `RK-AC-9 thẻ đã quyết bị đổi: ${x.item_id}`);
  }
  console.log(`RK-AC-9 (a) nguyên trạng: ${truocA.length} thẻ · ${choTruoc} thẻ chờ trỏ tin rời kho trước lượt → 0 sau lượt · ` +
    `${daQuyet.length} thẻ đã quyết giữ nguyên`);
  // đối chứng đỏ (a)
  const dau = sauA.find((x) => lo.roiKho.has(x.item_id))!;
  assert.throws(() => kiemKhongCho(sauA.map((x) => (x.id === dau.id ? { ...x, status: "pending" } : x))),
    new RegExp(`RK-AC-9 thẻ rời kho còn chờ: ${dau.item_id.replace(/[|]/g, "\\|")}`));

  // (b) dựng — mọi thẻ về chờ
  await napLo(true);
  await chamMotLuot(db, deps);
  const sauB = await tatCa();
  const au = (await db.query(`SELECT detail FROM ops_audit WHERE action = 'review-queue:rut-roi-kho'`)).rows;
  for (const x of sauB) {
    if (lo.roiKho.has(x.item_id)) {
      assert.equal(x.status, "deferred", `RK-AC-9 thẻ rời kho chưa rút: ${x.item_id}`);
      assert.ok(String(x.decision_note).startsWith("tin rời kho"), `RK-AC-9 thiếu lý do: ${x.item_id}`);
      assert.equal(au.filter((r) => String(r.detail.review_id) === String(x.id)).length, 1, `RK-AC-9 audit lệch: ${x.item_id}`);
    } else assert.equal(x.status, "pending", `RK-AC-9 thẻ sống bị rút: ${x.item_id}`);
  }
  kiemKhongCho(sauB);
  const n1 = (await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n;
  const dem2 = await chamMotLuot(db, deps);
  assert.equal(dem2.rut, 0);
  assert.equal((await db.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n, n1);
  const k = sauB.filter((x) => lo.roiKho.has(x.item_id)).length;
  console.log(`RK-AC-9 (b) dựng: ${sauB.length} thẻ · ${k} rời kho rút · ${sauB.length - k} sống giữ · lượt 2 rút ${dem2.rut}`);
  // đối chứng đỏ (b)
  const dauB = sauB.find((x) => lo.roiKho.has(x.item_id))!;
  assert.throws(() => kiemKhongCho(sauB.map((x) => (x.id === dauB.id ? { ...x, status: "pending" } : x))),
    new RegExp(`RK-AC-9 thẻ rời kho còn chờ: ${dauB.item_id.replace(/[|]/g, "\\|")}`));
});

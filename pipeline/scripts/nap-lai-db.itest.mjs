// nap-lai-db.itest.mjs — PL14 nạp lại không xoá (ND-AC-n ↔ _acceptance/nap-lai-khong-xoa/evals.yaml).
// Cần DB local :5433. Mọi ca trong BEGIN … ROLLBACK; ca cuối so pg_constraint/relkind trước-sau để chứng DB thật không đổi.
// Ca chạy được cả khi DB đã áp 044 (áp lại = kiểm idempotent) lẫn khi chưa (áp lần đầu).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = join(PIPE, "..");
const MIG = readFileSync(join(ROOT, "db/migrations/044_nap_lai_khong_xoa.sql"), "utf8");
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

let c;
before(async () => { c = new pg.Client({ connectionString: DB_URL }); await c.connect(); });
after(async () => { await c.end(); });

export async function trongGiaoDich(client, fn) {
  await client.query("BEGIN");
  try { return await fn(); } finally { await client.query("ROLLBACK"); }
}
const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const relkind = async (name) => (await one("SELECT relkind FROM pg_class WHERE oid = to_regclass($1)", [name]))?.relkind ?? null;
const sha = (rows) => createHash("sha256").update(rows.map((r) => Object.values(r)[0]).sort().join("\n")).digest("hex");
/** Tên thật của bảng tin / listing ở trạng thái hiện tại của DB (trước hay sau 044). */
const bangTin = async () => ((await relkind("sale_offer_records")) ? "sale_offer_records" : "sale_offers");
const bangListing = async () => ((await relkind("listing_records")) ? "listing_records" : "listings");

// Ma trận viết trước: 6 khoá ngoại phải trỏ bảng bản ghi và là RESTRICT.
const FK = [
  ["nights", "nights_listing_id_fkey", "listing_records"],
  ["listing_stats", "listing_stats_listing_id_fkey", "listing_records"],
  ["property_offers", "property_offers_offer_id_fkey", "sale_offer_records"],
  ["property_candidates", "property_candidates_offer_a_fkey", "sale_offer_records"],
  ["property_candidates", "property_candidates_offer_b_fkey", "sale_offer_records"],
  ["enrichment_proposals", "enrichment_proposals_offer_id_fkey", "sale_offer_records"],
];
// Chỉ hai view sống đọc thẳng bảng bản ghi; mọi view khác (thước giá) phải đi qua view sống.
const PHU_THUOC_CHO_PHEP = ["listings", "sale_offers"];

async function viewPhuThuoc() {
  const { rows } = await c.query(
    `SELECT DISTINCT v.relname FROM pg_depend d
       JOIN pg_rewrite r ON r.oid = d.objid
       JOIN pg_class v ON v.oid = r.ev_class
      WHERE d.refobjid IN ('sale_offer_records'::regclass, 'listing_records'::regclass)
        AND v.relname NOT IN ('sale_offer_records','listing_records')
      ORDER BY 1`);
  return rows.map((r) => r.relname);
}

let truoc;
test("ND-AC-1 áp 044 (hai lần): bảng bản ghi + view sống, 6 FK RESTRICT, CHECK lý do, thước giá, phụ thuộc đúng tập", async () => {
  truoc = { tin: await relkind("sale_offers"), listing: await relkind("listings"), fk: (await c.query(
    "SELECT conname, confdeltype FROM pg_constraint WHERE conname = ANY($1) ORDER BY 1", [FK.map((f) => f[1])])).rows };
  await trongGiaoDich(c, async () => {
    await c.query(MIG);
    assert.equal(await relkind("sale_offer_records"), "r");
    assert.equal(await relkind("listing_records"), "r");
    assert.equal(await relkind("sale_offers"), "v", "sale_offers phải là VIEW");
    assert.equal(await relkind("listings"), "v", "listings phải là VIEW");
    for (const [tbl, con, cha] of FK) {
      const r = await one(
        "SELECT confrelid::regclass::text AS cha, confdeltype FROM pg_constraint WHERE conname = $1 AND conrelid = $2::regclass", [con, tbl]);
      assert.ok(r, `thiếu khoá ngoại ${con}`);
      assert.equal(r.cha, cha, `${con} phải trỏ ${cha}`);
      assert.equal(r.confdeltype, "r", `${con} phải RESTRICT`);
    }
    await c.query("SAVEPOINT s");
    await assert.rejects(
      c.query("UPDATE sale_offer_records SET retired_reason = 'khac' WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records)"),
      /sale_offer_records_retired_reason_chk/);
    await c.query("ROLLBACK TO SAVEPOINT s");
    await c.query("UPDATE sale_offer_records SET retired_reason = 'doi_khoa' WHERE offer_id = (SELECT min(offer_id) FROM sale_offer_records)");
    await c.query("SELECT count(*) FROM v_ruler_p2");
    await c.query("SELECT count(*) FROM v_ruler_p2_area");
    assert.deepEqual(await viewPhuThuoc(), PHU_THUOC_CHO_PHEP);
    for (const v of ["v_ruler_p2", "v_ruler_p2_area"]) {
      const r = await one(`SELECT count(*)::int AS n FROM pg_depend d JOIN pg_rewrite r ON r.oid = d.objid
        WHERE r.ev_class = $1::regclass AND d.refobjid = 'sale_offers'::regclass`, [v]);
      assert.ok(r.n > 0, `${v} phải đọc qua view sống sale_offers`);
    }
    const n = (await one("SELECT count(*)::int AS n FROM sale_offer_records")).n;
    await c.query(MIG);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offer_records")).n, n, "áp lần hai đổi số dòng");
  });
});

test("ND-AC-1 đối chứng: view phụ tạo trước 044 trên sale_offers bị bắt, nêu tên", async () => {
  await trongGiaoDich(c, async () => {
    if ((await relkind("sale_offers")) === "v") {
      // DB đã áp 044: dựng view phụ trên bảng bản ghi để giả lập view cũ bị RENAME kéo theo
      await c.query("CREATE VIEW v_thu_phu AS SELECT offer_id FROM sale_offer_records");
    } else {
      await c.query("CREATE VIEW v_thu_phu AS SELECT offer_id FROM sale_offers");
      await c.query(MIG);
    }
    const ds = await viewPhuThuoc();
    assert.ok(ds.includes("v_thu_phu"), `phải bắt view phụ: ${ds.join(",")}`);
    assert.notDeepEqual(ds, PHU_THUOC_CHO_PHEP);
  });
});

test("ND-AC-2 view sống trả đúng tập khoá như bảng trước 044; đối chứng: cho nghỉ một tin thì view mất đúng khoá đó", async () => {
  await trongGiaoDich(c, async () => {
    const tin0 = sha((await c.query(`SELECT offer_id FROM ${await bangTin()} ${(await relkind("sale_offer_records")) ? "WHERE retired_at IS NULL" : ""}`)).rows);
    const ls0 = sha((await c.query(`SELECT id FROM ${await bangListing()} ${(await relkind("listing_records")) ? "WHERE retired_at IS NULL" : ""}`)).rows);
    await c.query(MIG);
    assert.equal(sha((await c.query("SELECT offer_id FROM sale_offers")).rows), tin0);
    assert.equal(sha((await c.query("SELECT id FROM listings")).rows), ls0);
    const k = (await one("SELECT min(offer_id) AS k FROM sale_offers")).k;
    await c.query("UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = $1", [k]);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offers WHERE offer_id = $1", [k])).n, 0);
    assert.equal((await one("SELECT count(*)::int AS n FROM sale_offer_records WHERE offer_id = $1", [k])).n, 1);
  });
});

test("ND-AC-1 DB thật không đổi sau các ca (relkind + khoá ngoại đọc lại)", async () => {
  assert.equal(await relkind("sale_offers"), truoc.tin);
  assert.equal(await relkind("listings"), truoc.listing);
  assert.deepEqual((await c.query("SELECT conname, confdeltype FROM pg_constraint WHERE conname = ANY($1) ORDER BY 1", [FK.map((f) => f[1])])).rows, truoc.fk);
});

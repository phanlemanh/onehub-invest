// bait-gap-sellers.test.mjs — người bán (sellers) từ SD3 sdt-luu-goc-e164 là VIEW trên bí danh `sdt` + tin (060, Hỏi-C bước 2).
// Giữ lời hứa của PL2 AC-7 (không dòng mồ côi) và SD1 (mọi SĐT trên tin có dòng, cột tổng hợp đúng, tên, payload cloud)
// trên view thay cho bảng ghi tay. BEGIN…ROLLBACK trên Postgres local :5433; mỗi ca dựng lược đồ riêng (bản rỗng của các
// bảng liên quan) rồi nạp 060 vào đó — không chạm dữ liệu dùng chung, không để lại dòng nào. Số trong test là số bịa.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import pg from "pg";

import { sellersThieuNguoi } from "../lib/danh-ba-nguoi.mjs";
import { MIG_060 } from "../lib/nap-060.mjs";
import { refreshBaitGap } from "../refresh-bait-gap.mjs";
import { localReadSql, selectList } from "../sync-cloud.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

// Bảng 060, view sellers, refresh-bait-gap và phép đối chiếu danh bạ chạm tới — chép rỗng sang lược đồ riêng của từng ca.
const BANG = ["sale_offer_records", "registry_aliases", "parties", "ref_lookup", "properties", "property_offers", "ops_audit"];
const SQL_034 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/034_ruler_p2_views.sql"), "utf8");
let soPhong = 0;

/** Lược đồ riêng trong giao dịch: bản rỗng của BANG (cột, mặc định, ràng buộc, chỉ mục cùng tên), view sale_offers như 044,
 * hai view thước của 034; search_path trỏ vào đó trước public. Không giữ khoá nào của bảng dùng chung ngoài ACCESS SHARE lúc
 * chép, không xếp hàng khoá tư vấn 33033 — chạy song song với các bộ khác (app, agent) không phải chờ ca nào. */
async function phongRieng(c) {
  const sc = `bg_sd3_${process.pid}_${++soPhong}`;
  await c.query(`CREATE SCHEMA ${sc}`);
  const defOffers = (await c.query("SELECT pg_get_viewdef('public.sale_offers') AS d")).rows[0].d;
  for (const t of BANG) {
    await c.query(`CREATE TABLE ${sc}.${t} (LIKE public.${t} INCLUDING DEFAULTS INCLUDING CONSTRAINTS INCLUDING GENERATED)`);
    const idx = await c.query(`SELECT pg_get_indexdef(indexrelid) AS d FROM pg_index WHERE indrelid = $1::regclass`, [`public.${t}`]);
    for (const { d } of idx.rows) await c.query(d.replace(` ON public.${t} `, ` ON ${sc}.${t} `));
  }
  await c.query(`SET LOCAL search_path = ${sc}, public`);
  await c.query(`CREATE VIEW sale_offers AS ${defOffers}`);
  await c.query(SQL_034);
  return sc;
}

async function withTx(fn, sql060 = MIG_060) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const sc = await phongRieng(c);
    await c.query(sql060); // 060 (hoặc bản chép đối chứng) dựng view sellers trong lược đồ riêng
    return await fn(c, sc);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const bam = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);
const P = process.pid % 1000;
const SO = (n) => `+8491${String(P).padStart(3, "0")}${String(n).padStart(4, "0")}`;
let soNguoi = 0;

/** Người theo SĐT của nguồn mang bí danh `sdt` (như bộ dựng danh bạ ghi). */
async function nguoi(c, so, source = "S03") {
  const pty = `pty_01HZZZZZZZZZZZZZZZZZZZ${String(++soNguoi).padStart(4, "0")}`;
  await c.query(`INSERT INTO parties (party_key, source) VALUES ($1, $2)`, [pty, source]);
  await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'sdt', $2, $3)`, [pty, so, source]);
  return pty;
}

async function tin(c, id, so, source, at, ten = null) {
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, seller_phone, seller_phone_hash, seller_name, property_type)
     VALUES ($1, $2, 'sale', 'medium', $3, $3, '{}', 'P1', $4, $5, $6, 'unknown')`,
    [`t_sd3_${process.pid}_${id}`, source, at, so, bam(so), ten],
  );
}

const dongCua = async (c, so) =>
  (await c.query(
    `SELECT phone_hash, name, sources, n_ads, first_seen::text fs, last_seen::text ls, flags FROM sellers WHERE phone_hash = $1`,
    [bam(so)],
  )).rows;

const A = SO(1);
const B = SO(2);
const C = SO(3);
/** Lát viết trước: A một tin S03 có tên, B có người mà không tin (mồ côi), C hai tin S03 + S05. */
async function lat(c) {
  for (const [so, s] of [[A, "S03"], [B, "S03"], [C, "S03"], [C, "S05"]]) await nguoi(c, so, s);
  await tin(c, "a1", A, "S03", "2026-10-01T00:00:00Z", "Tên tin A");
  await tin(c, "c1", C, "S03", "2026-10-03T00:00:00Z");
  await tin(c, "c2", C, "S05", "2026-10-05T00:00:00Z");
}

test("SD3 sellers là view sau 060", { timeout: 120_000 }, async () => {
  await withTx(async (c, sc) => {
    const { rows } = await c.query(`SELECT relkind FROM pg_class WHERE relname = 'sellers' AND relnamespace = $1::regnamespace`, [sc]);
    assert.equal(rows[0].relkind, "v");
  });
});

test("AC-7 (PL2) không dòng mồ côi: số có người mà không tin sống không có dòng sellers", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await lat(c);
    assert.equal((await dongCua(c, B)).length, 0, "AC-7 người bán mồ côi còn");
    assert.equal((await dongCua(c, A)).length, 1, "AC-7 người bán còn tin bị mất");
  });
});

async function kiemTongHop(c) {
  await lat(c);
  for (const so of [A, C]) assert.equal((await dongCua(c, so)).length, 1, `SD-AC-1 SĐT trên tin thiếu dòng sellers: ${so.length}`);
  const [cc] = await dongCua(c, C);
  assert.deepEqual([cc.n_ads, [...cc.sources].sort(), cc.flags.multi_channel, cc.flags.n_sale, cc.flags.n_rent],
    [2, ["S03", "S05"], true, 2, 0], "SD-AC-1 cột tổng hợp của C");
  const mm = (await c.query(`SELECT min(first_seen)::text a, max(last_seen)::text b FROM sale_offer_records WHERE seller_phone = $1`, [C])).rows[0];
  assert.deepEqual([cc.fs, cc.ls], [mm.a, mm.b], "SD-AC-1 first/last_seen của C lệch bản ghi tin");
  assert.equal((await dongCua(c, A))[0].name, "Tên tin A", "SD-AC-3 tên không lấy từ tin");
}

test("SD-AC-1/3 mọi SĐT trên tin có một dòng, cột tổng hợp và tên đúng", { timeout: 120_000 }, async () => {
  await withTx((c) => kiemTongHop(c));
});

test("SD-AC-1 đỏ: view bản chép bỏ đếm n_rent → bắt «cột tổng hợp của C»", { timeout: 120_000 }, async () => {
  const sai = MIG_060.replace("'n_sale', so.n_sale, 'n_rent', so.n_rent,", "'n_sale', so.n_sale, 'n_rent', so.n_sale,");
  assert.notEqual(sai, MIG_060);
  // Đối chứng dương: tin C đều là 'sale' nên n_rent đúng = 0; bản chép đặt n_rent = n_sale = 2.
  await withTx((c) => assert.rejects(kiemTongHop(c), /SD-AC-1 cột tổng hợp của C/), sai.replace("CREATE OR REPLACE VIEW sellers", "DROP VIEW IF EXISTS sellers; CREATE VIEW sellers"));
});

test("SD-AC-2 refresh-bait-gap chạy hai lượt không đổi view, không ghi sellers", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await lat(c);
    const r1 = await refreshBaitGap(c);
    const l1 = [await dongCua(c, A), await dongCua(c, C)];
    const r2 = await refreshBaitGap(c);
    assert.deepEqual([await dongCua(c, A), await dongCua(c, C)], l1, "SD-AC-2 lượt hai đổi view");
    assert.equal(r1.sellersRemaining, r2.sellersRemaining);
  });
});

test("SD-AC-7 đối chiếu danh bạ theo SĐT trên tin (bí danh sdt)", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    const z = SO(9);
    await tin(c, "z6", z, "S06", "2026-10-06T00:00:00Z");
    assert.ok((await sellersThieuNguoi(c)).includes(`${bam(z)}:S06`), "SD-AC-7 SĐT trên tin không vào phép đối chiếu");
    await nguoi(c, z, "S06");
    assert.ok(!(await sellersThieuNguoi(c)).includes(`${bam(z)}:S06`), "SD-AC-7 có người mà vẫn báo thiếu");
  });
});

test("SD-AC-8 payload cloud: đủ SĐT trên tin, không cột name, không số gốc", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await lat(c);
    const cols = (await c.query(
      `SELECT column_name AS c FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'sellers' ORDER BY ordinal_position`,
    )).rows.map((r) => r.c);
    const tai = (await c.query(localReadSql("sellers", selectList("sellers", cols).sql))).rows.map((r) => JSON.parse(r.j));
    for (const so of [A, C]) assert.equal(tai.filter((x) => x.phone_hash === bam(so)).length, 1, `SD-AC-8 payload cloud thiếu SĐT`);
    assert.ok(tai.every((x) => !("name" in x)), "SD-AC-8 payload cloud mang cột name");
    assert.ok(!JSON.stringify(tai).includes(A), "SD-AC-8 payload cloud mang số gốc");
  });
});

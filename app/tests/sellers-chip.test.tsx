// sellers-chip.test.tsx — sellers-them-dong-lai (SD1) AC-6: sau bước đêm (bait gap + dựng danh bạ), mọi tin Căn giá tốt có
// SĐT người bán có số tin của người bán (chip môi giới). dealsSql THẬT của app trên DB máy thu, trong BEGIN…ROLLBACK — không
// để lại dòng nào. Từ SD3 (060) `sellers` là view trên bí danh `sdt` + tin: nạp 060 trong giao dịch khi DB chưa áp.
// Chiều đỏ: bản chép 060 nối view theo khoá băm đời trước (bí danh sdt_bam) — SĐT mới mất dòng người bán.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import pg from "pg";

import { dealsSql, THUOC_CUNG_LOAI } from "../src/lib/deals";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const PIPE = join(import.meta.dirname, "../../pipeline");

type BuocDem = { buocDem: (c: pg.Client, o: { savepoint?: boolean; runId?: string }) => Promise<unknown> };
type Nap060 = { MIG_060: string; napSdtE164: (c: pg.Client, sql?: string) => Promise<boolean> };

async function withTx<T>(sql060: string | undefined, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const nap = (await import(pathToFileURL(join(PIPE, "lib/nap-060.mjs")).href)) as Nap060;
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await nap.napSdtE164(c, sql060 ?? nap.MIG_060);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

/** Bản đột biến của view sellers trong 060: nối bí danh theo khoá băm như đời trước, không theo số gốc. Dựng ở lược đồ riêng của ca:
 *  DDL trên `public.sellers` giữ khoá độc quyền trong giao dịch, deadlock với test đọc cùng lúc trên cùng DB (đo S4 05/11). */
async function banNoiKhoaBam(): Promise<string> {
  const { MIG_060 } = (await import(pathToFileURL(join(PIPE, "lib/nap-060.mjs")).href)) as Nap060;
  const view = MIG_060.slice(MIG_060.indexOf("CREATE OR REPLACE VIEW sellers"));
  const ma = view.replace("JOIN sdt ON sdt.value = so.seller_phone", "JOIN sdt ON sdt.value = so.h");
  assert.notEqual(ma, view, "đột biến không đổi mã — chiều đỏ rỗng");
  const sc = `sd6_${process.pid}`;
  return `CREATE SCHEMA ${sc}; SET LOCAL search_path = ${sc}, public; ${ma}`;
}

/** Một tin Căn giá tốt mang SĐT mới (chưa có người), ở phường có thước — bảo đảm chiều đỏ không rỗng trên mọi dữ liệu.
 *  `suy`: số suy qua người đăng (dấu `s03-qua-nguoi-dang` của 079 → `seller_phone_inferred` = true). */
async function tinMoi(c: pg.Client, suy = false, soSan?: string): Promise<string> {
  // Cặp phường × loại hình có thước — đúng thước dealsSql nối (THUOC_CUNG_LOAI); loại hình «unknown» không bao giờ vào danh sách.
  const r = (await c.query(`${THUOC_CUNG_LOAI} ORDER BY area_id, property_type LIMIT 1`)).rows[0];
  assert.ok(r, "SD-AC-6 không cặp phường × loại hình nào có thước (v_ruler_p2 rỗng) — ca không chạy được");
  const id = `t_sd1_chip_${suy ? (soSan ? "suy_trung_" : "suy_") : ""}${process.pid}`;
  const so = soSan ?? `+849${suy ? "1" : "0"}${String(process.pid % 1e7).padStart(7, "0")}`;
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, confidence, first_seen, last_seen, post_ids,
       price_tier, property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts, seller_phone, seller_phone_hash,
       field_provenance, bait_gap_pct)
     VALUES ($1, $1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', $7, $2, 80, 2, $8::bigint, $3::numeric, 1, $4, $5, $6::jsonb, $9::numeric)`,
    [id, r.area_id, Math.round(Number(r.m) * 0.8), so, createHash("sha256").update(so).digest("hex").slice(0, 32),
      JSON.stringify(suy ? { seller_phone: { rule_id: "s03-qua-nguoi-dang" } } : {}), r.property_type, Math.round(Number(r.m) * 0.8) * 80,
      // Tin số thật: bước đêm tự tính bait_gap_pct. Tin số suy cấy sau bước đêm nên tự mang mức giảm 20% (đúng giá 0.8 × thước).
      suy ? 20 : null],
  );
  return id;
}

type DongDeal = { offer_id: string; seller_phone: string | null; broker_n_ads: number | string | null };
/** Theo tin: số suy hay không, và số tin của SỐ ấy trong danh bạ (sellers theo phone_hash; null khi số chưa có người). */
type TheoTin = Map<string, { suy: boolean; danhBa: number | null }>;

/** Luật hiển thị chip người bán (hồ sơ hai-ca-app-dung-tren-du-lieu-may, GS 22/11). Số THẬT có SĐT → phải có số tin của người
 *  bán. Số SUY (seller_phone_inferred, S03 «s03-qua-nguoi-dang») → số tin bằng đúng số tin của số ấy trong danh bạ nếu số đã có
 *  người (số suy là số của chính người đăng lấy từ bài khác), null nếu chưa — màn hiện «Chưa rõ số tin», không bịa con số.
 *  dealsSql không đọc cột suy, nên ca tự nối cột đó (không sửa dealsSql). */
export function soatAc6(rows: DongDeal[], theo: TheoTin): { that: number; suyCoSo: number; suyNull: number } {
  const coSdt = rows.filter((r) => r.seller_phone != null);
  const lac = coSdt.filter((r) => !theo.has(r.offer_id)).map((r) => r.offer_id);
  assert.deepEqual(lac, [], `SD-AC-6 không đọc được cột số suy của: ${lac.join(", ")}`);
  const that = coSdt.filter((r) => !theo.get(r.offer_id)!.suy);
  const soSuy = coSdt.filter((r) => theo.get(r.offer_id)!.suy);
  const thieu = that.filter((r) => r.broker_n_ads == null).map((r) => r.offer_id);
  assert.deepEqual(thieu, [], `SD-AC-6 tin có SĐT thiếu số tin người bán: ${thieu.join(", ")}`);
  const lech = soSuy.filter((r) => (r.broker_n_ads == null ? null : Number(r.broker_n_ads)) !== theo.get(r.offer_id)!.danhBa).map((r) => r.offer_id);
  assert.deepEqual(lech, [], `SD-AC-6 số suy hiện số tin khác danh bạ của số: ${lech.join(", ")}`);
  return { that: that.length, suyCoSo: soSuy.filter((r) => r.broker_n_ads != null).length, suyNull: soSuy.filter((r) => r.broker_n_ads == null).length };
}

async function docAc6(c: pg.Client, mod: BuocDem): Promise<{ rows: DongDeal[]; theo: TheoTin; ids: { that: string; suyCoNguoi: string; suyMoi: string } }> {
  const that = await tinMoi(c);
  await mod.buocDem(c, { savepoint: true, runId: "sellers-chip" });
  // Số suy cấy SAU bước đêm: bước gán số qua người đăng rút số suy không có Người làm căn cứ (gan-sdt-qua-nguoi «rut»), và
  // danh bạ không dựng người TỪ tin số suy (TIN_VAO_DANH_BA). Một dòng trùng số của tin thật (số đã có người → có số tin), một
  // dòng số mới (chưa có người → null).
  const soThat = (await c.query("SELECT seller_phone FROM sale_offer_records WHERE offer_id = $1", [that])).rows[0].seller_phone as string;
  const ids = { that, suyCoNguoi: await tinMoi(c, true, soThat), suyMoi: await tinMoi(c, true) };
  // Không trần 500: tin tự cấy (giảm 20%) phải có mặt dù dữ liệu máy có nhiều tin giảm sâu hơn — trần 500 từng che mất 163 tin.
  const rows = (await c.query(dealsSql(), [0, 1_000_000])).rows as DongDeal[];
  const { rows: s } = await c.query(
    `SELECT o.offer_id, coalesce(o.seller_phone_inferred, false) AS suy, sel.n_ads
       FROM sale_offers o LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash
      WHERE o.offer_id = ANY($1::text[])`, [rows.map((r) => r.offer_id)]);
  const theo: TheoTin = new Map(s.map((r: { offer_id: string; suy: boolean; n_ads: number | null }) => [r.offer_id, { suy: r.suy, danhBa: r.n_ads == null ? null : Number(r.n_ads) }]));
  for (const id of Object.values(ids)) assert.ok(rows.some((r) => r.offer_id === id), `SD-AC-6 tin tự cấy ${id} không vào dealsSql — probe không đo được`);
  return { rows, theo, ids };
}

async function kiemAc6(c: pg.Client, mod: BuocDem) {
  const { rows, theo, ids } = await docAc6(c, mod);
  assert.equal(theo.get(ids.that)?.suy, false, "SD-AC-6 tin tự cấy số thật bị đọc là số suy");
  assert.equal(theo.get(ids.suyCoNguoi)?.suy, true, "SD-AC-6 tin tự cấy số suy không mang seller_phone_inferred");
  const kq = soatAc6(rows, theo); // soát toàn dữ liệu trước — thông điệp của luật đứng trước thông điệp của dòng tự cấy
  const r = (id: string) => rows.find((x) => x.offer_id === id)!;
  assert.ok(r(ids.suyCoNguoi).broker_n_ads != null, "SD-AC-6 số suy trùng số đã có người mà không hiện số tin");
  assert.equal(r(ids.suyMoi).broker_n_ads, null, "SD-AC-6 số suy mới (chưa có người) mà hiện số tin");
  return kq;
}

test("SD-AC-6 chip Căn giá tốt có số tin người bán", { timeout: 180_000 }, async (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật và thước phường — CI chỉ có lược đồ");
  const that = (await import(pathToFileURL(join(PIPE, "refresh-bait-gap.mjs")).href)) as BuocDem;
  const n = await withTx(undefined, (c) => kiemAc6(c, that));
  console.log(`SD-AC-6 số thật ${n.that}, số suy có số tin ${n.suyCoSo}, số suy null ${n.suyNull}`);
  assert.ok(n.that > 0 && n.suyCoSo > 0 && n.suyNull > 0, `SD-AC-6 thiếu một nhóm (${JSON.stringify(n)}) — probe không đo được`);
  // Chiều đỏ (số thật): view sellers nối theo khoá băm đời trước — SĐT mới mất dòng người bán.
  const sai = await banNoiKhoaBam();
  await withTx(sai, (c) => assert.rejects(kiemAc6(c, that), /SD-AC-6 tin có SĐT thiếu số tin người bán/));
  // Chiều đỏ (số suy): cùng dữ liệu thật, tin số suy mới được gán số tin như thể chip bịa con số cho số chưa có người.
  await withTx(undefined, async (c) => {
    const { rows, theo, ids } = await docAc6(c, that);
    const pha = rows.map((r) => (r.offer_id === ids.suyMoi ? { ...r, broker_n_ads: 3 } : r));
    assert.throws(() => soatAc6(pha, theo), /SD-AC-6 số suy hiện số tin khác danh bạ của số: .*t_sd1_chip_suy_/);
  });
});

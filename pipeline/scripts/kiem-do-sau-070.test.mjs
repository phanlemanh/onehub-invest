// kiem-do-sau-070.test.mjs — hồ sơ kiem-do-sau-ap-070-sua: kiểm n3 không đỏ giả với số ghép S06, và nạp lại migration cũ chạy được
// sau khi view có cột của 070. Ca DB chạy BEGIN…ROLLBACK trên Postgres local :5433, mỗi ca một lược đồ riêng; không chạm public.
// Mọi SĐT là số bịa. Mỗi phép đo có ca đỏ trên cùng fixture, ghim thông điệp.
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { docDuLieu, SQL_N3, tinhSo, veDong, xepTrangThai } from "../do-danh-ba-sdt.mjs";
import { ganSdtS06 } from "../gan-sdt-s06.mjs";
import { dungNguoi, RULE_TRUC_TIEP, TIN_VAO_DANH_BA } from "../lib/danh-ba-nguoi.mjs";
import { luocDoRieng } from "../lib/luoc-do-rieng.mjs";
import { nap068 } from "../lib/nap-068.mjs";
import { nap070 } from "../lib/nap-070.mjs";
import { CAU_VIEW_SONG, sqlNapLai } from "../lib/nap-view-song.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");

const BANG = ["stg_chotot_ads", "stg_zalo_posts", "sale_offer_records", "field_assertions", "ops_audit", "parties", "registry_aliases", "registry_events", "party_roles"];
const yen = { out: () => {} };
const bam = (so) => createHash("sha256").update(so).digest("hex").slice(0, 32);

/** View của public dựng lại trong lược đồ riêng: lấy định nghĩa khi search_path chỉ có public để tên bảng không gắn lược đồ. */
async function chepView(c, sc, ten) {
  await c.query("SET LOCAL search_path = public");
  const { rows } = await c.query("SELECT pg_get_viewdef($1::regclass) AS d", [`public.${ten}`]);
  await c.query(`SET LOCAL search_path = ${sc}, public`);
  await c.query(`CREATE VIEW ${sc}.${ten} AS ${rows[0].d}`);
}

/** Hàm phân xử chép vào lược đồ riêng: 068 sửa hàm theo search_path, không có bản riêng thì nó ghi đè hàm public trong giao dịch này. */
async function chepHamPhanXu(c, sc) {
  const { rows } = await c.query(`SELECT pg_get_functiondef('public.resolve_offer_fields(text[])'::regprocedure) AS d`);
  await c.query(rows[0].d.replace("public.resolve_offer_fields", `${sc}.resolve_offer_fields`));
}

async function trongLuocDo(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    const sc = await luocDoRieng(c, BANG, { tienTo: "kd" });
    return await fn(c, { sc });
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const voiDanhBa = (fn) => trongLuocDo(async (c, ctx) => {
  await chepView(c, ctx.sc, "sale_offers");
  await chepView(c, ctx.sc, "sellers");
  await chepHamPhanXu(c, ctx.sc);
  await nap068(c);
  await nap070(c);
  await c.query(`INSERT INTO ops_audit (actor, action) VALUES ('test', 'phat-bieu:cat-chuyen')`);
  return fn(c, ctx);
});

async function themTin(c, { id, source = "S06", fp = {}, so = null, tk = null }) {
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, first_seen, last_seen, source, originating_system_key, field_provenance,
                                     seller_phone, seller_phone_hash, seller_ref)
     VALUES ($1, 'sale', now(), now(), $2, $1, $3, $4, $5, $6)`,
    [String(id), source, JSON.stringify(fp), so, so ? bam(so) : null, tk ? `ct:${tk}` : null]);
}

async function themStg(c, { id, tk, so }) {
  await c.query(
    `INSERT INTO stg_chotot_ads (list_id, region_v2, city_code, category, ad_type, payload, snapshot_id, seller, price, size_m2)
     VALUES ($1, 1, 'x', 1010, 's', $2, 'kd', $3, 1000000000, 50)`,
    [id, JSON.stringify({ account_id: String(tk), phone_hidden: false }),
      JSON.stringify(so ? { full_name: "Người bán thử", phone: so } : { full_name: "Người bán thử" })]);
}

// Dấu S06 sinh từ bộ gán thật; mất dấu xoá khoá sau khi gán. S03 không đi nhánh dấu nên chèn thẳng. `n` tách số và tài khoản giữa các ô.
const LOAI = {
  "S06-truc-tiep": async (c, n, so) => { await themTin(c, { id: n, tk: n }); await themStg(c, { id: n, tk: n, so }); },
  "S06-ghep": async (c, n, so) => { await themTin(c, { id: n, tk: n }); await themStg(c, { id: n, tk: n }); await themStg(c, { id: n + 9000, tk: n, so }); },
  "S06-mat-dau": async (c, n, so) => { await LOAI["S06-ghep"](c, n, so); },
  "S06-truc-kem-ghep": async (c, n, so) => {
    await themTin(c, { id: n, tk: n }); await themStg(c, { id: n, tk: n, so });
    await themTin(c, { id: n + 1, tk: n }); await themStg(c, { id: n + 1, tk: n });
  },
  S03: async (c, n, so) => { await themTin(c, { id: n, source: "S03", so }); },
};

async function dungTin(c, o) {
  await LOAI[o.loai](c, o.n, o.so);
  await ganSdtS06(c);
  if (o.loai === "S06-mat-dau") await c.query(`UPDATE sale_offer_records SET field_provenance = field_provenance - 'seller_phone' WHERE offer_id = $1`, [String(o.n)]);
}

const docLuat = async (c, id) => (await c.query(`SELECT field_provenance->'seller_phone'->>'rule_id' AS r FROM sale_offer_records WHERE offer_id = $1`, [String(id)])).rows[0].r;
const biDanh = (c, so, source) => c.query(
  `INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('pty_00000000000000000000000000', 'sdt', $1, $2)`, [so, source]);

/** Đi hết đường thật: docDuLieu → tinhSo → veDong. docDuLieu tự mở và đóng giao dịch, nên bọc client để ca vẫn nằm trong ROLLBACK. */
async function dongN3(c) {
  const boc = { query: (sql, ...x) => (/^(BEGIN|COMMIT|ROLLBACK)/.test(sql) ? Promise.resolve({ rows: [] }) : c.query(sql, ...x)) };
  const dong = veDong(tinhSo(await docDuLieu(boc)));
  return dong.find((d) => d.check_name === "danh-ba-sdt:n3");
}

const CAU_CU = `SELECT (SELECT count(*) FROM sellers)::int AS sellers,
       (SELECT count(DISTINCT seller_phone_hash) FROM sale_offers WHERE seller_phone_hash IS NOT NULL)::int AS sdt`;
const CAU_THIEU_VE_BI_DANH = `SELECT (SELECT count(*) FROM sellers)::int AS sellers,
       (SELECT count(DISTINCT o.seller_phone_hash) FROM sale_offers o WHERE o.seller_phone_hash IS NOT NULL AND ${TIN_VAO_DANH_BA})::int AS sdt`;
const docCau = async (c, sql) => { const { rows: [r] } = await c.query(sql); return { sellers: r.sellers, sdt_tren_tin: r.sdt }; };

// Ma trận viết trước: năm loại tin × có hay chưa có bí danh. Bí danh chèn thẳng, gồm cả ô bộ dựng danh bạ không tự sinh (số đã có bí danh
// rồi chỉ còn tin ghép, vì bí danh không rút).
const MA_TRAN = [
  ["S06-truc-tiep", true, 1, 1, "pass"], ["S06-truc-tiep", false, 0, 1, "fail"],
  ["S06-ghep", true, 1, 1, "pass"], ["S06-ghep", false, 0, 0, "pass"],
  ["S06-mat-dau", true, 1, 1, "pass"], ["S06-mat-dau", false, 0, 0, "pass"],
  ["S06-truc-kem-ghep", true, 1, 1, "pass"], ["S06-truc-kem-ghep", false, 0, 1, "fail"],
  ["S03", true, 1, 1, "pass"], ["S03", false, 0, 1, "fail"],
].map(([loai, co, sellers, sdt, status], i) => ({ loai, co, sellers, sdt, status, n: 700 + i * 10, so: `+849000007${String(i).padStart(2, "0")}` }));

test("KD-AC-1 ma trận 10 ô đi hết đường thật tới danh-ba-sdt:n3", async () => {
  await voiDanhBa(async (c) => {
    assert.equal(MA_TRAN.length, 10, "KD-AC-1 bảng phải đủ 10 ô");
    let daKiem = 0;
    for (const o of MA_TRAN) {
      const ten = `${o.loai} ${o.co ? "có" : "chưa"} bí danh`;
      await c.query("SAVEPOINT o");
      await dungTin(c, o);
      if (o.co) await biDanh(c, o.so, o.loai === "S03" ? "S03" : "S06");
      const n3 = await dongN3(c);
      assert.equal(n3.detail, `sellers=${o.sellers} sdt_tren_tin=${o.sdt}`, `KD-AC-1 ô ${ten} đếm sai`);
      assert.equal(n3.status, o.status, `KD-AC-1 ô ${ten} sai trạng thái`);
      await c.query("ROLLBACK TO SAVEPOINT o");
      daKiem += 1;
    }
    assert.equal(daKiem, 10, "KD-AC-1 phải kiểm đủ 10 ô");
  });
});

test("KD-AC-1 dấu sinh từ bộ gán thật, và hai câu thiếu vế cho đỏ giả trên cùng ô", async () => {
  await voiDanhBa(async (c) => {
    const ghep = MA_TRAN.find((o) => o.loai === "S06-ghep" && !o.co);
    await c.query("SAVEPOINT o");
    await dungTin(c, ghep);
    assert.equal(await docLuat(c, ghep.n), "s06-cung-tai-khoan", "KD-AC-1 tiền đề ô ghép");
    const cu = await docCau(c, CAU_CU);
    assert.equal(xepTrangThai("n3", cu), "fail", "KD-AC-1 đối chứng: câu cũ phải đỏ giả ở ô ghép chưa bí danh");
    await c.query("ROLLBACK TO SAVEPOINT o");

    const conGhep = MA_TRAN.find((o) => o.loai === "S06-ghep" && o.co);
    await dungTin(c, conGhep);
    await biDanh(c, conGhep.so, "S06");
    const thieu = await docCau(c, CAU_THIEU_VE_BI_DANH);
    assert.equal(xepTrangThai("n3", thieu), "fail", "KD-AC-1 đối chứng: thiếu vế bí danh phải đỏ giả ở ô ghép đã có bí danh");
    assert.equal(xepTrangThai("n3", await docCau(c, SQL_N3)), "pass", "KD-AC-1 SQL_N3 phải xanh ở ô đó");

    const hai = MA_TRAN.find((o) => o.loai === "S06-truc-kem-ghep" && !o.co);
    await dungTin(c, hai);
    assert.equal(await docLuat(c, hai.n), RULE_TRUC_TIEP, "KD-AC-1 tiền đề tin trực tiếp");
    assert.equal(await docLuat(c, hai.n + 1), "s06-cung-tai-khoan", "KD-AC-1 tiền đề tin ghép cùng số");
  });
});

test("KD-AC-2 sau khi dựng danh bạ n3 xanh dù có số chỉ trên tin ghép, số mới chưa có bí danh thì đỏ, dựng lại thì xanh", async () => {
  await voiDanhBa(async (c) => {
    for (const o of MA_TRAN.filter((x) => !x.co)) await dungTin(c, o);
    await dungNguoi(c, yen);
    const n3 = await dongN3(c);
    assert.equal(n3.detail, "sellers=3 sdt_tren_tin=3", "KD-AC-2 đếm một lần: trực tiếp, trực tiếp kèm ghép, S03");
    assert.equal(n3.status, "pass", "KD-AC-2 n3 phải xanh sau khi dựng");
    await themTin(c, { id: 999, source: "S03", so: "+84900000999" });
    assert.equal((await dongN3(c)).status, "fail", "KD-AC-2 số mới chưa có bí danh phải làm n3 đỏ");
    await dungNguoi(c, yen);
    assert.equal((await dongN3(c)).status, "pass", "KD-AC-2 dựng lại danh bạ thì xanh");
  });
});

const MIG = ["044_nap_lai_khong_xoa", "045_phat_bieu_va_phan_xu", "059_thoi_gian_hieu_luc", "061_dac_trung_nha"];
const tepMig = (ten) => readFileSync(join(GOC, "db/migrations", `${ten}.sql`), "utf8");

/** View như trước 070: bảng bản ghi không có cột nhãn, nên SELECT * không mang nó. */
const viewCu = async (c, sc) => c.query(`CREATE VIEW ${sc}.sale_offers AS SELECT * FROM ${sc}.sale_offer_records WHERE retired_at IS NULL`);
const coCot = async (c) => (await c.query(
  `SELECT count(*)::int AS n FROM pg_attribute WHERE attrelid = to_regclass('sale_offers') AND attname = 'seller_phone_inferred' AND NOT attisdropped`)).rows[0].n === 1;

test("KD-AC-3 ma trận bốn migration × hai trạng thái view", async () => {
  await trongLuocDo(async (c, { sc }) => {
    await viewCu(c, sc);
    assert.equal(await coCot(c), false, "KD-AC-3 tiền đề: view cũ chưa có cột");
    for (const ten of MIG) {
      const sql = tepMig(ten);
      assert.equal(sql.split(CAU_VIEW_SONG).length, 2, `KD-AC-3 ${ten} phải có đúng một câu view khớp`);
      assert.equal(await sqlNapLai(c, sql), sql, `KD-AC-3 ${ten}: view cũ phải giữ nguyên từng byte`);
    }
    await nap070(c);
    assert.equal(await coCot(c), true, "KD-AC-3 tiền đề: view sau 070 có cột");
    for (const ten of MIG) {
      const sql = tepMig(ten);
      const ra = await sqlNapLai(c, sql);
      assert.ok(!ra.includes(CAU_VIEW_SONG), `KD-AC-3 ${ten}: view sau 070 phải bỏ câu dựng lại`);
      const [dau, cuoi] = sql.split(CAU_VIEW_SONG);
      assert.ok(ra.startsWith(dau) && ra.endsWith(cuoi), `KD-AC-3 ${ten}: phần còn lại phải giữ nguyên`);
    }
  });
});

test("KD-AC-3 chạy thẳng câu view báo lỗi, đi qua sqlNapLai thì không và view còn cột", async () => {
  await trongLuocDo(async (c, { sc }) => {
    await viewCu(c, sc);
    await nap070(c);
    await c.query("SAVEPOINT thang");
    await assert.rejects(c.query(CAU_VIEW_SONG), /cannot drop columns from view/, "KD-AC-3 đối chứng: câu thẳng phải lỗi view");
    await c.query("ROLLBACK TO SAVEPOINT thang");
    await c.query(await sqlNapLai(c, CAU_VIEW_SONG));
    assert.equal(await coCot(c), true, "KD-AC-3 view phải còn cột sau khi nạp");
  });
});

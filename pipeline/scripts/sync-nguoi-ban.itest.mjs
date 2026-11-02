// node --test scripts/sync-nguoi-ban.itest.mjs — cần DB local :5433 (ngoài `npm test`).
// tin-rao-tren-invest E2, E3: che định danh nguồn trong câu đọc của sync, tệp catch-up bốn cột. Chỉ ghi vào lược đồ
// tạm, xoá cuối lượt; khuôn bảng rút từ public bằng LIKE, token và tên trong test đều giả.
import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { schemaUrl } from "./ops-facts-fixture.mjs";
import {
  assertNoSourceNames,
  countMaskedSeller,
  localReadSql,
  maskedSellerWarning,
  scanSourceNames,
  selectList,
} from "../sync-cloud.mjs";

const TOKENS = ["Chợ Mẫu Giả", "nguon-gia-99", "O'Bẫy.*(x)", "Xyz", "Bàntay Giả"];
const COLS = ["offer_id", "kind", "price_vnd", "phuong_raw", "seller_name", "seller_phone"];
const DONG = [
  ["t-ten-ban", "sale", 2_000_000_000, "Phường Một", "Nhà đất CHỢ MẪU GIẢ quận 3", "+84901234567"],
  ["t-ten-lien", "sale", 2_100_000_000, "Phường Một", "chomaugia.vn", "+84901234568"],
  ["t-ten-dau", "sale", 2_200_000_000, "Phường Một", "Team BÀNTAY", "+84901234569"],
  ["t-so-ban", "sale", 2_300_000_000, "Phường Một", "Anh Bình", "nguon-gia-99:0901"],
  ["t-sach", "sale", 2_400_000_000, "Phường Hai", "Nguyễn Thị Ánh  Dương", "+84901234570"],
  ["t-token-ngan-giua-tu", "sale", 2_500_000_000, "Phường Hai", "Bxyzt", "+84901234571"],
  ["t-token-ngan-rieng", "sale", 2_600_000_000, "Phường Hai", "Cò XYZ", "+84901234572"],
  ["t-nhay", "sale", 2_700_000_000, "Phường Hai", "o'bẫy.*(x)", "+84901234573"],
  ["t-rong", "sale", 2_800_000_000, "Phường Hai", null, null],
];

async function voiLuocDo(fn) {
  const admin = new pg.Client({ connectionString: localDbUrl() });
  await admin.connect();
  const S = `tir_sync_${process.pid}_${Date.now()}`;
  const sc = new pg.Client({ connectionString: schemaUrl(S) });
  try {
    await admin.query(`CREATE SCHEMA "${S}"`);
    await admin.query(`CREATE TABLE "${S}".sale_offers (LIKE public.sale_offers)`);
    await sc.connect();
    for (const d of DONG) {
      await sc.query(`INSERT INTO sale_offers (${COLS.join(",")}) VALUES ($1,$2,$3,$4,$5,$6)`, d);
    }
    await fn(sc);
  } finally {
    await sc.end().catch(() => {});
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
    await admin.end();
  }
}

const docDong = async (sc, tokens) => {
  const { sql } = selectList("sale_offers", COLS, [], tokens);
  const { rows } = await sc.query(`${localReadSql("sale_offers", sql)} ORDER BY 1`);
  return rows.map((r) => r.j);
};
const theoMa = (rows) => Object.fromEntries(rows.map((j) => [JSON.parse(j).offer_id, JSON.parse(j)]));

test("E2 câu đọc che tên, số mang định danh; cột khác nguyên; tên sạch giữ từng byte", async () => {
  await voiLuocDo(async (sc) => {
    const r = theoMa(await docDong(sc, TOKENS));
    assert.equal(Object.keys(r).length, DONG.length);
    for (const ma of ["t-ten-ban", "t-ten-lien", "t-token-ngan-rieng", "t-nhay"]) {
      assert.equal(r[ma].seller_name, null, `${ma}: tên phải bị che`);
      assert.match(r[ma].seller_phone, /^\+84/, `${ma}: số không liên quan phải giữ`);
    }
    assert.equal(r["t-ten-ban"].price_vnd, 2_000_000_000);
    assert.equal(r["t-ten-ban"].phuong_raw, "Phường Một");
    assert.equal(r["t-so-ban"].seller_phone, null, "số mang định danh phải bị che");
    assert.equal(r["t-so-ban"].seller_name, "Anh Bình");
    assert.equal(r["t-sach"].seller_name, "Nguyễn Thị Ánh  Dương");
    assert.equal(r["t-ten-dau"].seller_name, null, "từ đầu của tên nhiều từ cũng là định danh");
    assert.equal(r["t-token-ngan-giua-tu"].seller_name, "Bxyzt", "token ngắn giữa từ không phải trúng");
    assert.equal(r["t-rong"].seller_name, null);
  });
});

test("E2 cảnh báo đếm đúng, chỉ có số, không chứa giá trị", async () => {
  await voiLuocDo(async (sc) => {
    const n = await countMaskedSeller(sc, TOKENS);
    assert.deepEqual(n, { name: 5, phone: 1 });
    const canh_bao = maskedSellerWarning(n);
    assert.equal(canh_bao, "che định danh nguồn ở sale_offers: 5 tên, 1 số");
    for (const v of ["CHỢ", "chomaugia", "nguon-gia", "Bình"]) assert.ok(!canh_bao.includes(v));
    assert.equal(maskedSellerWarning({ name: 0, phone: 0 }), null);
  });
});

test("E2 bộ soát thật sạch trên kết quả đã che", async () => {
  await voiLuocDo(async (sc) => {
    const rows = await docDong(sc, TOKENS);
    for (const j of rows) assert.equal(scanSourceNames(j, TOKENS), null);
    assert.doesNotThrow(() => assertNoSourceNames(new Map([["sale_offers", rows]]), TOKENS));
  });
});

test("E2 đối chứng cùng fixture: bỏ che thì bộ soát dừng ở seller_name", async () => {
  await voiLuocDo(async (sc) => {
    const { rows } = await sc.query(localReadSql("sale_offers", COLS.map((c) => `"${c}"`).join(", ")));
    assert.throws(
      () => assertNoSourceNames(new Map([["sale_offers", rows.map((r) => r.j)]]), TOKENS),
      /giá trị mang định danh nguồn \(tầng A\) ở sale_offers\.seller_name/,
    );
  });
});

test("E2 đối chứng: định danh ở phuong_raw không được che, bộ soát thật vẫn dừng", async () => {
  await voiLuocDo(async (sc) => {
    await sc.query(`UPDATE sale_offers SET phuong_raw = 'chợ mẫu giả' WHERE offer_id = 't-sach'`);
    const rows = await docDong(sc, TOKENS);
    assert.throws(
      () => assertNoSourceNames(new Map([["sale_offers", rows]]), TOKENS),
      /giá trị mang định danh nguồn \(tầng A\) ở sale_offers\.phuong_raw/,
    );
  });
});

test("E2 thiếu token: tên, số về NULL hết trên dữ liệu thật của lược đồ", async () => {
  await voiLuocDo(async (sc) => {
    const r = theoMa(await docDong(sc, []));
    for (const d of Object.values(r)) {
      assert.equal(d.seller_name, null);
      assert.equal(d.seller_phone, null);
    }
  });
});

// ─── E3: tệp catch-up bốn cột ─────────────────────────────────────────────
const CATCHUP = new URL("../../docs/ops/cloud-schema-catchup-2026-11-02-tin-rao.sql", import.meta.url);
const BON_COT = ["seller_name", "seller_phone", "stories", "frontage_length"];
const MOC = ["tường lửa", "gộp", "kéo về", "áp", "sync"];

/** Rút khối ĐO TRƯỚC, khối ÁP của tệp; thông điệp ghim khi sai khuôn. */
function docCatchup(text) {
  const iDo = text.indexOf("-- ĐO TRƯỚC");
  const iAp = text.indexOf("-- ÁP");
  assert.ok(iDo > 0 && iAp > iDo, "thiếu khối ĐO TRƯỚC, ÁP");
  const dau = text.slice(0, iDo);
  let truoc = -1;
  for (const m of MOC) {
    const dong = dau.split("\n").findIndex((l) => new RegExp(`^-- \\d\\. ${m}:`, "iu").test(l));
    assert.ok(dong >= 0, `THIEU MOC ${m}`);
    assert.ok(dong > truoc, `SAI THU TU ${m}`);
    truoc = dong;
  }
  const ap = text.slice(iAp).split("\n").filter((l) => !l.startsWith("--")).join("\n");
  for (const cau of ap.split(";").map((x) => x.trim()).filter(Boolean)) {
    assert.match(cau, /^ALTER TABLE public\.sale_offers\s+ADD COLUMN IF NOT EXISTS /i, "CAU CAM");
    assert.doesNotMatch(cau, /\b(DROP|DELETE|UPDATE|TRUNCATE|CREATE)\b/i, "CAU CAM");
  }
  return { doTruoc: text.slice(iDo, iAp), ap };
}

const docTep = async () => (await import("node:fs/promises")).readFile(CATCHUP, "utf8");
const veLuocDo = (sql, S) => sql.replaceAll("public.", `"${S}".`).replaceAll("'public'", `'${S}'`);

test("E3 tệp đúng khuôn: năm mốc đúng thứ tự, khối ÁP chỉ thêm bốn cột", async () => {
  const { ap } = docCatchup(await docTep());
  for (const c of BON_COT) assert.ok(ap.includes(c), `khối ÁP thiếu ${c}`);
  assert.equal(ap.split(";").filter((x) => x.trim()).length, 4);
});

test("E3 đối chứng: đảo hai mốc đỏ, thêm DROP vào bản chép đỏ CAU CAM", async () => {
  const text = await docTep();
  const dong = text.split("\n");
  const i = dong.findIndex((l) => /^-- 1\. tường lửa/iu.test(l));
  const j = dong.findIndex((l) => /^-- 2\. gộp/iu.test(l));
  [dong[i], dong[j]] = [dong[j], dong[i]];
  assert.throws(() => docCatchup(dong.join("\n")), /SAI THU TU/);
  assert.throws(() => docCatchup(`${text}\nDROP TABLE public.sale_offers;\n`), /CAU CAM/);
});

test("E3 chạy trên lược đồ thiếu bốn cột: đo báo thiếu, áp hai lần không lỗi, đo lại báo đủ, số dòng không đổi", async () => {
  const { doTruoc, ap } = docCatchup(await docTep());
  const admin = new pg.Client({ connectionString: localDbUrl() });
  await admin.connect();
  const S = `tir_catchup_${process.pid}_${Date.now()}`;
  try {
    await admin.query(`CREATE SCHEMA "${S}"`);
    await admin.query(`CREATE TABLE "${S}".sale_offers (offer_id text PRIMARY KEY, price_vnd bigint)`);
    await admin.query(`INSERT INTO "${S}".sale_offers VALUES ('a', 1), ('b', 2)`);
    const cauDo = veLuocDo(doTruoc.split("\n").filter((l) => !l.startsWith("--")).join("\n"), S);
    const kiem = async () => (await admin.query(cauDo)).rows[0].kiem;
    assert.match(await kiem(), /thiếu cột/);
    for (const c of BON_COT) assert.ok((await kiem()).includes(c), `đo trước không gọi tên ${c}`);
    await admin.query(veLuocDo(ap, S));
    await admin.query(veLuocDo(ap, S));
    assert.equal(await kiem(), "OK");
    const { rows } = await admin.query(`SELECT count(*)::int AS n FROM "${S}".sale_offers`);
    assert.equal(rows[0].n, 2);
    const kieu = await admin.query(`SELECT column_name AS c, data_type AS t FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'sale_offers'`, [S]);
    const theKieu = Object.fromEntries(kieu.rows.map((r) => [r.c, r.t]));
    const that = await admin.query(`SELECT column_name AS c, data_type AS t FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sale_offers' AND column_name = ANY($1)`, [BON_COT]);
    for (const r of that.rows) assert.equal(theKieu[r.c], r.t, `kiểu ${r.c} lệch local`);
  } finally {
    await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
    await admin.end();
  }
});

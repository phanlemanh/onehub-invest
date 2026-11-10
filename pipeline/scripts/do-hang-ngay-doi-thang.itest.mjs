// do-hang-ngay-doi-thang.itest.mjs — do1-giu-dau-doi-thang (DD-AC-n ↔ _acceptance/do1-giu-dau-doi-thang/evals.yaml E1–E5, E8).
// DO1 nhiều lượt trong ngày lập mốc + lệnh sửa ngày đổi thang. Mỗi ca BEGIN … ROLLBACK trên DB của riêng lượt
// (config:executors.test.do1_dd — db/db-thu.sh … --chay); 087 nạp trong giao dịch khi bản chép chưa có.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { KHOA } from "../bac-du-lieu.mjs";
import { doHangNgay, HOI1, HOI2, suaNgayDoiThang } from "../do-hang-ngay.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SQL_087 = readFileSync(path.join(ROOT, "db/migrations/087_thang_bac_moi.sql"), "utf8");
// Ngày xa để không đụng dòng thật của bản chép (dq_check_results, data_level_change có ngày 2026-11-xx).
const D = "2030-01-10", D_1 = "2030-01-09", D1 = "2030-01-11", D_2 = "2030-01-08", KHAC = "2030-01-20";

let c;
before(async () => {
  if (!process.env.DATABASE_URL) throw new Error("thiếu DATABASE_URL — chạy qua config:executors.test.do1_dd (DB của riêng lượt)");
  c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: [r] } = await c.query("SELECT current_database() AS db");
  if (r.db === "oneinvest") throw new Error("DATABASE_URL trỏ DB oneinvest dùng chung — dùng DB thử");
});
after(async () => {
  await c?.end();
});

async function trongGiaoDich(fn) {
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock($1)", [KHOA]);
    const { rows: [r] } = await c.query("SELECT to_regprocedure('data_level_units()') IS NOT NULL AS co");
    if (!r.co) await c.query(SQL_087);
    return await fn();
  } finally {
    await c.query("ROLLBACK");
  }
}

let dem = 0;
const T = `dd-tst-${process.pid}`;
/** Một tin S03 đủ năm trường lõi (B1) trong bảng bản ghi; trả offer_id. */
async function tin() {
  const { rows: [w] } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' ORDER BY id LIMIT 1");
  const id = `${T}-${++dem}`;
  await c.query(`INSERT INTO sale_offer_records (offer_id, kind, property_type, price_vnd, area_m2, area_id, source,
      originating_system_key, first_seen, last_seen, field_provenance, offer_status)
    VALUES ($1, 'sale', 'apartment', 2000000000, 60, $2, 'S03', $1, now() - interval '1 day', now(), '{}', 'unknown')`, [id, w.id]);
  return id;
}
const giaNull = (id) => c.query("UPDATE sale_offer_records SET price_vnd = NULL WHERE offer_id = $1", [id]);
const giaLai = (id) => c.query("UPDATE sale_offer_records SET price_vnd = 2000000000 WHERE offer_id = $1", [id]);

/** Nền: xoá bảng đơn vị, dòng chuyển, dấu DO1 và ảnh chụp thang mới; `bang` = rong | cu; `ap` = ngày áp (ảnh chụp thang mới). */
async function nen({ bang = "rong", ap = null } = {}) {
  await c.query(`DELETE FROM data_level_unit; DELETE FROM data_level_change;
    DELETE FROM dq_check_results WHERE check_name = 'do1-chuyen-bac';
    DELETE FROM data_level_snapshot WHERE scale = 'thang-0811'`);
  if (bang === "cu") {
    await c.query(`INSERT INTO data_level_unit (unit_key, unit, source, data_level, ke_thieu, core, seen_on, scale) VALUES
      ('can:999999001', 'can', 'S06', 'B2', 'so-do', '{"tin": []}', '2030-01-01', 'thang-2310'),
      ('tin:${T}-cu-1', 'tin_le', 'S03', 'B0', 'truong-loi', '{"tin": []}', '2030-01-01', 'thang-2310')`);
  }
  if (ap) {
    await c.query(`INSERT INTO data_level_snapshot (snap_date, market_id, property_type, unit, data_level, n, scale)
      VALUES ($1, 'chua-ro', 'unknown', 'tin_le', 'B1', 1, 'thang-0811')`, [ap]);
  }
}
/** Dòng do1-chuyen-bac mới nhất của ngày, đọc từ dq_check_results (bên đọc thật của app cũng đọc bảng này). */
async function dongDo1(ngay) {
  const { rows: [r] } = await c.query(
    `SELECT status, detail::jsonb AS d FROM dq_check_results WHERE check_name = 'do1-chuyen-bac' AND detail::jsonb ->> 'ngay' = $1
      ORDER BY checked_at DESC, id DESC LIMIT 1`, [ngay]);
  return r ? { status: r.status, ly_do: r.d.ly_do ?? null, thang: r.d.thang ?? null, don_vi: r.d.don_vi ?? null } : null;
}
const demNgay = async (ngay) => (await c.query("SELECT count(*)::int AS n FROM data_level_change WHERE snap_date = $1", [ngay])).rows[0].n;
const dongTin = async (ngay) => (await c.query(
  "SELECT unit_key, from_level, to_level, huong FROM data_level_change WHERE snap_date = $1 AND unit_key LIKE $2 ORDER BY unit_key",
  [ngay, `tin:${T}%`])).rows.map((r) => [r.unit_key, r.from_level, r.to_level, r.huong]);
const soDonVi = async () => (await c.query("SELECT count(*)::int AS n FROM data_level_unit")).rows[0].n;
const chay = (ngay, o = {}) => doHangNgay(c, { ngay, write: true, ...o });
/** Chèn dòng chuyển có sẵn (code cũ, lượt trước bản sửa) cho một ngày. */
async function chenChuyen(ngay, n, tien = "co-san") {
  for (let i = 1; i <= n; i++) {
    await c.query(`INSERT INTO data_level_change (snap_date, unit_key, unit, source, from_level, to_level, huong, ly_do)
      VALUES ($1, $2, 'tin_le', 'S03', 'B1', 'B0', 'tut', '{truong-loi}')`, [ngay, `tin:${T}-${tien}-${ngay}-${i}`]);
  }
}
const chenDau = (ngay, status, lyDo) => c.query(
  `INSERT INTO dq_check_results (checked_at, check_name, entity, status, detail) VALUES (clock_timestamp(), 'do1-chuyen-bac', 'tat-ca', $1, $2)`,
  [status, JSON.stringify({ ngay, ...(lyDo ? { ly_do: lyDo } : {}) })]);
const THANG_D = { ma: "thang-0811", tu_ngay: D };

// ---- E1 · AC-1 ----
test("DD-AC-1 đổi thang hai lượt: lượt hai giữ dấu doi-thang, 0 dòng chuyển ngày D (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  await trongGiaoDich(async () => {
    await nen({ bang: "cu", ap: D });
    const t = await tin();
    await chay(D);
    await giaNull(t);
    await chay(D);
    assert.deepEqual(await dongDo1(D), { status: "skip", ly_do: "doi-thang", thang: THANG_D, don_vi: await soDonVi() },
      "DD-AC-1 lượt hai mất dấu doi-thang");
    assert.equal(await demNgay(D), 0, "DD-AC-1 ngày đổi thang có dòng chuyển");
    const { rows: [u] } = await c.query("SELECT data_level FROM data_level_unit WHERE unit_key = $1", [`tin:${t}`]);
    assert.equal(u.data_level, "B0", "DD-AC-1 bảng đơn vị không mang bậc lượt hai");
  });
  await trongGiaoDich(async () => {   // chiều đỏ: bỏ nhận ngày lập mốc theo dấu và ngày áp
    await nen({ bang: "cu", ap: D });
    const t = await tin();
    await chay(D);
    await giaNull(t);
    await chay(D, { dotBien: "bo-giu-moc" });
    const r = await dongDo1(D);
    assert.equal(r.status, "pass", "đối chứng đỏ: bỏ giữ mốc mà lượt hai vẫn skip — thước không phân biệt");
    assert.ok(await demNgay(D) > 0, "đối chứng đỏ: bỏ giữ mốc mà không có dòng chuyển");
    assert.throws(() => assert.deepEqual(r.ly_do, "doi-thang", "DD-AC-1 lượt hai mất dấu doi-thang"), /DD-AC-1 lượt hai mất dấu doi-thang/);
  });
});

// ---- E2 · AC-2 ----
test("DD-AC-2 ngày sau so với trạng thái cuối ngày đổi thang (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  await trongGiaoDich(async () => {
    await nen({ bang: "cu", ap: D });
    const t = await tin();
    await chay(D);
    await giaNull(t);
    await chay(D);
    await giaLai(t);
    await chay(D1);
    assert.deepEqual(await dongTin(D1), [[`tin:${t}`, "B0", "B1", "len"]], "DD-AC-2 ngày sau so sai mốc");
    const r = await dongDo1(D1);
    assert.equal(r.status, "pass");
    assert.deepEqual(r.thang, THANG_D);
  });
  await trongGiaoDich(async () => {   // chiều đỏ: ngày D chỉ một lượt → trạng thái cuối D là B1 → D+1 không có dòng của tin
    await nen({ bang: "cu", ap: D });
    const t = await tin();
    await chay(D);
    await giaNull(t);
    await giaLai(t);
    await chay(D1);
    const dong = await dongTin(D1);
    assert.deepEqual(dong, [], "đối chứng đỏ: mốc khác mà vẫn có dòng — thước không phân biệt");
    assert.throws(() => assert.deepEqual(dong, [[`tin:${t}`, "B0", "B1", "len"]], "DD-AC-2 ngày sau so sai mốc"), /DD-AC-2 ngày sau so sai mốc/);
  });
});

// ---- E3 · AC-3 ----
for (const [bien, ap] of [["a ngày áp khác D", KHAC], ["b ngày áp chính là D", D]]) {
  test(`DD-AC-3 lập mốc đầu hai lượt (${bien}): cả hai lượt lap-moc, 0 dòng chuyển`, { timeout: 1_800_000 }, async () => {
    await trongGiaoDich(async () => {
      await nen({ bang: "rong", ap });
      const t = await tin();
      await chay(D);
      assert.deepEqual((await dongDo1(D)).ly_do, "lap-moc", "DD-AC-3 bảng rỗng ngày áp thành doi-thang");
      await giaNull(t);
      await chay(D);
      const r = await dongDo1(D);
      assert.deepEqual([r.status, r.ly_do], ["skip", "lap-moc"], "DD-AC-3 lượt hai mất dấu lap-moc");
      assert.equal(await demNgay(D), 0, "DD-AC-3 ngày lập mốc có dòng chuyển");
    });
  });
}
test("DD-AC-3 chiều đỏ: ngày áp trước bảng rỗng → doi-thang; bỏ giữ mốc → lượt hai pass", { timeout: 1_800_000 }, async () => {
  await trongGiaoDich(async () => {
    await nen({ bang: "rong", ap: D });
    await chay(D, { dotBien: "ngay-ap-truoc-rong" });
    const ly = (await dongDo1(D)).ly_do;
    assert.equal(ly, "doi-thang", "đối chứng đỏ: đột biến thứ tự mà vẫn lap-moc — thước không phân biệt");
    assert.throws(() => assert.deepEqual(ly, "lap-moc", "DD-AC-3 bảng rỗng ngày áp thành doi-thang"), /DD-AC-3 bảng rỗng ngày áp thành doi-thang/);
  });
  await trongGiaoDich(async () => {
    await nen({ bang: "rong", ap: KHAC });
    const t = await tin();
    await chay(D);
    await giaNull(t);
    await chay(D, { dotBien: "bo-giu-moc" });
    const r = await dongDo1(D);
    assert.equal(r.status, "pass", "đối chứng đỏ: bỏ giữ mốc mà lượt hai vẫn skip");
    assert.throws(() => assert.deepEqual([r.status, r.ly_do], ["skip", "lap-moc"], "DD-AC-3 lượt hai mất dấu lap-moc"), /DD-AC-3 lượt hai mất dấu lap-moc/);
  });
});

// ---- E3 · bảng 1 design §2: bảng đơn vị × ngày áp × dấu → nhãn (viết trước, năm hàng) ----
const BANG_1 = [
  { ten: "rỗng × ngày áp = D × không dấu", bang: "rong", ap: D, chuanBi: null, dau: null, nhan: "lap-moc" },
  { ten: "thang cũ × ngày áp khác D × không dấu", bang: "cu", ap: KHAC, chuanBi: null, dau: null, nhan: "doi-thang" },
  { ten: "thang mới × ngày áp = D × không dấu", bang: "rong", ap: D, chuanBi: D_1, dau: null, nhan: "doi-thang" },
  { ten: "thang mới × ngày áp khác D × không dấu", bang: "rong", ap: D_1, chuanBi: D_1, dau: null, nhan: null },
  { ten: "thang mới × ngày áp khác D × dấu lap-moc", bang: "rong", ap: D_1, chuanBi: D_1, dau: "lap-moc", nhan: "lap-moc" },
];
test("DD bảng 1: năm hàng viết trước, mỗi hàng một lượt doHangNgay thật", { timeout: 3_600_000 }, async () => {
  let daKiem = 0;
  for (const h of BANG_1) {
    await trongGiaoDich(async () => {
      await nen({ bang: h.bang, ap: h.ap });
      if (h.chuanBi) await chay(h.chuanBi);   // lập mốc ngày trước → bảng đơn vị toàn thang mới
      if (h.dau) await chenDau(D, "skip", h.dau);
      await chay(D);
      const r = await dongDo1(D);
      assert.deepEqual(r.status === "skip" ? r.ly_do : null, h.nhan, `DD bảng 1 «${h.ten}» ra sai nhãn`);
      daKiem++;
    });
  }
  assert.equal(daKiem, BANG_1.length, "DD bảng 1 không kiểm đủ số ô viết trước");
});

// ---- E4 · AC-4 ----
test("DD-AC-4 ngày áp mất dấu: ghi lại doi-thang, không thêm dòng; ngày khác so thường (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  await trongGiaoDich(async () => {
    await nen({ bang: "rong", ap: D });
    const t = await tin();
    await chay(D_1);                         // bảng đơn vị toàn thang mới
    await chenDau(D, "pass", null);          // lượt cũ đã xoá dấu
    await giaNull(t);
    await chay(D);
    const r = await dongDo1(D);
    assert.deepEqual([r.status, r.ly_do, r.thang?.tu_ngay], ["skip", "doi-thang", D], "DD-AC-4 ngày áp mất dấu thì so như thường");
    assert.deepEqual(await dongTin(D), [], "DD-AC-4 ngày áp có dòng của tin");
    await giaLai(t);                          // đối chứng dương: ngày khác ngày áp, không dấu → so thường
    await chay(KHAC);
    assert.equal((await dongDo1(KHAC)).status, "pass");
    assert.deepEqual(await dongTin(KHAC), [[`tin:${t}`, "B0", "B1", "len"]], "DD-AC-4 ngày thường không ghi dòng chuyển");
  });
  await trongGiaoDich(async () => {   // chiều đỏ: chỉ nhận theo dấu
    await nen({ bang: "rong", ap: D });
    const t = await tin();
    await chay(D_1);
    await chenDau(D, "pass", null);
    await giaNull(t);
    await chay(D, { dotBien: "bo-ngay-ap" });
    const r = await dongDo1(D);
    assert.equal(r.status, "pass", "đối chứng đỏ: bỏ luật ngày áp mà vẫn skip");
    assert.ok((await dongTin(D)).length > 0);
    assert.throws(() => assert.deepEqual([r.status, r.ly_do], ["skip", "doi-thang"], "DD-AC-4 ngày áp mất dấu thì so như thường"),
      /DD-AC-4 ngày áp mất dấu thì so như thường/);
  });
});

// ---- E5 · AC-5 ----
const tapNgoaiD = async () => (await c.query(
  `SELECT snap_date::text, unit_key, from_level, to_level FROM data_level_change WHERE snap_date <> $1 ORDER BY 1, 2`, [D])).rows;
test("DD-AC-5 dòng có sẵn của ngày lập mốc: nhánh xoá → 0, nhánh giữ → còn đúng dòng có sẵn; ngày khác giữ nguyên (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  console.log(`HOI1 đang ship: ${HOI1}`);
  assert.equal(HOI1, "xoa", "DD-AC-5 hằng HOI1 lệch câu trả lời Hỏi-1 ở Cổng Phạm vi (xoá)");
  for (const nhanh of ["xoa", "giu"]) {
    await trongGiaoDich(async () => {
      await nen({ bang: "cu", ap: D });
      await chenChuyen(D, 3);
      await chenChuyen(D_1, 2);
      const truoc = await tapNgoaiD();
      await chay(D, { hoi1: nhanh });
      if (nhanh === "xoa") assert.equal(await demNgay(D), 0, "DD-AC-5 ngày lập mốc còn dòng chuyển");
      else assert.deepEqual((await dongTin(D)).map((x) => x[0]), [1, 2, 3].map((i) => `tin:${T}-co-san-${D}-${i}`), "DD-AC-5 nhánh giữ đổi dòng có sẵn");
      assert.deepEqual(await tapNgoaiD(), truoc, `DD-AC-5 nhánh ${nhanh} đụng ngày khác`);
    });
  }
  await trongGiaoDich(async () => {   // chiều đỏ: bỏ bước dọn ở nhánh xoá
    await nen({ bang: "cu", ap: D });
    await chenChuyen(D, 3);
    await chay(D, { dotBien: "bo-don-ngay" });
    const n = await demNgay(D);
    assert.equal(n, 3, "đối chứng đỏ: bỏ dọn mà ngày D sạch — thước không phân biệt");
    assert.throws(() => assert.equal(n, 0, "DD-AC-5 ngày lập mốc còn dòng chuyển"), /DD-AC-5 ngày lập mốc còn dòng chuyển/);
  });
});

// ---- E8 · AC-8 ----
const bamDonVi = async () => (await c.query(
  "SELECT md5(coalesce(string_agg(unit_key || ':' || data_level || ':' || scale, ',' ORDER BY unit_key), '')) AS h FROM data_level_unit")).rows[0].h;
async function nenSua() {
  await nen({ bang: "rong", ap: D });
  await chenChuyen(D, 3);
  await chenChuyen(D1, 2);
  await chenDau(D, "pass", null);
}
test("DD-AC-8 lệnh sửa ngày đổi thang: thử không ghi, ghi đúng ngày, từ chối khi lệch, bỏ qua có tên (kèm chiều đỏ)", { timeout: 1_800_000 }, async () => {
  console.log(`HOI2 đang ship: ${HOI2}`);
  assert.equal(HOI2, "xoa", "DD-AC-8 hằng HOI2 lệch câu trả lời Hỏi-2 ở Cổng Phạm vi (xoá)");
  await trongGiaoDich(async () => {
    await nenSua();
    await chay(D_2);                                   // có bảng đơn vị để băm
    await c.query("DELETE FROM dq_check_results WHERE check_name = 'do1-chuyen-bac' AND detail::jsonb ->> 'ngay' = $1", [D_2]);
    const bam = await bamDonVi();
    assert.deepEqual(await suaNgayDoiThang(c, { write: false }), { ngay: D, xoa: 3 });
    assert.deepEqual([await demNgay(D), await demNgay(D1), (await dongDo1(D)).status, await bamDonVi()], [3, 2, "pass", bam],
      "DD-AC-8 chạy thử mà DB đổi");
    await suaNgayDoiThang(c, { write: true });
    assert.equal(await demNgay(D), 0, "DD-AC-8 ngày đổi thang còn dòng chuyển");
    assert.equal(await demNgay(D1), 2, "DD-AC-8 lệnh sửa đụng ngày khác");
    const r = await dongDo1(D);
    assert.deepEqual({ status: r.status, ly_do: r.ly_do, thang: r.thang }, { status: "skip", ly_do: "doi-thang", thang: THANG_D });
    assert.equal(await bamDonVi(), bam, "DD-AC-8 lệnh sửa đụng data_level_unit");
  });
  await trongGiaoDich(async () => {   // nhánh giữ của Hỏi-2
    await nenSua();
    await suaNgayDoiThang(c, { write: true, hoi2: "giu" });
    assert.equal(await demNgay(D), 3);
    assert.equal((await dongDo1(D)).ly_do, "doi-thang");
  });
  await trongGiaoDich(async () => {   // từ chối: đã có dấu doi-thang ở ngày khác ngày áp
    await nenSua();
    await chenDau(D_2, "skip", "doi-thang");
    await assert.rejects(suaNgayDoiThang(c, { write: true }), new RegExp(`DD-AC-8 ngày áp ${D} lệch ngày có dấu ${D_2}`));
    assert.equal(await demNgay(D), 3, "DD-AC-8 từ chối mà vẫn xoá");
  });
  await trongGiaoDich(async () => {   // bỏ qua có tên
    await nen({ bang: "rong", ap: null });
    assert.deepEqual(await suaNgayDoiThang(c, { write: true }), { bo_qua: "chua-co-thang-moi" });
    await c.query("DROP FUNCTION data_level_units()");
    assert.deepEqual(await suaNgayDoiThang(c, { write: true }), { bo_qua: "chua-ap-087" });
  });
  await trongGiaoDich(async () => {   // chiều đỏ: xoá không lọc ngày
    await nenSua();
    await suaNgayDoiThang(c, { write: true, dotBien: "sua-moi-ngay" });
    const n = await demNgay(D1);
    assert.equal(n, 0, "đối chứng đỏ: xoá không lọc mà ngày khác còn — thước không phân biệt");
    assert.throws(() => assert.equal(n, 2, "DD-AC-8 lệnh sửa đụng ngày khác"), /DD-AC-8 lệnh sửa đụng ngày khác/);
  });
});

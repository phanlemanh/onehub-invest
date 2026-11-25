// ban-chep-da-loc.test.mjs — ca thuần (không DB) của bản chép đã lọc cho M5 (HT18). E2 = `node --test scripts/ban-chep-da-loc.test.mjs`.
// Tên nguồn trong tệp này là chuỗi BỊA (kho công khai): không viết tên nguồn thật vào test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  keHoachCot, cotThua, cauDocNguon, cauDemNguon, loiTenDich, tenDich, laBangCam, BANG_CO_DONG, COT_NGUON_GIU, thuTuChep,
  boDinhDanh, soatDongDdl, taoChe, dongTrung, doiTenDoiTuong, loaiO, docDoiSo, phanTichNguon, TEN_DICH_RE, TEN_KIEM_RE, TEN_M5_RE,
  MAU_SINH_GIOI,
} from "./ban-chep-da-loc.mjs";
import { CLOUD_ALLOW, PII_EXCLUDE, SOURCE_EXCLUDE, selectList, SELLER_REF_RE } from "../pipeline/sync-cloud.mjs";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "ban-chep-da-loc.mjs");
const BIA = [{ code: "S99", realName: "Quoxa Bds", wholeOnly: false }, { code: "S98", realName: "zelvanha", wholeOnly: false }];
const TOKENS = BIA.map((e) => ({ token: e.realName, wholeOnly: false }));

// Ba bảng người bán: cột local = cho phép + loại + một cột local mới chưa duyệt, xáo thứ tự.
const COT_MOI = "cot_moi_chua_duyet";
const localCua = (t) => {
  const cols = [...CLOUD_ALLOW[t], ...(PII_EXCLUDE[t] ?? []), ...(SOURCE_EXCLUDE[t] ?? []), COT_MOI];
  return cols.map((c, i) => [c, (i * 7919) % cols.length]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
};

for (const t of ["sale_offers", "sellers", "properties"]) {
  test(`BCL-2: ${t} — cột đích = selectList của sync-cloud (cho phép trừ loại), cột local mới vắng`, () => {
    const local = localCua(t);
    const ke = keHoachCot(t, local, TOKENS);
    assert.deepEqual(ke.cols, selectList(t, local, [], TOKENS).cols);
    const loai = [...(PII_EXCLUDE[t] ?? []), ...(SOURCE_EXCLUDE[t] ?? [])];
    assert.deepEqual(ke.cols, local.filter((c) => CLOUD_ALLOW[t].includes(c) && !loai.includes(c)));
    for (const c of [...loai, COT_MOI]) assert.ok(!ke.cols.includes(c), `cột ${t}.${c} không được lên đích`);
    assert.ok(ke.unapproved.includes(COT_MOI));
    // Xanh: bản chép theo kế hoạch không có cột thừa.
    assert.deepEqual(cotThua(t, ke.cols, local, TOKENS), []);
  });

  test(`BCL-2: ${t} — chiều đỏ: bản chép «SELECT *» thì nêu đúng cột thừa`, () => {
    const local = localCua(t);
    const thua = cotThua(t, local, local, TOKENS);
    assert.ok(thua.includes(COT_MOI), `phải nêu ${COT_MOI}, nhận ${thua.join(",")}`);
    for (const c of [...(PII_EXCLUDE[t] ?? []), ...(SOURCE_EXCLUDE[t] ?? [])]) assert.ok(thua.includes(c), `phải nêu ${t}.${c}`);
  });
}

test("BCL-2: sale_offers — seller_ref về dạng <S0x>:<số>, tên/SĐT đi qua biểu thức che (mang tên nguồn → NULL)", () => {
  const ke = keHoachCot("sale_offers", localCua("sale_offers"), TOKENS);
  assert.match(ke.sql, /"source" \|\| ':' \|\| substring\("seller_ref" from '\(\[0-9\]\+\)\$'\)/);
  assert.match(ke.sql, /AS "seller_ref"/);
  assert.equal(SELLER_REF_RE, "^S0[1-9]:[0-9]+$");
  for (const c of ["seller_name", "seller_phone"]) {
    assert.match(ke.sql, new RegExp(`THEN NULL ELSE "${c}" END`), `${c} phải đi qua biểu thức che`);
  }
  // Biến thể đã gập của tên bịa có trong biểu thức che.
  assert.ok(ke.sql.includes("'quoxa bds'"));
  // Thiếu từ điển: đóng chặt, tên/SĐT về NULL hết.
  const kin = keHoachCot("sale_offers", localCua("sale_offers"), []);
  assert.match(kin.sql, /NULL::text AS "seller_name"/);
  assert.match(kin.sql, /NULL::text AS "seller_phone"/);
});

test("BCL-5: source_registry — chỉ mã + vai trò lên đích", () => {
  const local = ["code", "real_name", "label_vi", "status", "since", "retired_at", "source_ids", "note", "reason", "resume_when", "match_whole"];
  const ke = keHoachCot("source_registry", local, TOKENS);
  assert.deepEqual(ke.cols, [...COT_NGUON_GIU]);
  assert.equal(ke.sql, '"code", "label_vi"');
  assert.deepEqual(cotThua("source_registry", local, local).sort(), local.filter((c) => !COT_NGUON_GIU.includes(c)).sort());
});

test("BCL-1: câu đọc/đếm nguồn = câu của sync-cloud (bảng con theo cha sống, dòng chỉ ở máy thu)", () => {
  assert.match(cauDocNguon("nights", '"listing_id"'), /FROM "nights" WHERE "listing_id" IN \(SELECT "id" FROM "listings"\)/);
  assert.match(cauDemNguon("property_offers"), /FROM "property_offers" WHERE "offer_id" IN \(SELECT "offer_id" FROM "sale_offers"\)/);
  assert.match(cauDemNguon("dq_check_results"), /WHERE "check_name" IS DISTINCT FROM 's03-moc-ngay'/);
  assert.equal(cauDemNguon("source_registry"), 'SELECT count(*)::bigint AS n FROM "source_registry"');
  assert.ok(BANG_CO_DONG.includes("ref_calib_listings") && !BANG_CO_DONG.includes("airdna_listings"));
  assert.ok(BANG_CO_DONG.includes("source_registry") && BANG_CO_DONG.includes("spatial_ref_sys"));
});

test("BCL-1: thứ tự chép cha trước con", () => {
  const order = thuTuChep(["property_offers", "properties", "areas", "asset_nodes"], [
    { src: "property_offers", dst: "properties" }, { src: "properties", dst: "areas" }, { src: "properties", dst: "asset_nodes" },
    { src: "areas", dst: "areas" }, { src: "x", dst: "areas" },
  ]);
  assert.ok(order.indexOf("areas") < order.indexOf("properties"));
  assert.ok(order.indexOf("asset_nodes") < order.indexOf("properties"));
  assert.ok(order.indexOf("properties") < order.indexOf("property_offers"));
  assert.equal(order.length, 4);
});

test("BCL-1: đổi tên ref_calib_* ở mọi tên đối tượng nhắc bảng cũ, cột airdna_id giữ", () => {
  assert.equal(doiTenDoiTuong("airdna_listings_pkey"), "ref_calib_listings_pkey");
  assert.equal(doiTenDoiTuong("idx_airdna_listings_captured_at"), "idx_ref_calib_listings_captured_at");
  assert.equal(doiTenDoiTuong("airdna_scores_airdna_id_fkey"), "ref_calib_scores_airdna_id_fkey");
  assert.equal(doiTenDoiTuong("airdna_market_metrics_pkey"), "ref_calib_market_metrics_pkey");
  assert.equal(doiTenDoiTuong("airdna_submarket_metrics_pkey"), "ref_calib_submarket_metrics_pkey");
});

test("BCL-4: bảng cấm", () => {
  for (const t of ["users", "sessions", "machine_tokens", "user_events", "user_profile", "saved_markets", "review_queue", "airbnb_snapshots",
    "stg_s08_inventory", "stg_zalo_posts"]) assert.ok(laBangCam(t), t);
  for (const t of ["areas", "sale_offers", "source_registry", "stage_x"]) assert.ok(!laBangCam(t), t);
});

test("BCL-6: mẫu tên ngày sinh/giới tính", () => {
  for (const c of ["seller_dob", "birth_date", "gender", "ngay_sinh", "gioi_tinh", "Gender"]) assert.ok(MAU_SINH_GIOI.test(c), c);
  for (const c of ["seller_name", "bedrooms", "kind"]) assert.ok(!MAU_SINH_GIOI.test(c), c);
});

test("BCL-3: loại ô", () => {
  assert.equal(loaiO("text"), "o_chu");
  assert.equal(loaiO("varchar"), "o_chu");
  assert.equal(loaiO("jsonb"), "o_json");
  assert.equal(loaiO("_text"), "o_mang");
  assert.equal(loaiO("int4"), null);
  assert.equal(loaiO("geometry"), null);
});

// Bộ soát DDL: định danh lược đồ có sẵn (tên bảng, tên cột) không tính; tên cấy vào chỗ khác vẫn bị bắt (đối chứng dương).
const IDENTS = ["areas", "stg_zelvanha_ads", "zelvanha_id", "id", "captured_at"];
const ddl = (loai, txt) => ({ loai, cho: `public.${loai}`, txt });

test("BCL-3: bỏ định danh có sẵn — tên bảng/cột mang tên nguồn không trúng", () => {
  const rows = [
    ddl("chi_muc", "stg_zelvanha_ads_pkey"),
    ddl("default", "nextval('stg_zelvanha_ads_id_seq'::regclass)"),
    ddl("view", " SELECT a.zelvanha_id, b.id FROM stg_zelvanha_ads a JOIN areas b ON true"),
    ddl("rang_buoc", "areas_zelvanha_id_fkey"),
  ];
  assert.deepEqual(soatDongDdl(rows, IDENTS, BIA), []);
  assert.equal(boDinhDanh("stg_zelvanha_ads_pkey", IDENTS), " _pkey");
});

test("BCL-3: đối chứng dương — cấy tên vào từng loại chỗ DDL thì trúng, nêu chỗ, mã S0x, không tên", () => {
  const loai = ["ham", "view", "comment", "default", "check", "enum", "rang_buoc", "chi_muc"];
  const rows = loai.map((l) => ddl(l, `x Quoxa Bds y zelvanha`));
  const hits = soatDongDdl(rows, IDENTS, BIA);
  assert.deepEqual(hits.map((h) => h.muc), loai);
  for (const h of hits) assert.match(h.ma, /^S9[89]$/);
  // Chỉ mục đặt tên bằng tên nguồn trên bảng không mang tên ấy: trúng.
  assert.equal(soatDongDdl([ddl("chi_muc", "idx_zelvanha_gia")], IDENTS, BIA).length, 1);
  // Định danh trùng trọn tên nguồn không được bỏ: COMMENT nhắc đúng tên ấy vẫn trúng.
  assert.equal(soatDongDdl([ddl("comment", "zelvanha")], [...IDENTS, "zelvanha"], BIA).length, 1);
  // Không từ điển: không dò (chế độ --khong-tu-dien).
  assert.deepEqual(soatDongDdl(rows, IDENTS, []), []);
});

test("BCL-3: dòng in ra không mang tên nguồn (che bằng mã)", () => {
  const che = taoChe(BIA);
  const s = dongTrung({ muc: "chi_muc", cho: "public.idx_zelvanha_gia", ma: "S98" }, che);
  assert.ok(!/zelvanha/i.test(s), s);
  assert.match(s, /S98/);
  assert.equal(taoChe([])("abc"), "abc");
});

test("BCL-7: tên đích — từ chối oneinvest, sai khuôn, trùng nguồn", () => {
  assert.match(loiTenDich("oneinvest"), /oneinvest/);
  assert.ok(loiTenDich("oneinvest_m5_2026112"));
  assert.ok(loiTenDich("oneinvest_m5_kiem_1"));
  assert.ok(loiTenDich("oneinvest_u1_tg1"));
  assert.ok(loiTenDich(""));
  assert.equal(loiTenDich("oneinvest_m5_20261125", "oneinvest"), null);
  assert.ok(loiTenDich("oneinvest_m5_20261125", "oneinvest_m5_20261125"));
  assert.equal(tenDich(new Date(2026, 10, 5)), "oneinvest_m5_20261105");
  assert.ok(TEN_DICH_RE.test(tenDich()));
  assert.ok(TEN_KIEM_RE.test("oneinvest_m5_kiem_123") && TEN_M5_RE.test("oneinvest_m5_kiem_123"));
  assert.ok(!TEN_M5_RE.test("oneinvest") && !TEN_M5_RE.test("oneinvest_suite_bcl_1"));
});

test("BCL-7: nguồn chỉ nhận Postgres local :5433", () => {
  assert.equal(phanTichNguon("postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_bcl_9").db, "oneinvest_suite_bcl_9");
  assert.ok(phanTichNguon("postgres://db.example.com:5432/x").loi);
  assert.ok(phanTichNguon("không phải url").loi);
});

test("BCL-7: đối số", () => {
  assert.deepEqual(docDoiSo(["--kiem", "a.dump", "--khong-tu-dien"]), { che: "kiem", tep: "a.dump", khongTuDien: true });
  assert.equal(docDoiSo(["--don"]).che, "don");
  assert.ok(docDoiSo(["--khong-tu-dien"]).loi);
  assert.ok(docDoiSo(["--la"]).loi);
});

for (const dich of ["oneinvest", "oneinvest_m5_2026", "foo"]) {
  test(`BCL-7: lệnh từ chối đích «${dich}» mã 2, không chạm DB`, () => {
    const r = spawnSync(process.execPath, [SCRIPT, "--dich", dich], {
      encoding: "utf8", env: { ...process.env, DATABASE_URL: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_khong_co" },
    });
    assert.equal(r.status, 2, r.stderr);
    assert.match(r.stderr, /đích/);
  });
}

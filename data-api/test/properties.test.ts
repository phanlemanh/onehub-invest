/**
 * PB6 (data-api-property-danh-ba-nha) — tài nguyên Property (danh bạ nhà): toà, căn, tra theo mã, không dò, không lộ.
 *
 * Chạy trên DB thử có lược đồ thật (bản chép dữ liệu thật):
 *   bash db/db-thu.sh oneinvest_suite_dapi_prop --chay sh -c 'cd data-api && node --import tsx --test test/properties.test.ts'
 * Test cấy một dự án riêng (tên, khoá không trùng dữ liệu thật) và chuỗi canh vào mọi chỗ không được lộ; mỗi ca khẳng định
 * status 200 và có phần tử cấy trước khi soát chuỗi canh. Thông điệp ghim «PB6-AC-n …» để probe đối chứng (E9) đọc.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`PB6 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
delete process.env.DATA_API_KEYS;
process.env.NODE_ENV = "test";

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");
const { xoaBoNhoProperty } = await import("../src/routes/properties.js");
const { BUILDING_KEY_NAMES, UNIT_KEY_NAMES, LOOKUP_KEY_NAMES } = await import("../src/contract/property.js");

// ── Khoá cấy: ULID Crockford hợp lệ, tiền tố 01PB6 không trùng dữ liệu thật. Hạt (5 chữ số) khác nhau mỗi lượt để
// chạy lặp trên cùng DB thử (probe đối chứng E9 chạy test nhiều lần; bảng danh bạ chỉ-thêm, không dọn được). ─────────────
const HAT = (process.env.PB6_HAT ?? String(process.pid)).replace(/[^0-9]/g, "").padStart(5, "0").slice(-5);
const khoa = (loai: string, n: number) => `${loai}_01PB6${HAT}${String(n).padStart(16, "0")}`;
const T1 = khoa("bld", 1), T2 = khoa("bld", 2), T3 = khoa("bld", 3), T9 = khoa("bld", 9);
// Ma trận thứ tự tên toà (finding r1 AC-1): T4 có S08 · S16 · S03 (không S09) → S08; T5 có S16 · S03 → S16.
const T4 = khoa("bld", 4), T5 = khoa("bld", 5);
const S1 = khoa("stk", 1);
const C1 = khoa("unt", 1), C2 = khoa("unt", 2), C3 = khoa("unt", 3), C4 = khoa("unt", 4);
const upi = (k: string) => `urn:onehub:upi:1:VN:VN-HN:${k}`;
const PHUONG = `vn-pb6-phuong-cay-${HAT}`;
const DU_AN = `PB6 Dự Án Cấy Thử ${HAT}`;
const PHAN_KHU = `PB6 Phân Khu Cấy ${HAT}`;

// Chuỗi canh — chỉ bản mã lộ bí danh, căn cứ, nguồn hay tên nút nội bộ mới trả ra được.
const CANH = {
  duAnNguon: `PB6CANHDUAN${HAT}`,           // phần <dự án>/ của mã căn nguồn
  maC1: `PB6MA${HAT}-0912`,                 // phần mã của căn C1 (khách nhập để tra)
  maC3s16: `PB6MA${HAT}-1501`,
  maC3s08: `PB6MB${HAT}-1501`,
  maToaNguon: `PB6CANH-MA-TOA-${HAT}`,       // mã toà tại nguồn
  maTrucNguon: `PB6CANH-MA-TRUC-${HAT}`,
  canCu: `PB6CANH-CAN-CU-${HAT}`,            // field_assertions.evidence
  nguonPhatBieu: `PB6CANH-NGUON-${HAT}`,
  slugNut: `pb6-canh-slug-noi-bo-${HAT}`,    // slug nút dự án
  // Bí danh `ten` của nguồn thua thứ tự (finding r1 AC-6): route chỉ được trả tên của nguồn thắng.
  tenThuaT1s16: `PB6CANH-TEN-THUA-T1-S16-${HAT}`,
  tenThuaT1s03: `PB6CANH-TEN-THUA-T1-S03-${HAT}`,
  tenThuaT4s16: `PB6CANH-TEN-THUA-T4-S16-${HAT}`,
  tenThuaT4s03: `PB6CANH-TEN-THUA-T4-S03-${HAT}`,
  tenThuaT5s03: `PB6CANH-TEN-THUA-T5-S03-${HAT}`,
};
const CANH_MOI = Object.values(CANH);

// ── Bộ ghi SQL + gom mọi thân trả về ────────────────────────────────────────────────────────────────────────────────
const cauSql: string[] = [];
const queryGoc = pool.query.bind(pool);
(pool as unknown as { query: (...a: unknown[]) => unknown }).query = (...a: unknown[]) => {
  const q = a[0];
  cauSql.push(typeof q === "string" ? q : String((q as { text?: string })?.text ?? ""));
  return (queryGoc as (...b: unknown[]) => unknown)(...a);
};
const moiThan: string[] = [];
async function goi(duong: string) {
  const tu = cauSql.length;
  const res = await app.request(duong);
  const than = (await res.json()) as Record<string, any>;
  const vanBan = JSON.stringify(than);
  moiThan.push(vanBan);
  return { status: res.status, than, vanBan, sql: cauSql.slice(tu) };
}
const sql = (q: string, p: unknown[] = []) => queryGoc(q, p) as Promise<{ rows: Record<string, any>[] }>;
const bangTap = (a: Iterable<string>) => [...new Set(a)].sort();
function moiKhoa(v: unknown, ra = new Set<string>()): Set<string> {
  if (Array.isArray(v)) for (const x of v) moiKhoa(x, ra);
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { ra.add(k); moiKhoa(x, ra); }
  return ra;
}
const KHOA_CAM = ["universalPropertySubId", "stack", "stackKey", "nguon", "evidence", "originatingSystemName", "originatingSystemKey", "aliases"];

let duAnId = 0;

before(async () => {
  await sql(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'ward', $2, 'vn')`, [PHUONG, `PB6 Phường Cấy ${HAT}`]);
  const p = await sql(
    `INSERT INTO asset_nodes (node_type, name, slug, catalog_tier, area_ids) VALUES ('project', $1, $2, 'xac_minh', ARRAY[$3]) RETURNING id`,
    [DU_AN, CANH.slugNut, PHUONG],
  );
  duAnId = Number(p.rows[0].id);
  const z = await sql(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id, catalog_tier, area_ids) VALUES ('subzone', $1, $4, $2, 'xac_minh', ARRAY[$3]) RETURNING id`,
    [PHAN_KHU, duAnId, PHUONG, `pb6-pk-${HAT}`],
  );
  const vung = Number(z.rows[0].id);
  for (const [k, tier, nut] of [[T1, "xac_minh", vung], [T2, "mot_loi_khai", vung], [T3, "xac_minh", duAnId]] as const) {
    await sql(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier) VALUES ($1, $2, $3, 'VN-HN', $4)`, [k, nut, upi(k), tier]);
  }
  await sql(`INSERT INTO buildings (building_key, status, merged_into, region_node_id, upi, iso_region, catalog_tier) VALUES ($1, 'merged', $2, $3, $4, 'VN-HN', 'xac_minh')`, [T9, T1, vung, upi(T9)]);
  // T4, T5 ở một nút dự án riêng để không đổi các ca tra theo dự án DU_AN.
  const rieng = await sql(
    `INSERT INTO asset_nodes (node_type, name, slug, catalog_tier, area_ids) VALUES ('project', $1, $2, 'xac_minh', ARRAY[$3]) RETURNING id`,
    [`PB6 Dự Án Thứ Tự ${HAT}`, `pb6-thu-tu-${HAT}`, PHUONG],
  );
  for (const k of [T4, T5]) {
    await sql(`INSERT INTO buildings (building_key, region_node_id, upi, iso_region, catalog_tier) VALUES ($1, $2, $3, 'VN-HN', 'xac_minh')`, [k, Number(rieng.rows[0].id), upi(k)]);
  }
  // Tên toà theo thứ tự S09 → S08 → S16 → S03: T1 (S09 · S16 · S03) → S09; T4 (S08 · S16 · S03) → S08; T5 (S16 · S03) → S16.
  // T2 «Tháp B» (S03), T3 «Tháp B» (S09) → trùng tên trong dự án. Tên của nguồn thua là chuỗi canh (AC-6).
  const ten = [
    [T1, "S09", "Tháp A"], [T1, "S16", CANH.tenThuaT1s16], [T1, "S03", CANH.tenThuaT1s03],
    [T4, "S08", "Tháp S08"], [T4, "S16", CANH.tenThuaT4s16], [T4, "S03", CANH.tenThuaT4s03],
    [T5, "S16", "Tháp S16"], [T5, "S03", CANH.tenThuaT5s03],
    [T2, "S03", "Tháp B"], [T3, "S09", "Tháp B"],
  ];
  for (const [k, s, v] of ten) await sql(`INSERT INTO registry_aliases (object_key, kind, value, source, first_seen) VALUES ($1, 'ten', $2, $3, now())`, [k, v, s]);
  await sql(`INSERT INTO registry_aliases (object_key, kind, value, source, first_seen) VALUES ($1, 'ma_nguon', $2, 'S16', now())`, [T1, CANH.maToaNguon]);
  await sql(`INSERT INTO stacks (stack_key, building_key, catalog_tier) VALUES ($1, $2, 'xac_minh')`, [S1, T1]);
  await sql(`INSERT INTO registry_aliases (object_key, kind, value, source, first_seen) VALUES ($1, 'ma_nguon', $2, 'S16', now())`, [S1, CANH.maTrucNguon]);
  // Căn: C1 có trục + tầng, C2 không trục, C3 hai nguồn, C4 đã gộp vào C1.
  await sql(`INSERT INTO units (unit_key, building_key, stack_key, floor, sub_id, catalog_tier) VALUES ($1, $2, $3, '9', $4, 'xac_minh')`, [C1, T1, S1, `${S1}:9`]);
  await sql(`INSERT INTO units (unit_key, building_key, sub_id, catalog_tier) VALUES ($1, $2, $1, 'xac_minh')`, [C2, T1]);
  await sql(`INSERT INTO units (unit_key, building_key, sub_id, catalog_tier) VALUES ($1, $2, $1, 'xac_minh')`, [C3, T1]);
  await sql(`INSERT INTO units (unit_key, building_key, sub_id, catalog_tier, status, merged_into) VALUES ($1, $2, $1, 'xac_minh', 'merged', $3)`, [C4, T1, C1]);
  const ma = [[C1, "S16", `${CANH.duAnNguon}/${CANH.maC1}`], [C3, "S16", `${CANH.duAnNguon}/${CANH.maC3s16}`], [C3, "S08", `99${HAT}/${CANH.maC3s08}`]];
  for (const [k, s, v] of ma) await sql(`INSERT INTO registry_aliases (object_key, kind, value, source, first_seen) VALUES ($1, 'ma_nguon', $2, $3, now())`, [k, v, s]);
  // Thuộc tính: C1 hai phát biểu diện tích — bậc fact thắng observed; C2 loại house → null; C3 không thuộc tính.
  const pb = [
    [C1, "living_area", "68.5", "fact", "source_field"],
    [C1, "living_area", "99", "observed", "parser"],
    [C1, "bedrooms", "2", "fact", "source_field"],
    [C1, "bathrooms", "2", "fact", "source_field"],
    [C1, "property_type", "apartment", "fact", "source_field"],
    [C2, "living_area", "120", "fact", "source_field"],
    [C2, "property_type", "house", "fact", "source_field"],
  ];
  for (const [k, f, v, tier, m] of pb) {
    await sql(
      `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, evidence, observed_at)
       VALUES ('Unit', $1, $2, $3, $4, $5, $6, now())`,
      [k, f, v, tier, m, JSON.stringify({ nguon: CANH.nguonPhatBieu, can_cu: CANH.canCu })],
    );
  }
  // Một tin S03 đang rao gắn T1 (offer_building mức toà) và một tin đã nghỉ gắn T1 — chỉ tin đang rao được đếm.
  for (const [id, trangThai, bai] of [[`pb6-offer-song-${HAT}`, "active", `pb6-post-1-${HAT}`], [`pb6-offer-nghi-${HAT}`, "withdrawn", `pb6-post-2-${HAT}`]]) {
    await sql(
      `INSERT INTO sale_offer_records (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen,
         n_reposts, post_ids, source, property_type, offer_status)
       VALUES ($1, 'sale', $2, 5000000000, 70, 71428571, 'high', now(), now(), 1, ARRAY[$3], 'S03', 'apartment', $4)`,
      [id, PHUONG, bai, trangThai],
    );
    await sql(
      `INSERT INTO field_assertions (resource_name, subject_key, field, value, evidence_tier, method, rule_id, observed_at)
       VALUES ('Property', $1, 'universal_property_id', $2, 'observed', 'parser', 'ghep-toa-cot', now())`,
      [`S03:${bai}`, upi(T1)],
    );
  }
  xoaBoNhoProperty();
});

after(async () => {
  await pool.end();
});

const toa = (k: string) => `/v1/properties/${encodeURIComponent(upi(k))}`;
const can = (t: string, u: string) => `${toa(t)}/units/${u}`;

test("PB6-AC-1 toà theo UPI", async () => {
  const r = await goi(toa(T1));
  assert.equal(r.status, 200, "PB6-AC-1 toà T1 không 200");
  const d = r.than.data;
  assert.ok(d, "PB6-AC-1 thiếu toà cấy");
  assert.deepEqual(bangTap(Object.keys(d)), bangTap(BUILDING_KEY_NAMES), "PB6-AC-1 sai tập khoá cấp toà");
  assert.equal(d.universalPropertyId, upi(T1), "PB6-AC-1 sai universalPropertyId");
  assert.equal(d.buildingKey, T1);
  assert.equal(d.buildingName, "Tháp A", "PB6-AC-1 tên toà không theo thứ tự S09 → S08 → S16 → S03");
  // Ma trận thứ tự: mỗi cặp liền kề của S09 → S08 → S16 → S03 có một toà đo (T1: S09 > S16, S03; T4: S08 > S16, S03; T5: S16 > S03).
  for (const [k, mong] of [[T4, "Tháp S08"], [T5, "Tháp S16"]] as const) {
    const t = await goi(toa(k));
    assert.equal(t.status, 200, `PB6-AC-1 toà ${k} không 200`);
    assert.equal(t.than.data.buildingName, mong, "PB6-AC-1 tên toà không theo thứ tự S09 → S08 → S16 → S03");
  }
  assert.equal(d.complexName, PHAN_KHU, "PB6-AC-1 complexName phải là phân khu");
  assert.equal(d.subdivisionName, DU_AN, "PB6-AC-1 subdivisionName phải là dự án");
  assert.equal(d.projectId, duAnId, "PB6-AC-1 sai projectId");
  assert.equal(d.city, `PB6 Phường Cấy ${HAT}`, "PB6-AC-1 sai city");
  assert.equal(d.stateOrProvince, "VN-HN");
  assert.equal(d.country, "VN");
  assert.equal(d.catalogTier, "xac_minh");
  assert.equal(d.unitCount, 3, "PB6-AC-1 unitCount phải chỉ đếm căn active (3)");
  assert.equal(d.activeListingCount, 1, "PB6-AC-1 activeListingCount phải chỉ đếm tin đang rao (1)");
  const r2 = await goi(toa(T1));
  assert.equal(r2.vanBan, r.vanBan, "PB6-AC-1 hai lần gọi khác nhau");
  const t2 = await goi(toa(T2));
  assert.equal(t2.status, 200);
  assert.equal(t2.than.data.catalogTier, "mot_loi_khai", "PB6-AC-1 toà một lời khai mất nhãn");
});

test("PB6-AC-2 căn theo unitKey", async () => {
  const k = await goi(can(T1, C1));
  assert.equal(k.status, 200, "PB6-AC-2 căn C1 không 200");
  for (const u of [C1, C2, C3]) {
    const r = await goi(can(T1, u));
    assert.equal(r.status, 200, `PB6-AC-2 căn ${u} không 200`);
    assert.deepEqual(bangTap(Object.keys(r.than.data)), bangTap(UNIT_KEY_NAMES), "PB6-AC-2 sai tập khoá cấp căn");
    for (const cam of [...KHOA_CAM, "unitNumber"]) assert.ok(!(cam in r.than.data), `PB6-AC-2 lộ khoá cấm ${cam}`);
    assert.equal(r.than.data.unitKey, u);
  }
  const c1 = k.than.data;
  assert.equal(c1.unitFloorLocation, "9");
  assert.equal(c1.livingArea, 68.5, "PB6-AC-2 diện tích không theo luật thắng (fact > observed)");
  assert.equal(c1.livingAreaUnits, "Square Meters");
  assert.equal(c1.bedroomsTotal, 2);
  assert.equal(c1.bathroomsTotalInteger, 2);
  assert.equal(c1.propertySubType, "Condominium");
  const c2 = (await goi(can(T1, C2))).than.data;
  assert.equal(c2.unitFloorLocation, null);
  assert.equal(c2.livingArea, 120);
  assert.equal(c2.propertySubType, null, "PB6-AC-2 house phải ra null");
  const c3 = (await goi(can(T1, C3))).than.data;
  assert.equal(c3.livingArea, null);
  assert.equal(c3.livingAreaUnits, null);
  // So luật thắng chép tay với view của kho trên căn cấy.
  const v = await sql(`SELECT living_area, bedrooms_total, property_sub_type FROM v_unit_thuoc_tinh WHERE unit_key = $1`, [C1]);
  assert.equal(Number(v.rows[0].living_area), c1.livingArea, "PB6-AC-2 luật thắng lệch v_unit_thuoc_tinh");
});

test("PB6-AC-3 tra theo dự án + toà + mã căn", async () => {
  const q = (p: string, b: string, u: string) =>
    `/v1/properties/lookup?project=${encodeURIComponent(p)}&building=${encodeURIComponent(b)}&unitNumber=${encodeURIComponent(u)}`;
  const nhap = CANH.maC1.toLowerCase();
  const r = await goi(q(`pb6 du an cay thu ${HAT}`, "thap a", nhap));
  assert.equal(r.status, 200, "PB6-AC-3 tra không 200");
  assert.equal(r.than.meta.total, 1, "PB6-AC-3 không khớp đúng một căn");
  assert.deepEqual(bangTap(Object.keys(r.than.data[0])), bangTap(LOOKUP_KEY_NAMES), "PB6-AC-3 sai tập khoá");
  assert.equal(r.than.data[0].unitKey, C1);
  assert.equal(r.than.data[0].unitNumber, nhap, "PB6-AC-3 unitNumber phải đúng chuỗi khách nhập");
  const theoKhoa = await goi(q(String(duAnId), T1, CANH.maC1));
  assert.equal(theoKhoa.than.data[0]?.unitKey, C1, "PB6-AC-3 tra bằng id nút + buildingKey hỏng");
  const moHo = await goi(q(DU_AN, "Tháp B", "X-1"));
  assert.equal(moHo.status, 400);
  assert.equal(moHo.than.error.code, "AMBIGUOUS_BUILDING", "PB6-AC-3 toà trùng tên phải 400 AMBIGUOUS_BUILDING");
  const thieu = await goi(`/v1/properties/lookup?project=${encodeURIComponent(DU_AN)}&building=x`);
  assert.equal(thieu.status, 400);
  assert.equal(thieu.than.error.code, "BAD_REQUEST");
  const khong = await goi(q(DU_AN, "Tháp A", "KHONG-CO-9999"));
  assert.equal(khong.status, 200);
  assert.deepEqual(khong.than, { data: [], meta: { total: 0 } }, "PB6-AC-3 không khớp phải 200 rỗng");
  const a = await goi(q(DU_AN, "Tháp A", CANH.maC3s16));
  const b = await goi(q(DU_AN, "Tháp A", CANH.maC3s08));
  assert.equal(a.than.data[0]?.unitKey, C3, "PB6-AC-3 mã S16 của C3 không ra C3");
  assert.equal(b.than.data[0]?.unitKey, C3, "PB6-AC-3 mã S08 của C3 không ra C3");
  for (const [p, bb, u] of [[DU_AN, "Tháp A", `${CANH.duAnNguon}/${CANH.maC1}`], [DU_AN, CANH.maToaNguon, CANH.maC1]]) {
    const r2 = await goi(q(p, bb, u));
    assert.equal(r2.status, 400, "PB6-AC-3 nhận mã nguồn làm đầu vào");
    assert.equal(r2.than.error.code, "SOURCE_CODE_NOT_ACCEPTED");
  }
});

test("PB6-AC-4 liệt kê toà có trần", async () => {
  const r = await goi(`/v1/properties?project=${duAnId}&limit=500`);
  assert.equal(r.status, 200, "PB6-AC-4 liệt kê không 200");
  assert.equal(r.than.meta.limit, 100, "PB6-AC-4 limit không bị kẹp 100");
  assert.equal(r.than.meta.total, 3, "PB6-AC-4 meta.total phải là tổng toà active (3)");
  assert.deepEqual(r.than.data.map((d: any) => d.buildingKey), [T1, T2, T3]);
  for (const d of r.than.data) {
    assert.deepEqual(bangTap(Object.keys(d)), bangTap(BUILDING_KEY_NAMES), "PB6-AC-4 phần tử không phải hình toà");
    assert.ok(!("unitKey" in d) && !moiKhoa(d).has("units"), "PB6-AC-4 danh sách mang căn");
  }
  const p1 = await goi(`/v1/properties?project=${duAnId}&limit=2&offset=0`);
  const p2 = await goi(`/v1/properties?project=${duAnId}&limit=2&offset=2`);
  const hai = [...p1.than.data, ...p2.than.data].map((d: any) => d.buildingKey);
  assert.deepEqual(hai, [T1, T2, T3], "PB6-AC-4 hai trang trùng hay sót");
  const t = await goi(toa(T1));
  assert.ok(!moiKhoa(t.than).has("units"), "PB6-AC-4 GET toà kèm mảng căn");
});

test("PB6-AC-5 không dò được", async () => {
  const goc = await goi(can(T1, C1));
  assert.equal(goc.status, 200);
  for (const k of ["universalPropertySubId", "stack", "stackKey", "unitNumber"]) {
    assert.ok(!(k in goc.than.data), `PB6-AC-5 phát khoá dò được: ${k}`);
  }
  let lo = 0;
  // Khoá cấy của test liền số (…1, …2) nên «đổi ký tự cuối» sẽ trúng căn cấy khác — giới hạn của bộ cấy, không phải của
  // API: khoá thật là ULID có 80 bit ngẫu nhiên. Đổi sang ký tự không có trong bộ khoá cấy để đo đúng câu «khoá đoán bừa → 404».
  const doi = C1.slice(0, -1) + "Z";
  assert.equal((await goi(can(T1, doi))).status, 404, "PB6-AC-5 khoá đoán bừa không 404");
  const r1 = await goi(can(T1, doi));
  if (r1.status === 200 && r1.than.data?.unitKey !== C1) lo++;
  for (const tang of ["8", "10"]) {
    const r = await goi(`${can(T1, C1)}?floor=${tang}`);
    if (r.status === 200 && r.than.data?.unitKey !== C1) lo++;
  }
  const lienKe = await goi(`/v1/properties/lookup?project=${duAnId}&building=${T1}&unitNumber=PB6MA${HAT}-0913`);
  lo += lienKe.than.data?.length ?? 0;
  console.log(`số căn lộ thêm khi dò: ${lo}`);
  assert.equal(lo, 0, "PB6-AC-5 dò từ một căn ra căn khác");
});

test("PB6-AC-7 gộp", async () => {
  const t = await goi(toa(T9));
  assert.equal(t.status, 404);
  assert.equal(t.than.error.code, "MERGED", "PB6-AC-7 toà gộp không báo MERGED");
  assert.equal(t.than.error.mergedInto, upi(T1));
  const c = await goi(can(T1, C4));
  assert.equal(c.status, 404);
  assert.equal(c.than.error.code, "MERGED", "PB6-AC-7 căn gộp không báo MERGED");
  assert.equal(c.than.error.mergedInto, C1);
});

test("PB6-AC-10 cloud và lỗi", async () => {
  await sql(`ALTER TABLE buildings RENAME TO buildings_pb6_tam`);
  xoaBoNhoProperty();
  try {
    for (const d of [toa(T1), can(T1, C1), `/v1/properties?project=${duAnId}`, `/v1/properties/lookup?project=a&building=b&unitNumber=c`]) {
      const r = await goi(d);
      assert.equal(r.status, 503, `PB6-AC-10 ${d} không 503 khi thiếu danh bạ`);
      assert.deepEqual(r.than, { error: { code: "DIRECTORY_UNAVAILABLE", message: "danh bạ chưa lên cloud" } });
    }
  } finally {
    await sql(`ALTER TABLE buildings_pb6_tam RENAME TO buildings`);
    xoaBoNhoProperty();
  }
  await sql(`ALTER TABLE areas RENAME TO areas_pb6_tam`);
  try {
    const r = await goi(toa(T1));
    assert.equal(r.status, 500, "PB6-AC-10 lỗi cấy không ra 500");
    for (const chu of ["SELECT", "FROM", "relation", "areas", "buildings", "region_type"]) {
      assert.ok(!r.vanBan.includes(chu), `PB6-AC-10 thân lỗi lộ «${chu}»`);
    }
  } finally {
    await sql(`ALTER TABLE areas_pb6_tam RENAME TO areas`);
  }
});

test("PB6-AC-6 không lộ (chạy sau cùng, soát mọi thân đã gom)", async () => {
  const api = await goi("/openapi.json");
  assert.equal(api.status, 200);
  const coPhanTu = moiThan.some((t) => t.includes(T1));
  assert.ok(coPhanTu, "PB6-AC-6 không thân nào có toà cấy — ca soát rỗng nghĩa");
  const loi: string[] = [];
  for (const t of moiThan) {
    for (const c of CANH_MOI) {
      // unitNumber nhắc lại chuỗi khách nhập (AC-3) được phép, đúng một lần cho mỗi lần nhắc; mọi chỗ khác thì không —
      // đếm số lần xuất hiện, không xét cả thân (finding r1 AC-6).
      const dem = (chu: string) => t.split(chu).length - 1;
      if (dem(c) > dem(`"unitNumber":"${c}"`)) loi.push(`chuỗi canh ${c}`);
    }
    const khoaCo = moiKhoa(JSON.parse(t));
    for (const k of KHOA_CAM) if (khoaCo.has(k)) loi.push(`khoá cấm ${k}`);
  }
  assert.deepEqual([...new Set(loi)], [], `PB6-AC-6 lộ: ${[...new Set(loi)].join(", ")}`);
});

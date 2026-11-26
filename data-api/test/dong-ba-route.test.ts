/**
 * HT19 (data-api-dong-ba-route-lo) — ba đường không được trả hay đọc dữ liệu trái luật 5, 6 của AGENTS.md.
 *
 * Chạy trên DB thử có lược đồ thật của kho (db/db-thu.sh oneinvest_suite_<bộ> --chay …): test ghi dòng canh vào đúng các
 * bảng bị cấm, nên từ chối chạy khi DATABASE_URL không trỏ DB thử.
 *
 * Mỗi đường đo hai lớp, độc lập nhau:
 *   - lớp JSON: thân trả về không mang khoá cấm, không mang chuỗi canh;
 *   - lớp SQL: câu truy vấn route phát ra không nhắc bảng cấm.
 * Hai lớp gom lỗi vào một danh sách rồi mới báo, để lớp này đỏ không che lớp kia.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`DRL từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
// Không khoá API trong lượt test → middleware auth để mở.
delete process.env.DATA_API_KEYS;

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");

// ── Chuỗi canh: chỉ bản mã đọc bảng cấm mới trả ra được ───────────────────────────────────────────────────────────
const CANH = {
  nhom: "CANH-NHOM-7f3a91",
  nguoiGui: "CANH-NGUOI-GUI-7f3a91",
  chuBai: "CANH-CHU-BAI-7f3a91",
  anhBai: "CANH-ANH-BAI-7f3a91.jpg",
  anhS02: "https://canh.test/CANH-ANH-S02-7f3a91.jpg",
  urlS02: "https://canh.test/CANH-URL-S02-7f3a91",
  soS02: "7919.37", // giá trị listing_count của S02 — số lẻ không trùng số nào khác trong thân
  kyS02: "2031-07", // kỳ số liệu S02
};
const ID = {
  thiTruong: "vn-drl-thi-truong",
  thiTruongKhongS02: "vn-drl-thi-truong-b",
  phuong: "vn-drl-thi-truong-phuong-1",
  tinCanh: "drl-offer-canh",
  bai: "drl-post-canh",
  snapshot: "drl-snapshot",
  s02: "drl-s02-market",
  listingKhongAnh: "drl-listing-khong-anh",
  listingCoAnh: "drl-listing-co-anh",
};
const ANH_TU_THU = "https://tu-thu.test/drl-anh-tu-thu.jpg";

// ── Bộ ghi câu SQL ────────────────────────────────────────────────────────────────────────────────────────────────
const cauSql: string[] = [];
const queryGoc = pool.query.bind(pool);
(pool as unknown as { query: (...a: unknown[]) => unknown }).query = (...a: unknown[]) => {
  const q = a[0];
  cauSql.push(typeof q === "string" ? q : String((q as { text?: string })?.text ?? ""));
  return (queryGoc as (...b: unknown[]) => unknown)(...a);
};
/** Gọi một đường và trả thân JSON, mã trạng thái, cùng các câu SQL phát ra trong lời gọi đó. */
async function goi(duong: string) {
  const tu = cauSql.length;
  const res = await app.request(duong);
  const than = (await res.json()) as Record<string, unknown>;
  return { status: res.status, than, vanBan: JSON.stringify(than), sql: cauSql.slice(tu) };
}
const sql = (q: string, p: unknown[] = []) => queryGoc(q, p) as Promise<{ rows: Record<string, unknown>[] }>;

/** Mọi khoá của một giá trị JSON, quét đệ quy. */
function moiKhoa(v: unknown, ra = new Set<string>()): Set<string> {
  if (Array.isArray(v)) for (const x of v) moiKhoa(x, ra);
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      ra.add(k);
      moiKhoa(x, ra);
    }
  }
  return ra;
}
const coBang = (cau: string[], ...bang: string[]) => cau.filter((c) => bang.some((b) => c.includes(b)));
function chot(loi: string[]) {
  assert.equal(loi.length, 0, loi.join(" | "));
}

before(async () => {
  await sql(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES
       ($1, NULL, 'market', 'DRL Thị trường A', 'vn'),
       ($2, NULL, 'market', 'DRL Thị trường B', 'vn'),
       ($3, $1,   'ward',   'DRL Phường 1',     'vn')`,
    [ID.thiTruong, ID.thiTruongKhongS02, ID.phuong],
  );

  // Năm tin bán cùng phường × loại hình: đủ ngưỡng n ≥ 5 của thước CG8 (v_ruler_p2). Trung vị 50 triệu/m², tin canh 40 triệu/m².
  const tin = [ID.tinCanh, "drl-offer-2", "drl-offer-3", "drl-offer-4", "drl-offer-5"];
  for (const [i, id] of tin.entries()) {
    const perm2 = i === 0 ? 40_000_000 : 50_000_000;
    await sql(
      `INSERT INTO sale_offer_records
         (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, bedrooms, confidence, first_seen, last_seen,
          n_reposts, post_ids, source, property_type)
       VALUES ($1, 'sale', $2, $3, 70, $4, 2, 'high', now() - interval '3 days', now(), 1, $5, 'S03', 'apartment')`,
      [id, ID.phuong, perm2 * 70, perm2, i === 0 ? [ID.bai] : []],
    );
    const { rows } = await sql(
      `INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, 'apartment') RETURNING id`,
      [ID.phuong],
    );
    await sql(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [rows[0].id, id]);
  }
  await sql(
    `INSERT INTO offer_price_rank
       (offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, pn_nhom, n, trung_vi, p20, hang_pct,
        duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
     VALUES ($1, 'sale', 'apartment', 2, 'gia-m2', 40000000, 'phuong', $2, NULL, 12, 50000000, 42000000, 8.3,
             20.0, 're-trong-phuong', false, NULL, 'drl-run')`,
    [ID.tinCanh, ID.phuong],
  );

  // Bài gốc S03 của tin canh — bốn thứ luật 6 cấm ra khỏi Ops.
  await sql(
    `INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'drl', 'S03', '{}'::jsonb)`,
    [ID.snapshot],
  );
  await sql(
    `INSERT INTO stg_zalo_posts (post_id, snapshot_id, group_name, sender_name, text, media, captured_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, now())`,
    [ID.bai, ID.snapshot, CANH.nhom, CANH.nguoiGui, `${CANH.chuBai} bán căn 2PN`, JSON.stringify([{ path: CANH.anhBai }])],
  );

  // Hai listing tự thu thuộc thị trường A; listing không ảnh trùng id với một dòng S02 mang ảnh và đường dẫn canh.
  await sql(
    `INSERT INTO listing_records (id, area_id, name, room_type, property_type, bedrooms, price_listed, last_seen, photo_urls)
     VALUES ($1, $3, 'DRL không ảnh', 'entire_home', 'apartment', 1, 900000, current_date, NULL),
            ($2, $3, 'DRL có ảnh',    'entire_home', 'apartment', 2, 1200000, current_date, $4::jsonb)`,
    [ID.listingKhongAnh, ID.listingCoAnh, ID.phuong, JSON.stringify([ANH_TU_THU])],
  );
  await sql(`INSERT INTO airdna_markets (airdna_id) VALUES ($1)`, [ID.s02]);
  await sql(`INSERT INTO area_sources (area_id, source, source_area_key) VALUES ($1, 'S02', $2)`, [ID.thiTruong, ID.s02]);
  await sql(
    `INSERT INTO airdna_market_metrics (airdna_id, metric, period, value) VALUES ($1, 'listing_count', $2, $3)`,
    [ID.s02, CANH.kyS02, CANH.soS02],
  );
  await sql(
    `INSERT INTO airdna_listings (id, airdna_market_id, title, photo_urls, listing_url)
     VALUES ($1, $2, 'DRL S02', $3::jsonb, $4)`,
    [ID.listingKhongAnh, ID.s02, JSON.stringify([CANH.anhS02]), CANH.urlS02],
  );
});

after(async () => {
  await pool.end();
});

// DB thử chép từ dữ liệu thật (db-thu --chay): deals lấy 30 tin giảm sâu nhất, listings 50 tên đầu, nên gọi trần thì tin thật
// đẩy dòng cấy ra khỏi trang. Mọi lời gọi danh sách lọc theo phường canh (?area=), cả bản route mới lẫn bản cũ đều nhận tham số này.
const KHOA_CAM_DEALS = ["contact", "postText", "senderName", "groupName", "mediaPath"];
const CANH_S03 = [CANH.nhom, CANH.nguoiGui, CANH.chuBai, CANH.anhBai];

test("DRL-AC-1 deals không trả nội dung bài S03", async () => {
  const r = await goi(`/v1/deals?area=${ID.phuong}`);
  assert.equal(r.status, 200);
  const data = r.than.data as Record<string, unknown>[];
  const tin = data.find((d) => d.offerId === ID.tinCanh);
  assert.ok(tin, "DRL deals thiếu tin canh trong data");
  // Phần giữ lại vẫn đúng dòng cấy.
  assert.equal(tin.priceVnd, 40_000_000 * 70);
  assert.equal(tin.discountPct, 20);
  assert.equal((tin.rank as Record<string, unknown>).label, "re-trong-phuong");
  assert.equal((r.than.meta as Record<string, unknown>).kind, "sale");

  const loi: string[] = [];
  const khoa = moiKhoa(r.than);
  for (const k of KHOA_CAM_DEALS) if (khoa.has(k)) loi.push(`DRL deals lộ khoá cấm: ${k}`);
  for (const c of CANH_S03) if (r.vanBan.includes(c)) loi.push(`DRL deals lộ chuỗi canh: ${c}`);
  chot(loi);
});

test("DRL-AC-2 deals không đọc stg_zalo_posts ở hai nhánh", async () => {
  const loi: string[] = [];

  // Nhánh có bảng hạng.
  const hang = await goi(`/v1/deals?area=${ID.phuong}`);
  assert.equal(hang.status, 200);
  if (!hang.sql.some((c) => c.includes("FROM sale_offers"))) loi.push("DRL bộ ghi SQL không bắt được câu nào (nhánh bảng hạng)");
  if (coBang(hang.sql, "stg_zalo_posts").length) loi.push("DRL deals đọc stg_zalo_posts (nhánh bảng hạng)");

  // Nhánh thước CG8: bảng hạng rỗng → route lùi về v_ruler_p2.
  await sql(`DELETE FROM offer_price_rank`);
  try {
    const cg8 = await goi(`/v1/deals?area=${ID.phuong}`);
    assert.equal(cg8.status, 200);
    if (!cg8.sql.some((c) => c.includes("v_ruler_p2"))) loi.push("DRL bộ ghi SQL không bắt được câu nào (nhánh CG8)");
    if (coBang(cg8.sql, "stg_zalo_posts").length) loi.push("DRL deals đọc stg_zalo_posts (nhánh CG8)");
    const tin = (cg8.than.data as Record<string, unknown>[]).find((d) => d.offerId === ID.tinCanh);
    if (!tin) loi.push("DRL deals CG8 đổi hình: thiếu tin canh");
    else {
      for (const k of ["priceVnd", "medianPerm2", "discountPct"]) {
        if (typeof tin[k] !== "number") loi.push(`DRL deals CG8 đổi hình: ${k}`);
      }
      if (tin.medianPerm2 !== 50_000_000 || tin.discountPct !== 20) loi.push("DRL deals CG8 đổi hình: số trung vị hay số giảm lệch dòng cấy");
      if ("rank" in tin) loi.push("DRL deals CG8 đổi hình: rank");
    }
    if ("kind" in (cg8.than.meta as Record<string, unknown>)) loi.push("DRL deals CG8 đổi hình: meta.kind");
  } finally {
    await sql(
      `INSERT INTO offer_price_rank
         (offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, n, trung_vi, p20, hang_pct,
          duoi_trung_vi_pct, nhan, run_id)
       VALUES ($1, 'sale', 'apartment', 2, 'gia-m2', 40000000, 'phuong', $2, 12, 50000000, 42000000, 8.3, 20.0,
               're-trong-phuong', 'drl-run')`,
      [ID.tinCanh, ID.phuong],
    );
  }
  chot(loi);
});

const KHOA_CAM_COVERAGE = ["calibrationActive", "calibrationPeriod", "calibrationUniverse", "historyMonths", "coverageRatio"];

test("DRL-AC-3 coverage không đọc S02", async () => {
  const r = await goi("/v1/coverage");
  assert.equal(r.status, 200);
  const data = r.than.data as Record<string, unknown>[];
  const loi: string[] = [];

  const a = data.find((d) => d.areaId === ID.thiTruong);
  const b = data.find((d) => d.areaId === ID.thiTruongKhongS02);
  if (!a) loi.push("DRL coverage thiếu thị trường canh");
  else {
    if (a.name !== "DRL Thị trường A") loi.push("DRL coverage đổi hình: name");
    if (a.ourListings !== 2) loi.push(`DRL coverage đổi hình: ourListings = ${String(a.ourListings)}, phải là 2 tin tự thu`);
  }
  // Thị trường không có dữ liệu S02 vẫn phải có mặt — bản cũ nối trong với bảng S02 nên bỏ rơi nó.
  if (!b) loi.push("DRL coverage bỏ thị trường không có S02 khỏi danh sách");
  else if (b.ourListings !== 0) loi.push("DRL coverage đổi hình: thị trường B ourListings khác 0");

  const khoa = moiKhoa(r.than);
  for (const k of KHOA_CAM_COVERAGE) if (khoa.has(k)) loi.push(`DRL coverage lộ khoá cấm: ${k}`);
  for (const c of [CANH.soS02, CANH.kyS02]) if (r.vanBan.includes(c)) loi.push(`DRL coverage lộ chuỗi canh: ${c}`);

  if (r.sql.length === 0) loi.push("DRL bộ ghi SQL không bắt được câu nào (coverage)");
  if (coBang(r.sql, "airdna_", "area_sources").length) loi.push("DRL coverage đọc bảng S02");
  chot(loi);
});

test("DRL-AC-4 listings/:id không đọc S02", async () => {
  const loi: string[] = [];

  const khongAnh = await goi(`/v1/listings/${ID.listingKhongAnh}`);
  assert.equal(khongAnh.status, 200);
  const d1 = khongAnh.than.data as Record<string, unknown>;
  const p1 = d1.photos as Record<string, unknown>;
  if (p1.urls !== null || p1.source !== null) loi.push(`DRL listings/:id lộ ảnh S02: photos = ${JSON.stringify(p1)}`);

  const coAnh = await goi(`/v1/listings/${ID.listingCoAnh}`);
  assert.equal(coAnh.status, 200);
  const p2 = (coAnh.than.data as Record<string, unknown>).photos as Record<string, unknown>;
  assert.equal(p2.source, "self");
  assert.deepEqual(p2.urls, [ANH_TU_THU]);

  const khongCo = await goi("/v1/listings/drl-khong-co");
  assert.equal(khongCo.status, 404);
  assert.equal((khongCo.than.error as Record<string, unknown>).code, "NOT_FOUND");

  for (const r of [khongAnh, coAnh]) {
    if (moiKhoa(r.than).has("listingUrl")) loi.push("DRL listings/:id lộ khoá cấm: listingUrl");
    for (const c of [CANH.anhS02, CANH.urlS02]) if (r.vanBan.includes(c)) loi.push(`DRL listings/:id lộ chuỗi canh: ${c}`);
  }
  const moiCau = [...khongAnh.sql, ...coAnh.sql, ...khongCo.sql];
  if (moiCau.length === 0) loi.push("DRL bộ ghi SQL không bắt được câu nào (listings/:id)");
  if (coBang(moiCau, "airdna_").length) loi.push("DRL listings/:id đọc bảng S02");
  chot([...new Set(loi)]);
});

const KHOA_DANH_SACH = [
  "area", "bedrooms", "id", "lat", "lng", "market", "name", "photoUrls", "priceListed", "reviewCount", "roomType", "stats",
];

test("DRL-AC-5 listings danh sách giữ hình", async () => {
  const r = await goi(`/v1/listings?area=${ID.phuong}`);
  assert.equal(r.status, 200);
  const dong = (r.than.data as Record<string, unknown>[]).find((d) => d.id === ID.listingCoAnh);
  assert.ok(dong, "DRL listings danh sách đổi hình: thiếu listing cấy");
  const co = Object.keys(dong).sort();
  const thua = co.filter((k) => !KHOA_DANH_SACH.includes(k));
  const thieu = KHOA_DANH_SACH.filter((k) => !co.includes(k));
  assert.deepEqual([...thua, ...thieu], [], `DRL listings danh sách đổi hình: ${[...thua, ...thieu].join(", ")}`);
});

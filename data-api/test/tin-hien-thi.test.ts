/**
 * PB7 (`_acceptance/data-api-tin-hien-thi`): /v1/listings không bao giờ trả tin của nguồn không hiển thị công khai
 * (`SOURCE_HIDDEN` — sinh từ `nguon_khong_hien_thi` của pipeline/mappings.yaml; hôm nay S02, S08).
 *
 * Ma trận ô viết trước: mỗi ô kiểm (a) không tin ẩn nào lọt, (b) tin S06 đối chứng của ô có mặt. Mọi lỗi gom rồi báo một lần
 * (không dừng ở ô đầu) để probe pha.mjs đếm được thông điệp theo từng ô.
 * Chạy (từ gốc monorepo):
 *   bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test test/tin-hien-thi.test.ts'
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`PB7 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
delete process.env.DATA_API_KEYS;
delete process.env.LISTING_KEY_SECRET;
process.env.NODE_ENV = "test";

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");

const HAT = (process.env.PB7_HAT ?? String(process.pid)).replace(/[^0-9]/g, "").padStart(5, "0").slice(-5);
const TT = `vn-pb7${HAT}`;
const PH = `${TT}-phuong-1`;
const NUT = `97${HAT}`; // mã nút dự án (số) cho ô project
const id = (s: string) => `pb7-${HAT}-${s}`;
const AN = { S02: id("an-s02"), S08: id("an-s08") } as const; // tin nguồn ẩn: S02 bán, S08 thuê dài
const DC_BAN = id("dc-ban"), DC_THUE = id("dc-thue"); // tin S06 đối chứng
const CG8 = [1, 2, 3, 4].map((i) => id(`cg8-${i}`)); // đủ năm căn S06 cùng phường × loại cho thước CG8 (cùng DC_BAN)
const NGAN_TEN = `PB7 Căn ngắn hạn ${HAT}`;

const sql = (q: string, p: unknown[] = []) => pool.query(q, p) as Promise<{ rows: Record<string, any>[] }>;
async function goi(duong: string) {
  const res = await app.request(duong);
  const than = (await res.json()) as Record<string, any>;
  return { status: res.status, than, vanBan: JSON.stringify(than) };
}
async function cayTin(oid: string, kind: string, source: string, o: { gia: number; perm2: number }) {
  await sql(
    `INSERT INTO sale_offer_records (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, bedrooms, bathrooms, confidence,
       first_seen, last_seen, n_reposts, source, property_type, latitude, longitude, offer_status)
     VALUES ($1, $2, $3, $4, 70, $5, 2, 2, 'high', '2026-11-01T00:00:00Z', now() - interval '1 day', 1, $6, 'apartment', 21.03, 105.85, 'active')`,
    [oid, kind, PH, o.gia, o.perm2, source],
  );
}
async function hang(oid: string, kind: string, cap: string, nut: string) {
  await sql(`DELETE FROM offer_price_rank WHERE offer_id = $1`, [oid]);
  await sql(
    `INSERT INTO offer_price_rank (offer_id, kind, property_type, thuoc, cap, nut, n, trung_vi, p20, hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
     VALUES ($1, $2, 'apartment', 'gia-m2', $3, $4, 12, 90000000, 75000000, 8, 20.0, 're-trong-phuong', false, 'pb7', 'pb7-run')`,
    [oid, kind, cap, nut],
  );
}

before(async () => {
  await sql(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'market', $3, 'vn'), ($2, $1, 'submarket', $4, 'vn')`,
    [TT, PH, `PB7 Thị trường ${HAT}`, `PB7 Phường ${HAT}`]);
  await cayTin(AN.S02, "sale", "S02", { gia: 3_150_000_000, perm2: 45_000_000 });
  await cayTin(AN.S08, "rent_lt", "S08", { gia: 12_000_000, perm2: 171_428 });
  await cayTin(DC_BAN, "sale", "S06", { gia: 2_800_000_000, perm2: 40_000_000 });
  await cayTin(DC_THUE, "rent_lt", "S06", { gia: 15_000_000, perm2: 214_285 });
  for (const oid of CG8) await cayTin(oid, "sale", "S06", { gia: 3_500_000_000, perm2: 50_000_000 });
  await sql(
    `INSERT INTO listings (id, area_id, name, room_type, property_type, bedrooms, bathrooms, accommodates, price_listed, minimum_nights,
       latitude, longitude, last_seen, photo_urls, review_count)
     VALUES ($1, $2, $3, 'Entire home/apt', 'Apartment', 2, 1, 3, 900000, 2, 21.03, 105.85, now(), NULL, 1)`,
    [`abnb_97${HAT}01`, PH, NGAN_TEN],
  );
});

after(async () => {
  await pool.end();
});

type O = { o: string; duong: string; dc: string[]; ngan?: boolean };
/** Gọi một ô (phân trang hết khi ô là trang), trả các phần tử. */
async function phanTu(duong: string): Promise<any[]> {
  if (!duong.includes("limit=2")) return (await goi(duong)).than.data ?? [];
  const tat: any[] = [];
  for (let off = 0; off < 400; off += 2) {
    const d = (await goi(`${duong}&offset=${off}`)).than.data ?? [];
    tat.push(...d);
    if (d.length < 2) break;
  }
  return tat;
}
/** Soát một ô: tin ẩn lọt, đối chứng vắng — gom vào `loi`. */
async function soat(o: O, loi: string[]) {
  const ds = await phanTu(o.duong);
  const khoa = new Set(ds.map((x) => x.listingKey));
  const vanBan = JSON.stringify(ds);
  for (const [nguon, oid] of Object.entries(AN)) {
    if (vanBan.includes(oid) || ds.some((x) => x.originatingSystemName === nguon)) loi.push(`PB7 nguồn ẩn lọt ra API: ${nguon} ở ${o.o}`);
  }
  for (const k of o.dc) if (!khoa.has(k)) loi.push(`PB7 đối chứng S06 vắng ở ${o.o}`);
  if (o.ngan && !ds.some((x) => x.kind === "rent_st" && x.listingTitle === NGAN_TEN)) loi.push(`PB7 đối chứng S01 vắng ở ${o.o}`);
  for (const x of ds) if (x.kind === "rent_st" && x.originatingSystemName !== "S01") loi.push(`PB7 rent_st không mang S01 ở ${o.o}`);
}

// Ma trận AC-3 viết trước: 4 đường × 5 bộ lọc (mọi bộ lọc có phạm vi khu vực — DB thử là bản chép DB thật).
const DUONG = [
  { ten: "khong-kind", q: "", dc: [DC_BAN, DC_THUE], ngan: true },
  { ten: "sale", q: "kind=sale&", dc: [DC_BAN], ngan: false },
  { ten: "rent_lt", q: "kind=rent_lt&", dc: [DC_THUE], ngan: false },
  { ten: "rent_st", q: "kind=rent_st&", dc: [], ngan: true },
] as const;
const LOC = [
  { ten: "area", q: `area=${PH}&limit=200` },
  { ten: "market", q: `market=${TT}&limit=200` },
  { ten: "area+bedroomsTotal", q: `area=${PH}&bedroomsTotal=2&limit=200` },
  { ten: "market+bedroomsTotal", q: `market=${TT}&bedroomsTotal=2&limit=200` },
  { ten: "area+trang", q: `area=${PH}&limit=2` },
] as const;
const MA_TRAN_3: O[] = DUONG.flatMap((d) => LOC.map((l) => ({ o: `${d.ten}·${l.ten}`, duong: `/v1/listings?${d.q}${l.q}`, dc: [...d.dc], ngan: d.ngan })));

test("PB7-AC-3 nguồn ẩn vắng ở mọi nhánh và bộ lọc", async () => {
  assert.equal(MA_TRAN_3.length, DUONG.length * LOC.length, "PB7 ma trận thiếu ô");
  const loi: string[] = [];
  let so = 0;
  for (const o of MA_TRAN_3) { await soat(o, loi); so++; }
  assert.equal(so, MA_TRAN_3.length, "PB7 ma trận thiếu ô");
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

test("PB7-AC-4 nguồn ẩn vắng ở căn giá tốt", async () => {
  // Nhánh bảng hạng: hai tin ẩn và hai tin đối chứng có dòng hạng; tin S02 + DC_BAN ở cấp dự án (ô project).
  await hang(AN.S02, "sale", "du_an", NUT);
  await hang(DC_BAN, "sale", "du_an", NUT);
  await hang(AN.S08, "rent_lt", "phuong", PH);
  await hang(DC_THUE, "rent_lt", "phuong", PH);
  const g = `/v1/listings?minBelowMedianPct=0&area=${PH}`;
  const HANG: O[] = [
    { o: "hang·khong-kind", duong: g, dc: [DC_BAN, DC_THUE] },
    { o: "hang·sale", duong: `${g}&kind=sale`, dc: [DC_BAN] },
    { o: "hang·rent_lt", duong: `${g}&kind=rent_lt`, dc: [DC_THUE] },
    { o: "hang·project", duong: `${g}&project=${NUT}`, dc: [DC_BAN] },
  ];
  const loi: string[] = [];
  for (const o of HANG) await soat(o, loi);
  // Nhánh thước CG8: bảng hạng rỗng; nhóm phường × căn hộ có năm căn S06 (DC_BAN + 4) và tin S02.
  await sql(`DELETE FROM offer_price_rank`);
  for (const oid of [DC_BAN, ...CG8, AN.S02]) {
    const { rows } = await sql(`INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, 'apartment') RETURNING id`, [PH]);
    await sql(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [rows[0].id, oid]);
  }
  const CG: O[] = [
    { o: "cg8·khong-kind", duong: g, dc: [DC_BAN] },
    { o: "cg8·sale", duong: `${g}&kind=sale`, dc: [DC_BAN] },
  ];
  for (const o of CG) await soat(o, loi);
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

test("PB7-AC-5 chi tiết tin nguồn ẩn là 404", async () => {
  const loi: string[] = [];
  const khong = await goi(`/v1/listings/pb7-${HAT}-khong-co`);
  if (khong.status !== 404 || khong.than.error?.code !== "NOT_FOUND") loi.push("PB7 mốc khoá không có không phải 404 NOT_FOUND");
  /** Thân hai lời đáp khác nhau (so cả thân, không chỉ mã) — tin ẩn phải y hệt khoá không có, không lộ là «có mà ẩn». */
  const thanKhac = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);
  // Đối chứng cùng ca: một thân 404 khác chữ phải bị bộ so bắt.
  assert.ok(thanKhac({ error: { code: "NOT_FOUND", message: "Listing hidden" } }, khong.than), "PB7 bộ so thân không bắt được thân khác");
  for (const [nguon, oid] of Object.entries(AN)) {
    const r = await goi(`/v1/listings/${oid}`);
    if (r.status !== khong.status || thanKhac(r.than, khong.than)) loi.push(`PB7 nguồn ẩn lọt ra API: ${nguon} ở chi-tiet`);
  }
  const dc = await goi(`/v1/listings/${DC_BAN}`);
  if (dc.status !== 200) loi.push("PB7 đối chứng S06 vắng ở chi-tiet");
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

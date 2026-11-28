/**
 * PB10 (`_acceptance/data-api-nguon-an-dong-khi-so-rong`): sổ nguồn ẩn hỏng thì /v1/listings ĐÓNG (503
 * HIDDEN_SOURCES_NOT_CONFIGURED) trước khi chạm DB, không lặng lẽ trả tin của nguồn phải ẩn.
 *
 * Route dựng bằng `taoListingsRoute(<sổ>)` trong tiến trình test — không sửa tệp sinh trong cây nguồn.
 * Mọi lỗi gom rồi báo một lần để probe pha.mjs đếm thông điệp theo ô.
 * Chạy (từ gốc monorepo):
 *   bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test test/nguon-an-dong.test.ts'
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { Hono } from "hono";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`PB10 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
delete process.env.DATA_API_KEYS;
delete process.env.LISTING_KEY_SECRET;
process.env.NODE_ENV = "test";

const { pool } = await import("../src/db/client.js");
const { taoListingsRoute } = await import("../src/routes/listings.js");
const { kiemNguonAn, LOI_NGUON_AN } = await import("../src/lib/nguon-an.js");
const { SOURCE_HIDDEN } = await import("../src/contract/vocab.generated.js");
const { default: appThat } = await import("../src/app.js");

// Bộ ghi SQL: mọi câu đi qua pool trong lúc gọi route.
const cauSql: string[] = [];
const queryGoc = pool.query.bind(pool);
(pool as any).query = (...a: unknown[]) => {
  const text = typeof a[0] === "string" ? a[0] : String((a[0] as { text?: string })?.text ?? "");
  cauSql.push(text);
  return (queryGoc as (...b: unknown[]) => unknown)(...a);
};
const sql = (q: string, p: unknown[] = []) => queryGoc(q, p) as Promise<{ rows: Record<string, any>[] }>;
const docBangTin = (t: string) => /\b(sale_offers|sale_offer_records|listings)\b/.test(t);

const HAT = String(process.pid).replace(/[^0-9]/g, "").padStart(5, "0").slice(-5);
const TT = `vn-pb10${HAT}`;
const PH = `${TT}-phuong-1`;
const NUT = `96${HAT}`;
const id = (s: string) => `000000pb10-${HAT}-${s}`; // xếp đầu theo listingKey: đường không lọc thấy ngay trang đầu
const AN = { S02: id("an-s02"), S08: id("an-s08") } as const;
const DC_BAN = id("dc-ban"), DC_THUE = id("dc-thue");
const NGAN_ID = `abnb_96${HAT}01`;
const CAY = [AN.S02, AN.S08, DC_BAN, DC_THUE, NGAN_ID];

async function cayTin(oid: string, kind: string, source: string, gia: number, perm2: number) {
  await sql(
    `INSERT INTO sale_offer_records (offer_id, kind, area_id, price_vnd, area_m2, price_perm2, bedrooms, bathrooms, confidence,
       first_seen, last_seen, n_reposts, source, property_type, latitude, longitude, offer_status)
     VALUES ($1, $2, $3, $4, 70, $5, 2, 2, 'high', '2026-11-01T00:00:00Z', now() - interval '1 day', 1, $6, 'apartment', 21.03, 105.85, 'active')`,
    [oid, kind, PH, gia, perm2, source],
  );
}
async function hang(oid: string, kind: string, cap: string, nut: string) {
  await sql(
    `INSERT INTO offer_price_rank (offer_id, kind, property_type, thuoc, cap, nut, n, trung_vi, p20, hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do, run_id)
     VALUES ($1, $2, 'apartment', 'gia-m2', $3, $4, 12, 90000000, 75000000, 8, 49.0, 're-trong-phuong', false, 'pb10', 'pb10-run')`,
    [oid, kind, cap, nut],
  );
}

before(async () => {
  await sql(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, NULL, 'market', $3, 'vn'), ($2, $1, 'submarket', $4, 'vn')`,
    [TT, PH, `PB10 Thị trường ${HAT}`, `PB10 Phường ${HAT}`]);
  await cayTin(AN.S02, "sale", "S02", 3_150_000_000, 45_000_000);
  await cayTin(AN.S08, "rent_lt", "S08", 12_000_000, 171_428);
  await cayTin(DC_BAN, "sale", "S06", 2_800_000_000, 40_000_000);
  await cayTin(DC_THUE, "rent_lt", "S06", 15_000_000, 214_285);
  await hang(AN.S02, "sale", "du_an", NUT);
  await hang(DC_BAN, "sale", "du_an", NUT);
  await hang(AN.S08, "rent_lt", "phuong", PH);
  await hang(DC_THUE, "rent_lt", "phuong", PH);
  await sql(
    `INSERT INTO listings (id, area_id, name, room_type, property_type, bedrooms, bathrooms, accommodates, price_listed, minimum_nights,
       latitude, longitude, last_seen, photo_urls, review_count)
     VALUES ($1, $2, $3, 'Entire home/apt', 'Apartment', 2, 1, 3, 900000, 2, 21.03, 105.85, now(), NULL, 1)`,
    [NGAN_ID, PH, `PB10 Căn ngắn hạn ${HAT}`],
  );
});

after(async () => {
  await pool.end();
});

/** Khoá ngắn hạn của tin cấy (HMAC — lấy từ chính route thật, không tự tính). */
async function khoaNganHan(): Promise<string> {
  const r = await appThat.request(`/v1/listings?kind=rent_st&area=${PH}&limit=200`);
  const d = ((await r.json()) as any).data ?? [];
  const x = d.find((y: any) => y.listingTitle === `PB10 Căn ngắn hạn ${HAT}`);
  assert.ok(x, "PB10 không tìm được khoá ngắn hạn của tin cấy (đối chứng chi tiết ngắn hạn)");
  return x.listingKey;
}

// ── AC-1: bộ kiểm sổ ───────────────────────────────────────────────────────────────────────────────────────────────
const TRANG_THAI: [string, unknown, string[] | null][] = [
  ["hop-le", ["S02", "S08"], ["S02", "S08"]],
  ["rong", [], null],
  ["phan-tu-rong", [""], null],
  ["sai-khuon", ["S2"], null],
  ["khoang-trang", [" S02"], null],
  ["trung", ["S02", "S02"], null],
  ["undefined", undefined, null],
  ["null", null, null],
  ["khong-phai-mang", "S02", null],
];
const HONG = TRANG_THAI.filter(([, , mong]) => mong === null);

test("PB10-AC-1 bộ kiểm sổ nguồn ẩn", () => {
  assert.equal(TRANG_THAI.length, 9, "PB10 ma trận trạng thái sổ thiếu ô");
  const loi: string[] = [];
  let so = 0;
  for (const [ten, vao, mong] of TRANG_THAI) {
    let ra: string[] | null;
    try { ra = kiemNguonAn(vao); } catch (e) { loi.push(`PB10 bộ kiểm ném lỗi: ${ten} (${(e as Error).message})`); so++; continue; }
    if (mong === null && ra !== null) loi.push(`PB10 sổ hỏng được nhận: ${ten}`);
    if (mong !== null && JSON.stringify(ra) !== JSON.stringify(mong)) loi.push(`PB10 sổ hợp lệ bị từ chối: ${ten}`);
    so++;
  }
  assert.equal(so, 9, "PB10 ma trận trạng thái sổ thiếu ô");
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

// ── AC-2: sổ hỏng → mọi đường đóng ─────────────────────────────────────────────────────────────────────────────────
const DUONG_DS = [
  { ten: "khong-kind", q: "" },
  { ten: "sale", q: "kind=sale&" },
  { ten: "rent_lt", q: "kind=rent_lt&" },
  { ten: "rent_st", q: "kind=rent_st&" },
  { ten: "gia-tot", q: "minBelowMedianPct=0&" },
  { ten: "gia-tot-project", q: `minBelowMedianPct=0&project=${NUT}&` },
] as const;
const LOC = [
  { ten: "khong-loc", q: "limit=200" },
  { ten: "area", q: `area=${PH}&limit=200` },
  { ten: "market+bedroomsTotal", q: `market=${TT}&bedroomsTotal=2&limit=200` },
  { ten: "trang", q: `area=${PH}&limit=2&offset=0` },
] as const;
type O = { o: string; duong: string; bang: "sale_offers" | "listings"; banThue: boolean };
async function maTranDuong(): Promise<O[]> {
  const ds: O[] = DUONG_DS.flatMap((d) => LOC.map((l) => ({
    o: `${d.ten}·${l.ten}`, duong: `/v1/listings?${d.q}${l.q}`,
    bang: d.ten === "rent_st" ? "listings" as const : "sale_offers" as const, banThue: d.ten !== "rent_st",
  })));
  ds.push({ o: "chi-tiet-s02", duong: `/v1/listings/${AN.S02}`, bang: "sale_offers", banThue: true });
  ds.push({ o: "chi-tiet-s06", duong: `/v1/listings/${DC_BAN}`, bang: "sale_offers", banThue: false });
  ds.push({ o: "chi-tiet-ngan-han", duong: `/v1/listings/${await khoaNganHan()}`, bang: "listings", banThue: false });
  return ds;
}
const appVoi = (so: unknown) => new Hono().route("/v1/listings", taoListingsRoute(so));
// Ô mà tin nguồn ẩn lọt khi sổ rỗng và chốt bị bỏ (đối chiếu cho probe pha — chỉ dùng trong thông điệp).
const O_LOT_KHI_RONG = new Set(["khong-kind·khong-loc", "sale·khong-loc", "rent_lt·khong-loc", "gia-tot·khong-loc", "gia-tot-project·khong-loc", "chi-tiet-s02"]);

test("PB10-AC-2 sổ hỏng thì /v1/listings đóng", async () => {
  const O = await maTranDuong();
  assert.equal(O.length, 27, "PB10 ma trận đường thiếu ô");
  const loi: string[] = [];
  let so = 0;
  for (const [ten, vao] of HONG) {
    const app = appVoi(vao);
    for (const o of O) {
      const tu = cauSql.length;
      let res: Response;
      try { res = await app.request(o.duong); } catch (e) { loi.push(`PB10 nguồn ẩn mở khi sổ ${ten}: ${o.o} (ném ${(e as Error).message})`); so++; continue; }
      const vanBan = await res.text();
      const cau = cauSql.slice(tu).filter(docBangTin);
      if (res.status !== 503 || vanBan !== JSON.stringify({ error: LOI_NGUON_AN })) loi.push(`PB10 nguồn ẩn mở khi sổ ${ten}: ${o.o} (${res.status})`);
      if (CAY.some((k) => vanBan.includes(k)) || /S02|S08/.test(vanBan.replace(LOI_NGUON_AN.message, ""))) {
        if (ten === "rong" && O_LOT_KHI_RONG.has(o.o)) loi.push(`PB10 tin nguồn ẩn lọt khi sổ rỗng: ${o.o}`);
        else loi.push(`PB10 thân đóng mang tin: ${ten}·${o.o}`);
      }
      if (cau.length) loi.push(`PB10 route chạm bảng tin khi sổ ${ten}: ${o.o}`);
      so++;
    }
  }
  assert.equal(so, HONG.length * 27, "PB10 ma trận sổ hỏng × đường thiếu ô");
  assert.equal(so, 216, "PB10 ma trận sổ hỏng × đường thiếu ô");
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

test("PB10-AC-2 đối chứng: sổ hợp lệ thì cùng 27 đường mở và bộ ghi SQL thấy câu đọc bảng tin", async () => {
  const O = await maTranDuong();
  const hopLe = appVoi(SOURCE_HIDDEN);
  const loi: string[] = [];
  for (const o of O) {
    const tu = cauSql.length;
    const a = await hopLe.request(o.duong);
    const b = await appThat.request(o.duong);
    if (a.status !== b.status) loi.push(`PB10 đối chứng lệch route thật: ${o.o} (${a.status} ≠ ${b.status})`);
    if (a.status === 503) loi.push(`PB10 đối chứng đóng khi sổ hợp lệ: ${o.o}`);
    const cau = cauSql.slice(tu).filter((t) => new RegExp(`\\b${o.bang}\\b`).test(t));
    if (!cau.length) loi.push(`PB10 bộ ghi SQL không thấy câu đọc ${o.bang}: ${o.o}`);
  }
  const ds = ((await (await hopLe.request(`/v1/listings?area=${PH}&limit=200`)).json()) as any).data ?? [];
  if (!ds.some((x: any) => x.listingKey === DC_BAN)) loi.push("PB10 đối chứng: tin S06 cấy vắng ở khong-kind·area khi sổ hợp lệ");
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

// ── AC-5: không lan ────────────────────────────────────────────────────────────────────────────────────────────────
test("PB10-AC-5 sổ hỏng không lan sang route khác", async () => {
  const { taoApp } = await import("../src/app.js");
  const loi: string[] = [];
  const DUONG_KHAC = ["/health", "/v1/markets", "/v1/price-stats?market=vn-hanoi", "/v1/coverage", `/v1/properties?project=${NUT}`];
  for (const so of [[], undefined]) {
    let app: any;
    try { app = taoApp(so); } catch (e) { loi.push(`PB10 app sập khi sổ ${JSON.stringify(so) ?? "undefined"}: ${(e as Error).message}`); continue; }
    for (const d of DUONG_KHAC) {
      const a = await app.request(d);
      const b = await appThat.request(d);
      if (a.status !== b.status) loi.push(`PB10 sổ hỏng lan sang ${d}: ${a.status} ≠ ${b.status}`);
    }
    const l = await app.request("/v1/listings?limit=1");
    if (l.status !== 503) loi.push(`PB10 app dựng với sổ hỏng không đóng /v1/listings: ${l.status}`);
  }
  assert.deepEqual(loi, [], `\n${loi.join("\n")}`);
});

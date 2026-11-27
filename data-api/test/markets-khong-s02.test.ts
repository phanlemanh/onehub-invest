/**
 * HT20 (data-api-markets-khong-doc-s02) — bốn đường /v1/markets không đọc, không trả số S02 (AGENTS.md luật 5).
 *
 * Chạy trên DB thử có lược đồ thật (bản chép dữ liệu thật: 34 thị trường VN, 29 có điểm S02):
 *   bash db/db-thu.sh oneinvest_suite_dapi_mk --chay sh -c 'cd data-api && node --import tsx --test test/markets-khong-s02.test.ts'
 * Dòng cấy ở quốc gia riêng `zz` để không lẫn thị trường thật; điểm và chỉ số canh lớn hơn mọi số thật. Mỗi ca khẳng định
 * dòng cấy có mặt trước khi soát chuỗi canh. Hạt HT20_HAT cho phép chạy lặp trên cùng DB (probe đối chứng E6).
 * Thông điệp ghim «HT20-AC-n …».
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const url = process.env.DATABASE_URL ?? "";
const tenDb = url.split("?")[0].split("/").pop() ?? "";
if (!tenDb.includes("_suite_")) {
  throw new Error(`HT20 từ chối chạy: DATABASE_URL phải trỏ DB thử oneinvest_suite_* (đang là «${tenDb || "trống"}»)`);
}
delete process.env.DATA_API_KEYS;
process.env.NODE_ENV = "test";

const { pool } = await import("../src/db/client.js");
const { default: app } = await import("../src/app.js");

const DATA_API = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HAT = (process.env.HT20_HAT ?? String(process.pid)).replace(/[^0-9]/g, "").padStart(5, "0").slice(-5);
const ma = (s: string) => `vn-ht20${HAT}-${s}`;
const A = ma("a"), B = ma("b"), C = ma("c");
const A1 = `${A}-1`, A2 = `${A}-2`;
// Tên bảng nguồn trong chuỗi nháy đơn đúng bằng định danh đã biết (lưới tên nguồn PB5).
const BANG_THI_TRUONG = 'airdna_markets';
const BANG_DIEM = 'airdna_scores';
const BANG_TIEU_VUNG = 'airdna_submarket_metrics';
const BANG_THANG = 'airdna_market_metrics';
const TIEN_TO_S02 = 'airdna_listings'.slice(0, -"listings".length);
const CANH = {
  diem: "9871.37",        // điểm S02 — lớn hơn mọi điểm thật (≤ 100)
  diemCon: "8862.41",
  chiSoCon: "CANH-HT20-CHI-SO-TIEU-VUNG",
  thang: "7753.19",
  ky: "2039-04",
};
const CANH_MOI = Object.values(CANH);

// ── Bộ ghi SQL: văn bản câu + mảng tham số ─────────────────────────────────────────────────────────────────────────
type Cau = { text: string; params: unknown[] };
const cauSql: Cau[] = [];
const queryGoc = pool.query.bind(pool);
(pool as unknown as { query: (...a: unknown[]) => unknown }).query = (...a: unknown[]) => {
  const q = a[0];
  const text = typeof q === "string" ? q : String((q as { text?: string })?.text ?? "");
  const params = Array.isArray(a[1]) ? (a[1] as unknown[]) : ((q as { values?: unknown[] })?.values ?? []);
  cauSql.push({ text, params });
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
const tap = (o: object) => Object.keys(o).sort();
const soCanh = (t: string) => CANH_MOI.filter((c) => t.includes(c));

/** Câu SQL nào nhắc bảng S02 hay bảng nối khu nguồn, hoặc mang tham số 'S02'. */
function cauDocS02(cau: Cau[]): string[] {
  const ra: string[] = [];
  for (const c of cau) {
    if ([TIEN_TO_S02, "ref_calib_", "area_sources"].some((b) => c.text.includes(b))) ra.push(`câu: ${c.text.slice(0, 80)}`);
    if (c.params.some((p) => p === "S02" || (Array.isArray(p) && p.includes("S02")))) ra.push("tham số S02");
  }
  return ra;
}

before(async () => {
  await sql(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES
       ($1, NULL, 'market', $4, 'zz'), ($2, NULL, 'market', $5, 'zz'), ($3, NULL, 'market', $6, 'zz')`,
    [A, B, C, `HT20 Thị trường A ${HAT}`, `HT20 Thị trường B ${HAT}`, `HT20 Thị trường C ${HAT}`],
  );
  await sql(
    `INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES
       ($1, $3, 'submarket', $4, 'zz'), ($2, $3, 'submarket', $5, 'zz')`,
    [A1, A2, A, `HT20 Tiểu vùng 1 ${HAT}`, `HT20 Tiểu vùng 2 ${HAT}`],
  );
  // Số tin: A = 3 (2 ở A1, 1 ở A2), B = 1, C = 1. B có điểm S02 cao nhất mà ít tin.
  const tin: [string, string][] = [[A1, "1"], [A1, "2"], [A2, "3"], [B, "4"], [C, "5"]];
  for (const [khu, n] of tin) await sql(`INSERT INTO listings (id, area_id, name, last_seen) VALUES ($1, $2, 'HT20 listing', now())`, [`ht20-${HAT}-${n}`, khu]);
  // Dòng canh ở mọi bảng S02, nối qua bảng khu nguồn.
  await sql(`INSERT INTO area_sources (area_id, source, source_area_key) VALUES ($1, 'S02', $2), ($3, 'S02', $4)`, [B, `ht20-s02-${HAT}`, A2, `ht20-s02-sub-${HAT}`]);
  await sql(`INSERT INTO ${BANG_THI_TRUONG} (airdna_id, name, country_code) VALUES ($1, 'HT20 S02', 'zz')`, [`ht20-s02-${HAT}`]);
  await sql(`INSERT INTO ${BANG_DIEM} (airdna_id, total, seasonality, revenue_growth, regulation, rental_demand) VALUES ($1, $2, 1, 1, 1, 1)`, [`ht20-s02-${HAT}`, CANH.diem]);
  await sql(`INSERT INTO ${BANG_TIEU_VUNG} (airdna_sub_id, airdna_market_id, name, meta) VALUES ($1, $2, $3, $4)`,
    [`ht20-s02-sub-${HAT}`, `ht20-s02-${HAT}`, CANH.chiSoCon, JSON.stringify({ market_score: CANH.diemCon, metrics: { canh: CANH.chiSoCon } })]);
  await sql(`INSERT INTO ${BANG_THANG} (airdna_id, metric, period, value) VALUES ($1, 'adr', $2, $3)`, [`ht20-s02-${HAT}`, CANH.ky, CANH.thang]);
});

after(async () => {
  await pool.end();
});

test("HT20-AC-1 danh sách không S02", async () => {
  const r = await goi(`/v1/markets?country=zz&limit=5`);
  assert.equal(r.status, 200, "HT20-AC-1 danh sách không 200");
  const cay = (r.than.data as any[]).filter((d) => [A, B, C].includes(d.id));
  assert.equal(cay.length, 3, "HT20-AC-1 thiếu thị trường cấy");
  for (const d of r.than.data) assert.deepEqual(tap(d), ["countryCode", "id", "listingCount", "name"], `HT20-AC-1 sai tập khoá: ${tap(d).join(",")}`);
  assert.deepEqual(cay.map((d) => d.id), [A, B, C], "HT20-AC-1 thứ tự không theo số tin (A 3 → B 1 → C 1)");
  assert.deepEqual(cay.map((d) => d.listingCount), [3, 1, 1]);
  assert.deepEqual(tap(r.than.meta), ["limit", "total"], "HT20-AC-1 meta đổi hình");
  assert.equal(r.than.meta.limit, 5);
  assert.deepEqual(soCanh(r.vanBan), [], "HT20-AC-1 thân lộ số S02");
});

test("HT20-AC-2 chi tiết không S02", async () => {
  const ds = await goi(`/v1/markets?country=zz`);
  for (const k of [B, A]) {
    const r = await goi(`/v1/markets/${k}`);
    assert.equal(r.status, 200, `HT20-AC-2 ${k} không 200`);
    assert.deepEqual(tap(r.than.data), ["countryCode", "id", "listingCount", "name"], `HT20-AC-2 sai tập khoá: ${tap(r.than.data).join(",")}`);
    const dong = (ds.than.data as any[]).find((d) => d.id === k);
    assert.equal(r.than.data.listingCount, dong.listingCount, "HT20-AC-2 listingCount lệch dòng danh sách");
    assert.deepEqual(soCanh(r.vanBan), [], "HT20-AC-2 thân lộ số S02");
  }
  const cu = await goi(`/v1/markets/${A.replace(/^vn-/, "vn-tinh-")}`);
  const moi = await goi(`/v1/markets/${A}`);
  assert.equal(cu.vanBan, moi.vanBan, "HT20-AC-2 mã dài cũ không cho cùng thân");
  const khong = await goi(`/v1/markets/vn-ht20-khong-co`);
  assert.equal(khong.status, 404);
  assert.equal(khong.than.error.code, "NOT_FOUND");
});

test("HT20-AC-3 submarkets không S02", async () => {
  const r = await goi(`/v1/markets/${A}/submarkets`);
  assert.equal(r.status, 200, "HT20-AC-3 không 200");
  assert.deepEqual((r.than.data as any[]).map((d) => d.id), [A1, A2], "HT20-AC-3 thiếu tiểu vùng cấy hay sai thứ tự");
  for (const d of r.than.data) assert.deepEqual(tap(d), ["id", "listingCount", "name"], `HT20-AC-3 sai tập khoá: ${tap(d).join(",")}`);
  assert.deepEqual((r.than.data as any[]).map((d) => d.listingCount), [2, 1]);
  assert.deepEqual(soCanh(r.vanBan), [], "HT20-AC-3 thân lộ chỉ số tiểu vùng S02");
  const cu = await goi(`/v1/markets/${A.replace(/^vn-/, "vn-tinh-")}/submarkets`);
  assert.equal(cu.vanBan, r.vanBan, "HT20-AC-3 mã dài cũ không cho cùng thân");
  const khong = await goi(`/v1/markets/vn-ht20-khong-co/submarkets`);
  assert.deepEqual(khong.than, { data: [], meta: { total: 0 } });
});

test("HT20-AC-4 insights đã gỡ", async () => {
  for (const k of [B, B.replace(/^vn-/, "vn-tinh-"), "vn-ht20-khong-co"]) {
    const r = await goi(`/v1/markets/${k}/insights`);
    assert.equal(r.status, 410, `HT20-AC-4 insights ${k} không 410`);
    assert.deepEqual(r.than, { error: { code: "GONE", message: "insights đã gỡ: số theo tháng của thị trường chưa có nguồn tự thu đủ phủ" } });
    assert.equal(r.sql.length, 0, "HT20-AC-4 insights còn phát câu SQL");
  }
  const api = (await goi("/openapi.json")).than;
  assert.ok(!("/v1/markets/{id}/insights" in api.paths), "HT20-AC-4 openapi còn đường insights");
});

// ── Rào tĩnh: mọi chuỗi trong mã data-api/{src,api}/** (bỏ chú thích) ──────────────────────────────────────────────
/** Các chuỗi (nháy đơn, nháy kép, template) của một tệp TS/JS, bỏ chú thích. */
function chuoiTrongMa(s: string): string[] {
  const ra: string[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "/" && s[i + 1] === "/") { i = s.indexOf("\n", i); if (i < 0) break; continue; }
    if (c === "/" && s[i + 1] === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? s.length : e + 2; continue; }
    if (c === "'" || c === '"' || c === "`") {
      let j = i + 1;
      while (j < s.length && s[j] !== c) j += s[j] === "\\" ? 2 : 1;
      ra.push(s.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    i++;
  }
  return ra;
}
function viPhamTep(noiDung: string): boolean {
  return chuoiTrongMa(noiDung).some((t) => [TIEN_TO_S02, "ref_calib_", "area_sources"].some((b) => t.includes(b)) || /\bS02\b/.test(t));
}
function moiTep(goc: string): string[] {
  const ra: string[] = [];
  const di = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = path.join(d, n);
      if (statSync(p).isDirectory()) di(p);
      else if (/\.(ts|js|mjs|cjs)$/.test(n)) ra.push(p);
    }
  };
  di(goc);
  return ra;
}
function raoTinh(thay: Record<string, string> = {}): string[] {
  const tep = [...moiTep(path.join(DATA_API, "src")), ...moiTep(path.join(DATA_API, "api"))];
  return tep
    .filter((p) => viPhamTep(thay[path.relative(DATA_API, p)] ?? readFileSync(p, "utf8")))
    .map((p) => `HT20 route đọc bảng S02: ${path.relative(path.dirname(DATA_API), p)}`);
}

test("HT20-AC-5 không câu SQL nào đọc S02", async () => {
  const loi: string[] = [];
  const goiMoi = [
    await goi(`/v1/markets?country=zz`), await goi(`/v1/markets/${B}`), await goi(`/v1/markets/${A}/submarkets`),
  ];
  for (const [i, r] of goiMoi.entries()) {
    if (r.sql.length === 0) loi.push(`HT20-AC-5 đường ${i} không phát câu nào — bộ ghi không chạy`);
    loi.push(...cauDocS02(r.sql).map((x) => `HT20-AC-5 ${x}`));
  }
  const raoGoc = raoTinh();
  loi.push(...raoGoc);
  // Đột biến trong cùng ca — mỗi cái đúng một tệp đỏ.
  const markets = "src/routes/markets.ts";
  const goc = readFileSync(path.join(DATA_API, markets), "utf8");
  const dotBien: [string, string][] = [
    ["JOIN cũ", goc + `\nconst _cu = \`LEFT JOIN ${BANG_DIEM} ms ON ms.airdna_id = (SELECT x.source_area_key FROM ${"area_sources"} x WHERE x.source = 'S02' LIMIT 1)\`;\n`],
    ["tham số S02", goc + `\nconst _ts = ["S02"]; const _q = "SELECT 1 FROM areas WHERE source = $1";\n`],
    ["bảng cloud", goc + `\nconst _cl = "SELECT total FROM ref_calib_scores";\n`],
  ];
  for (const [ten, noi] of dotBien) {
    const r = raoTinh({ [markets]: noi });
    if (r.length !== 1 || r[0] !== "HT20 route đọc bảng S02: data-api/src/routes/markets.ts") loi.push(`HT20-AC-5 đột biến «${ten}» không đỏ đúng một tệp: ${r.join(" | ")}`);
  }
  // Lớp lúc chạy cũng bắt tham số 'S02' (bộ ghi tham số tự chứng).
  if (cauDocS02([{ text: "SELECT 1 WHERE source = $1", params: ["S02"] }]).length !== 1) loi.push("HT20-AC-5 bộ ghi tham số không bắt 'S02'");
  assert.deepEqual(loi, [], loi.join(" | "));
});

#!/usr/bin/env node
// moi-route.mjs — PB8 (eval E2, E3): lược đồ mẫu data-api (db/schema.sql + seed.sql) dựng trên DB PostGIS rỗng, rồi gọi MỌI
// đường khai trong /openapi.json bằng app.request() — đường nào trả 500 là đỏ; đường trong openapi chưa có mẫu gọi cũng đỏ,
// để thêm tài nguyên mới mà quên lược đồ mẫu thì lỗ không tái diễn.
//  Mỗi đường có MAU (một hay vài lời gọi cụ thể, giá trị lấy từ seed) và mã mong: Property theo hợp đồng PB6 — danh sách toà
//  của dự án mẫu 200 ≥ 1 toà (dự án không có: 200 rỗng), tra căn 200, toà 200, căn 200, toà không có 404.
//  In «moi-route: <n> lời gọi trên <k> đường openapi; 500: <m>; sai mã: <s>» — thoát 0 khi m = s = 0 và không đường thiếu mẫu.
//  Chiều đỏ cùng lượt (--khong-cay để bỏ): (1) schema.sql bỏ khúc PB8 → đường Property 500 (đếm ≥ 1, ghim «PB8 route trả 500
//  trên DB mẫu: /v1/properties»); (2) openapi thêm một đường không mẫu → «PB8 đường openapi chưa có mẫu gọi: /v1/x».
//  Cờ --chi-dem: chỉ in số đếm của cây hôm nay (đo trước ở S1), không xét đạt.
// DB tạm bị xoá cuối lượt kể cả khi lỗi. Máy chủ: DATABASE_URL (chỉ CREATE/DROP DB tạm), bắt buộc — chạy qua db/db-thu.sh.
// Tạo phẩm (tệp gọi) ở thư mục tạm của hệ thống, không ghi vào cây nguồn.
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const pg = createRequire(path.join(ROOT, "app", "package.json"))("pg");
// Địa chỉ DB chỉ lấy từ môi trường (CHUNG điểm 17 — không viết chuỗi kết nối vào kho); executor chạy probe qua db/db-thu.sh.
const QUAN = process.env.DATABASE_URL;
if (!QUAN) { console.log(`${path.basename(fileURLToPath(import.meta.url))}: thiếu DATABASE_URL — chạy qua bash db/db-thu.sh <tên> --chay node <probe>`); process.exit(2); }
const urlDb = (db) => { const u = new URL(QUAN); u.pathname = `/${db}`; return u.toString(); };
const CHI_DEM = process.argv.includes("--chi-dem");
const KHONG_CAY = process.argv.includes("--khong-cay");

// Giá trị mẫu — khớp seed.sql (khúc PB8). Đổi seed thì đổi ở đây.
const DU_AN = "900001";
const UPI = "urn:onehub:upi:1:VN:VN-HN:bld_01JD0000000000000000000001";
const UNIT = "unt_01JD0000000000000000000001";
const UPI_KHONG = "urn:onehub:upi:1:VN:VN-HN:bld_01JD00000000000000000000ZZ";
/** Đường openapi → [[lời gọi, mã mong, số phần tử tối thiểu?, tin gắn toà tối thiểu (activeListingCount của phần tử đầu)?,
 *  số phần tử ĐÚNG (đẳng thức — vòng 2 S4: lời hứa «đúng 1 căn», «rỗng» là đẳng thức, không phải ngưỡng dưới)?]]. */
const MAU = {
  "/health": [["/health", 200]],
  "/v1/markets": [["/v1/markets", 200]],
  "/v1/markets/{id}": [["/v1/markets/vn-hanoi", 200]],
  "/v1/markets/{id}/submarkets": [["/v1/markets/vn-hanoi/submarkets", 200]],
  "/v1/listings": [["/v1/listings", 200, 1], ["/v1/listings?kind=sale", 200, 1], ["/v1/listings?kind=rent_lt", 200, 1], ["/v1/listings?kind=rent_st", 200, 1], ["/v1/listings?minBelowMedianPct=0", 200]],
  "/v1/listings/{listingKey}": [["@listingKey", 200], ["/v1/listings/khong-co-tin-nay", 404]],
  "/v1/price-stats": [["/v1/price-stats?market=vn-hanoi", 200]],
  "/v1/coverage": [["/v1/coverage", 200]],
  "/v1/properties": [[`/v1/properties?project=${DU_AN}`, 200, 1, 1], ["/v1/properties?project=999999999", 200, 0, 0, 0]],
  "/v1/properties/lookup": [[`/v1/properties/lookup?project=${DU_AN}&building=PB8%20To%C3%A0%20A&unitNumber=A-1205`, 200, 0, 0, 1]],
  "/v1/properties/{universalPropertyId}": [[`/v1/properties/${encodeURIComponent(UPI)}`, 200], [`/v1/properties/${encodeURIComponent(UPI_KHONG)}`, 404]],
  "/v1/properties/{universalPropertyId}/units/{unitKey}": [[`/v1/properties/${encodeURIComponent(UPI)}/units/${UNIT}`, 200]],
};

/** Xét một lượt gọi: trả thông điệp lỗi (rỗng = đạt). `them` = đường giả thêm vào openapi (ô chiều đỏ). */
export function xet(kq, them = []) {
  const loi = [];
  for (const p of [...kq.duong, ...them]) if (!MAU[p]) loi.push(`PB8 đường openapi chưa có mẫu gọi: ${p}`);
  for (const r of kq.goi) {
    if (r.status >= 500) loi.push(`PB8 route trả 500 trên DB mẫu: ${r.p}`);
    else if (r.mong !== null && r.status !== r.mong) loi.push(`PB8 sai mã trên DB mẫu: ${r.goi} ${r.status} (mong ${r.mong})`);
    else if (r.dungN !== null && r.n !== r.dungN) loi.push(`PB8 sai số phần tử trên DB mẫu: ${r.goi} ${r.n} (mong đúng ${r.dungN})`);
    else if (r.toiThieu && !(r.n >= r.toiThieu)) loi.push(`PB8 DB mẫu rỗng ở: ${r.goi} (${r.n} phần tử)`);
    else if (r.tinToiThieu && !(r.tin >= r.tinToiThieu)) loi.push(`PB8 DB mẫu rỗng ở: ${r.goi} (activeListingCount ${r.tin})`);
  }
  return [...new Set(loi)];
}

function goiMoiDuong(db) {
  const tam = mkdtempSync(path.join(os.tmpdir(), "pb8-mr-"));
  try {
    const f = path.join(tam, "goi.mts");
    writeFileSync(f, `process.env.NODE_ENV = "test"; delete process.env.DATA_API_KEYS;
const { default: app } = await import(${JSON.stringify(path.join(ROOT, "data-api", "src", "app.ts"))});
const { pool } = await import(${JSON.stringify(path.join(ROOT, "data-api", "src", "db", "client.ts"))});
const MAU = ${JSON.stringify(MAU)};
const api = await (await app.request("/openapi.json")).json();
const duong = Object.keys(api.paths ?? {});
const dau = await (await app.request("/v1/listings?limit=1")).json().catch(() => ({}));
const khoa = dau?.data?.[0]?.listingKey;
const goi = [];
for (const p of duong) for (const [g, mong, toiThieu, tinToiThieu, dungN] of MAU[p] ?? []) {
  const url = g === "@listingKey" ? (khoa ? "/v1/listings/" + encodeURIComponent(khoa) : "/v1/listings/khong-co-khoa-mau") : g;
  const r = await app.request(url); let n = null; let tin = null;
  try { const j = await r.json(); n = Array.isArray(j.data) ? j.data.length : null; tin = Array.isArray(j.data) ? j.data[0]?.activeListingCount ?? null : null; } catch {}
  goi.push({ p, goi: url, status: r.status, mong: mong ?? null, toiThieu: toiThieu ?? 0, tinToiThieu: tinToiThieu ?? 0, dungN: dungN ?? null, n, tin });
}
await pool.end();
console.log("KQ " + JSON.stringify({ duong, goi }));
`);
    const r = spawnSync("npx", ["tsx", f], {
      cwd: path.join(ROOT, "data-api"), encoding: "utf8", maxBuffer: 64 << 20,
      env: (() => { const e = { ...process.env, DATABASE_URL: urlDb(db) }; delete e.LISTING_KEY_SECRET; delete e.VERCEL; return e; })(),
    });
    const dong = (r.stdout ?? "").split("\n").find((l) => l.startsWith("KQ "));
    if (!dong) throw new Error(`không gọi được đường: ${(r.stderr ?? "").split("\n").slice(-6).join(" | ")}`);
    return JSON.parse(dong.slice(3));
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
}

async function voiDb(nhan, sqls, fn) {
  const db = `oneinvest_suite_pb8_${nhan}_${process.pid}`;
  const quan = new pg.Client({ connectionString: QUAN });
  await quan.connect();
  try {
    await quan.query(`DROP DATABASE IF EXISTS ${db}`);
    await quan.query(`CREATE DATABASE ${db}`);
    const c = new pg.Client({ connectionString: urlDb(db) });
    c.on("error", () => {});
    await c.connect();
    let loi = null;
    try {
      for (const [ten, sql] of sqls) {
        try { await c.query(sql); } catch (e) { loi ??= `${ten}: ${e.code ?? "?"} ${String(e.message).slice(0, 120)}`; }
      }
    } finally {
      await c.end().catch(() => {});
    }
    return await fn(db, loi);
  } finally {
    await quan.query(`DROP DATABASE IF EXISTS ${db} WITH (FORCE)`).catch(() => {});
    await quan.end();
  }
}

const schema = readFileSync(path.join(ROOT, "data-api", "db", "schema.sql"), "utf8");
const seed = readFileSync(path.join(ROOT, "data-api", "seed.sql"), "utf8");
const dem = (kq) => ({ duong: kq.duong.length, goi: kq.goi.length, loi500: new Set(kq.goi.filter((r) => r.status >= 500).map((r) => r.p)).size });
let ma = 0;

const homNay = await voiDb("nay", [["schema.sql", schema], ["seed.sql", seed]], async (db, loiSql) => {
  const kq = goiMoiDuong(db);
  return { kq, loiSql };
});
const d = dem(homNay.kq);
const loi = xet(homNay.kq);
const sai = loi.filter((l) => l.startsWith("PB8 sai mã") || l.startsWith("PB8 sai số phần tử") || l.startsWith("PB8 DB mẫu rỗng")).length;
console.log(`moi-route: ${d.goi} lời gọi trên ${d.duong} đường openapi; route trả 500: ${d.loi500}; sai mã: ${sai}${homNay.loiSql ? `; lỗi dựng lược đồ: ${homNay.loiSql}` : ""}`);
for (const l of loi) console.log(l);
if (CHI_DEM) process.exit(0);
if (loi.length || homNay.loiSql) ma = 1;

if (!KHONG_CAY) {
  const MOC = "-- ═════ PB8:";
  if (!schema.includes(MOC)) { console.log("moi-route: schema.sql không có khúc PB8 để bỏ"); process.exit(1); }
  const boPb8 = schema.slice(0, schema.indexOf(MOC));
  const seedBo = seed.includes(MOC) ? seed.slice(0, seed.indexOf(MOC)) : seed;
  const cay = await voiDb("cay", [["schema.sql bỏ khúc PB8", boPb8], ["seed.sql bỏ khúc PB8", seedBo]], async (db) => goiMoiDuong(db));
  const loiCay = xet(cay);
  const o1 = loiCay.includes("PB8 route trả 500 trên DB mẫu: /v1/properties");
  const o2 = xet(homNay.kq, ["/v1/x"]).includes("PB8 đường openapi chưa có mẫu gọi: /v1/x");
  // Đột biến số phần tử trên kết quả thật của hôm nay: /lookup trả 2 căn, dự án không có trả 1 toà → mỗi ô đỏ đúng lời gọi.
  const doiN = (khop, n) => ({ ...homNay.kq, goi: homNay.kq.goi.map((r) => (r.goi.includes(khop) ? { ...r, n } : r)) });
  const o3 = xet(doiN("/v1/properties/lookup?", 2)).some((l) => l.startsWith("PB8 sai số phần tử trên DB mẫu: /v1/properties/lookup?") && l.endsWith("2 (mong đúng 1)"));
  const o4 = xet(doiN("project=999999999", 1)).includes("PB8 sai số phần tử trên DB mẫu: /v1/properties?project=999999999 1 (mong đúng 0)");
  console.log(`chieu-do: bo-khuc-pb8 → ${dem(cay).loi500} route trả 500 (${o1 ? "đúng" : "SAI"}); duong-khong-mau → ${o2 ? "đúng" : "SAI"}; lookup-2-can → ${o3 ? "đúng" : "SAI"}; du-an-khong-co-1-toa → ${o4 ? "đúng" : "SAI"}`);
  const hong = [!o1 && "bo-khuc-pb8", !o2 && "duong-khong-mau", !o3 && "lookup-2-can", !o4 && "du-an-khong-co-1-toa"].filter(Boolean);
  if (hong.length) { console.log(`moi-route: thước không đỏ ở ${hong.join(", ")}`); ma = 1; }
}
// Seed chạy lại (khúc PB8 áp hai lần) không nhân đôi dòng nào của bảy bảng khúc PB8 chạm (vòng 2 S4).
{
  const khuc = seed.slice(seed.indexOf("-- ═════ PB8:"));
  const BANG = ["asset_nodes", "buildings", "units", "registry_aliases", "field_assertions", "sale_offers"];
  const demBang = async (db) => {
    const c = new pg.Client({ connectionString: urlDb(db) }); await c.connect();
    try { const ra = {}; for (const b of BANG) ra[b] = (await c.query(`SELECT count(*)::int n FROM ${b}`)).rows[0].n; return ra; } finally { await c.end(); }
  };
  const [mot, hai] = await voiDb("lai", [["schema.sql", schema], ["seed.sql", seed]], async (db, loiSql) => {
    const a = await demBang(db);
    const c = new pg.Client({ connectionString: urlDb(db) }); await c.connect();
    let loiLai = null; try { await c.query(khuc); } catch (e) { loiLai = String(e.message).slice(0, 120); } finally { await c.end(); }
    return [{ ...a, loiSql }, { ...(await demBang(db)), loiLai }];
  });
  const lech = BANG.filter((b) => mot[b] !== hai[b]);
  if (hai.loiLai || lech.length) { console.log(`PB8 seed chạy lại nhân đôi hay lỗi: ${hai.loiLai ?? lech.map((b) => `${b} ${mot[b]}→${hai[b]}`).join(", ")}`); ma = 1; }
  else console.log(`seed-chay-lai: khúc PB8 áp hai lần, ${BANG.length} bảng giữ nguyên số dòng`);
  if (!KHONG_CAY) {
    // Đối chứng: bỏ chốt chống trùng ở khúc PB8 (NOT EXISTS) → bảng bí danh phải nhân đôi.
    const tho = khuc.replaceAll(/\nWHERE NOT EXISTS \([^;]*\);/g, ";");
    const [x, y] = await voiDb("lai2", [["schema.sql", schema], ["seed.sql", seed]], async (db) => {
      const a = await demBang(db);
      const c = new pg.Client({ connectionString: urlDb(db) }); await c.connect();
      try { await c.query(tho); } catch {} finally { await c.end(); }
      return [a, await demBang(db)];
    });
    const o5 = tho !== khuc && y.registry_aliases > x.registry_aliases && y.field_assertions > x.field_assertions;
    console.log(`chieu-do: seed-bo-chot-trung → ${o5 ? "đúng (bí danh, phát biểu nhân đôi)" : "SAI"}`);
    if (!o5) { console.log("moi-route: thước không đỏ ở seed-bo-chot-trung"); ma = 1; }
  }
}
console.log(ma ? "moi-route: đỏ" : "moi-route: đạt");
process.exit(ma);

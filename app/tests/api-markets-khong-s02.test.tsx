// api-markets-khong-s02.test.ts — HT23 api-markets-khong-tra-so-s02. DB thử trắng (db/db-thu.sh --chay) dựng từ db/migrations.
// Tập viết tay, số bịa, mã quốc gia riêng «zz» để không lẫn dữ liệu khác: bốn thị trường; «Gamma» có điểm S02 cao nhất nhưng ít
// tin nhất; «Aaa» đứng đầu theo tên nhưng ít tin, để xếp theo tên và xếp theo số tin ra hai thứ tự khác nhau (S4-r1, finding đo AC-2). Route mới phải không mang khoá marketScore và xếp theo số tin; đối chứng: SQL của route cũ (ghim ở bộ soát) trên
// cùng DB trả điểm S02 và đẩy Gamma lên đầu.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// DB của lượt: npm test / db-thu.sh --chay đặt DATABASE_URL. CI (Postgres riêng dựng từ migration, không container) không đặt
// biến này — dùng DB «oneinvest» của CI như can-gia-cung-loai-db.test. Trên máy mà thiếu biến thì dừng, không rơi về DB chung
// và không tự đặt một tên DB riêng (lỗi CI 4e0156200: tên «…_ht23_khong_dung» không có trên DB trống của CI).
const DB_URL = process.env.DATABASE_URL ?? (process.env.CI ? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" : "");
if (!DB_URL) throw new Error("api-markets-khong-s02.test: thiếu DATABASE_URL — chạy qua npm test hoặc db/db-thu.sh <tên> --chay");
process.env.DATABASE_URL = DB_URL;

const nap = async () => ({
  pool: (await import("../src/lib/db")).pool,
  GET: (await import("../src/app/api/v1/markets/route")).GET,
  JOIN_S02_CU: (await import(pathToFileURL(join(import.meta.dirname, "../../scripts/check-api-surface.mjs")).href)).JOIN_S02_CU as string,
});
let m: Awaited<ReturnType<typeof nap>>;
const q = (sql: string, v: unknown[] = []) => m.pool.query(sql, v);

const QG = "zz";
// Thứ tự chèn NGƯỢC thứ tự tên trong từng cặp bằng số tin (Beta trước Alpha, Gamma trước Aaa). Postgres không bảo đảm
// thứ tự giữa các dòng bằng nhau khi thiếu khoá phụ, nên cách chèn này chỉ tăng khả năng phép so thứ tự bắt được route
// mất khoá phụ «rồi tên»; chiều đỏ tất định nằm ở HT28-AC-2 (soát văn bản ORDER BY của route).
const TT = [
  { id: "zz-ht23-beta", name: "Beta", tin: 3, diem: 40 },
  { id: "zz-ht23-alpha", name: "Alpha", tin: 3, diem: null },
  { id: "zz-ht23-gamma", name: "Gamma", tin: 1, diem: 95 },
  { id: "zz-ht23-aaa", name: "Aaa", tin: 1, diem: null },
];
// Thứ tự mong: số tin giảm dần, bằng nhau thì theo tên.
const MONG = [["Alpha", 3], ["Beta", 3], ["Aaa", 1], ["Gamma", 1]];

// HT28: câu SQL thật của route — chuỗi backtick đầu tiên sau `pool.query(` trong route.ts.
const sqlCuaRoute = (): string => {
  const src = readFileSync(join(import.meta.dirname, "../src/app/api/v1/markets/route.ts"), "utf8");
  const i = src.indexOf("pool.query(");
  assert.ok(i >= 0, "route.ts không còn lời gọi pool.query( — cách rút SQL của HT28 phải sửa theo khuôn mới");
  const dau = src.indexOf("`", i);
  const cuoi = src.indexOf("`", dau + 1);
  assert.ok(dau > i && cuoi > dau, "không rút được chuỗi SQL backtick sau pool.query(");
  return src.slice(dau + 1, cuoi);
};

// HT28: chỉ xét mệnh đề ORDER BY (tới LIMIT hay hết câu); m.name ở SELECT không tính.
const coKhoaPhuTheoTen = (sql: string): boolean => {
  const m = /\bORDER\s+BY\s+([\s\S]*?)(?:\s+LIMIT\b|$)/i.exec(sql);
  if (!m) return false;
  const khoa = m[1].split(",").map((k) => k.trim().replace(/\s+/g, " "));
  return khoa.length === 2 && khoa[0] === "m.listing_count DESC" && /^m\.name( ASC)?$/i.test(khoa[1]);
};

const don = async () => {
  await q("DELETE FROM listings WHERE id LIKE 'ht23-%'");
  await q("DELETE FROM area_sources WHERE area_id LIKE 'zz-ht23-%'");
  await q("DELETE FROM airdna_scores WHERE airdna_id LIKE 'ht23-%'");
  await q("DELETE FROM airdna_markets WHERE airdna_id LIKE 'ht23-%'");
  await q("DELETE FROM areas WHERE id LIKE 'zz-ht23-%'");
};

before(async () => {
  m = await nap();
  await don();
  for (const t of TT) {
    await q("INSERT INTO areas (id, name, region_type, country_code) VALUES ($1, $2, 'market', $3)", [t.id, t.name, QG]);
    for (let i = 0; i < t.tin; i++) {
      await q("INSERT INTO listings (id, area_id, last_seen) VALUES ($1, $2, now())", [`ht23-${t.name}-${i}`, t.id]);
    }
    if (t.diem !== null) {
      await q("INSERT INTO airdna_markets (airdna_id) VALUES ($1)", [`ht23-${t.name}`]);
      await q("INSERT INTO airdna_scores (airdna_id, total) VALUES ($1, $2)", [`ht23-${t.name}`, t.diem]);
      await q("INSERT INTO area_sources (area_id, source, source_area_key) VALUES ($1, 'S02', $2)", [t.id, `ht23-${t.name}`]);
    }
  }
});
after(async () => {
  await don();
  await m.pool.end();
});

const goi = async () => {
  const res = await m.GET(new Request(`http://local.test/api/v1/markets?country=${QG}&limit=5`));
  return { status: res.status, body: (await res.json()) as { data: Record<string, unknown>[]; meta: Record<string, unknown> } };
};

// SQL route cũ (trước HT23) dựng từ đúng văn bản JOIN ghim ở bộ soát — đối chứng chiều đỏ.
const SQL_CU = () => `SELECT a.id, a.name, ms.total AS market_score
     FROM areas a
${m.JOIN_S02_CU}     WHERE a.region_type = 'market' AND a.country_code = $1
     ORDER BY ms.total DESC NULLS LAST, a.name LIMIT 5`;

test("HT23-AC-1 phản hồi không mang khoá suy từ S02; đối chứng: route cũ mang số S02", async () => {
  const cu = (await q(SQL_CU(), [QG])).rows;
  assert.ok(cu.some((r) => r.market_score !== null), "route cũ mang số S02 — đối chứng phải thấy điểm S02");
  const { status, body } = await goi();
  assert.equal(status, 200);
  assert.equal(body.data.length, 4);
  for (const d of body.data) assert.deepEqual(Object.keys(d).sort(), ["countryCode", "id", "listingCount", "name"], `dòng ${String(d.id)}`);
  assert.ok(!body.data.some((d) => "marketScore" in d), "không dòng nào được có khoá marketScore");
  assert.deepEqual(body.meta, { total: 4, limit: 5 });
});

test("HT23-AC-2 xếp theo số tin giảm dần rồi tên; đối chứng: route cũ đẩy thị trường điểm S02 cao nhất lên đầu", async () => {
  const cu = (await q(SQL_CU(), [QG])).rows;
  assert.equal(cu[0].name, "Gamma", "route cũ xếp theo điểm S02 — đối chứng phải đặt Gamma đầu");
  const { body } = await goi();
  const thuTu = body.data.map((d) => [d.name, d.listingCount] as [string, number]);
  // Đối chứng: chỉ xếp theo tên thì «Aaa» đứng đầu — tập này phân biệt được khoá số tin với khoá tên.
  const theoTen = [...thuTu].sort((a, b) => a[0].localeCompare(b[0]));
  assert.notDeepEqual(theoTen, MONG, "tập thử phải phân biệt xếp theo tên với xếp theo số tin");
  assert.deepEqual(thuTu, MONG);
});

test("HT28-AC-1 đối chứng khoá phụ chạy trên DB: SQL thật của route ra thứ tự mong, đổi khoá phụ thành name DESC thì đảo cặp bằng số tin", async () => {
  const sql = sqlCuaRoute();
  const ten = async (cau: string) => (await q(cau, [QG, 5])).rows.map((r) => [r.name, r.listing_count]);
  assert.deepEqual(await ten(sql), MONG, "SQL rút từ route phải ra đúng thứ tự mong trên DB thử");
  const nguoc = sql.replace(/ORDER BY m\.listing_count DESC, m\.name\b/, "ORDER BY m.listing_count DESC, m.name DESC");
  assert.notEqual(nguoc, sql, "không thay được khoá phụ trong SQL route — khuôn ORDER BY đã đổi");
  const raNguoc = await ten(nguoc);
  assert.notDeepEqual(raNguoc, MONG, "tập thử không có cặp bằng số tin do khoá phụ quyết");
  assert.deepEqual(raNguoc, [["Beta", 3], ["Alpha", 3], ["Gamma", 1], ["Aaa", 1]]);
});

test("HT28-AC-2 soát văn bản ORDER BY: route giữ khoá phụ rồi tên; bản mất khoá phụ hay đảo chiều thì sai", () => {
  const sql = sqlCuaRoute();
  assert.ok(coKhoaPhuTheoTen(sql), "route mất khoá phụ rồi tên");
  // (b) chỉ sửa trong ORDER BY, SELECT vẫn còn m.name.
  const matKhoaPhu = sql.replace(/(ORDER BY m\.listing_count DESC), m\.name\b/, "$1");
  assert.notEqual(matKhoaPhu, sql, "không dựng được bản mất khoá phụ — khuôn ORDER BY đã đổi");
  assert.ok(/SELECT m\.id, m\.name/.test(matKhoaPhu), "bản đối chứng phải còn m.name ở SELECT");
  assert.equal(coKhoaPhuTheoTen(matKhoaPhu), false, "bỏ khoá phụ trong ORDER BY phải bị bắt dù SELECT còn m.name");
  // (c) đảo chiều khoá phụ.
  const daoChieu = sql.replace(/(ORDER BY m\.listing_count DESC, m\.name)\b/, "$1 DESC");
  assert.equal(coKhoaPhuTheoTen(daoChieu), false, "khoá phụ m.name DESC phải bị bắt");
});

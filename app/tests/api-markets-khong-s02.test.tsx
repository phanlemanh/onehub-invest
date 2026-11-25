// api-markets-khong-s02.test.ts — HT23 api-markets-khong-tra-so-s02. DB thử trắng (db/db-thu.sh --chay) dựng từ db/migrations.
// Tập viết tay, số bịa, mã quốc gia riêng «zz» để không lẫn dữ liệu khác: bốn thị trường; «Gamma» có điểm S02 cao nhất nhưng ít
// tin nhất; «Aaa» đứng đầu theo tên nhưng ít tin, để xếp theo tên và xếp theo số tin ra hai thứ tự khác nhau (S4-r1, finding đo AC-2). Route mới phải không mang khoá marketScore và xếp theo số tin; đối chứng: SQL của route cũ (ghim ở bộ soát) trên
// cùng DB trả điểm S02 và đẩy Gamma lên đầu.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

process.env.DATABASE_URL ??= "postgres://oneinvest:oneinvest@localhost:5433/oneinvest_suite_ht23_khong_dung";

const nap = async () => ({
  pool: (await import("../src/lib/db")).pool,
  GET: (await import("../src/app/api/v1/markets/route")).GET,
  JOIN_S02_CU: (await import(pathToFileURL(join(import.meta.dirname, "../../scripts/check-api-surface.mjs")).href)).JOIN_S02_CU as string,
});
let m: Awaited<ReturnType<typeof nap>>;
const q = (sql: string, v: unknown[] = []) => m.pool.query(sql, v);

const QG = "zz";
// Thứ tự chèn NGƯỢC thứ tự tên trong từng cặp bằng số tin (Beta trước Alpha, Gamma trước Aaa): nếu route bỏ khoá phụ
// «rồi tên» thì sort ổn định giữ thứ tự chèn và AC-2 đỏ (S4-r2, finding đo AC-2 nửa «bằng nhau thì theo tên»).
const TT = [
  { id: "zz-ht23-beta", name: "Beta", tin: 3, diem: 40 },
  { id: "zz-ht23-alpha", name: "Alpha", tin: 3, diem: null },
  { id: "zz-ht23-gamma", name: "Gamma", tin: 1, diem: 95 },
  { id: "zz-ht23-aaa", name: "Aaa", tin: 1, diem: null },
];

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
  const MONG = [["Alpha", 3], ["Beta", 3], ["Aaa", 1], ["Gamma", 1]];
  // Đối chứng: chỉ xếp theo tên thì «Aaa» đứng đầu — tập này phân biệt được khoá số tin với khoá tên.
  const theoTen = [...thuTu].sort((a, b) => a[0].localeCompare(b[0]));
  assert.notDeepEqual(theoTen, MONG, "tập thử phải phân biệt xếp theo tên với xếp theo số tin");
  // Đối chứng nửa khoá phụ: thứ tự chèn (cái mà «chỉ theo số tin» + sort ổn định sẽ giữ) phải khác MONG.
  const theoChen = [...TT].sort((a, b) => b.tin - a.tin).map((t) => [t.name, t.tin]);
  assert.notDeepEqual(theoChen, MONG, "tập thử phải phân biệt «chỉ theo số tin» với «theo số tin rồi tên»");
  assert.deepEqual(thuTu, MONG);
});

// node --test scripts/sync-nguoi-ban-that.itest.mjs — tin-rao-tren-invest E2b. READ ONLY trên DB máy thu, chỉ in số:
// chạy đúng câu đọc của sync và bộ soát thật trên toàn sale_offers, để biết lượt sync đầu có dừng hay không.
import assert from "node:assert/strict";
import { test } from "node:test";
import pg from "pg";
import { localDbUrl } from "./capture-ops-facts.mjs";
import { countMaskedSeller, localReadSql, scanSourceNames, selectList } from "../sync-cloud.mjs";

test("E2b toàn bảng thật: câu đọc đã che không còn giá trị nào làm bộ soát dừng", async () => {
  const c = new pg.Client({ connectionString: localDbUrl() });
  try {
    await c.connect();
    await c.query("SELECT 1 FROM source_registry LIMIT 1");
  } catch {
    await c.end().catch(() => {});
    console.error("THIEU DB MAY THU");
    process.exit(1);
  }
  try {
    await c.query("BEGIN READ ONLY");
    const tokens = (await c.query(`SELECT DISTINCT x FROM (SELECT real_name AS x FROM source_registry
      UNION ALL SELECT unnest(source_ids) FROM source_registry) s WHERE length(x) > 0`)).rows.map((r) => r.x);
    assert.ok(tokens.length > 0, "source_registry rỗng: không đo được");
    const cols = (await c.query(`SELECT column_name AS c FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sale_offers' ORDER BY ordinal_position`)).rows.map((r) => r.c);
    const dem = async (tok) => {
      const { rows } = await c.query(localReadSql("sale_offers", selectList("sale_offers", cols, [], tok).sql));
      return { dong: rows.length, trung: rows.filter((r) => scanSourceNames(r.j, tokens)).length };
    };

    const che = await dem(tokens);
    assert.ok(che.dong > 0, "bảng rỗng: không đo được");
    const { name, phone } = await countMaskedSeller(c, tokens);
    const { rows: [khong_hien] } = await c.query(`SELECT count(*)::int AS n FROM sale_offers
      WHERE source IN ('S02', 'S08') AND (seller_name IS NOT NULL OR seller_phone IS NOT NULL)`);
    // Đối chứng: cùng câu đọc nhưng để nguyên giá trị (chỉ khi còn giá trị mang định danh mới có số trúng).
    const list = selectList("sale_offers", cols.filter((x) => !["seller_name", "seller_phone"].includes(x))).sql;
    const { rows: tho } = await c.query(localReadSql("sale_offers", `${list}, "seller_name", "seller_phone"`));
    const tho_trung = tho.filter((r) => scanSourceNames(r.j, tokens)).length;
    console.log(`dòng ${che.dong} · trúng sau che ${che.trung} · trúng khi bỏ che ${tho_trung} · đã che ${name} tên, ${phone} số · S02/S08 có tên hoặc số ${khong_hien.n}`);

    assert.equal(che.trung, 0, "lượt sync sẽ dừng: còn giá trị mang định danh nguồn");
    assert.equal(khong_hien.n, 0, "S02, S08 không được mang tên hay số");
    assert.ok(tho_trung >= che.trung);
    if (name + phone > 0) assert.ok(tho_trung >= 1, "có giá trị bị che mà bỏ che không trúng: phép che rộng hơn bộ soát");
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
});

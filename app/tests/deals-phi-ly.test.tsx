// deals-phi-ly.test.tsx — hồ sơ deals-loai-tin-phi-ly (ON11): danh sách «Căn giá tốt».
// Ca DB chạy ĐÚNG câu dealsSql() app gửi, trên fixture trong BEGIN…ROLLBACK (Postgres local :5433): mỗi ca dựng lược đồ
// riêng (bản rỗng các bảng, view tin như 044, thước 034, sellers 060 — pipeline/lib/luoc-do-rieng.mjs) — không xếp hàng
// khoá 33033, không chạm dữ liệu dùng chung, không để lại dòng nào. Ca thẻ vẽ DealCard trong jsdom.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import pg from "pg";

import { dealsSql, repostLabel, toDealRow } from "../src/lib/deals";
import { CLOUD_ALLOW, PII_EXCLUDE } from "../../pipeline/sync-cloud.mjs";
import { luocDoRieng, neuLaBang } from "../../pipeline/lib/luoc-do-rieng.mjs";
import { MIG_060 } from "../../pipeline/lib/nap-060.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ROOT = join(import.meta.dirname, "../..");
const SQL_034 = readFileSync(join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8");
// Bảng mà dealsSql, view tin, thước 034 và 060 chạm tới — chép rỗng sang lược đồ riêng của từng ca.
const BANG = [
  "sale_offer_records", "properties", "property_offers", "areas", "stg_zalo_posts",
  "registry_aliases", "parties", "ref_lookup",
];

async function withTx<T>(fn: (c: pg.Client, sc: string) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    // 060 bỏ BẢNG sellers bằng câu DROP không tên lược đồ — DB chưa áp 060 thì chép nó để câu ấy rơi vào bản riêng.
    const sc = await luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))], { tienTo: "dp_app" });
    // Như 044 (không đọc định nghĩa từ public — pg_get_viewdef xin khoá trên view dùng chung), rồi thước 034, sellers 060.
    await c.query("CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL");
    await c.query(SQL_034);
    await c.query(MIG_060);
    return await fn(c, sc);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

const PHUONG = "vn-hanoi-t-on11-app";
const M = 100_000_000; // giá/m² của năm căn thước bịa

/** Thước: năm căn bịa cùng phường, mỗi căn một tin giá M/m² không số giảm — v_ruler_p2_area (034) ra trung vị M. */
async function thuoc(c: pg.Client) {
  for (let i = 0; i < 5; i++) {
    const oid = `t_on11_app_thuoc_${i}`;
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
         property_type, area_id, area_m2, price_perm2)
       VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'unknown', $2, 80, $3)`,
      [oid, PHUONG, M],
    );
    const pid = (await c.query(`INSERT INTO properties (kind, area_id) VALUES ('sale', $1) RETURNING id`, [PHUONG])).rows[0].id;
    await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [pid, oid]);
  }
  const ruler = (await c.query(`SELECT area_id, m FROM v_ruler_p2_area`)).rows;
  assert.deepEqual(ruler.map((r) => [r.area_id, Number(r.m)]), [[PHUONG, M]], "DP thước bịa không ra đúng một phường");
  return ruler[0];
}

/** Dựng các tin fixture ở phường của thước bịa (lược đồ riêng — không có tin thật nào để gạt). */
async function seed(c: pg.Client, gaps: (number | null)[]): Promise<string[]> {
  const ruler = await thuoc(c);
  const ids: string[] = [];
  for (const [i, gap] of gaps.entries()) {
    const id = `t_on11_app_${String(i).padStart(2, "0")}`;
    ids.push(id);
    await c.query(
      `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
         property_type, area_id, area_m2, bedrooms, price_vnd, price_perm2, n_reposts, bait_gap_pct)
       VALUES ($1, 'S03', 'sale', 'high', now(), now(), '{}', 'P1', 'unknown', $2, 80, 2, 4000000000,
               $3::numeric, 1, $4)`,
      // giá/m² cố ý KHÔNG khớp số giảm — chứng trang đọc bait_gap_pct chứ không tự tính lại
      [id, ruler.area_id, Math.round(Number(ruler.m) * 0.99), gap],
    );
  }
  return ids;
}

/** Lược đồ cloud: sale_offers không có cột PII_EXCLUDE. Từ 044 (PL14) sale_offers là VIEW sống trên bảng bản ghi
 *  sale_offer_records — xoá cột ở bảng thật; CASCADE kéo đổ view sống và hai view thước đọc qua nó, nên dựng lại đúng
 *  như 044 (view `SELECT *` chỉ hàng sống) và 034 (thước). DB trước 044 thì xoá thẳng trên bảng sale_offers. */
async function xoaCotPii(c: pg.Client) {
  const view = (await c.query(`SELECT relkind FROM pg_class WHERE oid = to_regclass('sale_offers')`)).rows[0]?.relkind === "v";
  const bang = view ? "sale_offer_records" : "sale_offers";
  // Từ SD3 (060) sellers máy thu là VIEW trên tin — xoá cột người bán CASCADE kéo theo nó. Trên cloud sellers là BẢNG
  // do sync đổ, chỉ mang cột CLOUD_ALLOW.sellers: chép view thành bảng đúng hình dạng ấy trước khi xoá cột.
  const sellersView = (await c.query(`SELECT relkind FROM pg_class WHERE oid = to_regclass('sellers')`)).rows[0]?.relkind === "v";
  if (sellersView) {
    const cot = (CLOUD_ALLOW.sellers as string[]).map((x) => `"${x}"`).join(", ");
    await c.query(`CREATE TABLE sellers_cloud AS SELECT ${cot} FROM sellers`);
  }
  for (const col of PII_EXCLUDE.sale_offers as string[]) {
    await c.query(`ALTER TABLE ${bang} DROP COLUMN ${col} CASCADE`);
  }
  if (sellersView) {
    await c.query(`DROP VIEW IF EXISTS sellers`);
    await c.query(`ALTER TABLE sellers_cloud RENAME TO sellers`);
  }
  if (!view) return;
  await c.query(`CREATE OR REPLACE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL`);
  await c.query(SQL_034);
}

const run = async (c: pg.Client, sql: string, limit = 30) => (await c.query(sql, [5, limit])).rows.map(toDealRow);

test("DP-AC-3 trang đọc bait_gap_pct", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    const ids = await seed(c, [12.3, null, 4, 51, 5, 50]);
    const rows = await run(c, dealsSql());
    const got = new Map(rows.map((r) => [r.offerId, r.discountPct]));
    assert.equal(got.get(ids[0]), 12.3, "DP-AC-3 số giảm khác bait_gap_pct (trang tự tính lại?)");
    assert.equal(got.has(ids[1]), false, "DP-AC-3 tin không có số giảm vẫn lên danh sách");
    assert.equal(got.has(ids[2]), false, "DP-AC-3 tin 4% lọt ngưỡng dưới");
    assert.equal(got.has(ids[3]), false, "DP-AC-3 tin 51% lọt guard 50%");
    assert.equal(got.get(ids[4]), 5, "DP-AC-3 tin 5% phải có");
    assert.equal(got.get(ids[5]), 50, "DP-AC-3 tin 50% phải có");
  });
});

test("DP-AC-4 tin sát trần đứng sau", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    await seed(c, [48, 12, 36, 30, 49, 35]);
    const rows = await run(c, dealsSql());
    assert.deepEqual(rows.map((r) => r.discountPct), [35, 30, 12, 49, 48, 36], "DP-AC-4 thứ tự");
    assert.deepEqual(rows.map((r) => r.suspect), [false, false, false, true, true, true], "DP-AC-4 cờ cần xác minh");
  });
});

test("DP-AC-4 sắp trước khi cắt", { timeout: 120_000 }, async () => {
  await withTx(async (c) => {
    const sau = Array.from({ length: 31 }, (_, i) => 36 + (i % 15));
    const ids = await seed(c, [...sau, 20]);
    const rows = await run(c, dealsSql(), 30);
    assert.equal(rows.length, 30);
    assert.equal(rows[0].offerId, ids[31], "DP-AC-4 tin 20% không đứng đầu khi tin sát trần nhiều hơn số thẻ");
    // Chiều đỏ trên cùng fixture: sắp giảm dần rồi cắt 30 thì tin 20% rơi khỏi danh sách.
    const cu = dealsSql().replaceAll("ORDER BY suspect, discount_pct DESC", "ORDER BY discount_pct DESC");
    assert.notEqual(cu, dealsSql(), "DP-AC-4 bản sắp cũ không khác bản mới");
    const cuRows = await run(c, cu, 30);
    assert.equal(cuRows.some((r) => r.offerId === ids[31]), false, "DP-AC-4 đối chứng không phân biệt");
  });
});

test("DP-AC-5 bản cloud", { timeout: 120_000 }, async () => {
  assert.ok((CLOUD_ALLOW.sale_offers as string[]).includes("bait_gap_pct"), "DP-AC-5 bait_gap_pct không lên cloud");
  const cloud = dealsSql({ cloud: true });
  assert.notEqual(cloud, dealsSql(), "DP-AC-5 phép thay bản cloud không áp");
  await withTx(async (c, sc) => {
    await seed(c, [30, 12, 40]);
    const full = (await run(c, dealsSql())).map((r) => r.offerId);
    await c.query(`DROP TABLE stg_zalo_posts CASCADE`);
    await xoaCotPii(c);
    // Chỉ lược đồ riêng (đã xoá như cloud): bản cloud không được với tới bảng nào của public.
    await c.query(`SET LOCAL search_path = ${sc}`);
    const onCloud = (await run(c, cloud)).map((r) => r.offerId);
    assert.deepEqual(onCloud, full, "DP-AC-5 bản cloud khác dãy tin của bản đầy đủ");
    // Đối chứng: bản đầy đủ trên lược đồ đã xoá phải lỗi — chứng phép xoá có tác dụng.
    await c.query("SAVEPOINT doi_chung");
    await assert.rejects(c.query(dealsSql(), [5, 30]), "DP-AC-5 bản đầy đủ vẫn chạy trên lược đồ đã xoá");
    await c.query("ROLLBACK TO SAVEPOINT doi_chung");
  });
});

// ---- Thẻ (jsdom) ----
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3456/ops/deals" });
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window, // next/link đọc self
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true });

async function renderCard(over: Record<string, unknown>): Promise<string> {
  const React = await import("react");
  Object.assign(globalThis, { React });
  const { createRoot } = await import("react-dom/client");
  const { AppRouterContext } = await import("next/dist/shared/lib/app-router-context.shared-runtime");
  const { DealCard } = await import("../src/components/ops/deal-card");
  const d = toDealRow({
    offer_id: "t", source: "S03", price_vnd: 4e9, area_m2: 80, price_perm2: 5e7, bedrooms: 2,
    area_id: "vn-hanoi-x", phuong: "Phường X", median_perm2: 8e7, ruler_n: 9, discount_pct: 30,
    suspect: false, confidence: "high", first_seen: "2026-10-18", last_seen: "2026-10-24", n_reposts: 1,
    ...over,
  });
  const router = { refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  document.body.innerHTML = "<div id=root></div>";
  const root = createRoot(document.getElementById("root")!);
  await React.act(async () => {
    root.render(
      <AppRouterContext.Provider value={router as never}>
        <DealCard d={d} showContact={false} />
      </AppRouterContext.Provider>,
    );
  });
  const text = document.body.textContent ?? "";
  await React.act(async () => root.unmount());
  return text;
}

test("DP-AC-6 thẻ", async () => {
  assert.equal(repostLabel(1), "đăng 1 lần");
  assert.equal(repostLabel(3), "đăng 3 lần");
  assert.equal(repostLabel(0), "đăng 1 lần");
  const mot = await renderCard({ n_reposts: 1 });
  const ba = await renderCard({ n_reposts: 3 });
  assert.match(mot, /đăng 1 lần/, "DP-AC-6 thẻ đăng một lần");
  assert.match(ba, /đăng 3 lần/, "DP-AC-6 thẻ đăng ba lần");
  for (const t of [mot, ba]) assert.doesNotMatch(t, /(^|[^\p{L}])mới([^\p{L}]|$)/u, "DP-AC-6 thẻ còn chữ «mới»");
  assert.match(await renderCard({ suspect: true, discount_pct: 45 }), /cần xác minh/, "DP-AC-6 tin cần xác minh thiếu nhãn");
  assert.doesNotMatch(await renderCard({ suspect: false }), /cần xác minh/, "DP-AC-6 tin thường mang nhãn cần xác minh");
});

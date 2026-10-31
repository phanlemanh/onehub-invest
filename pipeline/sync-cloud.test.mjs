import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  ADVISORY_KEY,
  CLOUD_ALLOW,
  SHRINK_AUDIT,
  PII_EXCLUDE,
  SOURCE_EXCLUDE,
  assertNoTag,
  buildSwapSql,
  chunkRows,
  dollarTag,
  localTypes,
  mgmtExec,
  planTables,
  pool,
  scanSourceNames,
  selectList,
  shrinkVerdict,
} from "./sync-cloud.mjs";

// cloud-sync-atomic (_acceptance/cloud-sync-atomic) — lõi thuần của sync nguyên tử.

// FK đo trên cloud 2026-10-23 (chỉ đọc) — hình dạng thật của kế hoạch tráo.
const CLOUD_FKS = [
  { src: "ref_calib_market_metrics", dst: "ref_calib_markets" },
  { src: "ref_calib_scores", dst: "ref_calib_markets" },
  { src: "areas", dst: "areas" },
  { src: "listing_stats", dst: "listings" },
  { src: "listings", dst: "areas" },
  { src: "market_asset_stats", dst: "areas" },
  { src: "market_metrics", dst: "areas" },
  { src: "nights", dst: "listings" },
  { src: "sale_offers", dst: "areas" },
  { src: "saved_markets", dst: "areas" },
  { src: "saved_markets", dst: "users" },
  { src: "sessions", dst: "users" },
  { src: "asset_nodes", dst: "asset_nodes" },
  { src: "properties", dst: "asset_nodes" },
  { src: "property_offers", dst: "properties" },
];
const FILL_CLOUD = [
  "areas", "listings", "market_metrics", "listing_stats", "nights", "sale_offers",
  "asset_nodes", "properties", "property_offers", "ref_calib_markets", "ref_calib_scores",
  "ref_calib_market_metrics",
];
const PKS = { areas: ["id"], listings: ["id"], nights: ["listing_id", "night"] };

test("danh sách cho phép không giao danh sách loại (PII_EXCLUDE, SOURCE_EXCLUDE)", () => {
  for (const [t, allow] of Object.entries(CLOUD_ALLOW)) {
    for (const c of [...(PII_EXCLUDE[t] ?? []), ...(SOURCE_EXCLUDE[t] ?? [])]) {
      assert.ok(!allow.includes(c), `${t}.${c} vừa cho phép vừa bị loại`);
    }
  }
  // đối chứng dương: danh sách cho phép thật sự có cột (không rỗng hằng-đúng)
  assert.ok(CLOUD_ALLOW.sale_offers.includes("offer_id"));
});

test("selectList: cột chưa duyệt ở lại máy, seller_ref chuẩn hoá, cột loại vắng", () => {
  const r = selectList("sale_offers", ["offer_id", "seller_phone", "seller_name", "seller_ref", "source", "listing_url", "new_col"]);
  assert.deepEqual(r.cols, ["offer_id", "seller_ref", "source"]);
  assert.deepEqual(r.unapproved, ["new_col"]);
  assert.match(r.sql, /substring\("seller_ref" from '\(\[0-9\]\+\)\$'\)/);
  assert.match(r.sql, /"source" \|\| ':'/);
  assert.doesNotMatch(r.sql, /seller_phone|seller_name|listing_url|new_col/);
  // bảng không phải người bán: mọi cột, không danh sách cho phép
  const n = selectList("nights", ["listing_id", "night", "price"]);
  assert.deepEqual(n.cols, ["listing_id", "night", "price"]);
  assert.deepEqual(n.unapproved, []);
});

test("planTables: cha trước con, xoá ngược lại, areas giữ-chỗ vì saved_markets", () => {
  const p = planTables({ fill: FILL_CLOUD, fks: CLOUD_FKS, pks: PKS });
  const at = (t) => p.insertOrder.indexOf(t);
  assert.equal(p.insertOrder.length, FILL_CLOUD.length);
  assert.ok(at("areas") < at("listings") && at("listings") < at("nights") && at("listings") < at("listing_stats"));
  assert.ok(at("asset_nodes") < at("properties") && at("properties") < at("property_offers"));
  assert.ok(at("ref_calib_markets") < at("ref_calib_scores"));
  assert.deepEqual(p.deleteOrder, [...p.insertOrder].reverse());
  assert.deepEqual(p.keep, { areas: ["id"] });
});

test("planTables: vòng FK giữa hai bảng sync → lỗi ghim; bảng giữ-chỗ không khoá → lỗi ghim", () => {
  assert.throws(
    () => planTables({ fill: ["a", "b"], fks: [{ src: "a", dst: "b" }, { src: "b", dst: "a" }], pks: {} }),
    /vòng FK giữa các bảng sync: a, b/,
  );
  assert.throws(
    () => planTables({ fill: ["a"], fks: [{ src: "x", dst: "a" }], pks: {} }),
    /bảng giữ-chỗ a không có khoá chính/,
  );
});

test("chunkRows: chia theo byte thân yêu cầu; dòng quá lớn → lỗi ghim", () => {
  const row = { v: "x".repeat(380) };
  const chunks = chunkRows([row, row, row], 1000);
  assert.equal(chunks.length, 2);
  assert.equal(JSON.parse(chunks[0]).length + JSON.parse(chunks[1]).length, 3);
  for (const c of chunks) assert.ok(Buffer.byteLength(JSON.stringify(c)) <= 1000);
  assert.throws(() => chunkRows([{ v: "x".repeat(2000) }], 1000), /dòng quá lớn/);
  assert.deepEqual(chunkRows([], 1000), []);
});

test("dollarTag/assertNoTag: dữ liệu chứa thẻ của lượt → dừng", () => {
  const tag = dollarTag("20261023-abc123");
  assert.equal(tag, "$sync_20261023abc123$");
  assert.throws(() => assertNoTag(`[{"a":"${tag}"}]`, tag), /thẻ dollar-quote/);
  assert.doesNotThrow(() => assertNoTag('[{"a":"$x$"}]', tag));
});

test("buildSwapSql: một giao dịch, DELETE trước INSERT, upsert giữ-chỗ, không DDL", () => {
  const plan = planTables({ fill: FILL_CLOUD, fks: CLOUD_FKS, pks: PKS });
  const columns = Object.fromEntries(FILL_CLOUD.map((t) => [t, ["id", "v"]]));
  const counts = Object.fromEntries(FILL_CLOUD.map((t) => [t, 3]));
  const sql = buildSwapSql({ runId: "r1", readAt: "2026-10-23 01:00:00+00", plan, counts, columns, pause: 2 });
  assert.match(sql, /^BEGIN;/);
  assert.match(sql, /COMMIT;$/);
  assert.equal(sql.match(/BEGIN;/g).length, 1);
  assert.equal(sql.match(/COMMIT;/g).length, 1);
  assert.ok(sql.includes(`pg_advisory_xact_lock(${ADVISORY_KEY})`));
  assert.ok(sql.indexOf('DELETE FROM public."nights";') < sql.indexOf('INSERT INTO public."nights"'));
  const sleepAt = sql.indexOf("pg_sleep(2)");
  for (const m of sql.matchAll(/DELETE FROM public\."[a-z_]+";/g)) assert.ok(m.index < sleepAt, `${m[0]} sau pg_sleep`);
  assert.ok(sleepAt < sql.indexOf("INSERT INTO public."), "pg_sleep phải nằm giữa DELETE và INSERT");
  assert.ok(!sql.includes('DELETE FROM public."areas";'), "areas không bị xoá trọn");
  assert.match(sql, /INSERT INTO public\."areas" .* ON CONFLICT \("id"\) DO UPDATE SET "v" = EXCLUDED\."v"/s);
  assert.match(sql, /DELETE FROM public\."areas" d WHERE NOT EXISTS/);
  assert.match(sql, /read_at > '2026-10-23 01:00:00\+00'::timestamptz/);
  assert.match(sql, /staging lệch nights: % ≠ 3/);
  assert.doesNotMatch(sql, /\b(TRUNCATE|CREATE|DROP|ALTER)\b/);
  const noPause = buildSwapSql({ runId: "r1", readAt: "x", plan, counts, columns, pause: 0 });
  assert.ok(!noPause.includes("pg_sleep"));
  assert.throws(() => buildSwapSql({ runId: "r'1", readAt: "x", plan, counts, columns }), /run_id không hợp lệ/);
});

test("scanSourceNames: trúng token không phân biệt hoa thường; danh sách rỗng → null", () => {
  assert.equal(scanSourceNames('{"a":"X-Foo:1"}', ["x-foo"]), "x-foo");
  assert.equal(scanSourceNames('{"a":"bar"}', ["x-foo"]), null);
  assert.equal(scanSourceNames('{"a":"X-Foo"}', []), null);
});

test("scanSourceNames: token ngắn (< 4) so theo ranh giới từ — không bỏ qua, không trúng giữa từ", () => {
  assert.equal(scanSourceNames('{"a":"ngõ Abc 3"}', ["abc"]), "abc");
  assert.equal(scanSourceNames('{"a":"abc-xyz"}', ["abc"]), "abc");
  assert.equal(scanSourceNames('{"a":"xabcx"}', ["abc"]), null);
  assert.equal(scanSourceNames('{"a":"a.b"}', ["a.b"]), "a.b");
});

test("pool: một job lỗi → không job mới nào bắt đầu, chỉ trả về khi mọi worker đã dừng", async () => {
  const started = [];
  let running = 0;
  let maxAfterReject = 0;
  const items = Array.from({ length: 12 }, (_, i) => i);
  const p = pool(items, 3, async (x) => {
    started.push(x);
    running++;
    await new Promise((r) => setTimeout(r, 5));
    running--;
    if (x === 1) throw new Error("mẻ 1 gãy");
  });
  await assert.rejects(p, /mẻ 1 gãy/);
  maxAfterReject = running;
  assert.equal(maxAfterReject, 0, "còn worker chạy sau khi pool trả về");
  assert.ok(started.length <= 4, `đã bắt đầu ${started.length} job sau khi job 1 gãy`);
  // đối chứng: không lỗi thì chạy đủ
  const all = [];
  await pool(items, 3, async (x) => all.push(x));
  assert.equal(all.length, 12);
});

test("localTypes: date/timestamp giữ nguyên chuỗi, kiểu khác theo node-pg", () => {
  assert.equal(localTypes.getTypeParser(1082, "text")("2026-10-01"), "2026-10-01");
  assert.equal(localTypes.getTypeParser(1114, "text")("2026-10-01 07:00:00"), "2026-10-01 07:00:00");
  assert.equal(localTypes.getTypeParser(23, "text")("42"), 42);
});

test("mgmtExec: 429/503 thử lại rồi thành công; retry:false không lặp; 400 ném ngay", async () => {
  const mk = (statuses) => {
    const calls = [];
    const fetchImpl = async (_u, init) => {
      calls.push(JSON.parse(init.body).query);
      const s = statuses.shift();
      return { ok: s === 200, status: s, json: async () => [{ ok: 1 }], text: async () => `err ${s}` };
    };
    return { calls, fetchImpl };
  };
  const a = mk([429, 503, 200]);
  assert.deepEqual(await mgmtExec("t", { fetchImpl: a.fetchImpl, sleep: async () => {} })("SELECT 1"), [{ ok: 1 }]);
  assert.equal(a.calls.length, 3);
  const b = mk([503, 200]);
  await assert.rejects(mgmtExec("t", { fetchImpl: b.fetchImpl, sleep: async () => {} })("SWAP", { retry: false }), /mgmt 503/);
  assert.equal(b.calls.length, 1);
  const c = mk([400]);
  await assert.rejects(mgmtExec("t", { fetchImpl: c.fetchImpl, sleep: async () => {} })("X"), /mgmt 400: err 400/);
  const d = mk([503, 503, 503]);
  await assert.rejects(mgmtExec("t", { fetchImpl: d.fetchImpl, retries: 2, sleep: async () => {} })("X"), /mgmt 503/);
  assert.equal(d.calls.length, 3);
});

// canonical-khong-tin-gia AC-10 — chặn tụt cho qua khi bảng co vì một lượt dọn có audit khớp số. Từ SD3 sellers là view
// và SHRINK_AUDIT thôi khai sellers; ma trận đo cơ chế bằng bản đồ audit truyền vào (như sellers khai trước SD3).
const NOW = new Date("2026-10-24T00:15:00Z");
const MAP_CU = { sellers: "bait-gap:sellers-orphan" };
const orphanAudit = (remaining, hoursAgo = 0.25) => ({
  action: MAP_CU.sellers, at: new Date(NOW - hoursAgo * 3600_000), detail: { deleted: 989, remaining },
});
const AC10_MATRIX = [
  ["(1) sellers tụt, audit khớp trong 24h", { table: "sellers", local: 54, cloud: 1043, audits: [orphanAudit(54)] }, true],
  ["(2) sellers tụt, remaining lệch 1", { table: "sellers", local: 54, cloud: 1043, audits: [orphanAudit(55)] }, false],
  ["(3) sellers tụt, audit cũ hơn 24h", { table: "sellers", local: 54, cloud: 1043, audits: [orphanAudit(54, 25)] }, false],
  ["(4) sellers tụt, không audit", { table: "sellers", local: 54, cloud: 1043, audits: [] }, false],
  ["(5) sale_offers tụt kèm audit sellers", { table: "sale_offers", local: 100, cloud: 12615, audits: [orphanAudit(100)] }, false],
  ["(6) không tụt", { table: "sellers", local: 1040, cloud: 1043, audits: [] }, true],
];

test("AC-10 chặn tụt có audit", () => {
  let n = 0;
  for (const [name, args, ok] of AC10_MATRIX) {
    assert.equal(shrinkVerdict({ ...args, now: NOW, auditMap: MAP_CU }).ok, ok, `AC-10 ${ok ? "chặn oan" : "cho qua tụt không giải thích được"}: ${name}`);
    n++;
  }
  assert.equal(n, 6, "AC-10 ma trận phải đủ 6 ô");
  assert.match(shrinkVerdict({ ...AC10_MATRIX[3][1], now: NOW, auditMap: MAP_CU }).reason, /local tụt sellers: 54 < 50% của 1043/);
});

test("SD3 SHRINK_AUDIT thôi khai sellers: audit mồ côi cũ không còn miễn trừ tụt sellers", () => {
  assert.equal("sellers" in SHRINK_AUDIT, false, "SD3 SHRINK_AUDIT còn mục sellers");
  assert.equal(shrinkVerdict({ ...AC10_MATRIX[0][1], now: NOW }).ok, false, "SD3 tụt sellers vẫn được miễn bằng audit đời trước");
  // Đối chứng dương: cùng ô với bản đồ đời trước thì qua — phép đo phân biệt được.
  assert.equal(shrinkVerdict({ ...AC10_MATRIX[0][1], now: NOW, auditMap: MAP_CU }).ok, true);
});

test("AC-10 chiều đỏ: bỏ so remaining thì ô (2) cho qua", () => {
  const loose = (a) => (a.table in MAP_CU && a.audits.length > 0) || shrinkVerdict({ ...a, auditMap: MAP_CU }).ok;
  const wrong = AC10_MATRIX.filter(([, args, ok]) => loose({ ...args, now: NOW }) !== ok).map(([name]) => name);
  assert.deepEqual(wrong, ["(2) sellers tụt, remaining lệch 1", "(3) sellers tụt, audit cũ hơn 24h"]);
});

// ---- NH1 media-canonical-reso AC-9 (E10): bảng media chỉ ở máy thu ----
const { FILL, leakGate } = await import("./sync-cloud.mjs");

/** Ném khi danh sách bảng sync có bảng media (URL ảnh S06 mang tên miền nguồn — tầng A). */
function kiemFill(fill) {
  if (fill.includes("media")) throw new Error("media không được vào FILL");
}

/** exec giả cho leakGate: bảng media vắng (null) hay có n dòng; mọi kiểm khác sạch. */
function execGia(media) {
  return async (sql) => {
    if (/table_name LIKE 'stg_%'/.test(sql)) return [];
    const reg = sql.match(/to_regclass\('(?:public\.)?([a-z_]+)'\)/);
    if (reg) return [{ r: reg[1] === "media" && media !== null ? "media" : null }];
    if (/FROM public\."media"/.test(sql)) return [{ n: media }];
    if (/FROM pg_roles WHERE rolname = 'anon'/.test(sql)) return [{ n: 1 }];
    if (/count\(\*\)/.test(sql)) return [{ n: 0 }];
    return [];
  };
}

test("NH-AC-9 media không lên cloud", async () => {
  kiemFill(FILL);
  assert.throws(() => kiemFill([...FILL, "media"]), /media không được vào FILL/);
  const mediaLeaks = async (m) => (await leakGate(execGia(m))).filter((l) => l.startsWith("media"));
  assert.deepEqual(await mediaLeaks(3), ["media=3"], "cloud có bảng media có dòng → vi phạm");
  assert.deepEqual(await mediaLeaks(null), [], "bảng vắng → sạch");
  assert.deepEqual(await mediaLeaks(0), [], "bảng rỗng → sạch");
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const path = await import("node:path");
  const goc = new URL("../data-api/src/", import.meta.url).pathname;
  const tep = [];
  const di = (d) => {
    for (const f of readdirSync(d)) {
      const p = path.join(d, f);
      if (statSync(p).isDirectory()) di(p);
      else if (/\.(ts|mts|js|mjs)$/.test(f)) tep.push(p);
    }
  };
  di(goc);
  assert.ok(tep.length > 0, "không quét được data-api/src");
  for (const p of tep) assert.doesNotMatch(readFileSync(p, "utf8"), /FROM media\b|media_url/, `data-api nhắc bảng media: ${p}`);
});

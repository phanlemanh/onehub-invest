// phat-bieu.test.mjs — PL15 phần không cần DB (PB-AC-n ↔ _acceptance/phat-bieu-va-phan-xu/evals.yaml E9, E19, E22):
// bộ quét ghi thẳng năm cột trên cây thật + ma trận đối chứng, ma trận chỗ gọi enrich (vai người/máy), rào cloud.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filesOfTree, scanCanonicalWrite } from "../lib/scan-canonical-write.mjs";
import { CALL_SITES, findCallSites, kiemVai, readActorPrefix } from "../lib/enrich-call-sites.mjs";
import { CLOUD_ALLOW, FILL } from "../sync-cloud.mjs";
import { VOCAB } from "../lib/vocab.generated.mjs";
import { soMoc } from "../phat-bieu-cat-chuyen.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const NAM_COT = VOCAB.enrich_field;

test("PB-AC-5 quét cây thật: không câu nào ghi thẳng năm cột vào bảng tin ngoài bộ phân xử", () => {
  const files = filesOfTree(ROOT);
  assert.ok(files.some((f) => f.path === "db/migrations/045_phat_bieu_va_phan_xu.sql"), "bộ quét không thấy 045 — phạm vi quét hỏng");
  assert.ok(files.some((f) => f.path.startsWith("app/src/")) && files.some((f) => f.path.startsWith("agent/")),
    "bộ quét thiếu app/ hoặc agent/");
  assert.deepEqual(scanCanonicalWrite(files, NAM_COT), []);
});

test("PB-AC-5 ma trận đối chứng: sáu dạng ghi thẳng viết trước đều đỏ, nêu tệp:dòng", () => {
  const MA_TRAN = [
    ["gia/a.mjs", "await c.query(`UPDATE sale_offers SET street_raw = $1 WHERE offer_id = $2`, [s, id]);", "gia/a.mjs:1 (street_raw)"],
    ["gia/b.ts", "await c.query(`INSERT INTO sale_offer_records (offer_id, bathrooms) VALUES ($1, $2)`);", "gia/b.ts:1 (bathrooms)"],
    ["gia/c.sql", "UPDATE sale_offer_records\n   SET retired_at = NULL,\n       bedrooms = 2\n WHERE offer_id = 'x';", "gia/c.sql:1 (bedrooms)"],
    ["gia/d.sh", "psql -c \"UPDATE sale_offers SET block_raw = 'A1' WHERE offer_id = 'x'\"", "gia/d.sh:1 (block_raw)"],
    ["gia/e.sql", "UPDATE sale_offer_records r SET r.property_type = 'house' FROM t WHERE r.offer_id = t.id;", "gia/e.sql:1 (property_type)"],
    ["gia/f.mjs", "q(`INSERT INTO sale_offer_records (offer_id) VALUES ($1)\n  ON CONFLICT (offer_id) DO UPDATE SET street_raw = EXCLUDED.street_raw`)", "gia/f.mjs:1 (street_raw)"],
  ];
  const hits = scanCanonicalWrite(MA_TRAN.map(([path, text]) => ({ path, text })), NAM_COT);
  assert.equal(hits.length, MA_TRAN.length, `đối chứng: ${hits.length}/${MA_TRAN.length} dạng bị bắt — ${hits.join(" · ")}`);
  for (const [, , muon] of MA_TRAN) assert.ok(hits.includes(muon), `đối chứng thiếu: ${muon}`);
  // dương: câu ghi cột khác, hay chỉ ĐỌC năm cột ở WHERE, không đỏ
  assert.deepEqual(scanCanonicalWrite([{ path: "gia/g.mjs",
    text: "q(`UPDATE sale_offer_records SET retired_at = now() WHERE bedrooms = 2`)" }], NAM_COT), []);
});

test("PB-AC-5 ENRICH_COLS: write-offers.mjs không còn xuất danh sách cột đóng băng", async () => {
  const m = await import("../lib/write-offers.mjs");
  assert.equal(m.ENRICH_COLS, undefined);
});

test("PB-AC-6 chỗ gọi: tập chỗ gọi đúng ma trận viết trước; người truyền actor 'hitl:', máy không", () => {
  const thay = findCallSites(ROOT);
  const khoa = (x) => `${x.file}|${x.fn}`;
  assert.deepEqual([...new Set(thay.map(khoa))].sort(), [...new Set(CALL_SITES.map(khoa))].sort(),
    `chỗ gọi lệch ma trận — tìm thấy: ${thay.map((x) => `${x.file}:${x.line} ${x.fn}`).join(" · ")}`);
  for (const s of thay) assert.ok(readActorPrefix(readFileSync(join(ROOT, s.file), "utf8"), s.line), `không đọc được actor — ${s.file}:${s.line}`);
  assert.deepEqual(kiemVai(ROOT), [], "ma trận thật phải đạt");
  assert.ok(thay.length >= CALL_SITES.length);
});

test("PB-AC-6 đối chứng: ma trận đổi vai route decide sang máy thì bộ kiểm vai đỏ, nêu tệp route", () => {
  const sai = CALL_SITES.map((x) => (x.file.includes("decide/route.ts") ? { ...x, vai: "may" } : x));
  const loi = kiemVai(ROOT, sai);
  assert.ok(loi.length > 0, "đối chứng: đổi vai route sang máy mà bộ kiểm không đỏ");
  for (const l of loi) assert.match(l, /decide\/route\.ts:\d+ chỗ của máy không được truyền 'hitl:'/);
  // đối chứng thứ hai: chỗ của máy (run.ts) bị khai là người → đỏ nêu run.ts
  const sai2 = CALL_SITES.map((x) => (x.file === "agent/src/enrich/run.ts" ? { ...x, vai: "nguoi" } : x));
  assert.deepEqual(kiemVai(ROOT, sai2).map((l) => l.split(":")[0]), ["agent/src/enrich/run.ts"]);
});

/** Vi phạm rào cloud của PL15: cột / bảng phát biểu lọt vào tập đồng bộ. */
export function cloudLeaks(allow, fill) {
  const out = [];
  if ((allow.sale_offers ?? []).includes("field_provenance")) out.push("CLOUD_ALLOW.sale_offers: field_provenance");
  if (fill.some((t) => (typeof t === "string" ? t : t?.table ?? t?.name) === "field_assertions")) out.push("FILL: field_assertions");
  return out;
}

test("PB-AC-10 cloud: nguồn gốc và bảng phát biểu không vào tập đồng bộ", () => {
  assert.deepEqual(cloudLeaks(CLOUD_ALLOW, FILL), []);
  const sai = { ...CLOUD_ALLOW, sale_offers: [...CLOUD_ALLOW.sale_offers, "field_provenance"] };
  assert.deepEqual(cloudLeaks(sai, FILL), ["CLOUD_ALLOW.sale_offers: field_provenance"]);
  assert.deepEqual(cloudLeaks(CLOUD_ALLOW, [...FILL, "field_assertions"]), ["FILL: field_assertions"]);
});

test("PB-AC-8 bộ so mốc: chỉ miễn S05 loại hình NULL → unknown; nguồn khác, trường khác hay giá trị khác đều là lệch", () => {
  const moc = (o) => ({ moc: new Map(Object.entries(o.moc)), nguon: new Map(Object.entries(o.nguon)) });
  const nguon = { a: "S05", b: "S03", c: "S06", d: "S05" };
  const truoc = moc({ nguon, moc: { "a|property_type": null, "b|property_type": null, "c|property_type": null, "d|street_raw": null } });
  const sau = moc({ nguon, moc: { "a|property_type": "unknown", "b|property_type": "unknown", "c|property_type": "house", "d|street_raw": "unknown" } });
  const r = soMoc(truoc, sau);
  assert.deepEqual(r.nullUnknown, ["a"]);
  assert.deepEqual(r.lech.map((x) => `${x.offer_id}|${x.field}`).sort(), ["b|property_type", "c|property_type", "d|street_raw"]);
});

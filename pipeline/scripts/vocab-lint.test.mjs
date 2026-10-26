// vocab-lint.test.mjs — PL6: lint enum viết tay ngoài sổ (VL-AC-n ↔ _acceptance/so-tu-vung-mot-nguon/evals.yaml E4/E5b).
// Cây giả dựng trong thư mục tạm; sổ là mappings.yaml THẬT (đột biến khối allow khi cần). Đường suy từ vị trí tệp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { lintTree, loadRegister, scanText, validateRegister } from "../lib/vocab-core.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SO_THAT = readFileSync(join(PIPE, "mappings.yaml"), "utf8");
const regVoi = (allow) => {
  const doc = YAML.parse(SO_THAT);
  doc.enums_lint_allow = allow;
  const r = loadRegister(YAML.stringify(doc));
  validateRegister(r);
  return r;
};
const REG = regVoi([]);

// Sáu dạng viết tay — mỗi dạng một tệp ở vùng quét, mỗi dạng đúng MỘT chỗ đỏ.
const SAU_DANG = [
  ["agent/src/a-mang.ts", "export const K = ['sale', 'rent_lt'];\n", 1, "kind", "sale,rent_lt"],
  ["agent/src/b-set.ts", "const S = new Set([\n  'high',\n  'low',\n]);\n", 2, "confidence", "high,low"],
  ["app/src/lib/c-nhan.ts", "export const N = { apartment: 'Căn hộ', land: 'Đất' };\n", 1, "property_type", "apartment,land"],
  ["app/src/lib/d-union.ts", "export type T = 'P1' | 'P2';\n", 1, "price_tier", "P1,P2"],
  ["pipeline/sql/e-in.sql", "-- lọc\nSELECT 1 FROM sale_offers\nWHERE property_type IN ('house', 'room');\n", 3, "property_type", "house,room"],
  ["pipeline/f-prompt.mjs", "const P = `Trả JSON: {\"listing_intent\": \"offer|wanted\"}`;\n", 1, "listing_intent", "offer,wanted"],
];
// Cùng sáu tệp, mỗi chỗ còn một code lẻ → 0 chỗ đỏ.
const MOT_CODE = {
  "agent/src/a-mang.ts": "export const K = ['sale'];\n",
  "agent/src/b-set.ts": "const S = new Set([\n  'high',\n]);\n",
  "app/src/lib/c-nhan.ts": "export const N = { apartment: 'Căn hộ' };\n",
  "app/src/lib/d-union.ts": "export type T = 'P1';\n",
  "pipeline/sql/e-in.sql": "SELECT 1 FROM sale_offers WHERE property_type IN ('house');\n",
  "pipeline/f-prompt.mjs": "const P = `Trả JSON: {\"listing_intent\": \"offer\"}`;\n",
};

function cay(files) {
  const d = mkdtempSync(join(tmpdir(), "vocab-lint-"));
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(d, p)), { recursive: true });
    writeFileSync(join(d, p), c);
  }
  return d;
}
const dongDo = (h) => `${h.path}:${h.line} · ${h.axis} · ${h.codes.join(",")}`;

test("VL-AC-4 sáu dạng: mỗi dạng đúng một dòng đỏ đường:dòng · trục · code", () => {
  const d = cay(Object.fromEntries(SAU_DANG.map(([p, c]) => [p, c])));
  const kq = lintTree(d, REG);
  const thay = kq.hits.map(dongDo).sort();
  const mong = SAU_DANG.map(([p, , line, axis, codes]) => `${p}:${line} · ${axis} · ${codes}`).sort();
  assert.deepEqual(thay, mong);
});

test("VL-AC-4 một code: cùng sáu tệp chỉ còn một code mỗi chỗ → 0 chỗ đỏ", () => {
  const kq = lintTree(cay(MOT_CODE), REG);
  assert.deepEqual(kq.hits.map(dongDo), []);
});

test("VL-AC-4 vùng không quét: tệp sinh, db/migrations, collector, tệp test → 0 chỗ đỏ; collector được đếm", () => {
  const files = {
    "pipeline/lib/x.generated.mjs": SAU_DANG[0][1],
    "db/migrations/099_x.sql": SAU_DANG[4][1],
    "collector/src/x.ts": SAU_DANG[0][1],
    "agent/tests/x.test.ts": SAU_DANG[1][1],
    "app/src/lib/x.test.tsx": SAU_DANG[2][1],
    "pipeline/scripts/x.itest.mjs": SAU_DANG[5][1],
  };
  const kq = lintTree(cay(files), REG);
  assert.deepEqual(kq.hits.map(dongDo), []);
  assert.equal(kq.collectorCount, 1);
});

test("VL-AC-4 ngoại lệ: mục thiếu reason đỏ; mục không còn khớp đỏ; mục khớp có reason thì cho qua", () => {
  const d = cay({ "agent/src/a-mang.ts": SAU_DANG[0][1], "agent/src/b-set.ts": SAU_DANG[1][1] });
  const kq = lintTree(d, regVoi([
    { path: "agent/src/a-mang.ts", axis: "kind", reason: "đóng băng để so số đo cũ" },
    { path: "agent/src/b-set.ts", axis: "confidence" },
    { path: "agent/src/khong-co.ts", axis: "kind", reason: "cũ" },
  ]));
  assert.deepEqual(kq.hits.map(dongDo), ["agent/src/b-set.ts:2 · confidence · high,low"]);
  assert.deepEqual(kq.allowed.map((h) => h.path), ["agent/src/a-mang.ts"]);
  assert.deepEqual(kq.allowBad.map((x) => x.path), ["agent/src/b-set.ts"]);
  assert.deepEqual(kq.allowStale.map((x) => x.path), ["agent/src/khong-co.ts"]);
});

test("VL-AC-4 trùng chữ: object số, mã lẻ, tên cột trần, comment, ${} lẻ, tệp chép kit → 0 chỗ đỏ", () => {
  const files = {
    "agent/src/so.ts": "const r = { bedrooms: 2, bathrooms: 1 };\nconst t = 'P1';\n",
    "pipeline/cot.mjs": "const q = `SELECT bedrooms, bathrooms FROM sale_offers WHERE kind = $1`;\n",
    "pipeline/ghi-chu.mjs": "// kind: 'sale' | 'rent_lt'\n/* 'high', 'low' */\nconst x = 1;\n",
    "app/src/lib/tpl.ts": "export const m = (kind: string) => `${kind}` === 'sale';\n",
    "scripts/product-map.mjs": SAU_DANG[0][1],
    "scripts/check-lo-trinh.sh": SAU_DANG[0][1],
    "scripts/pre-merge-check.sh": SAU_DANG[0][1],
  };
  const kq = lintTree(cay(files), REG);
  assert.deepEqual(kq.hits.map(dongDo), []);
});

test("VL-AC-4 nối chuỗi hai code là một danh sách viết tay → đỏ", () => {
  const hits = scanText("const s = 'sale' + '|' + 'rent_lt';\n", "pipeline/noi.mjs", REG);
  assert.deepEqual(hits.map(dongDo), ["pipeline/noi.mjs:1 · kind · sale,rent_lt"]);
});

test("VL-AC-4 regex có dấu nháy không làm lệch bộ quét", () => {
  const hits = scanText("const re = /['\"]/g;\nconst k = ['sale', 'rent_lt'];\n", "agent/src/re.ts", REG);
  assert.deepEqual(hits.map(dongDo), ["agent/src/re.ts:2 · kind · sale,rent_lt"]);
});

test("VL-AC-4 danh sách cột: quá nửa phần tử không phải code → không đỏ; quá nửa là code → đỏ", () => {
  const cot = "export const C = ['offer_id', 'kind', 'price_vnd', 'bedrooms', 'bathrooms', 'area_m2', 'source'];\n";
  assert.deepEqual(scanText(cot, "pipeline/cot2.mjs", REG).map(dongDo), []);
  const nhieu = "const X = ['high', 'medium', 'urgent'];\n";
  assert.deepEqual(scanText(nhieu, "agent/src/x.ts", REG).map(dongDo), ["agent/src/x.ts:1 · confidence · high,medium"]);
});

test("VL-AC-4 prompt dạng \"a\"|\"b\" trong template literal → đỏ", () => {
  const src = 'const p = `{"kind":"sale"|"rent_lt","x":1}`;\n';
  assert.deepEqual(scanText(src, "pipeline/scripts/b.mjs", REG).map(dongDo), ["pipeline/scripts/b.mjs:1 · kind · sale,rent_lt"]);
});

test("VL-AC-4 mã cài từ registry (components/ui|reui|blocks) ngoài vùng quét", () => {
  const kq = lintTree(cay({ "app/src/components/blocks/x/data.tsx": "const P = ['high', 'medium', 'low'];\n" }), REG);
  assert.deepEqual(kq.hits.map(dongDo), []);
});

test("VL-AC-4 object ánh xạ sang code ({s: 'sale', u: 'rent_lt'}) → đỏ; map nhãn tính theo khoá", () => {
  assert.deepEqual(scanText("const M = { s: 'sale', u: 'rent_lt' };\n", "pipeline/m.mjs", REG).map(dongDo), ["pipeline/m.mjs:1 · kind · sale,rent_lt"]);
  const nhan = "const N = {\n  sale: 'Bán ra',\n  rent_lt: 'Cho thuê dài',\n  other: 'Khác',\n};\n";
  assert.deepEqual(scanText(nhan, "pipeline/n.mjs", REG).map(dongDo), ["pipeline/n.mjs:2 · kind · sale,rent_lt"]);
});

// ---------------------------------------------------------------------------------------------------------------------
// VL-AC-5 — cây thật: ma trận kiểm kê viết trước (design doc §1/§2), mỗi chỗ một kết cục.
const ROOT = join(PIPE, "..");
const REG_THAT = loadRegister(SO_THAT);

const DOC_HANG_SINH = [
  "pipeline/dq-enum-vocab.mjs",
  "pipeline/transform-chotot.mjs",
  "agent/src/enrich/route.ts",
  "agent/src/agents/enrich-text.ts",
  "agent/src/agents/context-resolver.ts",
  "app/src/lib/ops-labels.ts",
];
// Tập ngoại lệ ghim ở contract AC-5 (path|axis) — so tập, không thừa không thiếu.
const NGOAI_LE = [
  "app/src/components/ops/review-card.tsx|enrich_field",
  "pipeline/scripts/bench-gate.mjs|kind",
  "pipeline/scripts/bench-extraction.mjs|kind",
  "pipeline/sql/500_asset_stats.sql|confidence",
  "pipeline/resolve-properties.mjs|confidence",
  "pipeline/resolve-properties.mjs|property_type",
  "agent/src/enrich/run.ts|confidence",
  "app/src/components/compare/compare-types.ts|confidence",
];

test("VL-AC-5 ma trận kiểm kê: sáu tệp đọc hằng sinh, tập ngoại lệ đúng bản ghim", () => {
  for (const p of DOC_HANG_SINH) {
    const src = readFileSync(join(ROOT, p), "utf8");
    assert.match(src, /from ["'][^"']*vocab\.generated(?:\.m?js)?["']/, `${p} không import tệp sinh`);
    assert.deepEqual(scanText(src, p, REG_THAT).map(dongDo), [], `${p} còn literal của trục`);
  }
  assert.deepEqual(REG_THAT.allow.map((x) => `${x.path}|${x.axis}`).sort(), [...NGOAI_LE].sort());
  const kq = lintTree(ROOT, REG_THAT);
  assert.deepEqual(kq.hits.map(dongDo), [], "cây thật còn chỗ viết tay ngoài sổ");
  assert.deepEqual(kq.allowStale, []);
  assert.deepEqual(kq.allowBad, []);
});

test("VL-AC-5 đối chứng: bản trước vòng của dq-enum-vocab.mjs bị lint bắt", () => {
  // Bản cũ GHIM thành fixture (git show 106cbd3e:pipeline/dq-enum-vocab.mjs) — không suy từ merge-base/origin/main:
  // sau merge, merge-base trỏ bản mới và phép đối chứng sẽ đỏ vĩnh viễn (S4-r1 t1/t7).
  const cu = readFileSync(join(PIPE, "scripts", "fixtures", "dq-enum-vocab.truoc-pl6.mjs.txt"), "utf8");
  const hits = scanText(cu, "pipeline/dq-enum-vocab.mjs", REG_THAT).map(dongDo);
  assert.deepEqual(hits, [
    "pipeline/dq-enum-vocab.mjs:14 · kind · sale,rent_lt",
    "pipeline/dq-enum-vocab.mjs:15 · confidence · high,medium,low",
    "pipeline/dq-enum-vocab.mjs:16 · price_tier · P0,P1,P2",
    "pipeline/dq-enum-vocab.mjs:17 · property_type · apartment,house,land,room,commercial,unknown",
  ]);
});

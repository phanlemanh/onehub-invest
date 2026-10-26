// vocab.test.mjs — PL6 sổ từ vựng một nguồn: bộ đọc sổ, bộ sinh, kiểm lệch, khoá tên trường G3.
// Ca VB-AC-n ↔ _acceptance/so-tu-vung-mot-nguon/evals.yaml. Fixture dựng bằng cách nạp mappings.yaml THẬT rồi đột biến
// một chỗ (round-trip từ sổ thật, không viết tay khuôn của bộ đọc). Đường tính từ vị trí tệp này.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { loadRegister, validateRegister, VocabError } from "../lib/vocab-core.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SO_THAT = readFileSync(join(PIPE, "mappings.yaml"), "utf8");

const AXES = [
  "kind", "property_type", "confidence", "price_tier", "enrich_field",
  "listing_intent", "offer_status", "data_level", "capability_level",
];

// Ma trận nhãn viết trước (39 dòng). Năm trục cũ: nguyên văn ops-labels.ts / FIELD_LABEL của review-card.tsx trước
// vòng; bậc: nguyên văn FRAMING §3.4; listing_intent + offer_status: Hỏi-1 của PL6 (Mạnh duyệt 26/10).
const NHAN = [
  ["kind", "sale", "Bán"], ["kind", "rent_lt", "Cho thuê"],
  ["property_type", "apartment", "Căn hộ"], ["property_type", "house", "Nhà riêng"], ["property_type", "land", "Đất"],
  ["property_type", "room", "Phòng"], ["property_type", "commercial", "Mặt bằng"], ["property_type", "unknown", "Chưa rõ"],
  ["confidence", "high", "cao"], ["confidence", "medium", "trung bình"], ["confidence", "low", "thấp"],
  ["price_tier", "P0", "giá giao dịch (P0)"], ["price_tier", "P1", "giá nội bộ (P1)"], ["price_tier", "P2", "giá công khai (P2)"],
  ["enrich_field", "property_type", "Loại hình"], ["enrich_field", "bedrooms", "Phòng ngủ"], ["enrich_field", "bathrooms", "WC"],
  ["enrich_field", "street_raw", "Đường"], ["enrich_field", "block_raw", "Toà"],
  ["listing_intent", "offer", "Tin rao"], ["listing_intent", "wanted", "Tin tìm mua, tìm thuê"],
  ["listing_intent", "not_listing", "Không phải tin rao"], ["listing_intent", "unknown", "Chưa rõ"],
  ["offer_status", "active", "Đang chào"], ["offer_status", "active_under_contract", "Đã cọc"],
  ["offer_status", "closed", "Đã bán"], ["offer_status", "withdrawn", "Đã gỡ"], ["offer_status", "unknown", "Chưa rõ"],
  ["data_level", "B0", "Có lời khai"], ["data_level", "B1", "Đọc được"], ["data_level", "B2", "Gắn căn"],
  ["data_level", "B3", "Đã đo"], ["data_level", "B4", "Xác minh"], ["data_level", "B5", "Sống"],
  ["capability_level", "N0", "Thu được"], ["capability_level", "N1", "Đọc được"], ["capability_level", "N2", "Đo được"],
  ["capability_level", "N3", "Tự động ở ngưỡng"], ["capability_level", "N4", "Tự duy trì"],
];

/** Nạp sổ thật, đột biến khối enums bằng `fn`, trả lại chuỗi YAML. */
function dotBien(fn) {
  const doc = YAML.parse(SO_THAT);
  fn(doc.enums);
  return YAML.stringify(doc);
}

test("VB-AC-1 sổ thật: đủ 9 trục, đúng code + nhãn từng byte", () => {
  const reg = loadRegister(SO_THAT);
  validateRegister(reg); // đối chứng dương: sổ thật không ném
  assert.deepEqual(reg.axes.map((a) => a.name), AXES);
  assert.equal(NHAN.length, 39);
  for (const a of reg.axes) {
    assert.ok(a.term_vi, `${a.name} thiếu term_vi`);
    assert.ok("dd_field" in a, `${a.name} thiếu dd_field`);
    assert.ok(Array.isArray(a.columns), `${a.name} thiếu columns`);
    for (const v of a.values) {
      assert.ok(v.label_vi, `${a.name}.${v.code} thiếu label_vi`);
      assert.ok(Boolean(v.dd_lookup) || (v.local && v.rationale && v.checked_on), `${a.name}.${v.code}: cần dd_lookup hoặc local`);
    }
  }
  const thuc = reg.axes.flatMap((a) => a.values.map((v) => [a.name, v.code, v.label_vi]));
  assert.deepEqual(thuc, NHAN);
});

const SAI_KHUON = [
  ["(a) thiếu label_vi", (e) => { delete e.kind.values[0].label_vi; }, "kind", "sale"],
  ["(b) code trùng", (e) => { e.confidence.values.push({ code: "high", label_vi: "cao 2" }); }, "confidence", "high"],
  ["(c) code sai khuôn", (e) => { e.property_type.values[0].code = "Căn_hộ"; }, "property_type", "Căn_hộ"],
  ["(d) local thiếu rationale", (e) => { delete e.property_type.values[3].rationale; }, "property_type", "room"],
  ["(e) vừa dd_lookup vừa local", (e) => { e.kind.values[1].local = true; e.kind.values[1].rationale = "x"; }, "kind", "rent_lt"],
  ["(f) một cột ở hai trục", (e) => { e.confidence.columns.push("sale_offers.kind"); }, "confidence", "sale_offers.kind"],
  ["(g) nhãn NFD", (e) => { e.property_type.values[0].label_vi = "Căn hộ".normalize("NFD"); }, "property_type", "apartment"],
];

for (const [ten, fn, truc, code] of SAI_KHUON) {
  test(`VB-AC-1 sai khuôn ${ten}: ném, nêu trục và code`, () => {
    const reg = loadRegister(dotBien(fn));
    assert.throws(() => validateRegister(reg), (err) => {
      assert.ok(err instanceof VocabError, "phải là VocabError");
      assert.match(err.message, new RegExp(truc));
      assert.ok(err.message.includes(code), `thông điệp thiếu «${code}»: ${err.message}`);
      return true;
    });
  });
}

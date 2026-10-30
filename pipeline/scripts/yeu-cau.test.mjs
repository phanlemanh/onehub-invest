// yeu-cau.test.mjs — bảng Yêu cầu, phần không cần DB (YC-AC-n ↔ _acceptance/bang-yeu-cau/evals.yaml): khai RESO của bảng
// (YC-AC-2). Ca đỏ chạy trên bản sao đột biến chép cạnh tệp thật rồi xoá.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { KIEM_ENUM } from "../dq-enum-vocab.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const doc = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
let nBan = 0;

/** Tên cột trong CREATE TABLE inquiry_records của tệp migration (không chép tay). */
function cotMigration(sql) {
  const than = sql.match(/CREATE TABLE IF NOT EXISTS inquiry_records \(([\s\S]*?)\n\);/)?.[1];
  if (!than) throw new Error("không thấy CREATE TABLE inquiry_records trong migration 058");
  return than.split("\n").map((l) => l.match(/^ {2}([a-z_0-9]+)\s+[a-z]/)?.[1]).filter(Boolean);
}

/** Ném khi khối inquiries của sổ thiếu cột của migration, sai resource, hoặc cột ngoài DD thiếu rationale. */
function kiemKhoiInquiries(mappingsText, sql) {
  const k = parse(mappingsText).inquiries;
  if (!k?.fields) throw new Error("mappings.yaml thiếu khối inquiries.fields");
  if (k.dd_resource !== "SavedSearch" || k.dd_version !== "2.1") throw new Error("khối inquiries phải khai dd_resource SavedSearch, dd_version 2.1");
  if (k.table !== "inquiry_records") throw new Error("khối inquiries phải trỏ bảng inquiry_records");
  const cot = cotMigration(sql);
  if (cot.length < 19) throw new Error(`migration 058 chỉ đọc được ${cot.length} cột`);
  for (const c of cot) {
    const f = k.fields[c];
    if (!f) throw new Error(`mappings.yaml thiếu cột ${c}`);
    if (!f.dd && !(f.rationale && f.checked_on)) throw new Error(`cột ${c} ngoài DD thiếu rationale/checked_on`);
  }
}

test("YC-AC-2 sổ: khối inquiries (SavedSearch) đủ cột, DQ enum hai mục, CONTEXT «Yêu cầu» đã sửa", () => {
  const sql = doc("db/migrations/058_inquiry_records.sql");
  kiemKhoiInquiries(doc("pipeline/mappings.yaml"), sql);
  for (const cot of ["kind", "property_type"]) {
    assert.ok(KIEM_ENUM.some((m) => m.bang === "inquiries" && m.cot === cot && m.truc === cot), `KIEM_ENUM thiếu (inquiries, ${cot})`);
  }
  const ctx = doc("CONTEXT.md");
  const muc = ctx.split("\n").find((l) => l.startsWith("**Yêu cầu**:"));
  assert.ok(muc, "CONTEXT thiếu mục «Yêu cầu»");
  assert.ok(!muc.includes("bảng lưu yêu cầu và ghép với listing là tính năng sau"), "CONTEXT còn câu «tính năng sau»");
  assert.ok(muc.includes("inquiries"), "CONTEXT «Yêu cầu» không nhắc bảng inquiries");
});

test("YC-AC-2 đối chứng: bản sao sổ bỏ rationale của post_ids → lỗi gọi tên post_ids", () => {
  const goc = doc("pipeline/mappings.yaml");
  const dotBien = goc.replace(/(\n {4}post_ids:\n {6}dd: null\n) {6}rationale: >\n(?: {8}.*\n)+/, "$1");
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  const tep = path.join(ROOT, "pipeline", `mappings.dot-bien-${process.pid}-${++nBan}.yaml`);
  writeFileSync(tep, dotBien);
  try {
    assert.throws(() => kiemKhoiInquiries(readFileSync(tep, "utf8"), doc("db/migrations/058_inquiry_records.sql")), /post_ids/);
  } finally {
    rmSync(tep, { force: true });
  }
});

// ---- Task 3: tiêu chí, khoá gom (YC-AC-3) ----
const LIB = path.join(ROOT, "pipeline", "lib", "yeu-cau.mjs");
const PHUONG = [{ id: "vn-hanoi-phuong-cau-giay", name: "Phường Cầu Giấy", market: "vn-hanoi" }];
const { matchPhuongThiTruong } = await import("../transform-zalo.mjs");
const CTX = { phuongCua: (p) => matchPhuongThiTruong(p.text, PHUONG), thiTruongKhai: () => [] };
const TY = 1e9, TR = 1e6;
const T = (o) => ({ kind: null, property_type: null, bedrooms: null, area_m2: null, budget_min_vnd: null, budget_max_vnd: null,
  area_id: null, ...o });
const pk = (value) => ({ value });

/** Ma trận viết trước: [tên, chữ bài, phát biểu thắng, bảy trường mong đợi]. */
const MA_TRAN = [
  ["khoảng 2–3 tỷ", "Cần mua căn hộ 2PN tầm 2-3 tỷ", {}, T({ kind: "sale", property_type: "apartment", bedrooms: 2, budget_min_vnd: 2 * TY, budget_max_vnd: 3 * TY })],
  ["từ a đến b", "Tìm mua nhà riêng từ 2 đến 3,5 tỷ", {}, T({ kind: "sale", property_type: "house", budget_min_vnd: 2 * TY, budget_max_vnd: 3.5 * TY })],
  ["dưới 3 tỷ", "Cần mua chung cư dưới 3 tỷ", {}, T({ kind: "sale", property_type: "apartment", budget_max_vnd: 3 * TY })],
  ["tối đa 3 tỷ", "Cần mua đất tối đa 3 tỷ", {}, T({ kind: "sale", property_type: "land", budget_max_vnd: 3 * TY })],
  ["tầm dưới 3 tỷ", "Cần mua lô đất tầm dưới 3 tỷ", {}, T({ kind: "sale", property_type: "land", budget_max_vnd: 3 * TY })],
  ["sàn kèm trần — tối đa 3 tỷ", "Cần mua căn hộ từ 2 tỷ, tối đa 3 tỷ", {}, T({ kind: "sale", property_type: "apartment", budget_min_vnd: 2 * TY, budget_max_vnd: 3 * TY })],
  ["trần kèm sàn — dưới 3 tỷ", "Cần mua nhà riêng dưới 3 tỷ, trên 2 tỷ", {}, T({ kind: "sale", property_type: "house", budget_min_vnd: 2 * TY, budget_max_vnd: 3 * TY })],
  ["trên 2 tỷ", "Cần mua đất nền trên 2 tỷ", {}, T({ kind: "sale", property_type: "land", budget_min_vnd: 2 * TY })],
  ["từ 2 tỷ", "Tìm mua nhà phố từ 2 tỷ", {}, T({ kind: "sale", property_type: "house", budget_min_vnd: 2 * TY })],
  ["tầm 3 tỷ (Hỏi-1)", "Cần mua nhà mặt phố tầm 3 tỷ", {}, T({ kind: "sale", property_type: "house", budget_max_vnd: 3 * TY })],
  ["khoảng 3 tỷ (Hỏi-1)", "Cần mua nhà ngõ khoảng 3 tỷ", {}, T({ kind: "sale", property_type: "house", budget_max_vnd: 3 * TY })],
  ["tài chính 3 tỷ (Hỏi-1)", "Cần mua căn 2PN, tài chính 3 tỷ", {}, T({ kind: "sale", bedrooms: 2, budget_max_vnd: 3 * TY })],
  ["ngân sách 15tr", "Cần thuê phòng trọ ngân sách 15tr", {}, T({ kind: "rent_lt", property_type: "room", budget_max_vnd: 15 * TR })],
  ["8 củ", "Tìm thuê phòng khép kín 8 củ", {}, T({ kind: "rent_lt", property_type: "room", budget_max_vnd: 8 * TR })],
  ["12 triệu", "Cần thuê văn phòng 40m2 12 triệu", {}, T({ kind: "rent_lt", property_type: "commercial", area_m2: 40, budget_max_vnd: 12 * TR })],
  ["thuê 2 tỷ phi lý", "Cần thuê mặt bằng tài chính 2 tỷ", {}, T({ kind: "rent_lt", property_type: "commercial" })],
  ["giá theo m2", "Cần mua shophouse 45tr/m2", {}, T({ kind: "sale", property_type: "commercial" })],
  ["khoảng ngược", "Cần mua căn hộ 3-2 tỷ", {}, T({ kind: "sale", property_type: "apartment", budget_min_vnd: 2 * TY, budget_max_vnd: 3 * TY })],
  ["nhà đứng một mình", "Cần mua nhà tầm 3 tỷ", {}, T({ kind: "sale", budget_max_vnd: 3 * TY })],
  ["hai loại hình", "Cần mua căn hộ hoặc nhà riêng", {}, T({ kind: "sale", property_type: "apartment" })],
  ["tìm thuê theo chữ", "Khách tìm thuê căn 2pn gần trung tâm", {}, T({ kind: "rent_lt", bedrooms: 2 })],
  ["có phường", "Cần thuê căn hộ 1PN ở Cầu Giấy", {}, T({ kind: "rent_lt", property_type: "apartment", bedrooms: 1, area_id: "vn-hanoi-phuong-cau-giay" })],
  ["có phát biểu kind", "Cần mua căn hộ tầm 3 tỷ", { kind: pk("rent_lt") }, T({ kind: "rent_lt", property_type: "apartment" })],
  ["phát biểu property_type", "Cần mua căn hộ", { property_type: pk("house") }, T({ kind: "sale", property_type: "house" })],
  ["phát biểu unknown", "Cần mua đất", { property_type: pk("unknown") }, T({ kind: "sale", property_type: "land" })],
];
const BAY = ["kind", "property_type", "bedrooms", "area_m2", "budget_min_vnd", "budget_max_vnd", "area_id"];

/** Chạy ma trận trên một bản của lib; trả số dòng đã assert. */
async function chayMaTran(lib) {
  let n = 0;
  for (const [ten, chu, thang, mong] of MA_TRAN) {
    const tc = lib.tieuChiYeuCau({ post_id: "p", text: chu }, thang, CTX);
    assert.deepEqual(Object.fromEntries(BAY.map((k) => [k, tc[k]])), mong, `dòng «${ten}»`);
    n++;
  }
  return n;
}

test("YC-AC-3 ma trận tiêu chí: ngân sách mọi dạng, loại hình Hỏi-3, dịch vụ, phường, phát biểu thắng chữ", async () => {
  assert.equal(await chayMaTran(await import("../lib/yeu-cau.mjs")), MA_TRAN.length);
});

/** Nạp bản sao đột biến của lib (chép cạnh tệp thật, tên có bộ đếm vì import() nhớ theo URL) rồi xoá. */
async function banSao(thay) {
  const goc = readFileSync(LIB, "utf8");
  const dotBien = thay(goc);
  assert.notEqual(dotBien, goc, "bản sao đột biến không đổi gì");
  const tep = path.join(ROOT, "pipeline", "lib", `yeu-cau.dot-bien-${process.pid}-${++nBan}.mjs`);
  writeFileSync(tep, dotBien);
  try {
    return await import(`./../lib/${path.basename(tep)}`);
  } finally {
    rmSync(tep, { force: true });
  }
}

// Theo Hỏi-1 số tiền đứng một mình cũng là trần, nên dòng «dưới 3 tỷ» trơn không phân biệt được nhánh trần; dòng trần ghim
// được là trần đi kèm sàn viết rời.
test("YC-AC-3 đối chứng: bản sao bỏ nhánh «dưới/tối đa» → ghim dòng trần «sàn kèm trần — tối đa 3 tỷ»", async () => {
  const lib = await banSao((s) => s.replace(String.raw`(?:tầm\s+dưới|dưới|tối\s*đa|không\s+quá|max)`, String.raw`(?:không\s+quá|max)`));
  await assert.rejects(chayMaTran(lib), /dòng «sàn kèm trần — tối đa 3 tỷ»/);
});

test("YC-AC-3 đối chứng: bản sao bỏ ưu tiên phát biểu kind → ghim dòng «có phát biểu kind»", async () => {
  const lib = await banSao((s) => s.replace("const kind = thang?.kind?.value ?? docDichVu(post.text);", "const kind = docDichVu(post.text);"));
  await assert.rejects(chayMaTran(lib), /dòng «có phát biểu kind»/);
});

test("YC-AC-3 gom: cùng người cùng chữ → một Yêu cầu; khác người, không người → mỗi bài một", async () => {
  const { gomYeuCau } = await import("../lib/yeu-cau.mjs");
  const li = { listing_intent: { assertion_id: 1, method: "kev", tier: "inferred", p: 0.7 } };
  const it = (post_id, sender_id, text, posted_at) => ({ post: { post_id, sender_id, text, posted_at }, thang: li, tieuChi: T({}) });
  const rows = gomYeuCau("S03", [
    it("b", "u1", "Cần thuê căn 2PN!!", "2026-10-29T02:00:00Z"),
    it("a", "u1", "cần thuê   căn 2pn", "2026-10-28T02:00:00Z"),
    it("c", "u2", "Cần thuê căn 2PN", "2026-10-28T03:00:00Z"),
    it("d", null, "Cần thuê căn 2PN", "2026-10-28T04:00:00Z"),
    it("e", null, "Cần thuê căn 2PN", "2026-10-28T05:00:00Z"),
  ]);
  const theoNeo = Object.fromEntries(rows.map((r) => [r.originating_system_key, r]));
  assert.deepEqual(Object.keys(theoNeo).sort(), ["a", "c", "d", "e"]);
  assert.deepEqual(theoNeo.a.post_ids, ["a", "b"]);
  assert.equal(theoNeo.a.first_seen, "2026-10-28T02:00:00.000Z");
  assert.equal(theoNeo.a.last_seen, "2026-10-29T02:00:00.000Z");
  assert.ok(rows.every((r) => /^inq_[0-9a-f]{16}$/.test(r.inquiry_id)));
});

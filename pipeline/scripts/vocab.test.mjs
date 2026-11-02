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
  "kind", "property_type", "confidence", "price_tier", "enrich_field", "assertion_field", "evidence_tier", "assertion_method",
  "registry_status", "alias_kind", "registry_event_kind", "party_role",
  "listing_intent", "offer_status", "change_type", "data_level", "capability_level",
];

// Ma trận nhãn viết trước (71 dòng). Năm trục cũ: nguyên văn ops-labels.ts / FIELD_LABEL của review-card.tsx trước
// vòng; bậc: nguyên văn FRAMING §3.4; listing_intent + offer_status: Hỏi-1 của PL6 (Mạnh duyệt 26/10);
// evidence_tier + assertion_method: PL15 (bảng phát biểu, design §3.7); `wanted` → `inquiry` «Yêu cầu»: Mạnh 27/10
// (hồ sơ wanted-thanh-inquiry); bốn trục danh bạ: DB2b
// ho-nguoi-theo-nguon (Mạnh duyệt 30/10); assertion_field + change_type: PL19 (trường phát biểu; loại thay đổi RESO ChangeType).
const NHAN = [
  ["kind", "sale", "Bán"], ["kind", "rent_lt", "Cho thuê"],
  ["property_type", "apartment", "Căn hộ"], ["property_type", "house", "Nhà riêng"], ["property_type", "land", "Đất"],
  ["property_type", "room", "Phòng"], ["property_type", "commercial", "Mặt bằng"], ["property_type", "unknown", "Chưa rõ"],
  ["confidence", "high", "cao"], ["confidence", "medium", "trung bình"], ["confidence", "low", "thấp"],
  ["price_tier", "P0", "giá giao dịch (P0)"], ["price_tier", "P1", "giá nội bộ (P1)"], ["price_tier", "P2", "giá công khai (P2)"],
  ["enrich_field", "property_type", "Loại hình"], ["enrich_field", "bedrooms", "Phòng ngủ"], ["enrich_field", "bathrooms", "WC"],
  ["enrich_field", "street_raw", "Đường"], ["enrich_field", "block_raw", "Toà"],
  ["assertion_field", "property_type", "Loại hình"], ["assertion_field", "bedrooms", "Phòng ngủ"],
  ["assertion_field", "bathrooms", "WC"], ["assertion_field", "street_raw", "Đường"], ["assertion_field", "block_raw", "Toà"],
  ["assertion_field", "offer_status", "Trạng thái chào"],
  // HD5 (dac-trung-nha-s06-len-canonical, 061; giám sát duyệt P1-87): bảy đặc trưng nhà S06.
  ["assertion_field", "street_number", "Số nhà"], ["assertion_field", "unit_number", "Mã căn"],
  ["assertion_field", "frontage_length", "Mặt tiền"], ["assertion_field", "lot_size_dimensions", "Ngang × dài"],
  ["assertion_field", "stories", "Số tầng"], ["assertion_field", "latitude", "Vĩ độ"], ["assertion_field", "longitude", "Kinh độ"],
  ["evidence_tier", "fact", "Sự thật"], ["evidence_tier", "observed", "Quan sát có trích dẫn"],
  ["evidence_tier", "inferred", "Suy luận"],
  ["assertion_method", "hitl", "Người quyết"], ["assertion_method", "source_field", "Trường có cấu trúc của nguồn"],
  ["assertion_method", "parser", "Bộ đọc tin"], ["assertion_method", "e1_rule", "Luật E1"],
  ["assertion_method", "e2_llm", "LLM E2"], ["assertion_method", "legacy", "Giá trị có trước"],
  ["registry_status", "active", "Đang dùng"], ["registry_status", "merged", "Đã gộp"],
  ["registry_status", "split", "Đã tách"], ["registry_status", "retired", "Đã nghỉ"],
  ["alias_kind", "tai_khoan_nguon", "Tài khoản tại nguồn"], ["alias_kind", "sdt_bam", "SĐT băm"], ["alias_kind", "ten", "Tên hiển thị"], ["alias_kind", "sdt", "SĐT số gốc"],
  ["registry_event_kind", "gop", "Gộp"], ["registry_event_kind", "tach", "Tách"], ["registry_event_kind", "nghi", "Nghỉ"],
  ["party_role", "nguoi_dang", "Người đăng"],
  ["listing_intent", "offer", "Tin rao"], ["listing_intent", "inquiry", "Yêu cầu"],
  ["listing_intent", "not_listing", "Không phải tin rao"], ["listing_intent", "unknown", "Chưa rõ"],
  ["offer_status", "active", "Đang chào"], ["offer_status", "active_under_contract", "Đã cọc"],
  ["offer_status", "closed", "Đã bán"], ["offer_status", "withdrawn", "Đã gỡ"], ["offer_status", "unknown", "Chưa rõ"],
  ["change_type", "new_listing", "Tin mới"], ["change_type", "price_change", "Đổi giá"], ["change_type", "withdrawn", "Gỡ tin"],
  ["change_type", "back_on_market", "Chào lại"], ["change_type", "active_under_contract", "Đã cọc"],
  ["change_type", "closed", "Đã bán"],
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

test("VB-AC-1 sổ thật: đủ 17 trục, đúng code + nhãn từng byte", () => {
  const reg = loadRegister(SO_THAT);
  validateRegister(reg); // đối chứng dương: sổ thật không ném
  assert.deepEqual(reg.axes.map((a) => a.name), AXES);
  assert.equal(NHAN.length, 79); // HD5 (061; giám sát duyệt P1-87): +7 mã assertion_field; SD3 thêm alias_kind sdt
  // wanted-thanh-inquiry AC-1: yêu cầu là bên mua, đối xứng với listing bên bán.
  const li = reg.axes.find((a) => a.name === "listing_intent");
  assert.deepEqual(li.values.map((v) => v.code), ["offer", "inquiry", "not_listing", "unknown"]);
  assert.match(li.rationale, /bên mua/);
  assert.match(li.rationale, /SavedSearch/);
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

// ---------------------------------------------------------------------------------------------------------------------
// VB-AC-2 / VB-AC-3 — bộ sinh và kiểm lệch, chạy CLI thật trên một kho tối thiểu trong thư mục tạm.
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = join(PIPE, "..");
const CLI = join(PIPE, "vocab.mjs");
const CONTEXT_THAT = readFileSync(join(ROOT, "CONTEXT.md"), "utf8");
const DICH_SINH = ["pipeline/lib/vocab.generated.mjs", "agent/src/vocab.generated.ts", "app/src/lib/vocab.generated.ts"];
const BEGIN = "<!-- VOCAB:BEGIN -->";
const END = "<!-- VOCAB:END -->";

function khoTam({ so = SO_THAT, context = CONTEXT_THAT } = {}) {
  const d = mkdtempSync(join(tmpdir(), "vocab-"));
  mkdirSync(join(d, "pipeline"), { recursive: true });
  writeFileSync(join(d, "pipeline", "mappings.yaml"), so);
  writeFileSync(join(d, "CONTEXT.md"), context);
  return d;
}
const chay = (root, ...args) => spawnSync(process.execPath, [CLI, "--root", root, ...args], { encoding: "utf8" });
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const ngoaiMoc = (t) => [t.slice(0, t.indexOf(BEGIN)), t.slice(t.indexOf(END) + END.length)];

test("VB-AC-2 --write hai lần ra cùng byte, nạp lại bằng sổ, CONTEXT.md ngoài mốc không đổi", async () => {
  const d = khoTam();
  const r1 = chay(d, "--write");
  assert.equal(r1.status, 0, r1.stderr);
  const dich = [...DICH_SINH, "CONTEXT.md"].map((p) => join(d, p));
  const lan1 = dich.map(sha);
  assert.equal(chay(d, "--write").status, 0);
  assert.deepEqual(dich.map(sha), lan1, "lần --write thứ hai đổi byte");
  for (const p of DICH_SINH) {
    const dong1 = readFileSync(join(d, p), "utf8").split("\n")[0];
    assert.ok(dong1.includes("MÁY SINH từ pipeline/mappings.yaml"), `${p} thiếu dòng đầu MÁY SINH`);
  }
  const reg = loadRegister(SO_THAT);
  const gen = await import(pathToFileURL(join(d, "pipeline/lib/vocab.generated.mjs")).href);
  assert.deepEqual(Object.keys(gen.VOCAB), reg.axes.map((a) => a.name));
  for (const a of reg.axes) assert.deepEqual([...gen.VOCAB[a.name]], a.values.map((v) => v.code));
  assert.deepEqual([...gen.CANONICAL_FIELDS], reg.canonicalFields);
  const ctx = readFileSync(join(d, "CONTEXT.md"), "utf8");
  assert.deepEqual(ngoaiMoc(ctx), ngoaiMoc(CONTEXT_THAT), "CONTEXT.md đổi ngoài hai mốc");
  const khoi = ctx.slice(ctx.indexOf(BEGIN), ctx.indexOf(END));
  for (const a of reg.axes) {
    assert.ok(khoi.includes(a.term_vi), `khối CONTEXT thiếu ${a.term_vi}`);
    for (const v of a.values) assert.ok(khoi.includes(v.label_vi), `khối CONTEXT thiếu nhãn ${a.name}.${v.code}`);
  }
  // đối chứng: đổi một nhãn trong sổ → tệp app đổi đúng chuỗi đó
  const d2 = khoTam({ so: dotBien((e) => { e.kind.values[0].label_vi = "Bán ra"; }) });
  assert.equal(chay(d2, "--write").status, 0);
  assert.ok(readFileSync(join(d2, "app/src/lib/vocab.generated.ts"), "utf8").includes('"Bán ra"'));
});

test("VB-AC-2 thiếu mốc VOCAB: --write thoát 1, CONTEXT.md không đổi", () => {
  const ctx = CONTEXT_THAT.replace(BEGIN, "").replace(END, "");
  const d = khoTam({ context: ctx });
  const r = chay(d, "--write");
  assert.equal(r.status, 1);
  assert.match(r.stderr, /thiếu mốc VOCAB/);
  assert.equal(readFileSync(join(d, "CONTEXT.md"), "utf8"), ctx);
});

test("VB-AC-3 --check: sạch thoát 0; sửa tay từng đích hoặc sửa sổ chưa --write thì thoát 1, nêu tệp", () => {
  const d = khoTam();
  assert.equal(chay(d, "--write").status, 0);
  const r0 = chay(d, "--check");
  assert.equal(r0.status, 0, r0.stderr);
  assert.match(r0.stdout, /vocab --check: 4\/4 đích khớp sổ/);
  for (const p of [...DICH_SINH, "CONTEXT.md"]) {
    const f = join(d, p);
    const goc = readFileSync(f, "utf8");
    const sua = p === "CONTEXT.md" ? goc.replace("«Căn hộ»", "«Căn họ»") : goc.replace('"sale"', '"salf"');
    assert.notEqual(sua, goc, `không tìm được chỗ sửa trong ${p}`);
    writeFileSync(f, sua);
    const r = chay(d, "--check");
    assert.equal(r.status, 1, `${p}: --check phải thoát 1`);
    assert.ok(r.stderr.includes(p), `${p}: stderr không nêu tệp: ${r.stderr}`);
    writeFileSync(f, goc);
  }
  writeFileSync(join(d, "pipeline", "mappings.yaml"),
    dotBien((e) => { e.data_level.values.push({ code: "B6", label_vi: "Thử" }); }));
  const r5 = chay(d, "--check");
  assert.equal(r5.status, 1);
  for (const p of [...DICH_SINH, "CONTEXT.md"]) assert.ok(r5.stderr.includes(p), `(5) stderr thiếu ${p}`);
  assert.ok(!existsSync(join(d, "x")));
});

// ---------------------------------------------------------------------------------------------------------------------
// VB-AC-9 — khoá tên trường FIELD_TARGET (G3) theo canonical.fields của mappings.yaml. Khuôn đọc: khoá cấp một là mã
// nguồn S0x, dưới đó `fields:` là danh sách mục có `canonical`. Tệp thật của ZCode chưa có (revisit trong sổ).
import { readdirSync, statSync } from "node:fs";

function bamCay(dir) {
  const h = createHash("sha256");
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(d, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "dist") walk(p); }
      else h.update(`${p}:${statSync(p).size}:${statSync(p).mtimeMs}`);
    }
  };
  walk(dir);
  return h.digest("hex");
}

test("VB-AC-9 --check-field-targets: khớp 0 · tên ngoài sổ 1 · tệp vắng 0 · khuôn lạ 1 · không ghi collector/", () => {
  const reg = loadRegister(SO_THAT);
  const d = mkdtempSync(join(tmpdir(), "vocab-ft-"));
  const tep = join(d, "field-targets.yaml");
  const muc = (c) => ({ canonical: c, raw_path: "$.x", ceiling: 1, target: 0.8, weight: 1 });
  const hop = { S03: { fields: reg.canonicalFields.slice(0, 6).map(muc) }, S06: { fields: reg.canonicalFields.slice(6, 12).map(muc) } };
  const truoc = bamCay(join(ROOT, "collector"));

  writeFileSync(tep, YAML.stringify(hop));
  const ra = chay(ROOT, "--check-field-targets", tep);
  assert.equal(ra.status, 0, ra.stderr);

  const sai = structuredClone(hop);
  sai.S03.fields.push(muc("gia_khoang"));
  writeFileSync(tep, YAML.stringify(sai));
  const rb = chay(ROOT, "--check-field-targets", tep);
  assert.equal(rb.status, 1);
  assert.ok(rb.stderr.includes("S03") && rb.stderr.includes("gia_khoang"), rb.stderr);

  const rc = chay(ROOT, "--check-field-targets", join(d, "khong-co.yaml"));
  assert.equal(rc.status, 0);
  assert.match(rc.stdout, /chưa có tệp/);

  for (const la of [{ nguon: { S03: hop.S03 } }, { S03: { muc_tieu: [{ cot: "price_vnd" }] } }]) {
    writeFileSync(tep, YAML.stringify(la));
    const re = chay(ROOT, "--check-field-targets", tep);
    assert.equal(re.status, 1, `khuôn lạ phải thoát 1: ${JSON.stringify(la).slice(0, 40)}`);
    assert.match(re.stderr, /không nhận khuôn/);
  }
  assert.equal(bamCay(join(ROOT, "collector")), truoc, "lệnh đã ghi vào collector/");
});

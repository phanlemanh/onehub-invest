// thuoc-tinh-can-s16.test.mjs — hồ sơ thuoc-tinh-can-s16 (DA40): ca «TTC-AC-3» (luật nguồn → phát biểu, ma trận viết trước)
// và «TTC-AC-8» (thuộc tính, giá S16 không rời máy). Không DB. Chạy: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham
// Dòng mẫu theo khuôn cột của migration 113 (bộ ghi thật là bộ nạp của làn thu — giới hạn khai ở Notes của hợp đồng).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const TEP_LOI = join(dirname(fileURLToPath(import.meta.url)), "../lib/thuoc-tinh-can-s16.mjs");
const GOC = join(dirname(fileURLToPath(import.meta.url)), "../..");

const D = (o = {}) => ({ du_an: "da-q", toa: "T1", ma_can: "Q1", dong: 0, height_type: "HIGH_RISE", property_type: "APARTMENT",
  bedroom: 2, bathroom: 1, direction: "", balcony_direction: "SE", area_using: 68.5, area_building: 74.9, ...o });
const lay = (kq, f) => kq.phat.filter((p) => p.field === f).map((p) => p.value);
const lyDo = (kq, f) => kq.bo.find((b) => b.field === f)?.ly_do ?? null;

/** Ma trận viết trước: mỗi ô một dòng, một mong đợi (trường, giá trị phát biểu, lý do bỏ). */
export const MA_TRAN = [
  ...[["APARTMENT", "apartment"], ["PENT_HOUSE", "apartment"], ["ROW_HOUSE", "house"], ["SEMI_DETACHED_VILLA", "house"],
    ["DETACHED_VILLA", "house"], ["QUADRUPLE_VILLA", "house"], ["SHOP_HOUSE", "commercial"], ["ROW_SHOP_HOUSE", "commercial"],
    ["SEMI_DETACHED_SHOP", "commercial"], ["DETACHED_SHOP", "commercial"], ["COMMERCIAL_SERVICE", "commercial"]]
    .map(([m, v]) => ({ o: `loai-${m}`, d: D({ property_type: m }), f: "property_type", gt: [v], ld: null })),
  { o: "loai-UNDEF", d: D({ property_type: "UNDEF" }), f: "property_type", gt: [], ld: "undef" },
  { o: "loai-ma-la", d: D({ property_type: "CASTLE" }), f: "property_type", gt: [], ld: "ma-la" },
  { o: "dt-duong", d: D({ area_using: 69.9 }), f: "living_area", gt: ["69.9"], ld: null },
  { o: "dt-0", d: D({ area_using: 0 }), f: "living_area", gt: [], ld: "khong-duong" },
  { o: "dt-thieu", d: D({ area_using: null }), f: "living_area", gt: [], ld: "trong" },
  { o: "tt-duong", d: D({ area_building: "74.90" }), f: "building_area_total", gt: ["74.9"], ld: null },
  { o: "pn-duong", d: D({ bedroom: 3 }), f: "bedrooms", gt: ["3"], ld: null },
  { o: "pn-0", d: D({ bedroom: 0 }), f: "bedrooms", gt: [], ld: "bang-0" },
  { o: "wc-duong", d: D({ bathroom: 2 }), f: "bathrooms", gt: ["2"], ld: null },
  { o: "wc-0", d: D({ bathroom: 0 }), f: "bathrooms", gt: [], ld: "bang-0" },
  { o: "huong-cao-tang", d: D({ height_type: "HIGH_RISE", balcony_direction: "NE", direction: "SW" }), f: "direction_faces", gt: ["northeast"], ld: null },
  { o: "huong-thap-tang", d: D({ height_type: "LOW_RISE", balcony_direction: "NE", direction: "SW" }), f: "direction_faces", gt: ["southwest"], ld: null },
  { o: "huong-N_E", d: D({ balcony_direction: "N_E" }), f: "direction_faces", gt: ["northeast"], ld: null },
  { o: "huong-NORTH", d: D({ balcony_direction: "NORTH" }), f: "direction_faces", gt: ["north"], ld: null },
  { o: "huong-hai-ma", d: D({ balcony_direction: "NE_NW" }), f: "direction_faces", gt: ["northeast", "northwest"], ld: null },
  { o: "huong-lap", d: D({ balcony_direction: "NE_NE" }), f: "direction_faces", gt: ["northeast"], ld: null },
  { o: "huong-OTHER", d: D({ balcony_direction: "OTHER" }), f: "direction_faces", gt: [], ld: "huong-other" },
  { o: "huong-trong", d: D({ balcony_direction: "" }), f: "direction_faces", gt: [], ld: "huong-trong" },
  { o: "huong-ma-la", d: D({ balcony_direction: "XYZ" }), f: "direction_faces", gt: [], ld: "huong-ma-la" },
  { o: "huong-cao-thap-trong", d: D({ height_type: null }), f: "direction_faces", gt: [], ld: "khong-ro-cao-thap" },
];

/** Ô hỏng của ma trận dưới một bản lõi; [] khi mọi ô đúng. */
function kiemMaTran(loi) {
  const hong = [];
  for (const c of MA_TRAN) {
    const kq = loi.phatBieuTuDong(c.d);
    if (JSON.stringify(lay(kq, c.f)) !== JSON.stringify(c.gt) || lyDo(kq, c.f) !== c.ld) hong.push(c.o);
  }
  return hong;
}

/** Bản sao của lõi có một chỗ phá, nạp từ thư mục tạm. */
async function loiPha(tu, sang) {
  const src = readFileSync(TEP_LOI, "utf8");
  assert.ok(src.includes(tu), `TTC chỗ phá không còn trong lõi: ${tu}`);
  const dir = mkdtempSync(join(tmpdir(), "ttc-pha-"));
  const tep = join(dir, "loi.mjs");
  writeFileSync(tep, src.replace(tu, sang));
  try { return await import(pathToFileURL(tep).href); } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("TTC-AC-3 ma trận nguồn → phát biểu: mọi ô đúng, số ô = số mong đợi", async () => {
  const loi = await import(pathToFileURL(TEP_LOI).href);
  assert.equal(MA_TRAN.length, 13 + 4 + 4 + 10 + 0, "TTC-AC-3 số ô ma trận đổi mà không cập nhật");
  assert.deepEqual(kiemMaTran(loi), [], "TTC-AC-3 ô sai");
  // không bao giờ phát biểu tầng hay giá
  const kq = loi.phatBieuTuDong({ ...D(), floor_number: "12", sale_price: 2_000_000_000 });
  assert.deepEqual(kq.phat.filter((p) => !["living_area", "building_area_total", "bedrooms", "bathrooms", "property_type", "direction_faces"].includes(p.field)), [],
    "TTC-AC-3 phát biểu ngoài sáu trường");
});

test("TTC-AC-3 chiều đỏ: lấy hướng cửa cho cao tầng → ô huong-cao-tang đỏ; coi PN 0 là hợp lệ → ô pn-0 đỏ", async () => {
  const p1 = await loiPha('cao === "HIGH_RISE" ? r.balcony_direction : r.direction', 'cao === "HIGH_RISE" ? r.direction : r.balcony_direction');
  assert.ok(kiemMaTran(p1).includes("huong-cao-tang"), "TTC-AC-3 phá hướng mà ô cao tầng không đỏ");
  const p2 = await loiPha("Number.isInteger(v) && v > 0", "Number.isInteger(v) && v >= 0");
  assert.ok(kiemMaTran(p2).includes("pn-0"), "TTC-AC-3 phá PN 0 mà ô pn-0 không đỏ");
});

test("TTC-AC-3 gộp khoá: trùng cùng toà gộp một; mã ở hai toà đánh dấu nhieu_toa; khoá viết hoa", async () => {
  const { gopKhoa, khoaCan } = await import(pathToFileURL(TEP_LOI).href);
  const m = gopKhoa([D({ dong: 3 }), D({ dong: 1 }), D({ ma_can: "q2", toa: "A" }), D({ ma_can: "Q2", toa: "B", dong: 5 })]);
  assert.equal(m.size, 2, "TTC-AC-3 số khoá");
  const g1 = m.get(khoaCan("da-q", "Q1"));
  assert.equal(g1.nhieu_toa, false, "TTC-AC-3 trùng cùng toà bị coi là hai toà");
  assert.equal(g1.dong.dong, 1, "TTC-AC-3 dòng đại diện phải là dòng nhỏ nhất");
  const g2 = m.get("da-q/Q2");
  assert.equal(g2.nhieu_toa, true, "TTC-AC-3 mã hai toà không bị đánh dấu");
  assert.deepEqual(g2.toa, ["A", "B"], "TTC-AC-3 danh sách toà");
});

test("TTC-AC-8 bảng nạp, phát biểu và hai view S16 không ở danh sách đẩy cloud; bộ soát bắt khi cấy", async () => {
  const { FILL } = await import(pathToFileURL(join(GOC, "pipeline/sync-cloud.mjs")).href);
  const { kiemBangDay } = await import(pathToFileURL(join(GOC, "pipeline/lib/s16-soat.mjs")).href);
  const CAM = ["stg_s16_can_chi_tiet", "field_assertions", "v_unit_thuoc_tinh", "v_s16_gia_cdt"];
  const ten = FILL.map((x) => (typeof x === "string" ? x : x.table ?? x.name ?? x[0]));
  assert.deepEqual(ten.filter((t) => CAM.includes(t)), [], "TTC-AC-8 bảng/view S16 nằm trong FILL");
  assert.equal(kiemBangDay([...ten, "stg_s16_can_chi_tiet"]), "stg_s16_can_chi_tiet", "TTC-AC-8 bộ soát không bắt bảng nạp cấy vào");
  // chiều đỏ của phép giao: cấy view giá vào bản sao danh sách → phép giao phải thấy
  assert.deepEqual([...ten, "v_s16_gia_cdt"].filter((t) => CAM.includes(t)), ["v_s16_gia_cdt"], "TTC-AC-8 phép giao không thấy view cấy");
  // hàng này không sửa sync-cloud.mjs (so với điểm rẽ nhánh khỏi main; không có main thì bỏ vế này)
  let base = null;
  try { base = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: GOC, encoding: "utf8" }).trim(); } catch { /* CI nông */ }
  if (base) {
    const doi = execFileSync("git", ["diff", "--name-only", base, "--", "pipeline/sync-cloud.mjs"], { cwd: GOC, encoding: "utf8" }).trim();
    assert.equal(doi, "", "TTC-AC-8 hàng này sửa sync-cloud.mjs");
  }
});

// noi-du-an-s08-lop.test.mjs — DA55 soat-noi-s08-danh-ba E1 (AC-1): ma trận mười lăm ca viết trước cho luật xếp ngả, và sáu phép phá
// trên cùng fixture (bản chép lib vào thư mục tạm, đổi đúng một chỗ) — mỗi phép phá phải làm đỏ đúng ca nó đo.
// Chạy: node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "..", "lib");

// Nút: HN = Hà Nội, HCM = Hồ Chí Minh; tinh null = nút ứng viên S09 chưa biết tỉnh; nguon S08 = do luật S08 đúc.
const NUT = [
  { id: 1, name: "The Global City", aliases: [], tinh: "HCM" },
  { id: 2, name: "Vinhomes Smart City", aliases: ["smart city"], tinh: "HN" },
  { id: 3, name: "Capital Square", aliases: [], tinh: "DN", nguon: "S06" },
  { id: 4, name: "Vinhomes Riverside", aliases: ["riverside"], tinh: "HN" },
  { id: 5, name: "Song Hành A", aliases: [], tinh: "HN" },
  { id: 6, name: "Song Hành A", aliases: [], tinh: "HN" },
  { id: 7, name: "Mỹ Đình Pearl", aliases: [], tinh: null, nguon: "S09" },
  { id: 8, name: "Masteri Lakeside", aliases: [], tinh: "HN" },
  { id: 9, name: "Abc Park", aliases: ["abcpark"], tinh: "HN" },
  { id: 10, name: "Eco Central Park", aliases: [], tinh: "HCM" },
  { id: 11, name: "Dự Án Đúc S08", aliases: [], tinh: "HN", nguon: "S08" },
];

/** Ma trận viết trước: tên ca → [dự án, daNoi, kỳ vọng (một phần của kết cục)]. */
const CA = {
  "giu-tay": [{ ma: "a1", ten: "The Global City", tinh: "HCM", noiTay: true }, null, { status: "giu_tay" }],
  "giu-nut-duc-s08": [{ ma: "a2", ten: "Bất kỳ", tinh: "HN" }, { asset_node_id: 11, laUngVienS08: true }, { status: "duc", node_id: 11 }],
  "ten-rong": [{ ma: "a3", ten: "Đang cập nhật", tinh: "HN" }, null, { status: "chua_noi", ly_do: "khong-ten" }],
  "hau-to-khu": [{ ma: "a4", ten: "MASTERI LAKESIDE (OCP1)", tinh: "HN" }, null, { status: "chua_noi", ly_do: "du-an-con" }],
  "khong-tinh": [{ ma: "a5", ten: "The Global City", tinh: null }, null, { status: "chua_noi", ly_do: "khong-tinh" }],
  "trung-mot-nut-cung-tinh": [{ ma: "a6", ten: "THE GLOBAL CITY", tinh: "HCM" }, null, { status: "noi", node_id: 1, can_cu: "S08-ten-chuan-cung-tinh" }],
  "trung-nut-ung-vien-s06": [{ ma: "a7", ten: "CAPITAL SQUARE", tinh: "DN" }, null, { status: "noi", node_id: 3 }],
  "trung-hai-nut": [{ ma: "a8", ten: "SONG HÀNH A", tinh: "HN" }, null, { status: "chua_noi", ly_do: "nhieu-ung-vien", ung_vien: [5, 6] }],
  "trung-nut-khong-tinh": [{ ma: "a9", ten: "MỸ ĐÌNH PEARL", tinh: "HN" }, null, { status: "chua_noi", ly_do: "nut-khong-tinh", ung_vien: [7] }],
  "chi-chua-ten": [{ ma: "a10", ten: "RIVERSIDE GARDEN", tinh: "HN" }, null, { status: "chua_noi", ly_do: "gan-giong", ung_vien: [4] }],
  "bi-danh-7-ky-tu": [{ ma: "a11", ten: "ABCPARK TOWER", tinh: "HN" }, null, { status: "duc", nhom: "abcpark tower|HN" }],
  "trung-ten-khac-tinh": [{ ma: "a12", ten: "ECO CENTRAL PARK", tinh: "NA" }, null, { status: "duc", nhom: "eco central park|NA" }],
  "tt-tmdv-ve-nut-goc": [{ ma: "a13", ten: "THE GLOBAL CITY_TT", tinh: "HCM" }, null, { status: "noi", node_id: 1 }],
  "tmdv-ve-nut-goc": [{ ma: "a14", ten: "TMDV VINHOMES SMART CITY", tinh: "HN" }, null, { status: "noi", node_id: 2 }],
  "nut-duc-s08-khong-la-ung-vien": [{ ma: "a15", ten: "DỰ ÁN ĐÚC S08", tinh: "HN" }, null, { status: "duc", nhom: "du an duc s08|HN" }],
};

const khop = (kq, mong) => Object.entries(mong).every(([k, v]) => JSON.stringify(kq[k]) === JSON.stringify(v));

/** Chạy cả ma trận trên một bản lib; trả tên các ca lệch. */
async function caLech(mod) {
  const lech = [];
  for (const [ten, [d, daNoi, mong]] of Object.entries(CA)) if (!khop(mod.phanLopS08(d, NUT, daNoi), mong)) lech.push(ten);
  // Nhóm đúc: cùng tên gốc cùng tỉnh chung khoá; khác tỉnh hai khoá.
  const g1 = mod.phanLopS08({ ma: "b1", ten: "SUN PARK", tinh: "HN" }, NUT);
  const g2 = mod.phanLopS08({ ma: "b2", ten: "SUN PARK_TT", tinh: "HN" }, NUT);
  const g3 = mod.phanLopS08({ ma: "b3", ten: "SUN PARK", tinh: "QN" }, NUT);
  if (!(g1.nhom && g1.nhom === g2.nhom && g1.nhom !== g3.nhom)) lech.push("nhom-duc");
  return lech;
}

test("NS8-1: ma trận mười lăm ca + nhóm đúc — mỗi ca đúng ngả", async () => {
  const mod = await import(pathToFileURL(join(LIB, "noi-du-an-s08-lop.mjs")).href);
  assert.deepEqual(await caLech(mod), [], "ca lệch trên lib thật");
});

/** Phép phá: [tên, chuỗi gốc, chuỗi thay, các ca phải đỏ]. */
const PHA = [
  ["bo-rang-buoc-cung-tinh", "if (n.tinh != null && n.tinh !== d.tinh) continue;", "", ["trung-ten-khac-tinh"]],
  ["chua-ten-thanh-noi", "if (chua.size) return { status: \"chua_noi\", ly_do: LY_DO.ganGiong, ung_vien: sap(chua) };", "if (chua.size === 1) return { status: \"noi\", node_id: sap(chua)[0], can_cu: CAN_CU.tenChuan };", ["chi-chua-ten"]],
  ["bo-xet-nut-khong-tinh", "if (n.tinh != null && n.tinh !== d.tinh) continue;", "if (n.tinh == null || n.tinh !== d.tinh) continue;", ["trung-nut-khong-tinh"]],
  ["bo-nguong-8-ky-tu", "q.length >= DO_DAI_BI_DANH && k.length >= DO_DAI_BI_DANH &&", "", ["bi-danh-7-ky-tu"]],
  ["bo-bo-hau-to-tt", ".replace(/(?:_|\\s)TT$/i, \"\")", "", ["tt-tmdv-ve-nut-goc"]],
  ["nhan-nut-duc-s08", "if (n.nguon === NGUON) continue;", "", ["nut-duc-s08-khong-la-ung-vien"]],
];

for (const [ten, goc, thay, phaiDo] of PHA) {
  test(`NS8-1 chiều đỏ «${ten}»: ca ${phaiDo.join(", ")} đỏ`, async () => {
    const tm = mkdtempSync(join(tmpdir(), "ns8-pha-"));
    try {
      copyFileSync(join(LIB, "noi-du-an-s06-lop.mjs"), join(tm, "noi-du-an-s06-lop.mjs"));
      const src = readFileSync(join(LIB, "noi-du-an-s08-lop.mjs"), "utf8");
      assert.ok(src.includes(goc), `phép phá «${ten}» không tìm thấy chuỗi gốc — lib đã đổi, sửa phép phá`);
      writeFileSync(join(tm, "noi-du-an-s08-lop.mjs"), src.replace(goc, thay));
      const lech = await caLech(await import(pathToFileURL(join(tm, "noi-du-an-s08-lop.mjs")).href));
      for (const ca of phaiDo) assert.ok(lech.includes(ca), `phép phá «${ten}» không làm đỏ ca «${ca}» (lệch: ${lech.join(", ") || "không"})`);
    } finally {
      rmSync(tm, { recursive: true, force: true });
    }
  });
}

test("NS8-1 băm: đổi nút đích, nhóm đúc hay lý do thì băm đổi; thứ tự không đổi băm", async () => {
  const { bamKetCuc, ketCucChuan } = await import(pathToFileURL(join(LIB, "noi-du-an-s08-lop.mjs")).href);
  const a = [["m1", ketCucChuan({ status: "noi", node_id: 1 })], ["m2", ketCucChuan({ status: "duc", nhom: "x|HN" })]];
  assert.equal(bamKetCuc(a), bamKetCuc([...a].reverse()));
  assert.notEqual(bamKetCuc(a), bamKetCuc([["m1", ketCucChuan({ status: "noi", node_id: 2 })], a[1]]), "đổi nút đích phải đổi băm");
  assert.notEqual(bamKetCuc(a), bamKetCuc([a[0], ["m2", ketCucChuan({ status: "duc", nhom: "y|HN" })]]), "đổi nhóm đúc phải đổi băm");
});

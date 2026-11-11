// tang-tren-tin.test.mjs — hồ sơ _acceptance/tang-tren-tin-s03 (DV4): ca thuần, không DB.
// DV4-AC-3: ma trận viết trước của design doc (docs/superpowers/specs/2026-11-11-tang-tren-tin-s03-design.md, M1…M28) + ca Review Focus.
// Mỗi ca một assert; ca đột biến chứng thước đỏ được.
import { test } from "node:test";
import assert from "node:assert/strict";
import { docTang, parsePost } from "../transform-zalo.mjs";

/** [mã, chữ, floor, floorBand] — chép nguyên bảng design doc; câu do người viết, không lấy từ bài thật. */
const MA_TRAN = [
  ["M1", "tầng 12", "12", null],
  ["M2", "lầu 5", "5", null],
  ["M3", "Tầng: 7", "7", null],
  ["M4", "TẦNG 9", "9", null],
  ["M5", "tầng 5/30", "5", null],
  ["M6", "S1.12.08", "12", null],
  ["M7", "GH3-1203", "12", null],
  ["M8", "PR6xx20", null, null],
  ["M9", "tầng cao", null, "upper"],
  ["M10", "tầng trung cao", null, "upper"],
  ["M11", "tầng trung", null, "middle"],
  ["M12", "trung tầng", null, "middle"],
  ["M13", "tầng vừa", null, "middle"],
  ["M14", "tầng thấp", null, "lower"],
  ["M15", "tầng 15, tầng cao", "15", null],
  ["M16", "bàn giao T4/2027", null, null],
  ["M17", "T12 view sông", null, null],
  ["M18", "toà T21", null, null],
  ["M19", "xem nhà T7", null, null],
  ["M20", "nhà 5 tầng", null, null],
  ["M21", "3 tầng", null, null],
  ["M22", "tầng 2-3", null, null],
  ["M23", "tầng 1 và 2", null, null],
  ["M24", "tầng 0", null, null],
  ["M25", "tầng 1234", null, null],
  ["M26", "tang 12", null, null],
  ["M27", "gia tang 5 trieu", null, null],
  ["M28", "S1.12.08 và S2.05.01 tầng cao", null, null],
];
/** Review Focus của kế hoạch: chữ «tầng N» thắng mã căn; chữ NFD + khoảng trắng lạ. */
const REVIEW = [
  ["R1", "S1.12.08 tầng 15", "15", null],
  ["R2", "Căn  TẦNG 7".normalize("NFD"), "7", null],
];

/** Chạy một ma trận với bộ đọc cho trước; trả mã ca sai. */
function chay(maTran, doc) {
  const sai = [];
  for (const [ma, chu, floor, floorBand] of maTran) {
    const r = doc(chu);
    if (r.floor !== floor || r.floorBand !== floorBand) sai.push(ma);
  }
  return sai;
}

test("DV4-AC-3 ma trận M1…M28 và Review Focus: mỗi ca một assert, trích dẫn có thật", () => {
  const daChay = [];
  for (const [ma, chu, floor, floorBand] of [...MA_TRAN, ...REVIEW]) {
    const r = docTang(chu);
    assert.deepEqual({ floor: r.floor, floorBand: r.floorBand }, { floor, floorBand }, `${ma} «${chu}»`);
    if (r.floor !== null || r.floorBand !== null) {
      assert.equal(typeof r.trich, "string", `${ma}: thiếu trích`);
      assert.ok(r.trich.length > 0 && chu.normalize("NFC").includes(r.trich), `${ma}: trích «${r.trich}» không có trong chữ`);
    } else {
      assert.equal(r.trich, null, `${ma}: không có giá trị mà vẫn có trích`);
    }
    daChay.push(ma);
  }
  console.log(`ma_ca_da_chay=${daChay.join(",")}`);
  assert.equal(daChay.filter((m) => m.startsWith("M")).length, 28);
});

test("DV4-AC-3 đột biến: bỏ chặn «tầng 2-3» thì M22 đỏ; đọc «T<số>» trần thì M17 đỏ", () => {
  assert.deepEqual(chay(MA_TRAN, docTang), [], "bản thật phải xanh trước");
  const sai1 = chay(MA_TRAN, (t) => docTang(t, { _dotBien: "bo-chan-nhieu-tang" }));
  assert.ok(sai1.includes("M22"), `bản bỏ chặn nhiều tầng phải đỏ ở M22, ra: ${sai1}`);
  const sai2 = chay(MA_TRAN, (t) => docTang(t, { _dotBien: "doc-T-tran" }));
  assert.ok(sai2.includes("M17"), `bản đọc T<số> trần phải đỏ ở M17, ra: ${sai2}`);
});

test("DV4-AC-3 parsePost mang tầng của bài", () => {
  const p = parsePost("Bán căn 2PN tầng 12 view sông, giá 3 tỷ");
  assert.equal(p.floor, "12");
  assert.equal(p.floorBand, null);
  assert.equal(p.trichTang, "tầng 12");
});

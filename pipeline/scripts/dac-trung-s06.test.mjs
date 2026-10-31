// dac-trung-nha-s06-len-canonical (HD5) — ca thuần «DT-AC-3»: bộ đọc đặc trưng nhà S06. Ma trận viết trước; ca đỏ trên bản
// sao đột biến của lib/dac-trung-s06.mjs chép cạnh tệp thật (tên mang bộ đếm vì import() nhớ theo URL) rồi xoá.
import { strict as assert } from "node:assert";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { docDacTrungS06 } from "../lib/dac-trung-s06.mjs";

const LIB = join(dirname(fileURLToPath(import.meta.url)), "..", "lib");
const f = (field, value, rule_id) => ({ field, value, rule_id });
const HN = { latitude: 21.0285, longitude: 105.8542 };

// [tên dòng, ad, tập phát biểu mong đợi] — dạng giá trị theo đo stg 31/10: width/length/floors là số JSON, toilets số nguyên,
// toạ độ số thực, street_number là chuỗi (có «số 88»).
const MA_TRAN = [
  ["số nhà · hợp lệ", { payload: { street_number: "số 88" } }, [f("street_number", "số 88", "payload.street_number")]],
  ["số nhà · chỉ streetnumber_display", { payload: { streetnumber_display: "208" } }, [f("street_number", "208", "payload.streetnumber_display")]],
  ["số nhà · rác (chữ rỗng)", { payload: { street_number: "  " } }, []],
  ["số nhà · vắng", { payload: {} }, []],
  ["mã căn · hợp lệ", { payload: { unitnumber_display: "A-12.05" } }, [f("unit_number", "A-12.05", "payload.unitnumber_display")]],
  ["mã căn · chỉ unitnumber", { payload: { unitnumber: "1205" } }, [f("unit_number", "1205", "payload.unitnumber")]],
  ["mã căn · rác (chữ rỗng)", { payload: { unitnumber_display: "" } }, []],
  ["ngang + dài · số JSON", { payload: { width: 4.5, length: 15 } }, [f("frontage_length", "4.5", "payload.width"), f("lot_size_dimensions", "4.5 x 15", "payload.width+payload.length")]],
  ["ngang + dài · chuỗi phẩy thập phân", { payload: { width: "4,5", length: "15" } }, [f("frontage_length", "4.5", "payload.width"), f("lot_size_dimensions", "4.5 x 15", "payload.width+payload.length")]],
  ["ngang · chuỗi kèm đơn vị", { payload: { width: "5m" } }, [f("frontage_length", "5", "payload.width")]],
  ["ngang không dài", { payload: { width: 4 } }, [f("frontage_length", "4", "payload.width")]],
  ["dài không ngang", { payload: { length: 15 } }, []],
  ["ngang · rác 0", { payload: { width: 0, length: 15 } }, []],
  ["ngang · rác âm", { payload: { width: -3 } }, []],
  ["ngang · rác > 200", { payload: { width: 250, length: 10 } }, []],
  ["ngang · rác chữ", { payload: { width: "rộng" } }, []],
  ["tầng · số JSON", { payload: { floors: 4 } }, [f("stories", "4", "payload.floors")]],
  ["tầng · chuỗi kèm đơn vị", { payload: { floors: "3 tầng" } }, [f("stories", "3", "payload.floors")]],
  ["tầng · rác > 100", { payload: { floors: 120 } }, []],
  ["tầng · rác lẻ", { payload: { floors: 2.5 } }, []],
  ["tầng · vắng", { payload: {} }, []],
  ["WC · hợp lệ", { payload: {}, toilets: 3 }, [f("bathrooms", "3", "toilets")]],
  ["WC · rác 0", { payload: {}, toilets: 0 }, []],
  ["toạ độ · trong khung VN", { payload: {}, ...HN }, [f("latitude", "21.0285", "latitude"), f("longitude", "105.8542", "longitude")]],
  ["toạ độ · ngoài khung VN", { payload: {}, latitude: 48.85, longitude: 2.35 }, []],
  ["toạ độ · thiếu kinh độ", { payload: {}, latitude: 21.03, longitude: null }, []],
];

test("DT-AC-3: docDacTrungS06 — mỗi dòng ma trận ra đúng tập {field, value, rule_id}; số assert bằng số dòng", () => {
  let n = 0;
  for (const [ten, ad, mong] of MA_TRAN) {
    assert.deepEqual(docDacTrungS06(ad), mong, `DT-AC-3 «${ten}»`);
    n++;
  }
  assert.equal(n, MA_TRAN.length);
  assert.equal(n, 26);
});

let dem = 0;
test("DT-AC-3 đỏ: bản sao bỏ khung toạ độ VN thì dòng «toạ độ ngoài khung» ra phát biểu", async () => {
  const goc = readFileSync(join(LIB, "dac-trung-s06.mjs"), "utf8");
  const cu = "const KHUNG_VN = { vi: [8, 24], kinh: [102, 110] };";
  assert.ok(goc.includes(cu), "đột biến không khớp mã nguồn");
  const tep = join(LIB, `dac-trung-s06.dotbien-${process.pid}-${++dem}.mjs`);
  writeFileSync(tep, goc.replace(cu, "const KHUNG_VN = { vi: [-90, 90], kinh: [-180, 180] };"));
  try {
    const m = await import(pathToFileURL(tep).href);
    const dong = MA_TRAN.find(([ten]) => ten === "toạ độ · ngoài khung VN");
    assert.notDeepEqual(m.docDacTrungS06(dong[1]), dong[2], "DT-AC-3 đỏ: toạ độ ngoài khung phải lọt ở bản sao");
  } finally {
    unlinkSync(tep);
  }
});

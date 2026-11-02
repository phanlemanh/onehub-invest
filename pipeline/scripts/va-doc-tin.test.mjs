// va-doc-tin.test.mjs — hồ sơ _acceptance/s03-va-doc-tin (SV1): ma trận viết tay từng lỗi đọc của parsePost, không DB. Chữ trong
// ca là chữ dựng, không phải bài thật (kho công khai). Mỗi ma trận có ca đỏ: bản sao đột biến transform-zalo.mjs chép cạnh tệp
// thật, nạp rồi xoá ngay; ca đỏ phải ghim đúng dòng hỏng.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import * as tz from "../transform-zalo.mjs";
import { phatBieuToaTruc } from "../lib/assert.mjs";

const PIPE = join(import.meta.dirname, "..");
const TZ = join(PIPE, "transform-zalo.mjs");
let nMut = 0;

async function banSaoDotBien(thay) {
  let src = readFileSync(TZ, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(PIPE, `.sv1-mut-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

/** Chạy ma trận trên mô-đun `m`; trả dòng hỏng đầu tiên (chuỗi) hoặc null. */
function dongHong(m, bang, doc) {
  for (const [chu, dapAn] of bang) {
    const ra = doc(m, chu);
    if (ra !== dapAn) return `«${chu}»: ra ${ra}, đáp án ${dapAn}`;
  }
  return null;
}

/** Ma trận xanh trên cây, đỏ trên đột biến ở đúng dòng ghim. */
async function kiemHaiChieu(ma, bang, doc, dotBien, dongGhim) {
  const hong = dongHong(tz, bang, doc);
  assert.equal(hong, null, `${ma} ${hong}`);
  const m = await banSaoDotBien(dotBien);
  const hongMut = dongHong(m, bang, doc);
  assert.ok(hongMut?.includes(dongGhim), `${ma} ca đỏ không ghim «${dongGhim}»: ${hongMut}`);
}

// ---- AC-1: diện tích có phẩy ----
const BANG_DT = [
  ["Bán 2PN 45,7m2 giá 3 tỷ", 45.7],
  ["Bán căn 31,9 m² giá 1.95 tỷ", 31.9],
  ["DT: 68,5m2 bán 4 tỷ", 68.5],
  ["Bán 65m² giá 3 tỷ", 65],
  ["Bán 43.2m2 giá 3 tỷ", 43.2],
  ["Bán 43.2m giá 3 tỷ", 43.2],
];
// Dấu chấm giữa nhóm nghìn giữ đúng cách đọc của bản nền: đó không phải lỗi hàng này.
const DT_GIU_NEN = "Bán 1.234m2 đất giá 30 tỷ";
test("SV1-AC-1 diện tích có phẩy đọc đủ, dạng cũ không đổi; ca đỏ bỏ phẩy khỏi regex", async () => {
  await kiemHaiChieu("SV1-AC-1", BANG_DT, (m, c) => m.parsePost(c).areaM2,
    [["(\\d+(?:[.,]\\d+)?)\\s*m[²2]", "(\\d+(?:\\.\\d+)?)\\s*m[²2]"]], "45,7m2");
  assert.equal(tz.parsePost(DT_GIU_NEN).areaM2, 1.234, "SV1-AC-1 «1.234m2» đổi so với bản nền");
});

// ---- AC-2: phòng ngủ viết tắt ----
const BANG_PN = [
  ["Bán 2N 3 tỷ", 2],
  ["Cần bán căn 1N+ giá 2 tỷ", 1],
  ["Bán căn 2n1wc giá 3 tỷ", 2],
  ["Bán 3n2vs giá 5 tỷ", 3],
  ["Bán 2 ngủ giá 3 tỷ", 2],
  ["Bán studio giá 1.5 tỷ", 0],
  ["Bán 3PN giá 5 tỷ", 3],
  ["Bán 2 phòng ngủ giá 5 tỷ", 2],
  ["Bán 2PN giá 3 tỷ", 2],
  ["Bán nhanh 1+ giá 2.6 tỷ", 1],
  ["Bán căn 1+1 giá 2.6 tỷ", null],
  ["Bán căn đã ở 2 năm giá 3 tỷ", null],
  ["Phòng 3 nữ ở, bán 3 tỷ", null],
  ["Bán gấp trong 5 ngày giá 3 tỷ", null],
  ["Bán nhà cách 1 ngõ giá 3 tỷ", null],
  ["Bán 2 nhà liền giá 3 tỷ", null],
];
test("SV1-AC-2 phòng ngủ viết tắt ra đúng số, chữ gần giống ra null; ca đỏ bỏ chặn chữ sau «n»", async () => {
  await kiemHaiChieu("SV1-AC-2", BANG_PN, (m, c) => m.parsePost(c).bedrooms,
    [["const PN_TAT = /(?<![\\p{L}\\d.,])([1-9])\\s*(?:n|ngủ|ngu)(?![\\p{L}])/iu;", "const PN_TAT = /(?<![\\p{L}\\d.,])([1-9])\\s*(?:n|ngủ|ngu)/iu;"]], "2 năm");
});

// ---- AC-3: phường không đọc nhầm từ hướng ----
const PHUONG = [
  { id: "vn-hcmc-tay-nam", name: "Tây Nam", market: "vn-hcmc" },
  { id: "vn-hcmc-long-binh", name: "Long Bình", market: "vn-hcmc" },
];
const BANG_PH = [
  ["Căn hướng Tây Nam mát", null],
  ["BC Tây Nam thoáng", null],
  ["Toà S1, Tây Nam thoáng, 3 tỷ", null],
  ["Bán căn phường Tây Nam", "vn-hcmc-tay-nam"],
  ["Bán căn P. Tây Nam", "vn-hcmc-tay-nam"],
  ["Bán căn xã Tây Nam", "vn-hcmc-tay-nam"],
  ["Bán căn Long Bình", "vn-hcmc-long-binh"],
  ["Hướng Tây Nam, căn ở Long Bình", "vn-hcmc-long-binh"],
];
test("SV1-AC-3 tên phường trùng hướng chỉ khớp khi gọi đích danh; ca đỏ bỏ luật hướng", async () => {
  await kiemHaiChieu("SV1-AC-3", BANG_PH, (m, c) => m.matchPhuongThiTruong(c, PHUONG)?.id ?? null,
    [["if (!tenHuongHopLe(v, textLower)) continue;", ""]], "hướng Tây Nam");
});

// ---- AC-4: số ngữ cảnh không phải giá ----
const BANG_NGU_CANH = [
  ["Bán căn 2PN cắt 450tr còn 3 tỷ", 3e9],
  ["Bán 2PN vốn 1,4 tỷ thu về 2.5 tỷ", 2.5e9],
  ["Bán căn vay 1.4ty giá 3.2 tỷ", 3.2e9],
  ["Bán căn đã vào 800tr giá 2.1 tỷ", 2.1e9],
  ["Bán căn cắt 450tr", null],
  ["Bán căn 2PN vốn 1,4 tỷ", null],
  ["Bán căn vay 1.4ty", null],
  ["Bán căn đã vào 800tr", null],
  ["Bán căn S702 triệu người mê", null],
  ["Bán căn lỗ 300tr, giá: 3.5 tỷ", 3.5e9],
  ["Bán căn 3 tỷ, cắt 450tr", 3e9],
  ["Bán căn giá 4 tỷ, chênh 200tr", 4e9],
  // Danh sách đóng của hợp đồng: mỗi từ một dòng, đứng một mình thì không có giá.
  ...["cắt", "lỗ", "lõm", "âm", "giảm", "hạ", "chênh", "lời", "đã vào", "đã đóng", "đã thanh toán", "vay", "cọc", "vốn", "trả trước", "gốc",
    "tiến độ", "bớt", "hỗ trợ", "chiết khấu", "dòng tiền", "thu nhập", "lãi", "tài chính", "ngân sách", "tc", "ttc", "tts", "htls"]
    .map((tu) => [`Bán căn ${tu} 800tr`, null]),
  // «giá» dính từ ngữ cảnh vẫn là khoản khác; «còn» sau từ ngữ cảnh là giá sau giảm.
  ["Bán căn giá vốn 1,4 tỷ", null],
  ["Bán căn giảm còn 2,5 tỷ", 2.5e9],
  ["Bán căn cắt lỗ còn 2,9 tỷ", 2.9e9],
  // Cùng dạng với «cắt lỗ 1 tỷ» nên không đoán là giá: mất giá còn hơn ghi giá sai.
  ["Bán căn cắt lỗ 2,9 tỷ", null],
  ["Bán căn chỉ hơn 8 tỷ", 8e9],
  // «Không vay», «bán vay» không nêu khoản vay nào nên số sau đó vẫn là giá.
  ["Bán căn 2PN có bán vay full 2.350ty btp", 2.35e9],
  ["Bán căn hướng đông nam ,không vay có bán vay full 2.350ty btp", 2.35e9],
  ["Bán căn 1PN sẵn sổ chủ ko vay 2ty1", 2.1e9],
  ["Bán căn 2PN không vay 2.350ty btp", 2.35e9],
  ["Bán căn 2PN chưa vay 3 tỷ", 3e9],
  // Giá viết đủ số đồng cũng theo luật ngữ cảnh.
  ["Bán căn cắt 450.000.000", null],
  ["Bán căn vay 1.400.000.000", null],
  ["Bán căn đã vào 800.000.000", null],
  ["Bán căn vay 1.400.000.000 giá 3.200.000.000", 3.2e9],
  ["Bán căn 3.200.000.000", 3.2e9],
];
test("SV1-AC-4 số ngữ cảnh không thành giá, giá có nhãn thắng; ca đỏ bỏ luật ngữ cảnh", async () => {
  await kiemHaiChieu("SV1-AC-4", BANG_NGU_CANH, (m, c) => m.parsePost(c).priceVnd,
    [["if (KHONG_PHAI_GIA.test(so.slice(Math.max(0, i - 40), i))) return true;", ""]], "vốn 1,4 tỷ");
  await kiemHaiChieu("SV1-AC-4", BANG_NGU_CANH, (m, c) => m.parsePost(c).priceVnd,
    [["(?<!(?<![\\p{L}])(?:không|ko|k|chưa|bán)\\s+)vay", "vay"]], "bán vay full");
  await kiemHaiChieu("SV1-AC-4", BANG_NGU_CANH, (m, c) => m.parsePost(c).priceVnd,
    [["const dong = khopGia(GIA_DONG, so);", "const dong = so.match(new RegExp(GIA_DONG, \"i\"));"]], "cắt 450.000.000");
});

// ---- AC-5: thuê từ 1 tỷ không đơn vị tháng thành bán ----
const BANG_THUE_TY = [
  ["Đang cho thuê 15 năm, 2PN 3 tỷ", "sale"],
  ["Cho thuê căn 2PN giá 3 tỷ", "sale"],
  ["Cho thuê căn 2PN giá 1 tỷ/tháng", "rent_lt"],
  ["Cho thuê nhà 1.000.000.000/tháng", "rent_lt"],
  ["Cho thuê căn 2PN giá 1 tỷ/th", "rent_lt"],
  ["Cho thuê nguyên toà 1,2 tỷ/năm", "rent_lt"],
  ["Cho thuê căn 2PN giá 1 tỷ", "sale"],
  ["Cho thuê nguyên toà 1,2 tỷ mỗi năm", "rent_lt"],
  ["Cho thuê nguyên toà 1,2 tỷ 1 năm", "rent_lt"],
  ["Cho thuê nguyên toà 1,2 tỷ/1 năm", "rent_lt"],
  // Tiền thuê hiện tại của bài bán: đơn vị tháng không đi liền số tiền từ 1 tỷ.
  ["Bán căn 2PN đang cho thuê 7tr/tháng. Giá bán: 2,7 tỷ", "sale"],
  ["Căn 2PN đang cho thuê 7,5tr/tháng. Giá: 27xx thu về", "sale"],
  ["Cho thuê căn 2PN 9tr", "rent_lt"],
  ["Bán căn 3 tỷ", "sale"],
];
const LY_DO_GAT = [
  ["Cho thuê căn 2PN giá 1 tỷ/tháng", "thue-tu-1-ty"],
  ["Cho thuê căn 2PN giá 1 tỷ/th", "thue-tu-1-ty"],
  ["Cho thuê nguyên toà 1,2 tỷ/năm", "thue-tu-1-ty"],
  ["Bán căn 2PN 120 tỷ", "ban-tren-100-ty"],
  ["Cho thuê căn 2PN giá 3 tỷ", null],
];
test("SV1-AC-5 thuê từ 1 tỷ không ghi tháng đổi thành bán, «/tháng» giữ thuê; ca đỏ bỏ bước đổi", async () => {
  const doc = (m, c) => { const pr = m.parsePost(c); m.chinhLoaiThueTy(pr, c); return pr.kind; };
  await kiemHaiChieu("SV1-AC-5", BANG_THUE_TY, doc,
    [["if (!THEO_THANG.test(gatSo(text))) pr.kind = KIND.sale;", ""]], "2PN 3 tỷ");
  await kiemHaiChieu("SV1-AC-5", BANG_THUE_TY, doc,
    [["if (!THEO_THANG.test(gatSo(text))) pr.kind = KIND.sale;", "if (!/\\/\\s*(?:th(?:áng)?|năm|1\\s*năm)|(?:mỗi|1)\\s*năm/iu.test(gatSo(text))) pr.kind = KIND.sale;"]], "7tr/tháng");
  // Chốt khoảng giữ nguyên: bài vẫn là thuê thì vẫn bị gạt.
  assert.equal(tz.lyDoGiaPhiLy({ kind: "rent_lt", priceVnd: 1e9 }), "thue-tu-1-ty", "SV1-AC-5 chốt khoảng đổi");
  for (const [chu, lyDo] of LY_DO_GAT) {
    const pr = tz.parsePost(chu);
    tz.chinhLoaiThueTy(pr, chu);
    assert.equal(tz.lyDoGiaPhiLy(pr), lyDo, `SV1-AC-5 lý do «${chu}»`);
  }
});

// ---- AC-6: giá che số ----
const BANG_CHE = [
  ["Bán căn 4.9xx tỷ", 4.9e9],
  ["Bán căn 2,3xx tỷ", 2.3e9],
  ["Bán căn giá 36xx", 3.6e9],
  ["Bán căn 1.8x tỷ", 1.8e9],
  ["Bán căn 3,2** tỷ", 3.2e9],
  ["Bán căn 1.9x thu về", 1.9e9],
  ["Bán căn 18XX tỷ", 1.8e9],
  ["Bán căn 37xx thu nét", 3.7e9],
  // Không nhãn, không đơn vị thì không phải giá: chống dương không cần công tắc.
  ["Bán căn 36xx", null],
  ["Tầng 36xx bán 2PN", null],
  ["Bán 2.9 tỷ", 2.9e9],
  ["Bán căn PR6xx20 2PN", null],
];
test("SV1-AC-6 giá che số ra số sàn, mã căn không thành giá; ca đỏ bỏ luật che", async () => {
  await kiemHaiChieu("SV1-AC-6", BANG_CHE, (m, c) => m.parsePost(c).priceVnd,
    [["const che = docGiaChe(so);", "const che = null;"]], "4.9xx");
});

// ---- AC-7: giá không đơn vị, sau công tắc ----
const BANG_KDV = [
  ["Bán căn Giá: 4100", 4.1e9],
  ["Bán căn Giá Bán: 2.680 NET", 2.68e9],
  ["Bán căn Giá: 4.1 thu nét", 4.1e9],
  ["Bán căn Giá; 3.790 thu nét", 3.79e9],
  ["Bán căn 1900 btp", 1.9e9],
  ["Bán căn giá 2,590", 2.59e9],
  ["Bán căn giá 2.6 allin", 2.6e9],
  ["Cho thuê căn 2PN Giá 12000", 12e6],
  ["Cho thuê căn 1PN Giá 8.5", 8.5e6],
  ["Bán căn 2PN 2800", null],
  ["Bán căn 2PN 2.65", null],
  ["Bán căn bàn giao 2027", null],
  ["Cho thuê căn 1PN 8.5", null],
  ["Bán căn mã 1200 đẹp", null],
  ["Bán căn 2PN 45m2", null],
];
// Khi tắt, dạng mới rơi về null. Nhãn giá + nhóm nghìn ở tin bán («Giá: 2.800») là luật cũ của bản nền nên vẫn đọc, ngoài công tắc.
const KDV_LUAT_CU = ["Bán căn Giá Bán: 2.680 NET", "Bán căn giá 2,590"];
const KDV_TAT_NULL = BANG_KDV.filter(([c, d]) => d !== null && !KDV_LUAT_CU.includes(c)).map(([c]) => c);
test("SV1-AC-7 giá không đơn vị đọc hẹp khi bật, không đọc khi tắt; mặc định bật; ca đỏ bỏ điều kiện nhãn", async () => {
  const doc = (m, c) => m.parsePost(c).priceVnd;
  await kiemHaiChieu("SV1-AC-7", BANG_KDV, doc,
    [["const coNhan = GIA_CO_NHAN_SO.test(truoc);", "const coNhan = true;"]], "2PN 2800");
  for (const chu of KDV_TAT_NULL) assert.equal(tz.parsePost(chu, { giaKhongDonVi: false }).priceVnd, null, `SV1-AC-7 khi tắt vẫn đọc «${chu}»`);
  for (const chu of KDV_LUAT_CU) assert.equal(tz.parsePost(chu, { giaKhongDonVi: false }).priceVnd, tz.parsePost(chu).priceVnd, `SV1-AC-7 luật cũ đổi «${chu}»`);
});

// ---- AC-8: toà, trục ----
const BANG_MA = [
  ["Bán PR6xx20 2PN 3 tỷ", { block: "PR6", unit: "PR6xx20" }],
  ["Bán pr6.12.20 2PN 3 tỷ", { block: "pr6", unit: "pr6.12.20" }],
  ["Bán lD1xx02 và LD1xx06 3 tỷ", { block: "lD1", unit: null }],
  ["Bán căn toà gh2 3 tỷ", { block: "gh2", unit: null }],
  ["Bán 2PN toà s1.03 3 tỷ", { block: "s1.03", unit: null }],
  ["Bán S1.12.08 3 tỷ", { block: "S1", unit: "S1.12.08" }],
  ["Bán GH3-1203 3 tỷ", { block: "GH3", unit: "GH3-1203" }],
  ["Bán PR6.3x13 3 tỷ", { block: "PR6", unit: "PR6.3x13" }],
  ["Bán LD1xx02 và LD1xx06 3 tỷ", { block: "LD1", unit: null }],
  ["Bán LD1xx02 và PR2xx10 3 tỷ", { block: null, unit: null }],
  ["Bán căn toà GH2 3 tỷ", { block: "GH2", unit: null }],
  ["Bán căn 2PN 3 tỷ", { block: null, unit: null }],
  ["Giao T4/2027, 2PN 3 tỷ", { block: null, unit: null }],
  ["Bán 2PN2WC 3 tỷ", { block: null, unit: null }],
  // Toà có đuôi số là tên toà, không phải trục; mã nội bộ của sàn không phải trục.
  ["Bán 2PN toà S1.03 3 tỷ", { block: "S1.03", unit: null }],
  ["Bán 2PN R1.01 và R1.02 3 tỷ", { block: null, unit: null }],
  ["Bán căn R1.052716 3 tỷ", { block: "R1", unit: "R1.052716" }],
  ["Bán 2PN 3 tỷ S115451", { block: null, unit: null }],
  ["Bán 2PN 3 tỷ (NTL22688)", { block: null, unit: null }],
];
test("SV1-AC-8 đọc toà, trục giữ nguyên chữ; bài nhiều mã trống trục; ca đỏ bỏ luật nhiều mã", async () => {
  const doc = (m, c) => JSON.stringify(m.docToaTruc(c));
  const bang = BANG_MA.map(([c, d]) => [c, JSON.stringify(d)]);
  await kiemHaiChieu("SV1-AC-8", bang, doc,
    [["if (units.length !== 1) unit = null;", ""]], "LD1xx06");
});

test("SV1-AC-8 phát biểu: mỗi bài có giá trị một dòng parser, bài trống không có dòng", () => {
  const rows = phatBieuToaTruc("S03", [
    { post_id: "a", posted_at: "2026-11-01T00:00:00Z", block: "PR6", unit: "PR6xx20" },
    { post_id: "b", posted_at: "2026-11-01T00:00:00Z", block: "LD1", unit: null },
    { post_id: "c", posted_at: "2026-11-01T00:00:00Z", block: null, unit: null },
  ], "transform-zalo@sv1");
  assert.deepEqual(rows.map((r) => [r.subject_key, r.field, r.value, r.method]), [
    ["S03:a", "block_raw", "PR6", "parser"],
    ["S03:a", "unit_number", "PR6xx20", "parser"],
    ["S03:b", "block_raw", "LD1", "parser"],
  ], "SV1-AC-8 phát biểu");
});

test("SV1-AC-8 khoá gom tách hai trục khác nhau, bài cùng trục cùng người vẫn chung", () => {
  const nd = { kind: "sale", priceVnd: 3e9, pricePerm2Vnd: null, areaM2: null, bedrooms: 2, phuong: null };
  const a = tz.repostKey({ ...nd, ma: [], unit: "PR6xx20" }, { sender_id: "x" });
  const b = tz.repostKey({ ...nd, ma: [], unit: "PR6xx21" }, { sender_id: "x" });
  const c = tz.repostKey({ ...nd, ma: [], unit: "pr6xx20" }, { sender_id: "x" });
  assert.notEqual(a, b, "SV1-AC-8 hai trục chung khoá");
  assert.equal(a, c, "SV1-AC-8 cùng trục khác hoa thường tách khoá");
  const du = { ...nd, phuong: "nghia-do", areaM2: 60, ma: [] };
  assert.notEqual(tz.repostKey({ ...du, unit: "PR6xx20" }, {}), tz.repostKey({ ...du, unit: "PR6xx21" }, {}), "SV1-AC-8 đủ phường + DT: hai trục chung khoá");
  assert.equal(tz.repostKey(du, {}), "sale|nghia-do|3000000000|60|2", "SV1-AC-8 đủ phường + DT không trục: khoá cũ đổi");
});

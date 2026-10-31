// transform-zalo-loai-tin.test.mjs — hồ sơ _acceptance/s03-nhan-loai-tin-rong (RM1): suy loại tin S03 khi chữ bài không ghi
// «bán/cho thuê». Tên ca mở đầu bằng mã AC (SLT-AC-n). Chữ bài trong ma trận là câu viết tay theo dạng tin thật, không chép
// bài thật. Mỗi phép đo có chiều đỏ: bản chép tạm của transform-zalo.mjs đổi đúng một chỗ, thông điệp ghim.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as goc from "../transform-zalo.mjs";

const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Bản chép tạm của transform-zalo.mjs (import tương đối trỏ về pipeline/), đổi từng cặp [cũ, mới]. */
async function banDot(thay) {
  let src = readFileSync(path.join(PIPE, "transform-zalo.mjs"), "utf8");
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `chỗ đột biến không còn trong transform-zalo.mjs: ${a}`);
    src = src.replace(a, b);
  }
  src = src.replace(/from "\.\/(lib\/[^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(PIPE, rel)).href)}`);
  const dir = mkdtempSync(path.join(PIPE, "scripts", ".slt-dot-"));
  const f = path.join(dir, "transform-zalo.mjs");
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Chạy suy loại trên một câu, mục đích nhóm mặc định «cả hai». */
const suy = (mod, text, mucDich = "ca-hai") => {
  const pr = mod.parsePost(text);
  return { ...mod.suyLoai(pr, text, mucDich), priceVnd: pr.priceVnd };
};

/** Gom ô lệch thành một thông điệp ghim. */
function kiemMaTran(mod, ten, oList, mucDich) {
  const lech = [];
  for (const [text, kind, nguon, gia] of oList) {
    const r = suy(mod, text, mucDich);
    if (r.kind !== kind || r.nguon !== nguon || (gia !== undefined && r.priceVnd !== gia)) {
      lech.push(`«${text}» → ${r.kind}/${r.nguon}/${r.priceVnd} (cần ${kind}/${nguon}${gia !== undefined ? `/${gia}` : ""})`);
    }
  }
  if (lech.length) assert.fail(`${ten}: ${lech.join(" · ")}`);
}

// ---------- AC-1 ----------
const BAN = [
  ["2PN view hồ, giá 3,2 tỷ", "sale", "tin-hieu-chu", 3_200_000_000],
  ["1N+1 45m2 Giá: 2,620 tỷ thu về", "sale", "tin-hieu-chu", 2_620_000_000],
  ["Giá: 4,000 thu về căn 3PN", "sale", "tin-hieu-chu", 4_000_000_000],
  ["Căn 2PN 70m2 cắt lỗ sâu, Giá: 2,900", "sale", "tin-hieu-chu", 2_900_000_000],
  ["HẠ GIÁ căn 2PN2WC 68m2, Giá: 2,750", "sale", "tin-hieu-chu", 2_750_000_000],
  ["GIÁ TỐT căn 2PN 70m2 tầng trung, Giá: 3,100", "sale", "tin-hieu-chu", 3_100_000_000],
  ["CHUYỂN NHƯỢNG căn 2PN 70m2 giá 3 tỷ", "sale", "tin-hieu-chu", 3_000_000_000],
  ["Căn 2PN 70m2 bao thuế phí sang tên, Giá: 3,050", "sale", "tin-hieu-chu", 3_050_000_000],
  ["2PN 3,2TỶ BTP sẵn sổ hồng", "sale", "tin-hieu-chu", 3_200_000_000],
];
// Đối chứng: tín hiệu bán đi kèm giá thuê → thuê, không phải bán.
const BAN_DOI_CHUNG = [
  ["chuyển nhượng HĐ thuê 2PN 14tr", "rent_lt", "don-vi-gia"],
  ["2PN giá tốt 12tr", "rent_lt", "don-vi-gia"],
];

describe("SLT-AC-1 tín hiệu bán → sale", () => {
  test("SLT-AC-1 ma trận 9 ô viết tay + 2 ô đối chứng giá thuê", () => {
    assert.equal(BAN.length, 9);
    kiemMaTran(goc, "SLT-AC-1 thiếu tín hiệu bán", [...BAN, ...BAN_DOI_CHUNG]);
  });
  test("SLT-AC-1 «3400 tỷ thu về» là 3,4 tỷ (nhóm nghìn)", () => {
    assert.equal(suy(goc, "GIÁ TỐT 2N2VS,62m Giá: 3400 tỷ thu về").priceVnd, 3_400_000_000);
  });
  test("chiều đỏ SLT-AC-1 thiếu tín hiệu bán: bỏ «thu về» khỏi danh sách → ô «Giá: 4,000 thu về» đỏ", async () => {
    const mod = await banDot([["(?:thu\\s*về|cắt", "(?:cắt"]]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-1 thiếu tín hiệu bán", BAN), /SLT-AC-1 thiếu tín hiệu bán: .*Giá: 4,000 thu về/);
  });
});

// ---------- AC-2 ----------
const THUE = [
  ["LBV A 2PN Full nt 14Tr", "rent_lt", "don-vi-gia", 14_000_000],
  ["S9.03 3PN FULL 14tr", "rent_lt", "don-vi-gia", 14_000_000],
  ["HÀNG THUÊ MCP 3PN 21tr", "rent_lt", "don-vi-gia", 21_000_000],
  ["Studio 6tr5 full đồ", "rent_lt", "don-vi-gia", 6_500_000],
  ["2PN 10tr/tháng ở liền", "rent_lt", "don-vi-gia", 10_000_000],
  ["pass thẻ 2PN 14tr", "rent_lt", "don-vi-gia", 14_000_000],
  ["1PN 5,5 triệu", "rent_lt", "don-vi-gia", 5_500_000],
];
const THUE_DOI_CHUNG = [["căn hộ 70m2 giá 45tr/m2", null, "bo"]];
/** Nhóm thuê, bài không chữ loại mà giá đồng từ 1 tỷ hay giá theo m² — không được thành thuê (S4 r1, AC-2). */
const NHOM_THUE_GIA_TY = [
  ["Căn 2PN 70m2 giá 3.800.000.000", null, "bo"],
  ["Căn 2PN 70m2 giá 45tr/m2", null, "bo"],
];
/** Bài bán có «tháng» không đứng sau giá (bàn giao, nhận nhà) — không được thành thuê (S4 r1, AC-2). */
const THANG_BAN = [
  ["Căn hộ 2PN 70m2 giá 45tr/m2, bàn giao tháng 12", "sale", "boi-canh-nhom"],
  ["Căn 2PN 70m2 giá 3.200.000.000 sổ hồng, nhận nhà tháng 11", "sale", "tin-hieu-chu", 3_200_000_000],
];

describe("SLT-AC-2 giá triệu / tháng / pass → rent_lt", () => {
  test("SLT-AC-2 ma trận 7 ô viết tay + ô đối chứng giá theo m²", () => {
    assert.equal(THUE.length, 7);
    kiemMaTran(goc, "SLT-AC-2 giá theo m2 thành thuê", [...THUE, ...THUE_DOI_CHUNG]);
  });
  test("chiều đỏ SLT-AC-2 giá theo m2 thành thuê: bản đột biến coi giá theo m² là thuê → ô 45tr/m2 đỏ", async () => {
    const mod = await banDot([[
      "const giaThue = pr.priceVnd != null && pr.priceVnd < 1e9 && pr.pricePerm2Vnd == null && !coTy && GIA_TRIEU.test(so);",
      "const giaThue = (pr.pricePerm2Vnd != null) || (pr.priceVnd != null && pr.priceVnd < 1e9 && !coTy && GIA_TRIEU.test(so));",
    ]]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-2 giá theo m2 thành thuê", THUE_DOI_CHUNG), /SLT-AC-2 giá theo m2 thành thuê: .*45tr\/m2/);
  });
  test("SLT-AC-2 nhóm thuê mà giá từ 1 tỷ hay theo m² → không thành thuê (giữ rỗng)", () => {
    kiemMaTran(goc, "SLT-AC-2 nhóm thuê giá tỷ", NHOM_THUE_GIA_TY, "rent_lt");
  });
  test("chiều đỏ SLT-AC-2 nhóm thuê giá tỷ: bản đột biến bỏ chặn giá ở bối cảnh nhóm → ô «3.800.000.000» đỏ", async () => {
    const mod = await banDot([["    if (mucDich === KIND.rent_lt && !giaCoTheThue) return { kind: null, nguon: \"bo\" };\n", ""]]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-2 nhóm thuê giá tỷ", NHOM_THUE_GIA_TY, "rent_lt"), /SLT-AC-2 nhóm thuê giá tỷ: .*3\.800\.000\.000/);
  });
  test("SLT-AC-2 «tháng» không sau giá (bàn giao, nhận nhà) trong bài bán → không thành thuê", () => {
    kiemMaTran(goc, "SLT-AC-2 tháng thành thuê", THANG_BAN, "sale");
  });
  test("chiều đỏ SLT-AC-2 tháng thành thuê: bản đột biến coi «tháng» trần là thuê, bỏ chặn giá m²/tỷ → hai ô đỏ", async () => {
    const mod = await banDot([
      ["|\\d\\s*(?:tr|triệu)\\s*(?:một|mỗi|1)?\\s*tháng\\b|", "|\\btháng\\b|"],
      ["(DON_VI_THUE.test(so) && giaCoTheThue)", "(DON_VI_THUE.test(so) && !coTy)"],
    ]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-2 tháng thành thuê", THANG_BAN, "sale"), /SLT-AC-2 tháng thành thuê: .*bàn giao tháng 12.*nhận nhà tháng 11/);
  });
});

// ---------- AC-3 ----------
const BAI_GIA_KHONG_DON_VI = "Căn 2PN 70m2 view hồ, Giá: 2,900"; // giá không đơn vị (như «Giá: 2,900» của tin thật), không tín hiệu
const nhom = (ten, sale, rent, conv) => [
  ...Array.from({ length: sale }, () => ({ conversation_id: conv, group_name: ten, kind: "sale" })),
  ...Array.from({ length: rent }, () => ({ conversation_id: conv, group_name: ten, kind: "rent_lt" })),
];
const NHOM = [
  ["g-ban", "📌TOÀ S1 - CHUYỂN NHƯỢNG", 0, 0, "sale"],
  ["g-thue", "CHO THUÊ CĂN HỘ PHÂN KHU A", 0, 0, "rent_lt"],
  ["g-hai", "CHO THUÊ - CHUYỂN NHƯỢNG KHU A", 0, 0, "ca-hai"],
  ["g-tile", null, 23, 2, "sale"],
  ["g-it", null, 19, 0, "ca-hai"],
];

function kiemNhom(mod) {
  const bai = NHOM.flatMap(([conv, ten, s, r]) => (s + r ? nhom(ten, s, r, conv) : [{ conversation_id: conv, group_name: ten, kind: null }]));
  const md = mod.mucDichNhom(bai);
  const lech = [];
  for (const [conv, , , , can] of NHOM) {
    if (md.get(conv) !== can) lech.push(`${conv} → ${md.get(conv)} (cần ${can})`);
    const r = suy(mod, BAI_GIA_KHONG_DON_VI, md.get(conv));
    const kind = can === "ca-hai" ? null : can;
    if (r.kind !== kind || r.nguon !== (kind ? "boi-canh-nhom" : "bo")) lech.push(`${conv}: bài → ${r.kind}/${r.nguon}`);
  }
  if (lech.length) assert.fail(`SLT-AC-3 ngưỡng tỉ lệ: ${lech.join(" · ")}`);
}

describe("SLT-AC-3 mục đích nhóm", () => {
  test("SLT-AC-3 ma trận 5 nhóm × bài giá không đơn vị", () => {
    assert.equal(NHOM.length, 5);
    kiemNhom(goc);
  });
  test("chiều đỏ SLT-AC-3 ngưỡng tỉ lệ: hạ ngưỡng 20 bài xuống 1 → nhóm 19 bài đỏ", async () => {
    const mod = await banDot([["const NHOM_TOI_THIEU = 20;", "const NHOM_TOI_THIEU = 1;"]]);
    assert.throws(() => kiemNhom(mod), /SLT-AC-3 ngưỡng tỉ lệ: .*g-it/);
  });
});

// ---------- AC-4 ----------
const YEU_CAU = [
  ["Khách sale xem liền căn 2PN", null, "yeu-cau"],
  ["Kháh xem liền 2PN … TC 2.7tỷ", null, "yeu-cau"],
  ["Khách em đang ở Vin xem liền 2PN 6,5tr", null, "yeu-cau"],
  ["Khách e tìm 1pn 5,5tr", null, "yeu-cau"],
  ["cần mua 2PN 3 tỷ", null, "yeu-cau"],
  ["cần thuê studio 6tr", null, "yeu-cau"],
  ["anh chị có căn gửi em 2PN 10tr", null, "yeu-cau"],
  ["tìm căn 3PN dưới 5 tỷ", null, "yeu-cau"],
];
const YEU_CAU_DOI_CHUNG = [["Có khách cọc, còn 1 căn 2PN 3,1 tỷ thu về", "sale", "tin-hieu-chu"]];

describe("SLT-AC-4 Yêu cầu không thành tin rao", () => {
  test("SLT-AC-4 ma trận 8 ô viết tay + đối chứng «có khách cọc»", () => {
    assert.equal(YEU_CAU.length, 8);
    kiemMaTran(goc, "SLT-AC-4 Yêu cầu lọt thành tin rao", [...YEU_CAU, ...YEU_CAU_DOI_CHUNG]);
  });
  test("chiều đỏ SLT-AC-4 Yêu cầu lọt thành tin rao: xét tín hiệu bán trước Yêu cầu → ô «Kháh xem liền» đỏ", async () => {
    const mod = await banDot([
      ['  if (YEU_CAU.test(so)) return { kind: null, nguon: "yeu-cau" };\n', ""],
      ['  if (mucDich === KIND.sale || mucDich === KIND.rent_lt) {', '  if (YEU_CAU.test(so)) return { kind: null, nguon: "yeu-cau" };\n  if (mucDich === KIND.sale || mucDich === KIND.rent_lt) {'],
    ]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-4 Yêu cầu lọt thành tin rao", YEU_CAU), /SLT-AC-4 Yêu cầu lọt thành tin rao: .*Kháh xem liền/);
  });
});

// ---------- AC-5 ----------
const KHONG_RAC = [
  ["ai cần vay 2 tỷ lãi thấp", null, "bo"],
  ["2PN view hồ đẹp", null, "bo"],
  ["xem nhà T7-CN 2PN", null, "bo"],
  ["tuyển sale lương 10tr/tháng", null, "bo"],
  ["CN 2PN 14tr", "rent_lt", "don-vi-gia"],
];

describe("SLT-AC-5 không thêm tin rác", () => {
  test("SLT-AC-5 ma trận 5 ô viết tay", () => {
    assert.equal(KHONG_RAC.length, 5);
    kiemMaTran(goc, "SLT-AC-5 CN thành bán", KHONG_RAC);
  });
  test("chiều đỏ SLT-AC-5 CN thành bán: thêm CN trần vào tín hiệu bán và xét trước giá → ô «CN 2PN 14tr» đỏ", async () => {
    const mod = await banDot([
      ["const TIN_HIEU_BAN = /(?:thu", "const TIN_HIEU_BAN = /(?:\\bcn\\b|thu"],
      ["  if (giaThue || (DON_VI_THUE.test(so) && giaCoTheThue)) return { kind: KIND.rent_lt, nguon: \"don-vi-gia\" };\n  if (coTy || TIN_HIEU_BAN.test(so)) {",
        "  if (coTy || TIN_HIEU_BAN.test(so)) {"],
    ]);
    assert.throws(() => kiemMaTran(mod, "SLT-AC-5 CN thành bán", KHONG_RAC), /SLT-AC-5 CN thành bán: .*CN 2PN 14tr/);
  });
});

// ---------- AC-6 ----------
const CO_SAN = [
  ["Cho thuê căn 2PN 70m2 giá 3 tỷ", "rent_lt"],
  ["Bán căn studio 14tr ở liền", "sale"],
];

function kiemCoSan(mod) {
  const lech = [];
  for (const [text, kind] of CO_SAN) {
    const r = suy(mod, text);
    if (r.kind !== kind || r.nguon !== "chu-bai") lech.push(`«${text}» → ${r.kind}/${r.nguon}`);
  }
  if (lech.length) assert.fail(`SLT-AC-6 đổi loại đã có: ${lech.join(" · ")}`);
}

describe("SLT-AC-6 bài đã có loại giữ nguyên", () => {
  test("SLT-AC-6 hai bài parsePost đã gán loại → nguồn chu-bai, loại không đổi", () => kiemCoSan(goc));
  test("chiều đỏ SLT-AC-6 đổi loại đã có: suy loại chạy cả khi kind có sẵn → ô «Cho thuê … 3 tỷ» đỏ", async () => {
    const mod = await banDot([['  if (pr.kind) return { kind: pr.kind, nguon: "chu-bai" };\n', ""]]);
    assert.throws(() => kiemCoSan(mod), /SLT-AC-6 đổi loại đã có: .*Cho thuê căn 2PN 70m2 giá 3 tỷ/);
  });
});

// ---------- AC-7 (phần viết tay) ----------
describe("SLT-AC-7 repostKey tách căn khác", () => {
  test("SLT-AC-7 cùng phường khác PN / DT / giá → khác khoá; cùng mọi trường → cùng khoá", () => {
    const post = { post_id: "p", author_hash: "a", text: "x" };
    const nen = { kind: "rent_lt", phuong: "vn-test-phuong-a", priceVnd: 14_000_000, pricePerm2Vnd: null, areaM2: 70, bedrooms: 2 };
    const k = (pr) => goc.repostKey(pr, post);
    for (const doi of [{ bedrooms: 3 }, { areaM2: 68 }, { priceVnd: 15_000_000 }]) assert.notEqual(k({ ...nen, ...doi }), k(nen), JSON.stringify(doi));
    assert.equal(k({ ...nen }), k(nen));
  });
});

// ---------- AC-8 ----------
describe("SLT-AC-8 đếm theo nguồn", () => {
  test("SLT-AC-8 bộ bài viết tay → đúng số từng nguồn, tổng = số bài", () => {
    const bai = [...BAN, ...THUE, ...YEU_CAU, ...KHONG_RAC.slice(0, 4), ...CO_SAN.map(([t]) => [t])];
    const nguon = bai.map(([t]) => suy(goc, t).nguon);
    const dem = goc.demNguonLoai(nguon);
    assert.deepEqual(dem, { "chu-bai": 2, "tin-hieu-chu": 9, "don-vi-gia": 7, "boi-canh-nhom": 0, "yeu-cau": 8, bo: 4 });
    assert.equal(Object.values(dem).reduce((a, b) => a + b, 0), bai.length);
    assert.deepEqual(Object.keys(dem), [...goc.NGUON_LOAI]);
  });
});

// ---------- s03-cho-vay-khong-phai-bds (CV-AC-n): «<số> năm/nữ» không phải viết tắt phòng ngủ «<số>n» ----------
const NHANH_N_MOI = "\\d+\\s*n\\s*\\+?\\s*\\d?(?![a-zà-ỹđ])";
const NHANH_N_CU = "\\d+\\s*n\\s*\\+?\\s*\\d?\\b";
/** Bản trước khi sửa: nhánh «<số>n» kết bằng ranh giới từ ASCII của JS. */
const banCu = () => banDot([[NHANH_N_MOI, NHANH_N_CU]]);

const NAM_NU = [
  ["Cho vay 500tr thời hạn 1 năm, thu về lãi", "1 năm"],
  ["góp 3 năm giá 2 tỷ", "3 năm"],
  ["tuyển 3 nữ lương 10tr", "3 nữ"],
  ["bảo hành 5 năm giá 7tr", "5 năm"],
];
function kiemNamNu(mod, cu) {
  const lech = [];
  for (const [text, cum] of NAM_NU) {
    if (!cu.coDauHieuBds(text)) lech.push(`«${text}» bản cũ không khớp — ô không đo được lỗi`);
    const r = suy(mod, text);
    if (mod.coDauHieuBds(text) || r.kind !== null || r.nguon !== "bo") lech.push(`«${text}» → ${mod.coDauHieuBds(text)}/${r.kind}/${r.nguon}`);
    const trungTinh = text.replace(cum, "dài hạn");
    if (mod.coDauHieuBds(trungTinh) || cu.coDauHieuBds(trungTinh)) lech.push(`«${trungTinh}» khớp nhờ chỗ khác`);
  }
  if (lech.length) assert.fail(`CV-AC-1 năm thành phòng ngủ: ${lech.join(" · ")}`);
}

const VIET_TAT = [
  ["2n1wc 70m2 giá 3,2 tỷ", true],
  ["1n1k 45m2 7tr", true],
  ["căn 3n2vs 5 tỷ", true],
  ["2n+1 giá 2,9 tỷ", true],
  ["Căn 2n 14tr", true],
  ["căn 2n, giá 14tr", true],
  ["giá 14tr căn 2n", true],
  ["1nk giá 3 tỷ", false],
];
function kiemVietTat(mod, cu) {
  const lech = [];
  for (const [text, bds] of VIET_TAT) {
    const a = suy(mod, text), b = suy(cu, text);
    if (mod.coDauHieuBds(text) !== bds || cu.coDauHieuBds(text) !== bds || a.kind !== b.kind || a.nguon !== b.nguon) {
      lech.push(`«${text}» → ${mod.coDauHieuBds(text)}/${a.kind}/${a.nguon} (bản cũ ${cu.coDauHieuBds(text)}/${b.kind}/${b.nguon}, cần BĐS ${bds})`);
    }
  }
  if (lech.length) assert.fail(`CV-AC-2 viết tắt phòng ngủ mất: ${lech.join(" · ")}`);
}

describe("CV-AC-1/2 «<số> năm/nữ» không phải phòng ngủ, viết tắt thật giữ nguyên", () => {
  test("CV-AC-1 bốn ô «<số> năm/nữ» có giá → không dấu hiệu BĐS, không thành tin; bản cũ khớp (đối chứng dương)", async () => {
    kiemNamNu(goc, await banCu());
  });
  test("chiều đỏ CV-AC-1: bản chép đặt lại ranh giới từ cũ → ô «Cho vay … 1 năm» đỏ", async () => {
    const cu = await banCu();
    assert.throws(() => kiemNamNu(cu, cu), /CV-AC-1 năm thành phòng ngủ: .*Cho vay 500tr thời hạn 1 năm/);
  });
  test("CV-AC-2 tám ô viết tắt: dấu hiệu BĐS và loại bằng bản cũ", async () => {
    kiemVietTat(goc, await banCu());
  });
  test("chiều đỏ CV-AC-2: bản đột biến lookahead dương (chỉ chữ số, + hay khoảng trắng sau) → ô «căn 2n, giá 14tr» đỏ", async () => {
    const mod = await banDot([[NHANH_N_MOI, "\\d+\\s*n\\s*\\+?\\s*\\d?(?=[\\d+\\s])"]]);
    const cu = await banCu();
    assert.throws(() => kiemVietTat(mod, cu), /CV-AC-2 viết tắt phòng ngủ mất: .*căn 2n, giá 14tr/);
  });
});

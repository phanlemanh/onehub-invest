// yeu-cau-khong-thanh-tin-thue.test.mjs — hồ sơ _acceptance/yeu-cau-khong-thanh-tin-thue (PL42), AC-1, AC-2, AC-3: bài tìm căn
// viết tắt là Yêu cầu, không thành tin rao thuê. Thuần, không DB. Câu trong ma trận viết tay theo dạng bài thật, không chép bài
// thật. Ma trận và kết quả ghim viết TRƯỚC khi sửa luật. Mỗi phép đo có chiều đỏ cùng ma trận, thông điệp ghim.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as goc from "../transform-zalo.mjs";

const PIPE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Biểu thức YEU_CAU trước PL42, ghim nguyên văn (transform-zalo.mjs ở origin/main 6286dd29a). */
const YEU_CAU_CU = /(?:cần\s+(?:mua|thuê|tìm)|tìm\s+(?:mua|thuê|căn|nhà|phòng)|kh[aá]c?h\b[^.!?\n]{0,30}?\b(?:xem|tìm|cần)\b|(?:anh|a)\s*(?:\/\s*)?(?:chị|c)\s+(?:nào\s+)?có\s+căn|ai\s+có\s+căn|có\s+căn\s+gửi)/iu;

/** Bản chép tạm của transform-zalo.mjs (import tương đối trỏ về pipeline/), đổi từng cặp [cũ, mới]. */
async function banDot(thay) {
  let src = readFileSync(path.join(PIPE, "transform-zalo.mjs"), "utf8");
  for (const [a, b] of thay) {
    assert.ok(src.includes(a), `chỗ đột biến không còn trong transform-zalo.mjs: ${a}`);
    src = src.replace(a, b);
  }
  src = src.replace(/from "\.\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(PIPE, rel)).href)}`);
  const dir = mkdtempSync(path.join(PIPE, "scripts", ".pl42-dot-"));
  const f = path.join(dir, "transform-zalo.mjs");
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** parsePost rồi suyLoai, nhóm «cả hai»; `luat` tiêm biểu thức Yêu cầu (chỉ chiều đỏ). */
const suy = (mod, text, luat = {}) => mod.suyLoai(mod.parsePost(text), text, "ca-hai", null, luat);

// ---------- AC-1: tám mẫu giữ × có/không giá ----------
// [mẫu, câu có giá, câu không giá]. Không câu nào khớp luật cũ (chiều đỏ dưới kiểm điều đó).
const MAU_GIU = [
  ["tìm N pn", "Tìm 2pn full 8tr ở liền", "Tìm gấp 1n1wc full đồ, ở liền"],
  ["tìm studio", "Tìm studio full đồ 5tr5", "Tìm gấp stu gần trường, ở liền"],
  ["tìm gấp", "Tìm gấp, tài chính 7tr, khu BS 1pn+ full", "Tìm gấp 1 căn ở liền khu GH, 2pn trống"],
  ["tim thue không dấu", "tim thue 2pn full 9tr", "tim thue studio gan truong"],
  ["cần studio/N pn", "Cần studio full đồ 6tr", "Cần 2pn trống ở liền khu BS"],
  ["ac có gửi em", "Xem liền 2pn full 8tr. Ac có gửi em nha", "Xem liền studio full đồ, ai nào có thì nhắn e ạ"],
  ["khách e cọc hụt/chốt", "Khách e cọc hụt căn 2pn full 9tr, ở liền", "Khách em chốt hụt căn studio, ở liền trong tuần"],
  ["em/mình tìm", "Em đang tìm 1 căn 2pn full đồ tầm 8tr", "Mình tìm 1 căn ở liền khu BS, 1pn full"],
];

/** Mọi câu của ma trận phải là Yêu cầu (laYeuCau và suyLoai → kind null, nguồn yeu-cau). */
function kiemYeuCau(mod, ten, luat = {}, laYc = mod.laYeuCau) {
  const lech = [];
  for (const [mau, ...cau] of MAU_GIU) {
    for (const text of cau) {
      const r = suy(mod, text, luat);
      if (!laYc(text) || r.kind !== null || r.nguon !== "yeu-cau") lech.push(`[${mau}] «${text}» → ${laYc(text)}/${r.kind}/${r.nguon}`);
    }
  }
  if (lech.length) assert.fail(`${ten}: ${lech.join(" · ")}`);
}

describe("PL42-AC-1 câu tìm viết tắt là Yêu cầu", () => {
  test("PL42-AC-1 ma trận tám mẫu × có/không giá → Yêu cầu", () => {
    assert.equal(MAU_GIU.length, 8);
    kiemYeuCau(goc, "PL42-AC-1 câu tìm lọt thành tin");
  });
  test("chiều đỏ PL42-AC-1: biểu thức YEU_CAU cũ ghim nguyên văn → cả 16 câu đỏ, gọi tên từng mẫu", () => {
    const laCu = (t) => YEU_CAU_CU.test(goc.gatSo(t));
    assert.throws(() => kiemYeuCau(goc, "PL42-AC-1 câu tìm lọt thành tin", { yeuCau: YEU_CAU_CU }, laCu), (e) => {
      const thieu = MAU_GIU.flatMap(([mau, ...cau]) => cau.map((text) => `[${mau}] «${text}»`)).filter((o) => !e.message.includes(o));
      assert.deepEqual(thieu, [], "chiều đỏ không gọi tên đủ 16 câu");
      return /^PL42-AC-1 câu tìm lọt thành tin: /.test(e.message);
    });
  });
});

// ---------- AC-2: tin rao gần giống giữ nguyên kind của hàm cũ ----------
// [mẫu gần, câu, kind ghim, nguồn ghim] — kind/nguồn là kết quả của hàm cũ, viết tay trước khi sửa luật.
const TIN_RAO = [
  ["tìm N pn", "Tìm khách thuê căn 2pn full 8tr", "rent_lt", "don-vi-gia"],
  ["tìm N pn", "Tìm khách thuê căn 2pn full đồ", null, "bo"],
  ["tìm studio", "Tìm gấp khách thuê studio 5tr", "rent_lt", "don-vi-gia"],
  ["tìm studio", "Tìm gấp khách thuê studio full đồ", null, "bo"],
  ["tìm gấp", "Tìm gấp người thuê 2pn full 9tr", "rent_lt", "don-vi-gia"],
  ["tìm gấp", "Tìm gấp người thuê 2pn full đồ", null, "bo"],
  ["tim thue không dấu", "Can tim khach thue 2pn 8tr", "rent_lt", "don-vi-gia"],
  ["tim thue không dấu", "tim khach thue 2pn full do", null, "bo"],
  ["cần studio/N pn", "Cần cho thuê studio 6tr", "rent_lt", "chu-bai"],
  ["cần studio/N pn", "Cần cho thuê studio full đồ", "rent_lt", "chu-bai"],
  ["ac có gửi em", "Căn 2pn full 8tr, ac có khách gửi em", "rent_lt", "don-vi-gia"],
  ["ac có gửi em", "Căn 2pn full đồ, ac có khách gửi em", null, "bo"],
  ["ac có gửi em", "2pn full 9tr, ac có nhu cầu ib em", "rent_lt", "don-vi-gia"],
  ["khách e cọc hụt/chốt", "Khách e chốt căn này rồi, còn 1 căn 2pn 9tr", "rent_lt", "don-vi-gia"],
  ["khách e cọc hụt/chốt", "Khách e chốt căn này rồi, còn 1 căn 2pn full đồ", null, "bo"],
  ["em/mình tìm", "Em tìm khách thuê cho căn 2pn 8tr", "rent_lt", "don-vi-gia"],
  ["em/mình tìm", "Em đang tìm khách thuê cho căn studio full đồ", null, "bo"],
  ["em/mình tìm", "Mình tìm người thuê căn 1pn 6tr", "rent_lt", "don-vi-gia"],
  ["khách thuê cọc", "Khách thuê cọc rồi, còn 1 căn 2pn 8tr", "rent_lt", "don-vi-gia"],
  ["khách thuê cọc", "Khách thuê cọc rồi, còn căn 2pn full đồ", null, "bo"],
  ["đã có khách", "Đã có khách, còn studio 6tr", "rent_lt", "don-vi-gia"],
  ["đã có khách", "Đã có khách căn 2pn full", null, "bo"],
  ["nhận ký gửi", "Nhận ký gửi căn hộ 2pn 9tr", "rent_lt", "don-vi-gia"],
  ["nhận ký gửi", "Nhận ký gửi căn hộ 2pn full đồ", null, "bo"],
];

function kiemTinRao(mod, ten, luat = {}) {
  const lech = [];
  for (const [mau, text, kind, nguon] of TIN_RAO) {
    const r = suy(mod, text, luat);
    if (r.kind !== kind || r.nguon !== nguon) lech.push(`[${mau}] «${text}» → ${r.kind}/${r.nguon} (cần ${kind}/${nguon})`);
  }
  if (lech.length) assert.fail(`${ten}: ${lech.join(" · ")}`);
}

describe("PL42-AC-2 tin rao gần giống không bị kéo vào Yêu cầu", () => {
  test("PL42-AC-2 mỗi mẫu giữ có câu rao gần giống (có/không giá) + ba câu rao → đúng kind ghim của hàm cũ", () => {
    const mau = new Set(TIN_RAO.map(([m]) => m));
    for (const [m] of MAU_GIU) assert.ok(mau.has(m), `mẫu «${m}» thiếu câu rao đối chứng`);
    kiemTinRao(goc, "PL42-AC-2 tin rao thành Yêu cầu");
  });
  test("PL42-AC-2 kết quả ghim đúng là của hàm cũ (biểu thức YEU_CAU cũ cho cùng kind/nguồn)", () => {
    kiemTinRao(goc, "PL42-AC-2 ghim lệch hàm cũ", { yeuCau: YEU_CAU_CU });
  });
  test("chiều đỏ PL42-AC-2: bản sao luật thêm «khách thuê» → ca «khách thuê cọc» đỏ", async () => {
    const mod = await banDot([["const YEU_CAU_PL42 = [\n", "const YEU_CAU_PL42 = [\n  String.raw`kh[aá]ch\\s+thuê`,\n"]]);
    assert.throws(() => kiemTinRao(mod, "PL42-AC-2 tin rao thành Yêu cầu"), /PL42-AC-2 tin rao thành Yêu cầu: .*\[khách thuê cọc\] «Khách thuê cọc rồi, còn 1 căn 2pn 8tr» → null\/yeu-cau/);
  });
  test("chiều đỏ PL42-AC-2: bỏ loại trừ «tìm khách/người» của mẫu «em tìm» → ca «Em tìm khách thuê» đỏ", async () => {
    const mod = await banDot([["tìm(?![\\p{L}])(?!\\s+(?:kh[aá]ch|người))`,", "tìm(?![\\p{L}])`,"]]);
    assert.throws(() => kiemTinRao(mod, "PL42-AC-2 tin rao thành Yêu cầu"), /PL42-AC-2 tin rao thành Yêu cầu: .*\[em\/mình tìm\] «Em tìm khách thuê cho căn 2pn 8tr» → null\/yeu-cau/);
  });
});

// ---------- AC-3: «cần/tìm thuê dài hạn» không thắng Yêu cầu ----------
const DAI_HAN = [
  ["Cần thuê dài hạn 2pn full 10tr", null, "yeu-cau"],
  ["Tìm thuê dài hạn studio", null, "yeu-cau"],
  ["Cho thuê dài hạn 2pn 10tr", "rent_lt", "chu-bai"],
  ["Căn 2pn thuê dài hạn 10tr", "rent_lt", "chu-bai"],
];

function kiemDaiHan(mod, ten) {
  const lech = [];
  for (const [text, kind, nguon] of DAI_HAN) {
    const r = suy(mod, text);
    if (r.kind !== kind || r.nguon !== nguon) lech.push(`«${text}» → ${r.kind}/${r.nguon} (cần ${kind}/${nguon})`);
  }
  if (lech.length) assert.fail(`${ten}: ${lech.join(" · ")}`);
}

describe("PL42-AC-3 chữ bài «cần thuê dài hạn» không thắng Yêu cầu", () => {
  test("PL42-AC-3 hai câu tìm là Yêu cầu, hai câu rao vẫn rent_lt chữ bài", () => kiemDaiHan(goc, "PL42-AC-3 cần thuê dài hạn thành tin"));
  test("chiều đỏ PL42-AC-3: bộ bắt cụm thuê cũ của parsePost → hai câu tìm đỏ", async () => {
    const mod = await banDot([["/cho thuê|(?<!(?:cần|tìm)\\s*)thuê dài hạn/iu", "/cho thuê|thuê dài hạn|cần cho thuê|thuê dài hạn/i"]]);
    assert.throws(() => kiemDaiHan(mod, "PL42-AC-3 cần thuê dài hạn thành tin"),
      /PL42-AC-3 cần thuê dài hạn thành tin: «Cần thuê dài hạn 2pn full 10tr» → rent_lt\/chu-bai .*«Tìm thuê dài hạn studio» → rent_lt\/chu-bai/);
  });
});

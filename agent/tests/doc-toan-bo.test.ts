// doc-toan-bo.test.ts — hồ sơ _acceptance/s03-llm-doc-toan-bo, phần không cần DB: luật trích dẫn, gạt chữ, đọc trả lời, quyết một tin.
// Model giả của AI SDK — không gọi mạng, không cần khoá. Chữ bài viết tay; số điện thoại, tên nhóm, tên miền đều giả.
import { test } from "node:test";
import assert from "node:assert/strict";
import { kiemTrichLoai, trichCoThat } from "../src/enrich/luat-trich-dan.js";

// ---------- luật trích dẫn (AC-3, AC-4) — ma trận viết trước ----------
const CHU = "Chính chủ bán căn hộ 2PN tầng cao, sổ đỏ, giá 3 tỷ";
const DAT: [string, string, string][] = [
  ["căn hộ", CHU, "bán căn hộ 2PN"],
  ["chung cư", "Cho thuê chung cư Times City 2PN 14tr", "chung cư Times City"],
  ["viết tắt cc", "Bán cc 2PN giá tốt", "Bán cc 2PN"],
];
const KHONG_DAT: [string, string, string | null, string, string][] = [
  ["không có trích", CHU, null, "apartment", "khong-co-trich"],
  ["trích giả", CHU, "bán căn hộ 3PN view hồ", "apartment", "trich-gia"],
  ["không từ khoá", "S9.03 2PN 14tr full đồ", "2PN 14tr", "apartment", "khong-tu-khoa"],
  ["từ khoá loại khác", "Chính chủ bán nhà phố 4 tầng", "bán nhà phố", "apartment", "tu-khoa-loai-khac"],
  ["gần X", "Cho thuê phòng gần chung cư Times City", "gần chung cư Times City", "apartment", "ngu-canh-loai-tru"],
  ["cạnh X", "Bán đất cạnh căn hộ mẫu dự án", "cạnh căn hộ mẫu", "apartment", "ngu-canh-loai-tru"],
  ["cần mua X", "Khách cần mua căn hộ 2PN tầm 3 tỷ", "cần mua căn hộ 2PN", "apartment", "ngu-canh-loai-tru"],
  ["hai loại một câu", "Bán căn hộ và nhà phố cùng khu", "Bán căn hộ và nhà phố", "apartment", "ngu-canh-loai-tru"],
  ["trích né ngữ cảnh gần", "Cho thuê phòng gần chung cư Times City", "chung cư Times City", "apartment", "ngu-canh-loai-tru"],
  ["trích né ngữ cảnh cần mua", "Khách cần mua căn hộ 2PN tầm 3 tỷ", "căn hộ 2PN", "apartment", "ngu-canh-loai-tru"],
  ["loại khác không tự điền", "Chính chủ bán nhà phố 4 tầng", "bán nhà phố", "house", "tu-khoa-loai-khac"],
];

for (const [ten, chu, quote] of DAT) {
  test(`LS1-AC-3 luật đạt: ${ten}`, () => {
    assert.deepEqual(kiemTrichLoai("apartment", quote, chu), { ok: true, ma: "trich-dan:can-ho" }, `LS1-AC-3 ${ten}: phải đạt`);
  });
}
for (const [ten, chu, quote, value, lyDo] of KHONG_DAT) {
  test(`LS1-AC-4 luật không đạt: ${ten}`, () => {
    assert.deepEqual(kiemTrichLoai(value, quote, chu), { ok: false, lyDo }, `LS1-AC-4 ${ten}: phải ra ${lyDo}`);
  });
}

test("LS1 Focus 5: chữ NFD nhiều khoảng trắng, trích NFC vẫn là có thật", () => {
  const nfd = "Chính chủ   bán căn hộ\n2PN".normalize("NFD");
  assert.equal(trichCoThat("bán căn hộ 2PN", nfd), true, "Focus 5: NFD/khoảng trắng làm trích thật thành giả");
  assert.deepEqual(kiemTrichLoai("apartment", "bán căn hộ 2PN", nfd), { ok: true, ma: "trich-dan:can-ho" });
  assert.equal(trichCoThat("bán căn hộ 3PN", nfd), false, "Focus 5 đối chứng: trích giả phải vẫn là giả");
});

// ---------- gạt chữ, gọi model (AC-2) ----------
import { MockLanguageModelV4 } from "ai/test";
import { chayLo, type Nhan } from "../src/agents/nhan-bac-s03.js";
import { docTraLoi, gatChu, hoiDoc } from "../src/enrich/doc-toan-bo.js";

function modelGia(tra: string | Error, nhan: string[] = [], cost?: string) {
  return new MockLanguageModelV4({
    modelId: "mock",
    doGenerate: async (o: { prompt: unknown }) => {
      nhan.push(JSON.stringify(o.prompt));
      if (tra instanceof Error) throw tra;
      return {
        content: [{ type: "text", text: tra }], finishReason: { unified: "stop", raw: "stop" },
        usage: { inputTokens: { total: 300, noCache: 300, cacheRead: undefined, cacheWrite: undefined }, outputTokens: { total: 40, text: 40, reasoning: undefined } },
        warnings: [], providerMetadata: cost ? { gateway: { cost } } : undefined,
      };
    },
  } as never);
}

const LO = ["0912.345.678", "khach@example.test", "https://nguon-gia.example/tin/1", "www.khac.example/x", "nguongia.vn/abc", "NguonGiaThat", "Nhóm Giả Hà Nội"];
const BAI_DAI = `Bán căn hộ 2PN Times City. LH ${LO[0]} hoặc ${LO[1]}. Xem ${LO[2]} ${LO[3]} ${LO[4]}. Đăng ở ${LO[5]} trong ${LO[6]}. `
  + "Căn góc thoáng mát, nội thất đầy đủ, sổ đỏ chính chủ. ".repeat(30);

test("LS1-AC-2 chữ đến model không cắt ở 500, không còn SĐT, email, link, tên nhóm, tên nguồn", async () => {
  assert.ok(BAI_DAI.length >= 1500, "LS1-AC-2 fixture phải dài từ 1.500 ký tự");
  const sach = gatChu(BAI_DAI, ["nguongiathat", "Nhóm Giả Hà Nội"]);
  const nhan: string[] = [];
  await hoiDoc(sach, { languageModel: modelGia("{}", nhan), recordCall: async () => {} });
  assert.equal(nhan.length, 1);
  const gui = nhan[0];
  assert.ok(sach.length > 500, "LS1-AC-2 chữ bị cắt");
  assert.ok(gui.includes("Bán căn hộ 2PN Times City"), "LS1-AC-2 đối chứng dương: chữ thường phải còn");
  assert.ok(gui.includes(sach.slice(-40).trim()), "LS1-AC-2 đuôi bài phải tới model");
  for (const lo of LO) assert.ok(!gui.includes(lo), `LS1-AC-2 chữ đến model còn chuỗi lộ: ${lo}`);
});

test("chiều đỏ LS1-AC-2: gửi chữ chưa gạt thì phép đo thấy chuỗi lộ", async () => {
  const nhan: string[] = [];
  await hoiDoc(BAI_DAI, { languageModel: modelGia("{}", nhan), recordCall: async () => {} });
  assert.ok(LO.some((lo) => nhan[0].includes(lo)), "chiều đỏ: phép đo không phân biệt được");
});

test("docTraLoi: JSON hỏng, giá chuỗi, giá 0, ý định lạ, trích so trên chữ đã gạt", () => {
  const chu = "Bán căn hộ giá 2,62 tỷ";
  assert.equal(docTraLoi("không phải json", chu).json_ok, false);
  const a = docTraLoi('{"intent":"offer","kind":"sale","quote":"Bán căn hộ","property_type":"apartment","quote_loai":"Bán căn hộ","price_vnd":"2,62 tỷ","area_m2":0}', chu);
  assert.equal(a.probabilities?.price_vnd, null, "Focus 4: giá chuỗi phải thành null");
  assert.equal(a.probabilities?.area_m2, null, "Focus 4: diện tích 0 phải thành null");
  assert.equal(a.probabilities?.property_type, "apartment");
  assert.equal(a.quote_ok, true);
  const b = docTraLoi('{"intent":"wanted","quote":"câu bịa","property_type":"unknown","price_vnd":2620000000}', chu);
  assert.equal(b.listing_intent, "unknown");
  assert.equal(b.quote_ok, false);
  assert.equal(b.probabilities?.property_type, null);
  assert.equal(b.probabilities?.price_vnd, 2620000000);
});

test("hoiDoc: lời gọi lỗi thành nhãn, không ném; ai_calls vẫn được gọi", async () => {
  const ghi: unknown[] = [];
  const n = await hoiDoc("chữ", { languageModel: modelGia(new TypeError("x")), recordCall: async (r) => { ghi.push(r); } });
  assert.equal(n.error_kind, "TypeError");
  assert.equal(ghi.length, 1);
});

const nhanGia = (): Nhan => ({ model: "m", listing_intent: "offer", kind: "sale", probability: null, probabilities: null, quote: null, quote_ok: null, json_ok: true, error_kind: null, latency_ms: 1, cost_usd: 0.001 });
test("chayLo: vắng tuỳ chọn vẫn ghi prompt cũ, có tuỳ chọn ghi prompt mới", async () => {
  const bai = [{ post_id: "p", text: "chữ", text_hash: "h" }];
  const cu = await chayLo({ backend: "haiku", bai, runId: "r", tranUsd: 1, hoi: async () => nhanGia(), ghi: null });
  assert.equal(cu.nhan[0].prompt_version, "nb-s03-v2");
  const moi = await chayLo({ backend: "haiku", bai, runId: "r", tranUsd: 1, hoi: async () => nhanGia(), ghi: null, promptVersion: "dtb-s03-v1", uoc: () => 5 });
  assert.equal(moi.nhan.length, 0, "uoc phải được dùng để chặn trần");
  assert.equal(moi.dungTran, true);
});

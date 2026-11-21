// cham-bong-bo-sung-tin.test.ts — NB1: chấm bóng hàng «Bổ sung tin». Tên ca bắt đầu bằng mã AC để probe
// _acceptance/cham-bong-bo-sung-tin/probes/cham.sh lọc. Mã nguồn nạp theo CHAM_BONG_SRC (mặc định «cham-bong») để probe đột biến
// chạy cùng bộ ca trên bản sao đã sửa (agent/src/enrich/cham-bong.dot-bien/).
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const SRC = process.env.CHAM_BONG_SRC ?? "cham-bong";
const KC = (await import(`../src/enrich/${SRC}/ket-cuc.js`)) as typeof import("../src/enrich/cham-bong/ket-cuc.js");
const CH = (await import(`../src/enrich/${SRC}/cau-hinh.js`)) as typeof import("../src/enrich/cham-bong/cau-hinh.js");
const PR = (await import(`../src/enrich/${SRC}/prompt.js`)) as typeof import("../src/enrich/cham-bong/prompt.js");
const DOC = (await import(`../src/enrich/${SRC}/doc.js`)) as typeof import("../src/enrich/cham-bong/doc.js");
type ModelCham = import("../src/enrich/cham-bong/cau-hinh.js").ModelCham;
type AiCallRecord = import("../src/runtime/ai-call-log.js").AiCallRecord;

// ---------- AC-4: kết cục ----------
const DX = "2";
const LAN = {
  bang: { v: "2", ly_do: null },
  A: { v: "3", ly_do: null },
  B: { v: "4", ly_do: null },
  rong: { v: null, ly_do: "khong-suy-ra" },
} as const;
type L = keyof typeof LAN;
/** Bảng viết tay: lần đọc 1 × lần đọc 2 → kết cục, và cờ ca biên khi KHÔNG có lech_tren_the. Có lech_tren_the thì ca biên luôn true. */
const BANG: [L, L, string, boolean][] = [
  ["bang", "bang", "khop", false],
  ["bang", "A", "lech_hai_lan", true],
  ["bang", "B", "lech_hai_lan", true],
  ["bang", "rong", "bo_trong", true],
  ["A", "bang", "lech_hai_lan", true],
  ["A", "A", "bac_dong_thuan", true],
  ["A", "B", "lech_hai_lan", true],
  ["A", "rong", "bo_trong", true],
  ["B", "bang", "lech_hai_lan", true],
  ["B", "A", "lech_hai_lan", true],
  ["B", "B", "bac_dong_thuan", true],
  ["B", "rong", "bo_trong", true],
  ["rong", "bang", "bo_trong", true],
  ["rong", "A", "bo_trong", true],
  ["rong", "B", "bo_trong", true],
  ["rong", "rong", "bo_trong", true],
];

test("AC-4 ma trận 16 cặp đọc × lech_tren_the × o_da_co = 64 assert", () => {
  let n = 0;
  for (const [a, b, ketCuc, caBienKhongLech] of BANG) {
    for (const lech of [false, true]) {
      for (const oDaCo of [false, true]) {
        const k = KC.ketCuc(DX, LAN[a], LAN[b]);
        assert.equal(k, ketCuc, `ô ${a}/${b} lech=${lech} o_da_co=${oDaCo}: kết cục ${k}, mong ${ketCuc}`);
        const cb = KC.laCaBien(k, lech);
        assert.equal(cb, lech ? true : caBienKhongLech, `ô ${a}/${b} lech=${lech} o_da_co=${oDaCo}: ca biên ${cb}`);
        n++;
      }
    }
  }
  assert.equal(n, 64);
});

test("AC-4 đối chứng dương: 4 ô khop không lech_tren_the không có cờ ca biên", () => {
  for (const oDaCo of [false, true]) for (const _ of [0, 1]) {
    assert.equal(KC.laCaBien(KC.ketCuc(DX, LAN.bang, LAN.bang), false), false, `ô khop o_da_co=${oDaCo} bị cờ ca biên`);
  }
});

test("AC-4 so theo khoá assertion_value_key: «02/2», hoa thường, khoảng trắng", () => {
  assert.equal(KC.ketCuc("2", { v: "02", ly_do: null }, { v: "2", ly_do: null }), "khop", "ô «02/2» phải khop");
  assert.equal(KC.ketCuc("Căn hộ", { v: "căn hộ", ly_do: null }, { v: " CĂN HỘ ", ly_do: null }), "khop", "ô «Căn hộ/căn hộ» phải khop");
  assert.equal(KC.khoaGiaTri("0"), "0");
  assert.equal(KC.khoaGiaTri("007"), "7");
  assert.equal(KC.khoaGiaTri(" S1.03 "), "s1.03");
});

test("AC-4 thứ tự ô ưu tiên", () => {
  assert.deepEqual([...KC.THU_TU_O], ["bathrooms", "bedrooms", "block_raw", "street_raw", "property_type"]);
});

// ---------- cấu hình ----------
const tepTam = (x: unknown) => {
  const p = join(mkdtempSync(join(tmpdir(), "cham-bong-")), "c.json");
  writeFileSync(p, JSON.stringify(x));
  return p;
};
const M = (khoa: string, gateway: string) => ({ khoa, gateway, gia_vao: 0.1, gia_ra: 0.5 });

test("cau-hinh tệp của kho: Haiku 5.5 + DeepSeek V4.1 Flash, trần 3 USD, lời nhắc cb-v1", () => {
  const { cauHinh, sha } = CH.napCauHinhCham();
  assert.match(sha, /^[0-9a-f]{64}$/);
  assert.deepEqual(cauHinh.model.map((m) => m.gateway), ["anthropic/claude-haiku-5.5", "deepseek/deepseek-v4.1-flash-1017"]);
  assert.equal(cauHinh.tran_usd, 3);
  assert.equal(cauHinh.prompt_version, "cb-v1");
});

test("cau-hinh chiều đỏ: model ngoài danh sách, hai model trùng, trần không dương", () => {
  const goc = { phien_ban: 1, prompt_version: "cb-v1", tran_usd: 3 };
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "openai/gpt-x")] })), /ngoài ba mã đã duyệt/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "anthropic/claude-haiku-5.5")] })), /trùng/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, tran_usd: 0, model: [M("a", "anthropic/claude-haiku-5.5"), M("b", "zai/glm-5.3-flash")] })), /tran_usd/);
  assert.throws(() => CH.napCauHinhCham(tepTam({ ...goc, model: [M("a", "anthropic/claude-haiku-5.5")] })), /đúng hai/);
});

// ---------- AC-3: luật kiểm ô ----------
const BAI3 = "Bán gấp căn hộ 2PN 2WC toà S1.03 đường Nguyễn Văn Linh, giá 3,2 tỷ";
test("AC-3 ma trận 8 ca kiểm ô", () => {
  const ca: [string, Parameters<typeof DOC.kiemO>[0], unknown, string | null, string | null][] = [
    ["trích có thật → giữ", "bathrooms", { v: 2, trich: "2WC", can_cu: "ghi 2WC" }, "2", null],
    ["trích không có trong bài → rỗng", "bathrooms", { v: 2, trich: "2 vệ sinh", can_cu: "x" }, null, "trich-gia"],
    ["trích khác hoa thường, khoảng trắng → giữ", "block_raw", { v: "S1.03", trich: "TOÀ   s1.03", can_cu: "x" }, "S1.03", null],
    ["loại hình trong từ vựng → giữ", "property_type", { v: "apartment", trich: "căn hộ", can_cu: "x" }, "apartment", null],
    ["loại hình ngoài từ vựng → rỗng", "property_type", { v: "chung_cu", trich: "căn hộ", can_cu: "x" }, null, "ngoai-tu-vung"],
    ["số WC «2» → giữ", "bathrooms", { v: "2", trich: "2WC", can_cu: "x" }, "2", null],
    ["số WC «2-3» → rỗng", "bathrooms", { v: "2-3", trich: "2WC", can_cu: "x" }, null, "khong-phai-so"],
    ["model trả rỗng → rỗng", "bedrooms", { v: null, trich: "", can_cu: "" }, null, "khong-suy-ra"],
  ];
  for (const [ten, f, raw, v, lyDo] of ca) {
    const o = DOC.kiemO(f, raw, BAI3);
    assert.equal(o.v, v, `ca ${ten}: v=${o.v}`);
    assert.equal(o.ly_do, lyDo, `ca ${ten}: ly_do=${o.ly_do}`);
  }
});

// ---------- AC-2: lời nhắc ----------
const MH: ModelCham = { khoa: "haiku", gateway: "anthropic/claude-haiku-5.5", duong: ["gateway"], gia_vao: 0.1, gia_ra: 0.5 };
const baiDai = (n: number, them = "") => `Bán căn hộ 2PN 2WC toà S1.03. ${them}`.padEnd(n, " Nội thất đầy đủ, view hồ, sổ đỏ chính chủ.");
const bat = () => {
  const loi: { system: string; user: string }[] = [];
  const goi: import("../src/enrich/cham-bong/doc.js").GoiModel = async (_m, _d, p) => {
    loi.push(p);
    return { text: JSON.stringify({ bathrooms: { v: 2, trich: "2WC", can_cu: "ghi 2WC" } }), vao: 100, ra: 20 };
  };
  return { loi, goi };
};

test("AC-2 lời nhắc chứa bài gốc đầy đủ trong khối ranh giới và tên ô; băm khớp", async () => {
  const bai = baiDai(420);
  assert.ok(bai.length > 300);
  const { loi, goi } = bat();
  const so: AiCallRecord[] = [];
  const k = await DOC.docMot({ model: MH, dauVao: { text: bai, group_name: "Nhóm A", o: ["bathrooms", "block_raw"] }, goi, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.equal(loi.length, 1);
  const u = loi[0].user;
  const a = u.indexOf(PR.RANH_BAI.mo), b = u.indexOf(PR.RANH_BAI.dong);
  assert.ok(a >= 0 && b > a, "thiếu khối ranh giới");
  assert.equal(u.slice(a + PR.RANH_BAI.mo.length + 1, b - 1), bai, "bài trong khối không nguyên văn (hay bị cắt 300 ký tự)");
  for (const f of ["bathrooms", "block_raw"]) assert.ok(u.slice(0, a).includes(f), `thiếu tên ô ${f}`);
  const { createHash } = await import("node:crypto");
  assert.equal(k.sha_loi_nhac, createHash("sha256").update(`${loi[0].system}\n${u}`).digest("hex"));
  assert.equal(so.length, 1);
});

test("AC-2 thẻ canh: giá trị đề xuất không có trong bài vắng trên toàn bộ lời nhắc", async () => {
  const { loi, goi } = bat();
  for (const the of ["the-c1", "the-c2", "the-c3"]) {
    await DOC.docMot({ model: MH, dauVao: { text: baiDai(350), group_name: "Nhóm B", o: ["bathrooms"] }, goi, recordCall: async () => {}, trace: "t" });
    const toan = loi[loi.length - 1].system + loi[loi.length - 1].user;
    assert.ok(!toan.includes(`DEXUAT_CANH_${the}`), `thẻ ${the} lộ DEXUAT_CANH_${the}`);
  }
});

test("AC-2 lời nhắc JSON bọc markdown đọc được; JSON hỏng là lời gọi lỗi có một dòng sổ", async () => {
  const so: AiCallRecord[] = [];
  const md: import("../src/enrich/cham-bong/doc.js").GoiModel = async () => ({ text: "```json\n{\"bathrooms\":{\"v\":2,\"trich\":\"2WC\",\"can_cu\":\"x\"}}\n```", vao: 1, ra: 1 });
  const k1 = await DOC.docMot({ model: MH, dauVao: { text: BAI3, group_name: null, o: ["bathrooms", "bedrooms"] }, goi: md, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.ok(k1.ok && k1.o.bathrooms.v === "2" && k1.o.bedrooms.ly_do === "khong-suy-ra");
  const hong: import("../src/enrich/cham-bong/doc.js").GoiModel = async () => ({ text: "không biết", vao: 1, ra: 1 });
  const k2 = await DOC.docMot({ model: MH, dauVao: { text: BAI3, group_name: null, o: ["bathrooms"] }, goi: hong, recordCall: async (r) => { so.push(r); }, trace: "t" });
  assert.ok(!k2.ok && k2.loi === "json-hong");
  assert.equal(so.length, 2);
  assert.deepEqual(so.map((r) => r.ok), [true, false]);
  assert.equal(so[1].viec, "cham-bong-bo-sung-tin");
  assert.equal(so[1].model, "gateway:anthropic/claude-haiku-5.5");
});

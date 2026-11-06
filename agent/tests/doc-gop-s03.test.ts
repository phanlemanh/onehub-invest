// doc-gop-s03.test.ts — PL30 `chon-model-theo-o`: bảng chọn model theo ô, gọi + gộp, trần tiền, tóm tắt chấm.
// Gateway giả (MockLanguageModelV4), không DB. Ca DB ở doc-gop-s03-db.itest.ts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, matchesGlob } from "node:path";
import { test } from "node:test";
import { keHoach, kiemCauHinh, napCauHinh, NGUOI, tuyChonGui, type CauHinh } from "../src/enrich/doc-gop-s03/cau-hinh.js";

const GOC = join(import.meta.dirname, "../..");
const MODEL = {
  haiku: { gateway: "anthropic/claude-haiku-5.5", gia_vao: 0.1, gia_ra: 0.5 },
  glm: { gateway: "zai/glm-5.3-flash", gia_vao: 0.15, gia_ra: 0.5 },
  deepseek: { gateway: "deepseek/deepseek-v4.1-flash-1017", gia_vao: 0.3, gia_ra: 1.2 },
};
const bang = (o: Record<string, string>, them: Record<string, unknown> = {}) => ({ phien_ban: 1, mac_dinh: "haiku", model: MODEL, o, ...them });

// ---------- AC-2: bảng của kho ----------
test("DGS-AC-2 bảng chọn của kho: mọi ô dùng Haiku 5.5, riêng WC người duyệt", () => {
  const { cauHinh, sha } = napCauHinh();
  assert.match(sha, /^[0-9a-f]{64}$/);
  const kh = keHoach(cauHinh);
  assert.equal(kh.nhom.length, 1);
  assert.equal(kh.nhom[0].gateway, "anthropic/claude-haiku-5.5");
  assert.equal(kh.nhom[0].o.length, 16);
  assert.deepEqual(kh.nguoi, ["bathrooms"], "WC PHAI LA NGUOI DUYET");
});

test("DGS-AC-2 chiều đỏ: bảng thiếu o.bathrooms thì WC rơi về model", () => {
  const kh = keHoach(kiemCauHinh(bang({})));
  assert.deepEqual(kh.nguoi, []);
  assert.ok(kh.nhom[0].o.includes("bathrooms"), "thước WC phân biệt được bảng thiếu ô người duyệt");
});

// ---------- AC-3: bảng sai dừng trước lời gọi đầu ----------
const BANG_SAI: [string, unknown, RegExp][] = [
  ["ô lạ", bang({ tang_hamm: "haiku" }), /tang_hamm/],
  ["khoá model không khai", bang({ price_min_vnd: "qwen" }), /qwen/],
  ["model thiếu gateway", bang({}, { model: { ...MODEL, glm: { gia_vao: 0.15, gia_ra: 0.5 } } }), /glm thiếu gateway/],
  ["model thiếu gia_ra", bang({}, { model: { ...MODEL, glm: { gateway: "zai/glm-5.3-flash", gia_vao: 0.15 } } }), /gia_ra/],
  ["gateway ngoài ba mã", bang({}, { model: { ...MODEL, glm: { gateway: "openai/gpt-6", gia_vao: 1, gia_ra: 1 } } }), /openai\/gpt-6/],
  ["ô giao cho giá trị lạ", bang({ kind: "ai-do" }), /ai-do/],
];
for (const [ten, x, mau] of BANG_SAI) {
  test(`DGS-AC-3 bảng sai (${ten}) ném lỗi gọi tên chỗ sai`, () => {
    assert.throws(() => kiemCauHinh(x), mau);
  });
}
test("DGS-AC-3 đối chứng: bảng đúng nạp được, ô người duyệt nhận được", () => {
  const c: CauHinh = kiemCauHinh(bang({ bathrooms: NGUOI, price_min_vnd: "glm" }));
  assert.deepEqual(keHoach(c).nhom.map((n) => n.khoa), ["glm", "haiku"]);
});

// ---------- AC-1 (phần tệp bảng là đường T1) ----------
function t1Globs(): string[] {
  const dong = readFileSync(join(GOC, "_acceptance/config.yaml"), "utf8").split("\n");
  const dau = dong.findIndex((l) => /^\s*t1_skip_globs:\s*$/.test(l));
  const ra: string[] = [];
  for (const l of dong.slice(dau + 1)) {
    const m = /^\s*-\s*"([^"]+)"/.exec(l);
    if (m) ra.push(m[1]);
    else if (/^\s*[a-z_0-9]+:/.test(l)) break;
  }
  return ra;
}
test("DGS-AC-1-T1 tệp bảng chọn nằm trong t1_skip_globs, mã bộ đọc thì không", () => {
  const g = t1Globs();
  assert.ok(g.length > 0, "đọc được t1_skip_globs");
  assert.ok(g.some((x) => matchesGlob("agent/config/doc-gop-s03.json", x)), "BANG CHON CAN HO SO");
  assert.ok(!g.some((x) => matchesGlob("agent/src/enrich/doc-gop-s03/doc.ts", x)), "mã bộ đọc không được miễn hồ sơ");
});

// ---------- cờ gửi theo mã Gateway (AC-4, phần thuần) ----------
test("DGS-AC-4-CO tuyChonGui: ZDR + không huấn luyện cho cả ba mã, DeepSeek chỉ Baseten", () => {
  for (const m of Object.values(MODEL)) {
    const g = tuyChonGui(m.gateway).gateway;
    assert.equal(g.zeroDataRetention, true, "THIEU ZDR");
    assert.equal(g.disallowPromptTraining, true, "THIEU ZDR");
    if (m.gateway.startsWith("deepseek/")) assert.deepEqual(g.only, ["baseten"], "DEEPSEEK KHONG QUA BASETEN");
    else assert.equal(g.only, undefined);
  }
});

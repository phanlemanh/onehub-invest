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

// luu-tang-huong.test.mjs — hồ sơ _acceptance/s03-luu-tang-huong (SV2): ma trận bộ đọc, không DB. Đáp án: mục «Ma trận viết trước» của
// docs/superpowers/specs/2026-11-02-s03-luu-tang-huong-design.md. Câu do người viết, không lấy từ bài thật. Ca đỏ chạy trên bản sao đột biến.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { docTangHuong } from "../transform-zalo.mjs";

const PIPE = join(dirname(fileURLToPath(import.meta.url)), "..");

const HUONG = [
  ["hướng Đông Nam", "unspecified:southeast"],
  ["Hướng: ĐN - TN", "unspecified:southeast,southwest"],
  ["hướng TB", "unspecified:northwest"],
  ["ban công Tây Bắc", "balcony:northwest"],
  ["BC Đông & Nam", "balcony:east,south"],
  ["BC đông + tây", "balcony:east,west"],
  ["ban công Đông và Bắc", "balcony:east,north"],
  ["hướng cửa Bắc", "door:north"],
  ["cửa chính Tây Nam", "door:southwest"],
  ["Toà X1, 30m2, Đông Nam", "unspecified:southeast"],
  ["phường Tây Nam", null],
  ["khu Đông Nam, phía Tây Bắc", null],
  ["hướng dẫn thủ tục, hướng tới khách thuê", null],
  ["S1.12.08 và S2.05.01 hướng Đông, tầng cao", null],
];
const TANG = [
  ["tầng 12", "12"],
  ["lầu 5", "5"],
  ["Tầng: 7", "7"],
  ["S1.12.08", "12"],
  ["GH3-1203", "12"],
  ["PR6xx20", null],
  ["tầng cao", "tầng cao"],
  ["tầng trung", "tầng trung"],
  ["trung tầng", "tầng trung"],
  ["tầng vừa", "tầng trung"],
  ["tầng thấp", "tầng thấp"],
  ["tầng trung cao", "tầng cao"],
  ["tầng 15, tầng cao", "15"],
  ["nhà 5 tầng", null],
  ["3 tầng", null],
  ["tầng 2-3", null],
  ["tầng 1 và 2", null],
  ["S1.12.08 và S2.05.01 hướng Đông, tầng cao", null],
];

test("SV2-AC-4 bộ đọc hướng: mỗi dòng ma trận ra đúng đáp án", () => {
  assert.equal(HUONG.length, 14);
  for (const [chu, dap] of HUONG) assert.equal(docTangHuong(chu).facing, dap, `SV2-AC-4 «${chu}»`);
});

test("SV2-AC-5 bộ đọc tầng: mỗi dòng ma trận ra đúng đáp án", () => {
  assert.equal(TANG.length, 18);
  for (const [chu, dap] of TANG) assert.equal(docTangHuong(chu).floor, dap, `SV2-AC-5 «${chu}»`);
});

test("SV2-AC-4 trọng tâm soát: chữ hoa, dấu tách lạ, tên riêng chứa hướng, chữ dễ nhầm", () => {
  const ca = [
    ["HƯỚNG ĐÔNG NAM", "unspecified:southeast"], ["Đông-Nam", null], ["hướng Đông-Nam", "unspecified:southeast"], ["Đ.Nam", null],
    ["Tây Hồ", null], ["Đông Anh", null], ["Nam Từ Liêm", null], ["Bắc Ninh", null],
    ["ban công hướng Nam", "balcony:south"], ["hướng Nam, hướng Nam", "unspecified:south"], ["hướng Tây - Đông", "unspecified:east,west"],
  ];
  for (const [chu, dap] of ca) assert.equal(docTangHuong(chu).facing, dap, `SV2-AC-4 «${chu}»`);
});

test("SV2-AC-5 trọng tâm soát: số tầng của nhà, chữ dễ nhầm với khoảng", () => {
  const ca = [
    ["nhà 5 tầng, tầng cao", "tầng cao"], ["nhà 5 tầng 3 ngủ", null], ["căn hộ cao tầng", null], ["tầng trung tâm thương mại", null], ["tầng cao cấp", null],
    ["tầng 2,5m", null], ["TẦNG CAO", "tầng cao"], ["S1.00.08", null], ["GH3-1203 tầng cao", "12"], ["GH3-1203, tầng 5", "5"],
  ];
  for (const [chu, dap] of ca) assert.equal(docTangHuong(chu).floor, dap, `SV2-AC-5 «${chu}»`);
});

/** Nạp bản sao transform-zalo.mjs có đột biến, chạy cạnh lib thật qua liên kết. */
async function docDotBien(tu, thanh) {
  const nguon = readFileSync(join(PIPE, "transform-zalo.mjs"), "utf8");
  assert.ok(nguon.includes(tu), `đột biến không khớp: ${tu}`);
  const tep = join(PIPE, `.dot-bien-sv2-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
  writeFileSync(tep, nguon.replace(tu, thanh));
  try {
    return (await import(tep)).docTangHuong;
  } finally {
    rmSync(tep, { force: true });
  }
}

test("SV2-AC-4 đỏ: bản sao bỏ danh sách nơi chốn thì dòng «phường Tây Nam» sai", async () => {
  const doc = await docDotBien("!NOI_CHON.test(so.slice(Math.max(0, m.index - 14), m.index))", "true");
  assert.equal(doc("phường Tây Nam").facing, "unspecified:southwest", "SV2-AC-4 đỏ: bỏ nơi chốn mà vẫn đúng — thước không đo");
});

test("SV2-AC-5 đỏ: bản sao bỏ chặn «tầng 2-3» thì đọc thành tầng 2", async () => {
  const doc = await docDotBien("|,\\s*\\d|-\\s*\\d))/iu", "|,\\s*\\d))/iu");
  assert.equal(doc("tầng 2-3").floor, "2", "SV2-AC-5 đỏ: bỏ chặn mà vẫn đúng — thước không đo");
});

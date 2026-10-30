// gop-anh.test.mjs — hồ sơ _acceptance/gop-tin-chi-anh-o-transform (PL28) AC-1, AC-2: nhận tin chỉ-ảnh và gán vào tin chữ
// gần nhất cùng người. Mỗi ma trận có ca đỏ: bản sao đột biến lib/gop-anh.mjs chép cạnh tệp thật, nạp rồi xoá ngay.
import { strict as assert } from "node:assert";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

import * as ga from "../lib/gop-anh.mjs";

const GA = join(import.meta.dirname, "../lib/gop-anh.mjs");
let nMut = 0;

async function banSaoDotBien(thay) {
  let src = readFileSync(GA, "utf8");
  for (const [cu, moi] of thay) {
    assert.ok(src.includes(cu), `đột biến không khớp mã nguồn: «${cu}»`);
    src = src.replace(cu, moi);
  }
  const f = join(import.meta.dirname, `../lib/.ga-mut-${process.pid}-${++nMut}.mjs`);
  writeFileSync(f, src);
  try {
    return await import(pathToFileURL(f).href);
  } finally {
    rmSync(f, { force: true });
  }
}

const BO_GAT_URL = [['(text ?? "").replace(URL_RE, " ").trim()', '(text ?? "").trim()']];
const BO_CUNG_NGUOI = [["const khoa = (p) => `${p.conversation_id}|${p.sender_id}`;", "const khoa = (p) => `${p.conversation_id}`;"]];
const NHO_HON_BANG = [["if (!(d < cuaSoGiay)) continue;", "if (!(d <= cuaSoGiay)) continue;"]];
const LAY_DAU_TIEN = [["if (!best || d < best.d || (d === best.d && totHon(tc, c.post_id, best, ta)))", "if (!best)"]];

// ---- AC-1: nhận tin chỉ-ảnh ----
const CHI_ANH = [
  ["https://img.example.test/a/1.jpg", true],
  ["https://img.example.test/a/1.jpg https://img.example.test/a/2.jpg\nhttps://img.example.test/a/3.jpg", true],
  ["www.img.example.test/a/1.jpg", true],
  ["", true],
  ["Cho thuê 2PN 7tr https://img.example.test/a/1.jpg", false],
  ["Bán căn 2PN giá 3 tỷ", false],
];

test("GA-AC-1: 6 dòng chữ — chỉ-URL và rỗng là tin chỉ-ảnh, có lời thì không", () => {
  assert.equal(CHI_ANH.length, 6);
  for (const [chu, dapAn] of CHI_ANH) assert.equal(ga.laChiAnh(chu), dapAn, `GA-AC-1 «${chu}»`);
});

test("GA-AC-1 đột biến: bỏ bước gạt URL → dòng một URL không còn là tin chỉ-ảnh", async () => {
  const m = await banSaoDotBien(BO_GAT_URL);
  assert.equal(m.laChiAnh(CHI_ANH[0][0]), false, "GA-AC-1 đột biến dòng một URL vẫn là chỉ-ảnh — thước không đo bước gạt URL");
});

// ---- AC-2: gán vào tin chữ gần nhất cùng người ----
const T0 = Date.parse("2026-10-28T03:00:00Z");
const luc = (giay) => new Date(T0 + giay * 1000).toISOString();
const chu = (id, giay, { nguoi = "u1", nhom = "g1" } = {}) => ({ post_id: id, posted_at: luc(giay), sender_id: nguoi, conversation_id: nhom });
const anh = (giay, o) => chu("X", giay, o);

// [tên, bài chữ, bài ảnh, đáp án (post_id chữ hoặc null)]
const GAN = [
  ["ảnh trước chữ 30 giây", [chu("A", 30)], anh(0), "A"],
  ["ảnh sau chữ 30 giây", [chu("A", 0)], anh(30), "A"],
  ["cách 119 giây", [chu("A", 0)], anh(119), "A"],
  ["cách 120 giây", [chu("A", 0)], anh(120), null],
  ["khác người gửi", [chu("A", 0, { nguoi: "u2" })], anh(10), null],
  ["khác nhóm", [chu("A", 0, { nhom: "g2" })], anh(10), null],
  ["thiếu người gửi", [chu("A", 0)], anh(10, { nguoi: null }), null],
  ["hai bài chữ cách 10 và 50 giây", [chu("A", 0), chu("B", 40)], anh(50), "B"],
  ["hai bài chữ cách đều 30 giây trước và sau", [chu("A", 0), chu("B", 60)], anh(30), "B"],
];

test("GA-AC-2: 9 dòng gán — đúng bài chữ hoặc không gán", () => {
  assert.equal(GAN.length, 9);
  for (const [ten, baiChu, baiAnh, dapAn] of GAN) {
    assert.equal(ga.ganBaiAnh(baiChu, [baiAnh]).get("X") ?? null, dapAn, `GA-AC-2 «${ten}»`);
  }
});

test("GA-AC-2 đột biến: bỏ điều kiện cùng người → ảnh vào bài chữ của người khác", async () => {
  const m = await banSaoDotBien(BO_CUNG_NGUOI);
  const [, baiChu, baiAnh] = GAN[4];
  assert.equal(m.ganBaiAnh(baiChu, [baiAnh]).get("X"), "A", "GA-AC-2 đột biến «khác người gửi» vẫn không gán — thước không đo điều kiện cùng người");
});

test("GA-AC-2 đột biến: «< cửa sổ» thành «<=» → dòng cách 120 giây bị gán", async () => {
  const m = await banSaoDotBien(NHO_HON_BANG);
  const [, baiChu, baiAnh] = GAN[3];
  assert.equal(m.ganBaiAnh(baiChu, [baiAnh]).get("X"), "A", "GA-AC-2 đột biến «cách 120 giây» vẫn không gán — thước không đo biên cửa sổ");
});

test("GA-AC-2 đột biến: lấy bài chữ đầu tiên thay vì gần nhất → dòng hai bài chữ vào A", async () => {
  const m = await banSaoDotBien(LAY_DAU_TIEN);
  const [, baiChu, baiAnh] = GAN[7];
  assert.equal(m.ganBaiAnh(baiChu, [baiAnh]).get("X"), "A", "GA-AC-2 đột biến «hai bài chữ» vẫn vào B — thước không đo luật gần nhất");
});

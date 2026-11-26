// yeu-cau.test.mjs — YC0 bang-yeu-cau-noi-lai AC-3 (E3): phát biểu ý định từng bài, hàm thuần, không DB. Ma trận viết trước ở
// yeu-cau-mau.mjs (nhãn đủ cột silver_labels). Chiều đỏ chạy trên bản sao đột biến của lib/yeu-cau.mjs chép cạnh tệp thật (để
// import tương đối vẫn đúng) rồi xoá; mỗi phép đo một cặp: vật lành xanh, bản phá đỏ đúng thông điệp ghim.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { MA_TRAN, nhan, rutGon } from "./yeu-cau-mau.mjs";

const LIB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib");
const TEP = path.join(LIB, "yeu-cau.mjs");
const NGUON = readFileSync(TEP, "utf8");
const that = await import(pathToFileURL(TEP).href);

let nBan = 0;
/** Nạp bản sao đột biến của yeu-cau.mjs (một chỗ thay, hay mảng cặp [từ, thành]), xoá ngay sau khi nạp. */
async function banSao(tu, thanh) {
  let dotBien = NGUON;
  for (const [a, b] of Array.isArray(tu) ? tu : [[tu, thanh]]) {
    const moi = dotBien.replace(a, b);
    assert.notEqual(moi, dotBien, `bản sao đột biến không đổi gì: ${a}`);
    dotBien = moi;
  }
  const tep = path.join(LIB, `.yeu-cau-dot-bien-${process.pid}-${++nBan}.mjs`);
  writeFileSync(tep, dotBien);
  try { return await import(pathToFileURL(tep).href); } finally { rmSync(tep, { force: true }); }
}

const P = "yc0t";
const bai = (m) => ({ post_id: `${P}-${m.ca}`, text: m.chu, posted_at: "2026-11-19T02:00:00Z", group_name: m.nhom ?? "Nhóm thử YC0",
  snapshot_id: "2026-11-19__zalo-s03__x", agent_id: null });
const nhanCua = (dsCa) => new Map(dsCa.map((m) => [`${P}-${m.ca}`, m.nhan.map((o) => nhan(`${P}-${m.ca}`, o))]));

/** Ma trận qua một bộ sinh: ném «YC0-AC-3 <ca>: …» ở ca đầu tiên lệch. Trả số ca đã so. */
function kiemMaTran(phatBieuYDinh, dsCa = MA_TRAN) {
  const { dong } = phatBieuYDinh(dsCa.map(bai), nhanCua(dsCa), { source: "S03" });
  for (const m of dsCa) {
    const cua = dong.filter((d) => d.subject_key === `S03:${P}-${m.ca}`);
    for (const d of cua) {
      if (d.field !== "listing_intent") throw new Error(`YC0-AC-3 ${m.ca}: trường ${d.field}, mong listing_intent`);
    }
    const thuc = rutGon(cua);
    const mong = [...m.mong].sort((a, b) => `${a.rule_id}|${a.value}`.localeCompare(`${b.rule_id}|${b.value}`));
    try {
      assert.deepEqual(thuc, mong);
    } catch {
      throw new Error(`YC0-AC-3 ${m.ca}: tập dòng ${JSON.stringify(thuc)}, mong ${JSON.stringify(mong)}`);
    }
  }
  return dsCa.length;
}

test("YC0-AC-3 ma trận viết trước: mỗi bài ra đúng tập phát biểu ý định", () => {
  assert.equal(kiemMaTran(that.phatBieuYDinh), MA_TRAN.length);
  const { xet, loaiTinNhanYeuCau } = that.phatBieuYDinh(MA_TRAN.map(bai), nhanCua(MA_TRAN));
  // Bài xét = có chữ, không phải bài thử, parsePost không ra loại: trừ chi-nhan-loai-tin, tin-rao-khong-nhan, bai-thu.
  assert.equal(xet, MA_TRAN.length - 3, "YC0-AC-3 số bài xét");
  assert.equal(loaiTinNhanYeuCau, 1, "YC0-AC-3 đếm Hỏi-1b (bài tin rao mà nhãn nói Yêu cầu)");
  const dong = that.phatBieuYDinh(MA_TRAN.map(bai), nhanCua(MA_TRAN)).dong;
  const luat = dong.find((d) => d.rule_id === that.RULE_LUAT);
  assert.equal(luat.observed_at, "2026-11-19T02:00:00Z", "YC0-AC-3 observed_at = lúc bài đăng");
  const n = dong.find((d) => d.subject_key === `S03:${P}-luat-va-nhan` && d.rule_id === that.RULE_NHAN);
  assert.deepEqual(n.evidence, { label_id: 1, prompt_version: "nb-s03-v2", probability: 0.8 }, "YC0-AC-3 evidence của dòng nhãn");
});

test("YC0-AC-3 đối chứng: bộ sinh bỏ bước lọc nhãn hỏng → ca «nhan-hong-de» đổi tập dòng, đỏ gọi tên ca", async () => {
  const bo = await banSao("n.json_ok !== false && ", "");
  assert.throws(() => kiemMaTran(bo.phatBieuYDinh), /YC0-AC-3 nhan-hong-de: /);
  // Cùng bản sao, các ca không dính nhãn hỏng vẫn xanh — phép đo gọi đúng ca.
  assert.equal(kiemMaTran(bo.phatBieuYDinh, MA_TRAN.filter((m) => m.ca !== "nhan-hong-de")), MA_TRAN.length - 1);
});

test("YC0-AC-3 đối chứng: lấy nhãn mới nhất TRƯỚC rồi mới lọc hỏng → ca «nhan-hong-de» đỏ", async () => {
  const bo = await banSao([["    if (!nhanHopLe(n)) continue;\n", ""], ["  return best;\n}", "  return best && nhanHopLe(best) ? best : null;\n}"]]);
  assert.throws(() => kiemMaTran(bo.phatBieuYDinh), /YC0-AC-3 nhan-hong-de: /);
});

test("YC0-AC-3 đối chứng: bỏ chặn parsePost ra loại → ca «chi-nhan-loai-tin» đỏ (Hỏi-1b)", async () => {
  const bo = await banSao("    if (parsePost(p.text ?? \"\").kind) {", "    if (false) {");
  assert.throws(() => kiemMaTran(bo.phatBieuYDinh), /YC0-AC-3 chi-nhan-loai-tin: /);
});

test("YC0-AC-3 đối chứng: bỏ chặn bài thử → ca «bai-thu» đỏ", async () => {
  const bo = await banSao("if (laChiAnh(p.text) || testMarker(p)) continue;", "if (laChiAnh(p.text)) continue;");
  assert.throws(() => kiemMaTran(bo.phatBieuYDinh), /YC0-AC-3 bai-thu: /);
});

test("YC0-AC-3 chọn nhãn: hợp lệ mới nhất theo (labeled_at, label_id); không Haiku, JSON hỏng, thiếu ý định thì bỏ", () => {
  const p = "x";
  assert.equal(that.chonNhan([]), null);
  assert.equal(that.chonNhan([nhan(p, { id: 1, intent: null, at: "2026-11-20T00:00:00Z" })]), null);
  assert.equal(that.chonNhan([nhan(p, { id: 1, intent: "inquiry", json_ok: false, at: "2026-11-20T00:00:00Z" })]), null);
  const cung = [nhan(p, { id: 5, intent: "offer", at: "2026-11-20T00:00:00Z" }), nhan(p, { id: 7, intent: "inquiry", at: "2026-11-20T00:00:00Z" })];
  assert.equal(that.chonNhan(cung).label_id, 7, "cùng labeled_at thì label_id lớn hơn thắng");
  assert.equal(that.chonNhan(cung.reverse()).label_id, 7);
});

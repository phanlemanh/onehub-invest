// ghep-tin-danh-muc-lat-nhan.test.mjs — PL20: rút mẫu hai nhóm nguồn cho lát hai-khu-ghep-b (AC-9).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { dongBangMau, rutMau } from "./ghep-tin-danh-muc-lat-nhan.mjs";

/** n tin một bài cho mỗi nguồn; chữ khác nhau để không trùng băm. */
function duLieu(soMoiNguon) {
  const tin = [], bai = new Map(), theoTin = new Map(), ketQuaBai = new Map();
  for (const [nguon, n] of Object.entries(soMoiNguon)) for (let i = 0; i < n; i++) {
    const offer_id = `t-${nguon}-${i}`, p = `p-${nguon}-${i}`;
    tin.push({ offer_id, post_ids: [p] });
    bai.set(p, { chu: `bài ${nguon} số ${i}` });
    theoTin.set(offer_id, { status: "gan", nguon, muc: "toa", k: "bld_1", du_an: "1" });
    ketQuaBai.set(p, { nguon, muc: "toa", k: "bld_1", rule_id: "r", offer_id, du_an: "1" });
  }
  return { vao: { tin, bai }, kq: { theoTin, ketQuaBai } };
}
const du = () => duLieu({ A: 200, B: 20, C: 60, F: 90, D: 70, G: 60 });

test("du-110-bai-moi-nhom", () => {
  const { vao, kq } = du();
  const r = rutMau(vao, kq, { seed: "s" });
  for (const n of ["n1", "n2"]) assert.equal(r.mau.filter((x) => x.stratum === n).length, 110, `nhóm ${n}`);
  assert.deepEqual(r.thieu, {});
});
test("nguon-vao-dung-nhom", () => {
  const { vao, kq } = du();
  const nhom = { A: "n1", B: "n1", C: "n2", F: "n2" };
  for (const x of rutMau(vao, kq, { seed: "s" }).mau) assert.equal(x.stratum, nhom[x.nguon], `bài ${x.ref_id}`);
});
test("cung-hat-giong-cung-mau-khac-hat-giong-khac-mau", () => {
  const { vao, kq } = du();
  const a = rutMau(vao, kq, { seed: "s" }).mau.map((x) => x.ref_id);
  assert.deepEqual(rutMau(vao, kq, { seed: "s" }).mau.map((x) => x.ref_id), a);
  assert.notDeepEqual(rutMau(vao, kq, { seed: "khac" }).mau.map((x) => x.ref_id), a);
});
test("moi-tin-mot-bai", () => {
  const { vao, kq } = duLieu({ A: 3 });
  vao.tin[0].post_ids.push("p-them");
  vao.bai.set("p-them", { chu: "bài thứ hai của tin" });
  kq.ketQuaBai.set("p-them", { nguon: "A", muc: "toa", k: "bld_1", rule_id: "r", offer_id: vao.tin[0].offer_id, du_an: "1" });
  const ids = rutMau(vao, kq, { seed: "s", co: 3 }).mau.map((x) => x.offer_id);
  assert.equal(new Set(ids).size, ids.length);
});
test("khong-trung-text-hash-giua-cac-nhom", () => {
  const { vao, kq } = duLieu({ A: 2, C: 2 });
  vao.bai.get("p-C-0").chu = vao.bai.get("p-A-0").chu;
  const r = rutMau(vao, kq, { seed: "s", co: 2 });
  const bam = r.mau.map((x) => x.text_hash);
  assert.equal(new Set(bam).size, bam.length, "trùng text_hash sẽ vi phạm khoá của lát");
});
test("khong-lay-bai-cua-lat-pl35", () => {
  const { vao, kq } = duLieu({ A: 3 });
  const r = rutMau(vao, kq, { seed: "s", co: 3, boBai: new Set(["p-A-1"]) });
  assert.ok(!r.mau.some((x) => x.ref_id === "p-A-1"));
  assert.equal(r.thieu.n1, 1);
});
test("chi-lay-tin-da-gan-va-bai-co-chu", () => {
  const { vao, kq } = duLieu({ A: 3 });
  kq.theoTin.get("t-A-0").status = "xung_dot";
  vao.bai.get("p-A-1").chu = "  ";
  assert.deepEqual(rutMau(vao, kq, { seed: "s", co: 3 }).mau.map((x) => x.ref_id), ["p-A-2"]);
});
test("nhom-thieu-bai-thi-bao-so-thieu", () => {
  const { vao, kq } = duLieu({ A: 5, C: 2 });
  const r = rutMau(vao, kq, { seed: "s", co: 5 });
  assert.deepEqual(r.thieu, { n2: 3 });
});
test("nguon-da-tat-khong-vao-mau", () => {
  const { vao, kq } = duLieu({ A: 2, D: 3, G: 3 });
  assert.ok(rutMau(vao, kq, { seed: "s", co: 2 }).mau.every((x) => x.stratum === "n1"));
});
test("dong-bang-doi-mot-nut-thi-doi-bam", () => {
  const { vao, kq } = duLieu({ A: 3 });
  const m = rutMau(vao, kq, { seed: "s", co: 3 }).mau;
  const a = dongBangMau(m, "s");
  const b = dongBangMau(m.map((x, i) => (i ? x : { ...x, k: "bld_khac" })), "s");
  assert.notEqual(a.sha256, b.sha256);
});

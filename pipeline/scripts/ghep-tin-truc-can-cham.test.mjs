// ghep-tin-truc-can-cham.test.mjs — PL36 AC-10: lệnh chấm trục trên tập giả (đọc tập, so băm, Wilson, bảng bài sai).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { bamDong } from "../label-dong-bang.mjs";
import { NGUONG, chamTap, docTap, vietBaoCao } from "./ghep-tin-truc-can-cham.mjs";

const dong = Array.from({ length: 110 }, (_, i) => ({ ref_id: `p${String(i).padStart(3, "0")}`, toa: "LD2", truc: "3", ma: "LD2XX03" }));
const tap = { lat: "hai-khu-truc", seed: "s", sha256: bamDong(dong), so_bai: dong.length, dong };
const nhanDung = new Map(dong.map((d) => [d.ref_id, { building: "ld2", stack: "03" }]));

test("tap-dung-het-dat-nguong", () => {
  const r = chamTap(docTap(JSON.stringify(tap), tap.sha256).dong, nhanDung);
  assert.equal(r.dung, 110); assert.ok(r.wilson_thap >= NGUONG, `Wilson ${r.wilson_thap}`); assert.equal(r.dat, true);
});
test("ba-bai-sai-hut-nguong-va-bang-bai-sai-du-cot", () => {
  const nhan = new Map(nhanDung);
  nhan.set("p000", { building: "ld2", stack: "11" }); nhan.set("p001", { building: "ld3", stack: "03" }); nhan.set("p002", { building: "ld2", stack: null });
  const r = chamTap(dong, nhan);
  assert.equal(r.dat, false); assert.equal(r.sai.length, 3);
  const md = vietBaoCao(r, tap);
  assert.match(md, /\| p002 \| LD2XX03 \| LD2 \| 3 \| không nêu \| ld2 \|/, "bảng bài sai phải có mã căn, toà, trục máy, trục người");
});
test("doi-mot-nhan-trong-tap-thi-bam-lech-goi-ten-tap", () => {
  const hong = { ...tap, dong: tap.dong.map((d, i) => (i === 5 ? { ...d, truc: "11" } : d)) };
  assert.throws(() => docTap(JSON.stringify(hong), tap.sha256), /tập hai-khu-truc-s lệch băm/);
});
test("thieu-nhan-nguoi-thi-chua-dat", () => {
  const nhan = new Map(nhanDung); nhan.delete("p109");
  const r = chamTap(dong, nhan);
  assert.equal(r.dat, false); assert.deepEqual(r.chua_nhan, ["p109"]);
});

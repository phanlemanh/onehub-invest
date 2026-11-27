// ghep-tin-truc-can-cham.test.mjs — PL36 AC-10: lệnh chấm trục trên tập giả (đọc tập, so băm, Wilson, bảng bài sai).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { bamDong } from "../label-dong-bang.mjs";
import { NGUONG, chamTap, docTap, tachTheCai, vietBaoCao } from "./ghep-tin-truc-can-cham.mjs";

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

test("the-cai-loai-khoi-phep-tinh-va-dem-nguoi-duyet-sua-dung", () => {
  const theCai = { the: [{ ref_id: "p000", dung: { building: "LD2", stack: "03" } }, { ref_id: "p001", dung: { building: "LD2", stack: "03" } }] };
  const nhan = new Map(nhanDung); nhan.set("p001", { building: "ld2", stack: "11" }); // người duyệt để lọt thẻ p001
  const t = tachTheCai(dong, nhan, theCai);
  assert.equal(t.dong.length, 108, "hai thẻ cài phải bị loại khỏi tập chấm luật");
  assert.deepEqual(t.the_cai, { so: 2, da_duyet: 2, sua_dung: 1 });
  const r = { ...chamTap(t.dong, nhan), the_cai: t.the_cai };
  assert.equal(r.dat, true, "thẻ cài người duyệt để lọt không được tính là máy gắn sai");
  assert.match(vietBaoCao(r, tap), /Thẻ cài lỗi loại khỏi phép tính: 2 · nhãn đã lưu của thẻ cài đúng giá trị 1\/2/);
});

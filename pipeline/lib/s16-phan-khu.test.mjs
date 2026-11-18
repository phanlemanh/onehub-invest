// s16-phan-khu.test.mjs — DA37 AC-3 (phần thuần): ma trận bốn ô viết trước của kế hoạch thẻ luật phân khu S16, và băm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { bamKeHoach, dungThe, keHoachPhanKhu, khoaKhu } from "./s16-phan-khu.mjs";

const P = 10;
const NUT = [
  { id: 1, parent_id: P, name: "The Beverly", s16_khu_ids: [] },
  { id: 2, parent_id: P, name: "Sao Biển", s16_khu_ids: [] },
  { id: 3, parent_id: P, name: "sao bien", s16_khu_ids: [] },
  { id: 4, parent_id: P, name: "Hải Âu", s16_khu_ids: [khoaKhu("qp", "K4")] },
  { id: 5, parent_id: 99, name: "The Rainbow", s16_khu_ids: [] },
];
const KHU = [
  { du_an: "qp", khu_id: "K1", khu_ten: "THE BEVERLY", so_toa: 3, du_an_node_id: P },  // ô san: trùng một nút (chuẩn hoá)
  { du_an: "qp", khu_id: "K2", khu_ten: "Sao Biển", so_toa: 2, du_an_node_id: P },     // ô mo-ho: trùng hai nút
  { du_an: "qp", khu_id: "K3", khu_ten: "The Rainbow", so_toa: 1, du_an_node_id: P },  // ô moi: nút trùng tên ở dự án khác
  { du_an: "qp", khu_id: "K4", khu_ten: "Hải Âu", so_toa: 5, du_an_node_id: P },       // ô da-co: nút đã mang khu này
  { du_an: "qp", khu_id: "K5", khu_ten: null, so_toa: 1, du_an_node_id: P },           // ô không tên: không đúc (tên nút đi cloud)
];
const MONG = { K1: ["san", 1], K2: ["mo-ho", null], K3: ["moi", null], K4: ["da-co", 4], K5: ["mo-ho", null] };

test("DA37-AC-3 ma trận năm ô: san · mơ hồ · mới · đã gán · không tên", () => {
  const { dong } = keHoachPhanKhu(KHU, NUT);
  assert.equal(dong.length, 5);
  for (const d of dong) assert.deepEqual([d.nut, d.node_id], MONG[d.khu_id], `DA37-AC-3 ô ${d.khu_id}`);
});

test("DA37-AC-3 băm đổi khi một dòng đổi, không đổi khi thứ tự đầu vào đổi", () => {
  const a = keHoachPhanKhu(KHU, NUT).bam;
  assert.equal(keHoachPhanKhu([...KHU].reverse(), NUT).bam, a, "DA37-AC-3 băm phụ thuộc thứ tự đầu vào");
  const doi = KHU.map((k) => (k.khu_id === "K1" ? { ...k, so_toa: 4 } : k));
  assert.notEqual(keHoachPhanKhu(doi, NUT).bam, a, "DA37-AC-3 băm không đổi khi số toà đổi");
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.equal(bamKeHoach(keHoachPhanKhu(KHU, NUT).dong), a);
});

test("DA37-AC-3 thẻ không in khu_id; dòng cuối là băm", () => {
  const { dong, bam } = keHoachPhanKhu(KHU, NUT);
  const md = dungThe(dong, bam, new Map(NUT.map((n) => [n.id, n.name])));
  for (const k of ["K1", "K2", "K3", "K4", "K5"]) assert.ok(!new RegExp(`\\b${k}\\b`).test(md), `DA37-AC-3 thẻ in khu_id ${k}`);
  assert.ok(md.trimEnd().endsWith(`băm: ${bam}`), "DA37-AC-3 dòng cuối không phải băm");
  // đối chứng dương: chuỗi cấy khu_id thì phép tìm bắt được
  assert.ok(/\bK1\b/.test(`${md}| K1 |`), "DA37-AC-3 đối chứng: phép tìm không bắt được khu_id cấy");
});

test("DA37 khoá khu là băm 16 hex, không chứa mã khu thô; khác dự án hay khác khu thì khác băm", () => {
  const k = khoaKhu("q37-qp2", "KHUDAI0001");
  assert.match(k, /^[0-9a-f]{16}$/);
  assert.ok(!k.includes("KHUDAI0001") && !k.includes("q37-qp2"), "khoá khu mang mã thô");
  assert.notEqual(khoaKhu("q37-qp2", "KHUDAI0002"), k);
  assert.notEqual(khoaKhu("q37-qp3", "KHUDAI0001"), k);
});

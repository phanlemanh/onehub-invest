// Thước của thước E5 (HT26 AC-5): phanXet xanh trên một lượt đúng khuôn 25/11, đỏ nêu lý do ở mọi đột biến.
import assert from "node:assert/strict";
import { test } from "node:test";
import { docKho, docChiMayThu, dotBienKhongDo, laLoopback, phanXet, socketNgoai } from "../lib/sync-cloud-kho-xet.mjs";

const KHO = [
  "  WARN che tên nguồn 504 ô: areas.meta 501, area_sources.meta 3",
  "  areas: 3355",
  "  che area_sources.meta: 3",
  "  che areas.meta: 501",
  "kho che: 504 ô ở 2 bảng.cột",
  "kho bộ chặn: 0 (mọi bảng, sau che)",
  "kho đếm thô độc lập trên payload đã che: 0",
  "kho xong: 3398 dòng, 2 bảng; catalog 0.0s · gate-pre 0.0s · read 514.3s · che 30.7s · scan 46.2s; pha đọc+che+soát 591.3s; tới hết soát 591.3s",
].join("\n");
const CHI = ["bảng.cột · ô máy thu · thô máy thu", "area_sources.meta · 3 · 3", "areas.meta · 501 · 501", "tổng · 504 · 504"].join("\n");
const xanh = () => ({
  kho: { exit: 0, text: KHO, sockets: ["127.0.0.1:49192->127.0.0.1:5433"] },
  chiMayThu: { exit: 0, text: CHI, sockets: ["127.0.0.1:49200->127.0.0.1:5433"] },
  khongKho: { exit: 1, text: "sync bắt đầu x\nSYNC FAIL [catalog] x: fetch failed", sockets: ["127.0.0.1:49300->127.0.0.1:1"] },
  cu: { pha: 560, dung: "scan" },
  cayDo: { exit: 1, text: "KHO FAIL [scan] x: tên nguồn ở areas.meta" },
});

test("KX-1: đọc chữ in của lượt khô và lệnh đo máy thu", () => {
  const k = docKho(KHO);
  assert.equal(k.xong, true);
  assert.equal(k.tho, 0);
  assert.deepEqual([...k.che], [["area_sources.meta", 3], ["areas.meta", 501]]);
  assert.deepEqual(k.pha, { catalog: 0, "gate-pre": 0, read: 514.3, che: 30.7, scan: 46.2 });
  const c = docChiMayThu(CHI);
  assert.deepEqual(c.tong, { o: 504, tho: 504 });
  assert.equal(c.o.get("areas.meta").o, 501);
});

test("KX-2: lượt đúng khuôn thì xanh", () => {
  assert.deepEqual(phanXet(xanh()), []);
});

test("KX-3: mọi đột biến của thước đều làm đỏ", () => {
  assert.deepEqual(dotBienKhongDo(xanh()), []);
});

test("KX-4: từng chiều đỏ nêu đúng lý do", () => {
  const ca = [
    ["ô bẩn", (v) => (v.kho.text = v.kho.text.replace("đã che: 0", "đã che: 1")), /đếm thô độc lập .* = 1/],
    ["che lệch", (v) => (v.chiMayThu.text = v.chiMayThu.text.replace("areas.meta · 501", "areas.meta · 500")), /areas\.meta: lượt khô 501 ≠ máy thu 500/],
    ["vượt 1,5 lần", (v) => (v.cu.pha = 300), /> 1\.5 × mã cũ/],
    ["thêm quá 2 phút", (v) => (v.cu.pha = 470), /phần mã mới thêm 121\.2s > 120s/],
    ["socket ra ngoài", (v) => v.kho.sockets.push("10.0.0.2:5000->104.18.1.1:443"), /lượt khô: socket ra ngoài máy: 10\.0\.0\.2/],
    ["lsof mù", (v) => (v.kho.sockets = []), /thước socket mù/],
    ["không --kho qua catalog", (v) => (v.khongKho = { exit: 0, text: "sync xong", sockets: [] }), /vẫn thoát 0/],
    ["cấy ô bẩn thoát 0", (v) => (v.cayDo.exit = 0), /bộ chặn không bắt/],
    ["bộ chặn dừng", (v) => Object.assign(v.kho, { exit: 1, text: "KHO FAIL [scan] x" }), /KHO FAIL \[scan\]/],
  ];
  for (const [ten, fn, re] of ca) {
    const v = xanh();
    fn(v);
    const ly = phanXet(v);
    assert.ok(ly.some((l) => re.test(l)), `${ten}: ${JSON.stringify(ly)}`);
  }
});

test("KX-5: loopback và socket ngoài", () => {
  assert.ok(laLoopback("127.0.0.1:5433") && laLoopback("[::1]:5433"));
  assert.ok(!laLoopback("104.18.1.1:443"));
  assert.deepEqual(socketNgoai(["127.0.0.1:1->127.0.0.1:5433", "127.0.0.1:2->1.2.3.4:443", "*:5000 (LISTEN)"]), ["127.0.0.1:2->1.2.3.4:443", "*:5000 (LISTEN)"]);
});

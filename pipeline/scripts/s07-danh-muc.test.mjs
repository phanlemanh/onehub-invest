import test from "node:test"; import assert from "node:assert/strict";
import {
  LOAI_HINH_S07, boMien, bocDuAn, bocSitemap, bocTheDanhSach, chu, laPhienKhach, mienCua, soNguyenVn, tachDuongDan, trongDiv,
} from "../lib/s07-danh-muc.mjs";
import { BANG_S07, SCHEMA_S07, dongCuaSnapshot, kiemKhongMien, laSnapshotS07 } from "../import-s07-danh-muc.mjs";
import { ANH, MIEN, W, itemDanhSach, itemDuAn, itemSitemap, theChinh } from "./s07-fixture.mjs";

// Hàm bóc thuần của bộ nạp S07 (hàng thu-danh-muc-s07, E2 E3 E4 E6 E8). Không DB. Đúng CHÍN ca — lệnh kiểm đòi «pass 9».
// HTML là giả (s07-fixture.mjs), miền thử `.test`.

test("S07-AC-2 thẻ chính: mỗi thẻ một dòng đủ trường, khối «nổi bật» không tính", () => {
  const it = itemDanhSach(30, [theChinh({ id: 6658 }), theChinh({ id: 6653, duong: `${W}/du-an-shophouse-tan-uyen_1-bd/hai-pj6653`, ten: "Dự án Hai", cauHinh: false, cdt: false })]);
  assert.match(it.payload.listHtml, /noi-bat-pj9001/, "đối chứng dương: thẻ nổi bật CÓ trong HTML");
  const r = bocTheDanhSach(it);
  assert.equal(r.the.length, 2, "thẻ nổi bật pj9001 không vào");
  assert.equal(r.khongMa, 0);
  const a = r.the[0];
  assert.deepEqual([a.pj_id, a.list_page, a.list_position, a.path], [6658, 30, 1, "/du-an-can-ho-chung-cu-quan-a/du-an-mot-pj6658"]);
  assert.deepEqual([a.project_type_slug, a.area_slug, a.project_name, a.development_status_raw], ["can-ho-chung-cu", "quan-a", "Dự án Một", "Đang mở bán"]);
  assert.equal(a.unparsed_address, "Đường Số Một, Phường A & B, Hà Nội", "thực thể HTML được giải");
  assert.deepEqual([a.land_area_raw, a.number_of_units_total, a.number_of_buildings_total], ["11,93 ha", 1314, 2]);
  assert.equal(a.builder_name_raw, "Công ty Thử Nghiệm");
  assert.equal(a.summary_raw, "Dự án Một là dự án thử, xem thêm tại S07.");
  assert.deepEqual(a.image_paths, ["s07://tep9/crop/240x180/2026/01/02/a-1_wm.jpg", "s07://tep9/crop/240x180/2026/01/02/a-2_wm.jpg"]);
  const b = r.the[1];
  assert.deepEqual([b.pj_id, b.list_position, b.path, b.area_slug], [6653, 2, "/du-an-shophouse-tan-uyen_1-bd/hai-pj6653", "tan-uyen_1-bd"]);
  assert.deepEqual([b.land_area_raw, b.number_of_units_total, b.number_of_buildings_total, b.builder_name_raw], [null, null, null, null]);
  for (const d of r.the) assert.ok(!JSON.stringify(d).toLowerCase().includes(MIEN), "dòng thẻ không còn tên miền nguồn");
});

test("S07-AC-2 should-NOT-fire: thẻ không trỏ tới trang dự án bị bỏ có đếm; trang rỗng ra 0 thẻ", () => {
  const r = bocTheDanhSach(itemDanhSach(2, [theChinh({ id: 1, duong: "/ban-can-ho/tin-rao-pr55" })]));
  assert.deepEqual([r.the.length, r.khongMa], [0, 1]);
  assert.deepEqual(bocTheDanhSach(itemDanhSach(3, [])), { the: [], khongMa: 0 });
});

test("S07-AC-3 trang dự án: mỗi trường một khẳng định, mô tả trọn khối, link ứng viên", () => {
  const d = bocDuAn(itemDuAn(2766));
  assert.deepEqual([d.pj_id, d.project_type_slug, d.area_slug, d.final_path], [2766, "khu-do-thi-moi", "quan-a", null]);
  assert.equal(d.project_name, "Khu đô thị Thử & Nghiệm");
  assert.equal(d.unparsed_address, "Đường Số Hai, Xã Thử, Hà Nội.");
  assert.deepEqual([d.latitude, d.longitude], [21.0024, 105.9641]);
  assert.deepEqual([d.development_status_raw, d.status_note_raw], ["Đang cập nhật", "Khởi công ngày 16/9/2026"]);
  assert.deepEqual(d.attributes, [
    { label: "Giá", value: "10,5 - 33 triệu/m²" }, { label: "Diện tích", value: "420 ha" }, { label: "Số căn hộ", value: "1.155 căn" },
    { label: "Số tòa", value: "66 tòa" }, { label: "Chủ đầu tư", value: "Công ty Thử" }, { label: "Pháp lý", value: "Sở hữu lâu dài" },
    { label: "Quy mô", value: "2.300 căn, 66 tòa" },
  ], "mảng cặp giữ đúng thứ tự bảy nhãn của nguồn, hộp trước bảng");
  assert.deepEqual([d.land_area_raw, d.number_of_units_raw, d.number_of_buildings_total_raw], ["420 ha", "1.155 căn", "66 tòa"]);
  assert.deepEqual([d.builder_name_raw, d.builder_ref, d.builder_path], ["Công ty Thử", 1876, "/dau-tu-du-an/cong-ty-thu-ep1876"]);
  assert.deepEqual([d.legal_raw, d.scale_raw, d.price_range_raw], ["Sở hữu lâu dài", "2.300 căn, 66 tòa", "10,5 - 33 triệu/m²"]);
  assert.deepEqual(d.amenities, ["Bãi đỗ xe", "Hồ bơi"]);
  assert.match(d.description_html, /Toà T1, T2<\/div><\/div><figure>/, "khối mô tả lấy trọn cả div lồng bên trong");
  assert.doesNotMatch(d.description_html, /re__project-box-info/, "không ăn sang khối sau");
  assert.deepEqual(d.desc_link_pj_ids, [7001, 7002], "link dự án trong mô tả, bỏ link trỏ về chính nó");
  assert.deepEqual(d.related_pj_ids, [8001]);
  assert.deepEqual(d.child_pj_ids, []);
  assert.deepEqual(d.breadcrumb, [{ position: 1, name: "Trang chủ", path: "/" }, { position: 2, name: "Hà Nội", path: "/du-an-khu-do-thi-moi-ha-noi" }]);
  assert.deepEqual(d.faq, [{ q: "Giá bán?", a: "Xem tại S07" }], "JSON-LD hỏng bị bỏ qua, khối còn lại vẫn đọc");
  assert.deepEqual(d.image_paths, ["s07://tep9/2026/01/02/lon-1_wm.jpg", "s07://tep9/2026/01/02/lon-2_wm.jpg"]);
  assert.equal(d.og_image_path, "s07://tep9/2026/01/02/lon-1_wm.jpg");
  assert.ok(!JSON.stringify(d).toLowerCase().includes(MIEN), "không còn tên miền nguồn ở bất kỳ trường nào");
});

test("S07-AC-3 should-NOT-fire: toạ độ 0,0 → NULL; meta.loaiHinh sai không được tin; item rỗng → null", () => {
  const d = bocDuAn(itemDuAn(5, { lat: "0", lng: "0" }));
  assert.deepEqual([d.latitude, d.longitude], [null, null]);
  assert.equal(d.project_type_slug, "khu-do-thi-moi", "suy từ meta.path, không đọc meta.loaiHinh («khu»)");
  const con = bocDuAn(itemDuAn(6, {}, { children: ["/du-an-can-ho-chung-cu-quan-a/con-pj61", "/du-an-khu-do-thi-moi-quan-a/khu-do-thi-thu-pj6"], finalPath: "/du-an-khu-do-thi-moi-quan-b/doi-pj6" }));
  assert.deepEqual(con.child_pj_ids, [61], "bỏ chính nó khỏi danh sách con");
  assert.equal(con.final_path, "/du-an-khu-do-thi-moi-quan-b/doi-pj6", "bị chuyển hướng thì ghi đường dẫn cuối");
  const it = itemDuAn(7); it.payload.mainHtml = null;
  assert.equal(bocDuAn(it), null);
  assert.equal(bocDuAn({ ...itemDuAn(8), meta: { path: "/khong-phai-du-an" } }), null);
});

test("S07-AC-3 đường dẫn: mã, loại hình khớp tên dài nhất, khu vực có gạch dưới; trang lọc không phải dự án", () => {
  assert.deepEqual(tachDuongDan("/du-an-can-ho-chung-cu-gia-lam/abc-pj2766"), { pjId: 2766, projectTypeSlug: "can-ho-chung-cu", areaSlug: "gia-lam" });
  assert.deepEqual(tachDuongDan("/du-an-khu-nghi-duong-sinh-thai-da-lat-ldd/x-pj1"), { pjId: 1, projectTypeSlug: "khu-nghi-duong-sinh-thai", areaSlug: "da-lat-ldd" });
  assert.deepEqual(tachDuongDan("/du-an-shophouse-tan-uyen_1-bd/x-pj6592"), { pjId: 6592, projectTypeSlug: "shophouse", areaSlug: "tan-uyen_1-bd" });
  assert.deepEqual(tachDuongDan("/du-an-khac/x-pj5"), { pjId: 5, projectTypeSlug: "khac", areaSlug: null });
  assert.equal(tachDuongDan("/du-an-loai-la-quan-a/x-pj9").projectTypeSlug, null, "loại hình lạ → null, vẫn giữ mã");
  assert.equal(tachDuongDan("/du-an-nha-o-xa-hoi/gia-duoi-5-trieu-m2"), null);
  assert.equal(tachDuongDan("/ban-can-ho/x-pr123"), null);
  assert.equal(LOAI_HINH_S07.length, 12);
  assert.equal(soNguyenVn("1.155 căn"), 1155);
  assert.equal(soNguyenVn("11,93 ha"), null, "số có phần lẻ không thành số nguyên");
  assert.equal(chu(" <b>A</b>&nbsp;&amp;&#32;B "), "A & B");
  assert.equal(trongDiv(`<div a><div>x</div>y</div>z`, 0), "<div>x</div>y");
});

test("S07-AC-4 sitemap: chỉ đường dẫn dự án, bỏ trang lọc, khử trùng mã", () => {
  const it = itemSitemap();
  assert.equal((it.payload.xml.match(/<loc>/g) || []).length, 5, "đối chứng dương: năm <loc> trong tệp");
  const r = bocSitemap(it);
  assert.deepEqual(r.duAn, [
    { pj_id: 101, path: "/du-an-nha-o-xa-hoi-quan-a/noxh-mot-pj101", project_type_slug: "nha-o-xa-hoi", area_slug: "quan-a" },
    { pj_id: 102, path: "/du-an-nha-o-xa-hoi-thi-xa_1-tx/noxh-hai-pj102", project_type_slug: "nha-o-xa-hoi", area_slug: "thi-xa_1-tx" },
  ]);
  assert.deepEqual([r.khac, r.lap], [2, 1], "hai trang không phải dự án, một đường dẫn dự án lặp");
});

test("S07-AC-6 tên miền: suy từ canonical hoặc link; bỏ khỏi link trang, link ảnh, chữ trần", () => {
  assert.equal(mienCua(itemDuAn(1)), MIEN);
  assert.equal(mienCua(itemDanhSach(1, [theChinh({ id: 1 })])), MIEN, "trang danh sách không có canonical — suy từ hậu tố chung của host");
  assert.equal(mienCua({ payload: { listHtml: `<img src="https://x.a.com.vn/1"><img src="https://y.a.com.vn/2"><img src="https://z.b.com.vn/3">` } }), "a.com.vn", "đuôi công cộng com.vn không được chọn");
  assert.equal(mienCua({ payload: { listHtml: `<img src="https://tep9.abc.vn/1"><img src="https://tep9.abc.vn/2">` } }), "abc.vn", "trang chỉ dùng một máy con vẫn ra tên miền gốc");
  assert.equal(mienCua({ payload: { listHtml: "<p>không link</p>" } }), null);
  assert.equal(boMien(`${W}/du-an/x-pj1`, MIEN), "/du-an/x-pj1");
  assert.equal(boMien(`https://www.${MIEN}/a`, MIEN), "/a");
  assert.equal(boMien(`${ANH}/crop/1.jpg`, MIEN), "s07://tep9/crop/1.jpg");
  assert.equal(boMien(`<a href="${W}/a">Theo ${MIEN.toUpperCase()}</a>`, MIEN), `<a href="/a">Theo S07</a>`);
  assert.equal(boMien("https://www.youtube.com/watch?v=1", MIEN), "https://www.youtube.com/watch?v=1", "link ngoài nguồn giữ nguyên");
  assert.equal(boMien(null, MIEN), null);
});

test("S07-AC-6 rào còn sót: soát theo MỌI miền suy được; còn tên miền thì ném, gọi tên bảng", () => {
  const items = [itemDanhSach(1, [theChinh({ id: 11 })]), itemDuAn(21)];
  const lanh = dongCuaSnapshot(items);
  assert.doesNotThrow(() => kiemKhongMien(lanh), "đối chứng dương: cùng fixture, bóc đúng miền thì không ném");
  lanh.duAn[0].scale_raw = `xem ${MIEN}`;
  assert.throws(() => kiemKhongMien(lanh), /còn tên miền nguồn trong dòng stg_s07_project pj_id=21/);
  // cấu hình miền SAI: bóc bằng miền sai nên miền thật còn nguyên — tập soát vẫn có miền thật (từ canonical) → ném
  const sai = dongCuaSnapshot(items, "mien-khac.test");
  assert.ok(sai.mien.has("mien-khac.test") && sai.mien.has(MIEN), "tập soát gồm cả miền cấu hình lẫn miền suy từ canonical");
  assert.throws(() => kiemKhongMien(sai), /còn tên miền nguồn/);
  assert.equal(BANG_S07.duAn, "stg_s07_project");
});

test("S07-AC-7 phiên khách và bộ đếm: cờ true hoặc thiếu cờ không nạp, phần bỏ đếm theo sáu lý do", () => {
  assert.equal(laPhienKhach(itemDuAn(1)), true);
  assert.equal(laPhienKhach(itemDuAn(1, {}, { sessionLoggedIn: true })), false);
  assert.equal(laPhienKhach({ kind: "project_catalog", meta: {} }), false, "trang dự án THIẾU cờ → không nạp (Hỏi-1)");
  assert.equal(laPhienKhach({ kind: "project_list_page", meta: {} }), false, "trang danh sách THIẾU cờ → không nạp (Hỏi-1)");
  assert.equal(laPhienKhach(itemSitemap()), true, "sitemap lượt đầu không ghi cờ vẫn nhận");
  assert.equal(laPhienKhach(itemSitemap({ sessionLoggedIn: true })), false);
  // snapshot một: bảy item
  const mot = [
    itemDanhSach(1, [theChinh({ id: 11 }), theChinh({ id: 12 })]),
    itemDanhSach(2, [theChinh({ id: 12 }), theChinh({ id: 13 })]), // 12 lùi sang trang 2 trong lúc thu
    itemDuAn(21), itemDuAn(22, {}, { sessionLoggedIn: true }), itemSitemap(),
    { source: "nguon-khac", kind: "x" }, { source: "s07-danh-muc", kind: "kind-la", meta: { sessionLoggedIn: false }, payload: {} },
  ];
  const a = dongCuaSnapshot(mot);
  assert.deepEqual(a.the.map((d) => d.pj_id), [11, 12, 13], "dự án lặp giữa hai trang chỉ một dòng");
  assert.deepEqual(a.duAn.map((d) => d.pj_id), [21]);
  assert.equal(a.sitemap.length, 2);
  assert.deepEqual(a.bo, { dang_nhap: 1, lap: 2, trang_rong: 0, the_khong_du_an: 0, kind_la: 1, nguon_khac: 1 }, "lặp: thẻ của dự án 12 và một đường dẫn sitemap");
  assert.equal(a.the[0].captured_at, "2026-11-11T02:00:00.000Z", "captured_at = fetchedAt của item");
  // snapshot hai: thêm trang dự án thiếu cờ, trang dự án rỗng, thẻ trỏ tin rao → ba con số tăng đúng 1, không dòng nào thêm
  const thieuCo = itemDuAn(23); delete thieuCo.meta.sessionLoggedIn;
  const rong = itemDuAn(24); rong.payload.mainHtml = null;
  const b = dongCuaSnapshot([...mot, thieuCo, rong, itemDanhSach(3, [theChinh({ id: 1, duong: "/ban-can-ho/tin-rao-pr55" })])]);
  assert.deepEqual(b.bo, { dang_nhap: 2, lap: 2, trang_rong: 1, the_khong_du_an: 1, kind_la: 1, nguon_khac: 1 });
  assert.deepEqual([b.the.length, b.duAn.length, b.sitemap.length], [3, 1, 2], "không dòng nào sinh thêm");
  assert.equal(laSnapshotS07("vn__s07-danh-muc__2026-11-11T002019630"), true);
  assert.equal(laSnapshotS07("vn__s07-danh-muc__TEST"), false);
  assert.equal(laSnapshotS07("vn__s08-danh-muc__2026-11-11T002019630"), false);
  assert.ok(SCHEMA_S07.includes(4) && SCHEMA_S07.includes(9) && !SCHEMA_S07.includes(10));
});

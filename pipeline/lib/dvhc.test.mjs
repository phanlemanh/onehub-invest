// dvhc.test.mjs — PX1 danh-ba-phuong-xa-toan-quoc: hàm thuần của lib/dvhc.mjs (E3 ma trận tên, E4 bộ tra, E7 ca thuần,
// E8 bí danh, E9 hàm so sánh). Không DB. Ma trận bộ tra rút từ chính pipeline/data/dvhc (không viết tay khuôn).
import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  chuanTen, docDanhBa, dungBiDanhAnToan, khopXa, matchXaCuCoTienTo, MA_TINH_THI_TRUONG, soSanhTruocSau,
  thiTruongCuaTinh, traXaCu, idXa, slugTrungTrongTinh,
} from "./dvhc.mjs";

const DB = docDanhBa();

test("PX1-AC-3 chuanTen: ma trận viết trước", () => {
  const MT = [
    ["Phường Ba Đình", "ba đình"],
    ["Xã Bát Tràng", "bát tràng"],
    ["Thị trấn Đông Anh", "đông anh"],
    ["Đặc khu Hoàng Sa", "hoàng sa"],
    ["Cẩm Giàng (03626)", "cẩm giàng"],
    ["Thạnh An (73308)", "thạnh an"],
    ["Quận Thanh Xuân", "quận thanh xuân"],
    ["Huyện Gia Lâm", "huyện gia lâm"],
    ["Thị xã Sơn Tây", "thị xã sơn tây"],
    ["  Phường   Phúc  Xá ", "phúc xá"],
    ["Ba Đình".normalize("NFD"), "ba đình"],
  ];
  for (const [vao, ra] of MT) assert.equal(chuanTen(vao), ra, `chuanTen(${vao})`);
  assert.notEqual(chuanTen("Cẩm Giang"), chuanTen("Cẩm Giàng"));
});

test("PX1-AC-3 khopXa: ưu tiên phường OSM, khu tên quận cũ không nhận mã, hai cùng hạng thì mơ hồ", () => {
  const con = [
    { id: "vn-hanoi-thanh-xuan", name: "Thanh Xuân", source: "osm-phuong" },
    { id: "vn-hanoi-quan-thanh-xuan", name: "Quận Thanh Xuân", source: "airbnb-discovery" },
    { id: "vn-hanoi-xuan-la", name: "Xuân La", source: "airbnb-discovery" },
    { id: "vn-hai-phong-cam-giang-03626", name: "Cẩm Giàng (03626)", source: "osm-phuong" },
    { id: "vn-hai-phong-cam-giang", name: "Cẩm Giang", source: "osm-phuong" },
  ];
  assert.deepEqual(khopXa({ ten: "Thanh Xuân" }, con), { id: "vn-hanoi-thanh-xuan" });
  assert.deepEqual(khopXa({ ten: "Cẩm Giàng" }, con), { id: "vn-hai-phong-cam-giang-03626" });
  assert.deepEqual(khopXa({ ten: "Cẩm Giang" }, con), { id: "vn-hai-phong-cam-giang" });
  assert.equal(khopXa({ ten: "Hoàn Kiếm" }, con), null);
  // khu khác (không OSM) khớp đúng một thì nhận
  assert.deepEqual(khopXa({ ten: "Xuân La" }, con), { id: "vn-hanoi-xuan-la" });
  const hai = [...con, { id: "vn-hanoi-thanh-xuan-2", name: "Phường Thanh Xuân", source: "osm-phuong" }];
  assert.equal(khopXa({ ten: "Thanh Xuân" }, hai).loi, "hai");
});

test("PX1-AC-3 idXa: slug chung trong tỉnh hoặc id đã có thì thêm mã", () => {
  const xaHp = DB.xa.filter((x) => x.maTinh === "31");
  const trung = slugTrungTrongTinh(xaHp);
  const cg = xaHp.filter((x) => x.ten === "Cẩm Giang" || x.ten === "Cẩm Giàng");
  assert.equal(cg.length, 2);
  for (const x of cg) assert.equal(idXa(x, "vn-hai-phong", trung, new Set()), `vn-hai-phong-cam-giang-${x.ma}`);
  const x0 = DB.xa.find((x) => x.maTinh === "40");
  assert.equal(idXa(x0, "vn-nghe-an", new Set(), new Set()), `vn-nghe-an-${x0.ten.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`);
  assert.equal(idXa(x0, "vn-nghe-an", new Set(), new Set([idXa(x0, "vn-nghe-an", new Set(), new Set())])).endsWith(`-${x0.ma}`), true);
});

test("PX1-AC-2 bảng tỉnh: 34 mã, phủ mọi maTinh của danh bạ, tên khớp tinh.json", () => {
  assert.equal(Object.keys(MA_TINH_THI_TRUONG).length, 34);
  assert.equal(DB.tinh.length, 34);
  for (const t of DB.tinh) assert.ok(thiTruongCuaTinh(t.ma), `thiếu mã tỉnh ${t.ma}`);
  for (const x of DB.xa) assert.ok(thiTruongCuaTinh(x.maTinh), `xã ${x.ma} trỏ tỉnh không có`);
  assert.equal(thiTruongCuaTinh("46"), "vn-hue");
  assert.equal(thiTruongCuaTinh("79"), "vn-hcmc");
  assert.equal(DB.xa.length, 3321);
  assert.equal(DB.xaCu.length, 10033);
});

/** Kiểm một bộ tra trên ma trận toàn phần theo khoá (tỉnh mới, tên chuẩn) rút từ xa-cu.json. */
function kiemBoTra(fn) {
  const nhom = new Map();
  for (const r of DB.xaCu) {
    const k = `${r.maTinh}|${chuanTen(r.ten)}`;
    if (!nhom.has(k)) nhom.set(k, { maTinh: r.maTinh, ten: r.ten, dich: new Set() });
    for (const v of r.vao) nhom.get(k).dich.add(v);
  }
  const loi = [];
  let soAssert = 0;
  for (const g of nhom.values()) {
    soAssert++;
    const kq = fn(DB.xaCu, g.maTinh, g.ten);
    const dich = [...g.dich].sort();
    if (dich.length === 1) {
      if (!kq || kq.xa !== dich[0]) loi.push(`PX1-AC-4 sai xã cho ${g.maTinh}/${g.ten}`);
    } else if (!kq || kq.xa || JSON.stringify(kq.canChon) !== JSON.stringify(dich)) {
      loi.push(`PX1-AC-4 đoán xã cho tên cũ nhiều đích: ${g.maTinh}/${g.ten}`);
    }
  }
  return { loi, soAssert, soKhoa: nhom.size };
}

test("PX1-AC-4 bộ tra theo khoá: một đích → xã, nhiều đích → cần chọn, không bao giờ đoán", () => {
  const r = kiemBoTra(traXaCu);
  assert.equal(r.soAssert, r.soKhoa);
  assert.deepEqual(r.loi, []);
  assert.equal(DB.xaCu.filter((x) => x.vao.length > 1).length, 441);
  // Chiều đỏ: bản sao bộ tra trả đích đầu tiên
  const hong = (xaCu, maTinh, ten) => {
    const t = traXaCu(xaCu, maTinh, ten);
    return t?.canChon ? { xa: t.canChon[0] } : t;
  };
  const d = kiemBoTra(hong);
  assert.ok(d.loi.some((m) => m.startsWith("PX1-AC-4 đoán xã cho tên cũ nhiều đích: ")), "bản hỏng phải đỏ");
});

// Danh sách xã hiện hành dạng đầu ra của bộ đọc DB (id giả theo mã, market theo bảng tỉnh)
const xaHienHanh = (xa) => xa.map((x) => ({ ma: x.ma, id: `${thiTruongCuaTinh(x.maTinh)}-x${x.ma}`, name: x.ten, market: thiTruongCuaTinh(x.maTinh) }));

test("PX1-AC-8 bí danh: ma trận bốn lớp × hai đường", () => {
  const xa = [
    { ma: "90001", maTinh: "40", ten: "An Mới", loai: "Xã" },
    { ma: "90002", maTinh: "40", ten: "Bình Mới", loai: "Xã" },
    { ma: "90003", maTinh: "40", ten: "Cũ Trùng", loai: "Xã" }, // tên hiện hành trùng tên một xã cũ
  ];
  const xaCu = [
    { ma: "80001", maTinh: "40", ten: "Trọn Vẹn", vao: ["90001"] },            // trọn
    { ma: "80002", maTinh: "40", ten: "Bị Tách", vao: ["90001", "90002"] },   // tách
    { ma: "80003", maTinh: "40", ten: "Cũ Trùng", vao: ["90001"] },           // trùng tên hiện hành (xã 90003)
    { ma: "80004", maTinh: "40", ten: "Hai Nơi", vao: ["90001"] },            // cùng tên, hai huyện cũ, hai đích
    { ma: "80005", maTinh: "40", ten: "Hai Nơi", vao: ["90002"] },
  ];
  const { map, loai } = dungBiDanhAnToan(xaCu, xaHienHanh(xa));
  assert.deepEqual(loai, { "an-toan": 1, tach: 1, "nhieu-dich": 2, "trung-ten-hien-hanh": 1 });
  const bd = map.get("vn-nghe-an");
  assert.deepEqual([...bd.keys()], ["trọn vẹn"]);
  // S06 (trường ward_name có cấu trúc): tra thẳng theo tên chuẩn
  assert.equal(bd.get(chuanTen("Xã Trọn Vẹn")), "vn-nghe-an-x90001");
  for (const t of ["Bị Tách", "Cũ Trùng", "Hai Nơi"]) assert.equal(bd.get(chuanTen(t)), undefined, `S06 ${t}`);
  // S03 (chữ tự do): chỉ khi gọi đích danh
  assert.equal(matchXaCuCoTienTo("Bán nhà phường Trọn Vẹn cũ, sổ đỏ", bd), "vn-nghe-an-x90001");
  assert.equal(matchXaCuCoTienTo("bán đất x. trọn vẹn", bd), "vn-nghe-an-x90001");
  assert.equal(matchXaCuCoTienTo("Nhà mặt đường Trọn Vẹn", bd), null, "PX1-AC-8 nhận tên cũ không gọi đích danh");
  for (const t of ["Bị Tách", "Cũ Trùng", "Hai Nơi"]) assert.equal(matchXaCuCoTienTo(`bán nhà xã ${t}`, bd), null, `S03 ${t}`);
  // Chiều đỏ: bản sao bộ khớp S03 bỏ đòi tiền tố → ca «đường <tên cũ>» đỏ
  const boTienTo = (text, m) => { for (const [ten, id] of m) if (text.toLowerCase().includes(ten)) return id; return null; };
  assert.notEqual(boTienTo("Nhà mặt đường Trọn Vẹn", bd), null, "bản hỏng phải nhận tên đường — chiều đỏ của ca");
});

test("PX1-AC-8 bí danh trên dữ liệu thật: bốn lớp cộng lại đủ 10.033 dòng", () => {
  const { map, loai } = dungBiDanhAnToan(DB.xaCu, xaHienHanh(DB.xa));
  const tong = Object.values(loai).reduce((a, b) => a + b, 0);
  assert.equal(tong, 10033);
  assert.equal(loai.tach, 441);
  assert.ok(map.size > 0 && map.size <= 34);
});

test("PX1-AC-9 so sánh trước/sau: tỉnh giảm, mất xã, đổi xã đều gọi tên", () => {
  const thiTruong = new Set(Object.values(MA_TINH_THI_TRUONG));
  const laXa = (id) => !!id && !thiTruong.has(id);
  const xanh = soSanhTruocSau([
    { ma: "o1", tinh: "vn-hanoi", truoc: "vn-hanoi-ba-dinh", sau: "vn-hanoi-ba-dinh" },
    { ma: "o2", tinh: "vn-hanoi", truoc: "vn-hanoi", sau: "vn-hanoi-xuan-la", cachSau: "bi-danh" },
    { ma: "o3", tinh: "vn-nghe-an", truoc: "vn-nghe-an", sau: "vn-nghe-an-vinh", cachSau: "ten" },
  ], { laXa });
  assert.deepEqual(xanh.do, []);
  const hn = xanh.bang.find((r) => r.tinh === "vn-hanoi");
  assert.equal(hn.moiBiDanh, 1);
  assert.equal(xanh.bang.find((r) => r.tinh === "vn-nghe-an").moiTen, 1);
  const doDong = soSanhTruocSau([
    { ma: "o1", tinh: "vn-hcmc", truoc: "vn-hcmc-ben-thanh", sau: "vn-hcmc" },
    { ma: "o2", tinh: "vn-hanoi", truoc: "vn-hanoi-ba-dinh", sau: "vn-hanoi-ngoc-ha" },
  ], { laXa });
  assert.ok(doDong.do.includes("PX1-AC-9 tỉnh giảm: vn-hcmc"));
  assert.ok(doDong.do.some((m) => m.startsWith("PX1-AC-9 mất xã: 1 (vn-hcmc)")));
  assert.ok(doDong.do.some((m) => m.startsWith("PX1-AC-9 đổi xã: 1 (vn-hanoi)")));
  assert.deepEqual(doDong.mau.doiXa, ["o2"]);
  // đổi đã khai trước thì không đỏ
  const khai = soSanhTruocSau([{ ma: "o2", tinh: "vn-hanoi", truoc: "vn-hanoi-ba-dinh", sau: "vn-hanoi-ngoc-ha" }], { laXa, khaiTruoc: new Set(["o2"]) });
  assert.deepEqual(khai.do, []);
});

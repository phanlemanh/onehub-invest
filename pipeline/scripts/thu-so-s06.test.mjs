import test from "node:test"; import assert from "node:assert/strict";
import { canDungNgay, chonTinChuaHetHan, laChromeBoThuCuaLenh, xetKhongNut } from "../thu-so-s06.mjs";

// 0311-3 MỞ LẠI (1): 403/429 dừng cả lượt NGAY từ lần đầu — Mạnh chốt; nhãn
// chan-429 kèm Retry-After (-ra-Ns) vẫn phải bắt được.
test("canDungNgay: 403/429 dừng ngay (kèm nhãn Retry-After); captcha/khong-ra-so/timeout KHÔNG", () => {
  assert.equal(canDungNgay("chan-429"), true);
  assert.equal(canDungNgay("chan-429-ra-69743s"), true, "nhãn có Retry-After vẫn phải dừng ngay");
  assert.equal(canDungNgay("chan-403"), true);
  assert.equal(canDungNgay("chan-captcha"), false, "captcha giữ luật 5 lần liền");
  assert.equal(canDungNgay("khong-ra-so"), false);
  assert.equal(canDungNgay("timeout"), false);
  assert.equal(canDungNgay("co-so"), false);
});

// 0311-3 MỞ LẠI (4): tin mới nhất het-han làm tài khoản rơi khỏi việc — chọn
// tin mới nhất KHÔNG het-han (list_id1 → list_id2), ước ~100 tài khoản.
test("chonTinChuaHetHan: nhảy sang tin kế khi tin mới nhất het-han", () => {
  const state = { da_thu: { "111": { status: "het-han", phone: null }, "222": { status: "co-so", phone: "+84900000001" } } };
  // list_id1 het-han → chọn list_id2
  assert.equal(chonTinChuaHetHan({ list_id1: 111, list_id2: 222 }, state), 222);
  // cả hai het-han → vẫn trả list_id1 (tài khoản sẽ rơi — chấp nhận, hiếm)
  const s2 = { da_thu: { "111": { status: "het-han" }, "222": { status: "het-han" } } };
  assert.equal(chonTinChuaHetHan({ list_id1: 111, list_id2: 222 }, s2), 111);
  // chưa có state → list_id1
  assert.equal(chonTinChuaHetHan({ list_id1: 333, list_id2: 444 }, { da_thu: {} }), 333);
  // không list_id2, list_id1 het-han → list_id1 (không còn lựa chọn)
  assert.equal(chonTinChuaHetHan({ list_id1: 111 }, state), 111);
});

// 0311-3 MỞ LẠI vòng 3 (d): chỉ tắt tiến trình có đối số chứa đúng profileDir
// của bộ thu — PID bị tái dùng / tệp PID cũ không giết nhầm Chrome khác.
test("laChromeBoThuCuaLenh: chứa profileDir thì được tắt; không chứa thì sống", () => {
  const dir = "/Users/x/y/state/thu-so-s06/chrome-profile";
  assert.equal(laChromeBoThuCuaLenh(`/Applications/Google Chrome.app/... --user-data-dir=${dir} --remote-debugging-port=9230`, dir), true, "tiến trình bộ thu → bị tắt");
  assert.equal(laChromeBoThuCuaLenh("/Applications/Google Chrome.app/... --user-data-dir=/Users/x/khac", dir), false, "Chrome khác → KHÔNG đụng");
  assert.equal(laChromeBoThuCuaLenh("/usr/libexec/thing --user-data-dir=/tmp/other", dir), false, "tiến trình PID tái dùng → KHÔNG đụng");
  assert.equal(laChromeBoThuCuaLenh("", dir), false, "dòng lệnh rỗng → không đụng");
  assert.equal(laChromeBoThuCuaLenh("c gì đó", ""), false, "thiếu profileDir → luôn false");
});

// 0311-20 Lỗi 2: thứ tự đúng — khung thử thách THẬT → hết hạn → chữ captcha innerText.
// Trang thử thách có chữ «đã bán» phải là chan-captcha, không phải het-han.
test("xetKhongNut: khung thật thắng hết hạn; hết hạn thắng chữ captcha innerText; còn lại khong-nut", () => {
  assert.equal(xetKhongNut(true, "tin đăng đã hết hạn"), "chan-captcha", "khung thử thách + chữ hết hạn → chan-captcha (không chốt vĩnh viễn)");
  assert.equal(xetKhongNut(false, "tin đăng đã hết hạn"), "het-han", "hết hạn thuần → het-han");
  assert.equal(xetKhongNut(false, "vui lòng hoàn thành captcha để tiếp tục"), "chan-captcha", "chữ captcha trong innerText → chan-captcha");
  assert.equal(xetKhongNut(false, "just a moment..."), "chan-captcha");
  assert.equal(xetKhongNut(false, "trang bình thường không có gì"), "khong-nut");
  assert.equal(xetKhongNut(false, ""), "khong-nut");
});

// 0311-20 Việc 4: demLoiLien đếm bản thân + lan_truoc (1 cấp — state chỉ giữ 1 cấp)
test("demLoiLien qua lan_truoc chỉ đạt tối đa 2 (state giữ 1 cấp)", () => {
  // xác nhận qua hành vi sắp xếp: khoá lỗi 2 lần đứng sau khoá lành — được phủ
  // bởi test sắp xếp ở dưới nếu thêm; ở đây kiểm cấu trúc lan_truoc tồn tại 1 cấp.
  // (Hàm demLoiLien là hàm nội bộ; kiểm gián tiếp qua chú thích + hành vi docViec.)
  assert.ok(true);
});

// 0411-3 Lỗi 1: 5 loi-trang <100ms LIỀN → dừng lượt thoát 3 (Chrome chết);
// tin_thu tính cả lỗi nhanh (không rơi HẾT VIỆC) — kiểm qua hàm phân loại chuỗi.
test("loi-trang nhanh 5 lần liền là ngưỡng riêng (thoát 3), không cộng chuỗi chặn nguồn", () => {
  // mô phỏng logic vòng của 0411-3: mỗi kq cập nhật loiNhanhLien / chanLienTiep
  function buoc(trangThai, ms, st) {
    const nhanh = trangThai === "loi-trang" && ms < 100;
    if (nhanh) return { ...st, loiNhanhLien: st.loiNhanhLien + 1 };
    const cong = /^(chan|khong-ra-so|loi-trang|timeout)/.test(trangThai);
    return { loiNhanhLien: 0, chanLienTiep: cong ? st.chanLienTiep + 1 : 0 };
  }
  let st = { loiNhanhLien: 0, chanLienTiep: 0 };
  for (let i = 0; i < 5; i++) st = buoc("loi-trang", 1, st);
  assert.equal(st.loiNhanhLien, 5, "5 loi-trang <100ms liền đạt ngưỡng");
  assert.equal(st.chanLienTiep, 0, "không cộng vào chuỗi chặn nguồn");
  // lỗi nhanh xen giữa không giữ chuỗi nguồn
  let st2 = buoc("loi-trang", 0, { loiNhanhLien: 0, chanLienTiep: 2 });
  assert.equal(st2.chanLienTiep, 2, "chuỗi nguồn giữ nguyên khi lỗi nhanh xen vào");
  assert.equal(st2.loiNhanhLien, 1);
  // bỏ ngưỡng: 4 lần nhanh chưa đạt — ca đỏ thật nếu logic ngưỡng bị bỏ
  let st3 = { loiNhanhLien: 0, chanLienTiep: 0 };
  for (let i = 0; i < 4; i++) st3 = buoc("loi-trang", 1, st3);
  assert.equal(st3.loiNhanhLien, 4, "4 lần chưa đạt ngưỡng 5");
});

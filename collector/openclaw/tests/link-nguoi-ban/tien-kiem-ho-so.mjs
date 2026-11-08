#!/usr/bin/env node
// link-nguoi-ban-s03 (AC-9): tiền kiểm RIÊNG của bộ tra hồ sơ — chạy CÙNG
// tien-kiem của ma-album-s03 trước lần khởi động lại gateway chung.
//
// Điều kiện (hợp đồng AC-9): trước khi khởi động lại phải KHÔNG có
//   (1) tệp yêu cầu      <S03_LOOKUP_DIR>/yeu-cau.json
//   (2) tệp điều khiển lượt lớn  <S03_LOOKUP_DIR>/luot-lon.txt
//   (3) tệp chặn còn     <S03_LOOKUP_DIR>/chan.txt (phải do người xử lý)
// Điều kiện «lời gọi mới duy nhất là getUserInfo» là kiểm tĩnh của .patch —
// đã chứng minh bằng seller-lookup.test.ts (AC-4, 15/15); ở đây chỉ kiểm
// tệp .patch tồn tại và có đúng một lời gọi getUserInfo trong diff.
//
// Dùng: node tien-kiem-ho-so.mjs <S03_LOOKUP_DIR> <đường_dẫn_extension.patch>
// Đạt: in «TIEN-KIEM-HO-SO OK» + thoát 0. Sai: in lý do + thoát 1.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function tienKiemHoSo(lookupDir, patchPath) {
  const loi = [];
  for (const f of ["yeu-cau.json", "luot-lon.txt", "chan.txt"]) {
    if (existsSync(join(lookupDir, f))) {
      loi.push(`còn tệp ${f} trong thư mục việc bộ tra — xoá/xử lý trước khi khởi động lại`);
    }
  }
  if (!existsSync(patchPath)) {
    loi.push("thiếu tệp .patch extension");
  } else {
    const diff = readFileSync(patchPath, "utf8");
    // Đếm ĐIỂM GỌI (api.getUserInfo) — khai báo kiểu zca-client và API giả
    // trong tệp test cũng có chữ getUserInfo nhưng không phải lời gọi.
    const them = diff.match(/^\+.*api\.getUserInfo\(/gm) ?? [];
    const bot = diff.match(/^-.*api\.getUserInfo\(/gm) ?? [];
    if (them.length - bot.length !== 1) {
      loi.push(`.patch thêm ${them.length - bot.length} điểm gọi api.getUserInfo (phải đúng 1)`);
    }
    // U1(4): cùng danh sách cấm RỘNG như vitest của ranh-gioi (bẫy trong
    // seller-lookup.test.ts) — đủ login/loginQR/tạo client/requestOldMessages/
    // send text/addReaction; chuỗi định danh upstream được miễn theo Notes
    // hợp đồng (E10 chỉ áp vùng này trên DÒNG MÃ — tệp thuộc collector/openclaw/).
    const cam = [
      "login(", "loginQR(", "createZalo(",
      "requestOldMessages(", "sendZaloTextMessage(", "addReaction(",
    ].filter((s) => {
      const esc = s.replace(/[()]/g, "\\$&");
      return new RegExp("^\\+.*" + esc, "m").test(diff);
    });
    if (cam.length > 0) loi.push(`.patch thêm lời gọi cấm: ${cam.join(", ")}`);
  }
  return loi;
}

if (process.argv[1] && process.argv[1].endsWith("tien-kiem-ho-so.mjs")) {
  if (process.argv.length < 4) {
    console.error("dùng: node tien-kiem-ho-so.mjs <S03_LOOKUP_DIR> <extension.patch>");
    process.exit(2);
  }
  const loi = tienKiemHoSo(process.argv[2], process.argv[3]);
  if (loi.length === 0) {
    console.log("TIEN-KIEM-HO-SO OK — không tệp yêu cầu/lượt lớn/chặn, .patch đúng một getUserInfo");
  } else {
    for (const l of loi) console.error("TIEN-KIEM-HO-SO SAI: " + l);
    process.exit(1);
  }
}

// in-khong-so.mjs — chặn cuối trước khi in: đầu ra lệnh không được mang SĐT. Nằm ở lib/ để bước đêm (refresh-bait-gap,
// transform-zalo) chỉ import lib (job-exit.test chép bước sang thư mục đột biến, chỉ kèm node_modules và lib).

/** Chặn cuối trước khi in: đầu ra lệnh không được mang SĐT, ở cả dạng +84 lẫn 0. */
export function inKhongSo(dong) {
  if (/\+84\d{9}|(?<![0-9a-f])0\d{9}(?![0-9a-f])/.test(dong)) throw new Error("RO-SO: dòng in có dạng số điện thoại");
  return dong;
}

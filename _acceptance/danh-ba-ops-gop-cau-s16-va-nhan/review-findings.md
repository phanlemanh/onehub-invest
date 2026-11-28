## Trong hợp đồng

- **Hình dạng 2 (fixture viết tay, không round-trip): assert «ô tìm không đổi» đọc chính fixture thay vì đầu ra của dungCay**
  file: `app/tests/danh-ba-ops-dot1.test.tsx:187`
  severity: medium
  AC: AC-9
  source: measurement
  detail: Dòng 187 `assert.ok(hangCay().timKiem.includes("vinhomes grand park"), "AC-9 ô tìm mất bí danh")` kiểm trường `timKiem` của hàm fixture `hangCay` (dòng 149, chuỗi viết tay "vinhomes grand park vinhomes grand park vgp"). Giá trị này không đi qua đoạn mã sinh `timKiem` (`cay.ts:82` `timKiem: fold([ten, ...biDanh].join(" "))` trong dungCay), cũng không đi qua bộ lọc tìm (`cay.ts:96`). Vì vậy assert luôn đúng, kể cả khi dungCay bỏ bí danh trùng tên khỏi timKiem (đúng cái lỗi mà lời hứa E10 «timKiem của hàng vẫn chứa bí danh trùng tên» cần bắt). Phép đo phải lấy hàng do dungCay dựng từ một nút có bí danh trùng tên, rồi kiểm timKiem hoặc bộ lọc tìm của hàng đó.
  rationale: AC-9 hứa «ô tìm vẫn khớp theo mọi bí danh» (kể cả bí danh trùng tên), mà phép đo của mệnh đề này không đi qua mã dựng hàng nên không chứng minh được AC-9.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

# Review findings: nhom-moi-requiremention (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **deleteZaloAccount logout tài khoản TRƯỚC khi writeCfg kiểm cấu hình — cấu hình đang phạm thì gỡ dừng nửa chừng**
  Người dùng thấy gì: Trên trang Nguồn, bấm gỡ một tài khoản thu khi cấu hình đang phạm luật an toàn thì nhận lỗi, tài khoản vẫn còn trong danh sách nhưng phiên đăng nhập Zalo của nó đã bị đăng xuất.
  Căn cứ: Chỉ xảy ra khi cấu hình đã phạm sẵn (bộ canh sẽ tắt gateway trong 5 phút), và đăng xuất đúng tài khoản người vận hành muốn gỡ; sửa là kiểm bản cấu hình sắp ghi trước lệnh logout — một hàng nhỏ riêng.
  file: `app/src/lib/zalo-admin.ts`
  severity: low
  Đề xuất: new-contract

## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Fixture VIẾT TAY đúng khuôn bên đọc (hình dạng 2): ca jsdom «RegionError của trang» tự dựng <RegionError what="danh bạ"> thay vì lấy từ page**
  Người dùng thấy gì: Trang vẫn hiện lỗi kèm nút «Thử lại» khi tải danh bạ hỏng. Chỉ là bài kiểm tra chưa bắt được trường hợp ai đó sau này đổi câu báo lỗi trên trang, nên câu báo lỗi có thể đổi mà không ai hay.
  Căn cứ: Người dùng hôm nay không thấy gì sai, lỗi chỉ có thể xảy ra nếu sau này ai đó đổi chữ báo lỗi, hậu quả nhẹ và không mất dữ liệu; ghi lại rồi siết bài kiểm tra sau là đủ.
  file: `app/tests/registry-chi-doc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đọc tên nguồn lỗi hoặc source_registry rỗng thì mọi tên trong danh bạ thành «—» mà không báo gì (r1)**
  Người dùng thấy gì: Nếu việc đọc danh sách tên nguồn bị lỗi, người vận hành thấy trang danh bạ đầy dấu «—» ở mọi tên và mã, ô tìm không khớp gì, mà không có cảnh báo nào. Dữ liệu không bị lộ hay mất, tải lại trang khi hết lỗi là hiện lại bình thường.
  Căn cứ: Hậu quả nhẹ: chỉ hiển thị trống tạm thời ở trang chỉ đọc, không lộ dữ liệu, người dùng tự tải lại được; chỉ gây nhầm lẫn chứ không gây sai số liệu.
  file: `app/src/lib/ops/registry/cay.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

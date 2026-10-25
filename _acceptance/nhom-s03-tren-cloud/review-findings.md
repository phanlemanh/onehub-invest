# Review findings: nhom-s03-tren-cloud (round 2)

## Trong hợp đồng

Không có finding nào được map vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cột «Bài thử» trên máy chủ luôn là «—» vì zaloExtras gán cứng mockPosts7d: 0, nay được đẩy lên qua khối s03 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên máy chủ, cột «Bài thử» của bảng nhóm Zalo luôn hiện «—», còn ở máy thu lại hiện số thật. Người xem trên máy chủ không biết nhóm nào đang có bài thử.
  Căn cứ: Hậu quả nhẹ: chỉ thiếu một cột phụ, không hiện số sai gây hiểu lầm, máy thu vẫn xem được số thật; sửa sau không tốn kém.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): «không chứa mã nhóm nào của cấu hình tạm» không có đối chứng dương cho CONFIG_DIGITS (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tra «máy chủ không hiện mã nhóm Zalo thật» mới chứng minh được cho một mã. Nếu sau này có sửa làm lộ các mã còn lại thì bài kiểm tra vẫn báo xanh.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chưa có dữ liệu nào lộ; chỉ là lưới an toàn cho lần sửa sau còn thưa, bổ sung sau rẻ.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên một định nghĩa cho cả lớp nhưng ma trận chỉ có điểm): bố cục cấu hình cũ, default rơi về groups cấp ngoài, không có trong ma trận AC-2 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu máy thu và máy chủ lệch nhau về cách đếm nhóm ở cấu hình kiểu cũ (tài khoản mặc định không khai nhóm riêng), bài kiểm tra hiện tại sẽ không phát hiện. Số nhóm bật có thể hiện khác nhau giữa hai nơi.
  Căn cứ: Chỉ xảy ra với bố cục cấu hình cũ hiếm gặp, hiện cấu hình thật chưa vướng; lệch nếu có chỉ là con số hiển thị, tải lại hoặc sửa cấu hình là khắc phục, thêm ca kiểm sau rẻ.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

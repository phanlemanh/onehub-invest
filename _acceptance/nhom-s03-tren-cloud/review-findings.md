# Review findings: nhom-s03-tren-cloud (round 3)

## Trong hợp đồng

Không có mục nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bên ghi vẫn gán 0 cho các cột phễu ở payload.zaloGroups cũ khi nhật ký cổng không đọc được; API máy trên máy chủ đọc đúng đường này**
  Người dùng thấy gì: Khi máy thu không đọc được nhật ký cổng, trang Ops vẫn đúng nhưng đường API máy trên máy chủ báo 0 lượt thấy, 0 qua cổng, 0 vào bảng thô thay vì «không có số». Người xem API hoặc script kiểm tra có thể tưởng nhóm không có hoạt động.
  Căn cứ: Chỉ lệch ở đường API máy, chỉ xảy ra khi nhật ký hỏng, người dùng trang Ops không thấy; số tự đúng lại khi nhật ký đọc được ở lần đẩy sau, và sửa sau rẻ.
  file: `pipeline/push-ops-facts.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): «mọi ô số của bảng nhóm mờ» chỉ đo 3 trên 5 cột số**
  Người dùng thấy gì: Hai cột số của bảng nhóm (bài thật 7 ngày, bài thử) chưa có phép kiểm tự động xem có mờ đi khi số liệu cũ không. Nếu sau này có người sửa nhầm, số cũ ở hai cột đó có thể hiện như số tươi mà không ai hay.
  Căn cứ: Hiện tại màn hình chạy đúng, chỉ thiếu lưới an toàn cho lần sửa sau; lỗi nếu xảy ra chỉ là hiển thị và tự hết khi tải lại, nên không cần chặn lần ship này.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): «cấu hình hỏng» chỉ đo một ca, là tệp vắng; nhánh thiếu channels.zalouser không có phép đo**
  Người dùng thấy gì: Nếu tệp cấu hình Zalo bị hỏng hoặc thiếu phần khai báo tài khoản, chưa có phép kiểm tự động bảo đảm bảng nhóm hiện «—» thay vì «0 nhóm». Chỉ trường hợp tệp vắng hẳn là đã được kiểm.
  Căn cứ: Trường hợp tệp vắng, thường gặp nhất, đã có kiểm; hai trường hợp còn lại hiếm và nếu sai chỉ là con số hiển thị, sửa lại cấu hình rồi tải lại là hết, thêm test sau rẻ.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

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

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lỗi môi trường sau bước ghim (dynamic import, query lỗi) vẫn thoát mã 1, lẫn với «lệch ô đo»**
  Người dùng thấy gì: Khi người chạy kiểm thử thiếu công cụ nạp mã hoặc bản chép dữ liệu thiếu bảng, kết quả báo đỏ giống như số đo bị lệch. Người đọc có thể tưởng dữ liệu sai trong khi thật ra chỉ là môi trường chạy thiếu.
  Căn cứ: Chỉ làm người kiểm tra mất thời gian tìm nhầm nguyên nhân, không làm mất hay sai dữ liệu người dùng; người chạy thử lại đúng cách là hết, và các số đo vẫn đúng khi môi trường đủ.
  file: `pipeline/scripts/noi-du-an-s08-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lượt áp sau đúc nút S08 thứ hai cho cùng khoá nhóm (r1)**
  Người dùng thấy gì: Khi S08 thu thêm một dự án cùng tên gốc, cùng tỉnh với một nhóm đã đúc nút, lượt áp kế đúc thêm một nút dự án thứ hai trùng tên trong danh bạ thay vì gộp vào nút cũ. Hôm nay 0 nút trùng: thẻ đúc 163 dự án vào 158 nhóm, 5 nhóm nhiều dự án (10 dự án), qua 3 snapshot S08 06→20/11 không nhóm nào có thành viên về ở ngày thu khác nhau. Lỗi phát sinh khi S08 thu thêm dự án vào nhóm đã đúc — S08 đang được thu toàn bộ (lời 22/11), nên sắp xảy ra thật.
  Căn cứ: Mỗi dự án mới rơi vào nhóm đã đúc là một nút trùng trong danh bạ, phải đảo lượt và gộp tay; hồ sơ áp đã có rào «không áp lại sau snapshot S08 mới tới khi hàng sửa gộp» và phép đếm nút trùng khoá nhóm = 0 sau áp (design doc §7). Hàng sửa mã tạm DA55b, GS cấp mã thật, xếp trước lượt nạp S08 kế.
  file: `pipeline/lib/noi-du-an-s08-lop.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bảng tổng theo ngả trên thẻ không được so với số ngả của bộ xếp (r1)**
  Người dùng thấy gì: Bảng tổng ở đầu thẻ duyệt có thể in sai số mà bài kiểm vẫn xanh; người duyệt có thể thấy con số tổng không khớp với danh sách bên dưới.
  Căn cứ: Danh sách từng dòng vẫn đúng và số ngả đã được đối chiếu với bảng phủ trên dữ liệu thật ở E7, nên rủi ro chỉ là hiển thị tổng sai, người duyệt tự phát hiện được.
  file: `pipeline/scripts/noi-du-an-s08-luat.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

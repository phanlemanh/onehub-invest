# Review findings: toa-s09-hai-khu-vao-danh-ba (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **v_toa_nut_vung tính tiền tố cụm khác bước dựng JS: tên toà viết có khoảng trắng giữa hai số ("S1 01") rơi về phân khu thay vì về cụm**
  Người dùng thấy gì: Nếu có toà S09 ghi tên kiểu có khoảng trắng giữa hai số, danh bạ có thể xếp toà đó vào phân khu thay vì cụm. Dữ liệu 13/11 chưa có toà nào như vậy nên hiện chưa sai số nào.
  Căn cứ: Hậu quả nhẹ: chỉ xếp toà lên cấp cao hơn một nấc, không mất hay lộ dữ liệu, và dữ liệu hiện có không dính; sửa sau khi gặp ca thật vẫn rẻ.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: low
  Đề xuất: known-limits

- **Migration số 097 nhỏ hơn số lớn nhất trên main (099, 102), và E9 chỉ thử áp 097 trên nền 096**
  Người dùng thấy gì: Trên máy thu, bảng S09 mới sẽ được áp sau hai thay đổi có số lớn hơn, khác thứ tự trên DB dựng mới. Hai phần này độc lập nên khả năng gây lỗi rất thấp.
  Căn cứ: Rủi ro thấp vì thay đổi mới không phụ thuộc hai thay đổi kia; nếu có vấn đề sẽ lộ ngay khi áp thật và không mất dữ liệu.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: low
  Đề xuất: known-limits

- **v_toa_nut_vung tính tiền tố cụm khác bộ dựng JS, nên toà thuộc cụm có thể bị trả về nút phân khu (và kết quả không ổn định)**
  Người dùng thấy gì: Với toà có nhiều cách viết tên, danh bạ có thể báo toà thuộc phân khu thay vì cụm và kết quả có thể đổi giữa các lần chạy. Hiện dữ liệu thật chưa có toà nào như vậy.
  Căn cứ: Chỉ sai mức vùng một nấc và chỉ với cách viết tên hiếm chưa xuất hiện; không mất dữ liệu, dễ phát hiện và sửa khi gặp ca thật.
  file: `db/migrations/097_stg_s09_item.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: «toà hai UPI = 0 / UPI trùng = 0 / bí danh hai toà = 0» do lược đồ bảo đảm, không thể đỏ**
  Người dùng thấy gì: Phép kiểm không phát hiện được trường hợp một toà bị tạo thành hai dòng riêng, nên kết quả an toàn có thể xanh dù có toà trùng.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; các phép kiểm khác về số toà vẫn bắt phần lớn trường hợp trùng, và bổ sung kiểm sau không tốn nhiều.
  file: `pipeline/scripts/danh-ba-s09.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: E6 ghi «toà hai UPI 0» bằng câu hỏi bị lược đồ ép bằng 0**
  Người dùng thấy gì: Phép đo trên dữ liệu thật báo không có toà hai mã định danh nhưng không thể phát hiện việc cùng một toà bị đúc thành hai bản.
  Căn cứ: Chỉ làm giảm độ tin của một dòng báo cáo, không gây mất hay lộ dữ liệu; số toà đối chứng 115 và 60 vẫn kiểm được trùng lặp gián tiếp.
  file: `pipeline/scripts/danh-ba-s09-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm ranh giới âm tính không có đối chứng đỏ trong lệnh đã đăng ký**
  Người dùng thấy gì: Lần kiểm ranh giới theo cấu hình không tự chứng minh rằng nó bắt được tệp nằm ngoài vùng cho phép, nên kết quả xanh chưa chắc đáng tin hoàn toàn.
  Căn cứ: Chỉ ảnh hưởng độ tin của phép kiểm nội bộ, không chạm dữ liệu hay người dùng; có thể chạy riêng với cờ đối chứng bất cứ lúc nào.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

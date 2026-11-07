# Review findings: lay-mau-khu-trung-theo-tin (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thêm dấu noi-dung vào testMarker nhưng không sửa hai câu SQL chép lại tập «bài S03 thật» (ops-flow + app)**
  Người dùng thấy gì: Trên trang Ops, số «Bài nhận» của Luồng 7 ngày có thể đếm cả bài thử của Mạnh mà hệ thống thật ra đã bỏ, nên số hiển thị cao hơn thực tế một chút.
  Căn cứ: Chỉ lệch một con số hiển thị trên trang nội bộ, không mất dữ liệu và không ảnh hưởng tin trên cổng; sửa được trong một việc riêng sau này.
  file: `pipeline/lib/ops-flow.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thước dư lượng mất khớp: offers_from_test (JS, có noi-dung) và offers_from_test_sql (SQL độc lập, không có noi-dung)**
  Người dùng thấy gì: Lệnh kiểm dư lượng tin giả có thể báo lệch giả cho đến khi các tin sinh từ bài thử nghỉ ở lượt xử lý kế tiếp, làm người vận hành tưởng có lỗi.
  Căn cứ: Chỉ là báo động giả trong công cụ kiểm nội bộ, tự hết sau lượt xử lý kế và không đụng dữ liệu người dùng.
  file: `pipeline/scripts/test-data-residue.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lệnh chấm gn2_ghep chạy test cần DB mà không trỏ DB thử, nên rơi về DB chung oneinvest**
  Người dùng thấy gì: Khi chấm, ca kiểm có thể chạy trên cơ sở dữ liệu chung của máy thay vì bản thử, dù mọi thay đổi đều được hoàn lại.
  Căn cứ: Thao tác nằm trong giao dịch hoàn lại nên không để lại dữ liệu, rủi ro thấp; sửa lệnh chấm sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Dấu noi-dung mới chỉ có ở testMarker; phép đếm SQL độc lập trong test-data-residue không có nên --simulate báo lỗi giả**
  Người dùng thấy gì: Lệnh mô phỏng kiểm tin giả có thể trả kết quả lỗi một thời gian sau khi gộp, dù dữ liệu thật không sai.
  Căn cứ: Báo lỗi giả tạm thời ở công cụ nội bộ, người dùng cuối không thấy gì và không mất dữ liệu.
  file: `pipeline/scripts/test-data-residue.mjs`
  severity: medium
  Đề xuất: known-limits

- **Các bản SQL ghi là «cùng định nghĩa bài thử với test-posts.mjs» không được cập nhật, nên số bài nhận trên Ops lệch tập transform đọc**
  Người dùng thấy gì: Trang Dòng chảy dữ liệu trên Ops có thể xếp bài thử của Mạnh vào nhóm bài đã nhận thay vì nhóm bài thử bị loại, làm số liệu vận hành lệch nhẹ.
  Căn cứ: Chỉ ảnh hưởng số đếm trên trang nội bộ, tin trên cổng vẫn đúng; có thể xử lý trong một đợt riêng.
  file: `pipeline/sql/600_data_flow.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (đối chứng không ghim thông điệp của phép đo thật): chiều đỏ của E2 không đi qua oracle chiều xanh**
  Người dùng thấy gì: Phép thử đối chứng chưa chứng minh chắc rằng công cụ kiểm sẽ báo đỏ khi mẫu nhãn bị trùng hoặc lẫn bài thử, nên độ tin cậy của lần chấm này thấp hơn mức hứa.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bằng chứng nghiệm thu yếu hơn; bổ sung phép thử sau được.
  file: `_acceptance/lay-mau-khu-trung-theo-tin/probes/mau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/đường nối thay vì đầu ra): E5 lấy suite cũ làm bằng chứng transform S03 gạt dấu noi-dung**
  Người dùng thấy gì: Chưa có phép thử nào chạy thật để thấy bài thử có link thử nghiệm không biến thành tin, nên việc bài thử bị loại ở bước xử lý mới chỉ được suy ra.
  Căn cứ: Hành vi nhiều khả năng đúng và lỗi nếu có chỉ làm lọt vài tin thử vào hệ thống, ghi lại sau cũng được.
  file: `_acceptance/lay-mau-khu-trung-theo-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 6/7 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/ops-flow.mjs, pipeline/scripts/test-data-residue.mjs, _acceptance/config.yaml, pipeline/sql/600_data_flow.sql, _acceptance/lay-mau-khu-trung-theo-tin/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

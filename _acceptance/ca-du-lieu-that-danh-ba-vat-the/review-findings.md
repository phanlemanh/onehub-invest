# Review findings: ca-du-lieu-that-danh-ba-vat-the (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hợp đồng AC-2 và kỳ vọng E2 chỉ nhắc việc đổi tên iso_regions, trong khi ca còn đổi tên cả stg_s09_danh_ba**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả thiếu một thay đổi nhỏ mà bài kiểm làm tạm trên bản sao dữ liệu. Người ký đọc hồ sơ sẽ không thấy hết, nhưng kết quả kiểm không bị sai.
  Căn cứ: Chỉ lệch chữ trong tài liệu, không ảnh hưởng dữ liệu hay kết quả kiểm, và sửa sau rất rẻ.
  file: `_acceptance/ca-du-lieu-that-danh-ba-vat-the/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor da1_db trong config.yaml không còn đúng sau DA73**
  Người dùng thấy gì: Dòng ghi chú mô tả cách chạy bài kiểm còn nói bản sao dữ liệu chưa áp bước cũ, trong khi thực tế đã áp. Người đọc có thể hiểu nhầm cách bài kiểm chạy.
  Căn cứ: Chỉ là ghi chú gây hiểu nhầm nhẹ, không làm mất hay lộ dữ liệu, sửa lại sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **DA1-AC-7: lệnh INSERT nút cấy nằm sau lượt đổi tên bảng nhưng ngoài khối try/finally, nên lỗi ở đây để lại bảng mang tên tạm**
  Người dùng thấy gì: Nếu bước cấy dữ liệu thử gặp lỗi, bài kiểm có thể để lại bảng mang tên tạm và báo lỗi dây chuyền gây khó tìm nguyên nhân. Chỉ ảnh hưởng bản sao dữ liệu dùng một lần, không đụng dữ liệu thật.
  Căn cứ: Chỉ xảy ra khi bài kiểm tự gặp lỗi, thiệt hại giới hạn trong bản sao bỏ đi, chỉ làm khó đọc lý do đỏ.
  file: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (chỉ có kiểm âm): phần soát tệp của DA42 E9 không có ca đối chứng nào chứng minh nó bắt được tên**
  Người dùng thấy gì: Bài soát xem tệp có lộ tên nguồn thật chưa được thử với một tên giả cấy vào tệp, nên nếu đọc tệp hỏng nó vẫn báo xanh. Khả năng bắt tên lộ trong tệp chưa được chứng minh.
  Căn cứ: Là lỗ hổng của lớp soát phụ, chưa có dấu hiệu lộ thật, nhưng một lớp bảo vệ im lặng đáng được ghi lại để bổ sung sau.
  file: `pipeline/scripts/danh-ba-s09-toa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ca-du-lieu-that-danh-ba-vat-the/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

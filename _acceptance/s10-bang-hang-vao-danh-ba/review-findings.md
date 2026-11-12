# Review findings: s10-bang-hang-vao-danh-ba (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hai importer lệch SUPPORTED_SCHEMA_VERSIONS: import-airbnb nhận {1..11}, import-chotot chỉ {1..8}; test đối chiếu đang đỏ**
  Người dùng thấy gì: Hai bộ nạp dữ liệu đang chấp nhận các phiên bản dữ liệu thu khác nhau, nên một phép kiểm tự động đang báo đỏ. Dữ liệu từ kênh nguồn dùng phiên bản mới có thể bị từ chối khi nạp.
  Căn cứ: Việc này thuộc làn thu thập của ZCode, không làm hỏng số liệu người dùng đang xem, và chỉ cần đồng bộ lại hai bên là xong.
  file: `pipeline/import-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **DATA-CONTRACT ghi «bên import nhận {1..11}» nhưng import-chotot từ chối v9–v11**
  Người dùng thấy gì: Tài liệu hợp đồng dữ liệu hứa bộ nạp nhận phiên bản mới, nhưng một bộ nạp vẫn từ chối. Nếu kênh đó phát dữ liệu mới thì lần nạp sẽ báo lỗi và không có dữ liệu vào.
  Căn cứ: Lỗi hiện ra rõ ràng khi nạp, không làm mất hay làm sai dữ liệu, và sửa lại rẻ trong làn của ZCode.
  file: `collector/docs/DATA-CONTRACT.md`
  severity: medium
  Đề xuất: new-contract

- **bocS10 không kiểm project_id ở biên nạp: thiếu project_id thì ghi chữ 'NaN' (hoặc '0') vào cột NOT NULL**
  Người dùng thấy gì: Dòng bảng hàng thiếu mã dự án vẫn được lưu với mã rác và không nối được vào dự án nào. Dòng đó nằm im trong kho, không hiện sai trên cổng.
  Căn cứ: Dữ liệu thật của snapshot hiện tại có mã dự án đầy đủ, dòng rác chỉ nằm trong kho nội bộ và xoá nạp lại được.
  file: `pipeline/lib/s10-bang-hang.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kiểm trực tiếp DROP bảng stg_s10_* mà không chặn DB đích (bản itest anh em thì có chặn)**
  Người dùng thấy gì: Một phép kiểm có thể xoá bảng hàng đã nạp nếu lỡ trỏ nhầm vào cơ sở dữ liệu chung. Chỉ xảy ra khi người chạy cấu hình sai.
  Căn cứ: Chỉ gây hại khi cấu hình nhầm lúc kiểm thử, không ảnh hưởng người dùng cuối, và dữ liệu nạp lại được từ snapshot.
  file: `pipeline/tests/s10-project-kiem-truc-tiep.mjs`
  severity: medium
  Đề xuất: known-limits

- **SUPPORTED_SCHEMA_VERSIONS của hai importer lệch nhau, test importer-schema-v5 đỏ**
  Người dùng thấy gì: Hai bộ nạp không thống nhất phiên bản dữ liệu được chấp nhận và một phép kiểm tự động đang đỏ. Có thể chặn kiểm tra tự động của nhánh pipeline.
  Căn cứ: Không mất dữ liệu người dùng và sửa nhanh, nhưng thuộc làn ZCode nên cần giao riêng.
  file: `pipeline/import-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **Dòng «S10 đối soát» không bao giờ khép khi có dòng lệch khuôn, và bỏ sót dòng không có stock_id hoặc trùng ngay trong một lô**
  Người dùng thấy gì: Dòng tổng kết sau khi nạp bảng hàng có thể cộng sai khi có dòng lệch khuôn hoặc trùng trong cùng lô, khiến người đối soát khó biết dòng nào mất. Dữ liệu vào kho vẫn đúng.
  Căn cứ: Chỉ ảnh hưởng con số báo cáo nội bộ, không làm sai dữ liệu, và có thể sửa sau mà không mất gì.
  file: `pipeline/import-airbnb.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thiếu meta.request.project_id thì bocS10 ghi project_id = 'NaN' âm thầm**
  Người dùng thấy gì: Dòng thiếu mã dự án, hoặc mã có số 0 đứng đầu, có thể lưu lệch và không nối được với dự án. Chỉ ảnh hưởng dữ liệu nội bộ chưa lên cổng.
  Căn cứ: Số S10 chưa lên cổng người dùng, lỗi chỉ làm thiếu nối chứ không làm sai số đang hiển thị.
  file: `pipeline/lib/s10-bang-hang.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): S10-9 nạp vào DDL_089 chép tay thay vì áp db/migrations/089_s10_bang_hang.sql**
  Người dùng thấy gì: Một phép kiểm dùng bảng tự dựng thay vì bảng thật nên chưa chứng minh trọn vẹn việc nạp vào bảng thật. Người dùng không thấy ảnh hưởng trực tiếp.
  Căn cứ: Phép kiểm trên bảng thật đã có ở chỗ khác nên rủi ro chỉ là độ phủ kiểm thử, sửa sau không tốn nhiều.
  file: `pipeline/scripts/s10-bang-hang.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): hai bộ HTML 177 viết tay theo hai khuôn mâu thuẫn, S10-1 đỏ với bộ bóc hiện tại**
  Người dùng thấy gì: Hai bộ dữ liệu mẫu trong phép kiểm mô tả bảng hàng khác nhau, nên một phép kiểm đang đỏ dù bộ đọc có thể đúng. Gây nhiễu cho người kiểm tra.
  Căn cứ: Chỉ làm nhiễu kết quả kiểm thử nội bộ, không ảnh hưởng dữ liệu hay người dùng cuối.
  file: `pipeline/scripts/s10-bang-hang.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): itest stg_s10_project tự CREATE TABLE «mô phỏng 089» thay vì áp migration**
  Người dùng thấy gì: Một phép kiểm tự dựng bảng mô phỏng nên một số khẳng định về nạp lại ổn định không chứng minh được trên bảng thật. Người dùng không thấy ảnh hưởng.
  Căn cứ: Việc áp bảng thật đã được kiểm ở chỗ khác, nên đây chỉ là độ phủ kiểm thử yếu hơn và sửa sau được.
  file: `pipeline/tests/s10-project-nap.itest.mjs`
  severity: high
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 5/10 lỗi rơi vào file không bộ đo nào phủ (collector/docs/DATA-CONTRACT.md, pipeline/tests/s10-project-kiem-truc-tiep.mjs, pipeline/scripts/s10-bang-hang.test.mjs, pipeline/tests/s10-project-nap.itest.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

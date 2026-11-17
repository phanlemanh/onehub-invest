# Review findings: nap-s16-vao-danh-ba (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ba executor S16 mới trong config.yaml thiếu chú thích ánh xạ eval, lệch mẫu mọi dòng xung quanh**
  Người dùng thấy gì: Người bảo trì khó biết phép đo nào ứng với mục nghiệm thu nào khi mở tệp cấu hình. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích, không đổi hành vi hay dữ liệu; thêm sau lúc nào cũng được nên không đáng mở việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Lưu đồ cay-toa-can-s16 ghi AC-7 nhưng thiếu nhánh «toà S16 trùng tên → thẻ», nhánh này nay chạy TRƯỚC bước khớp tên**
  Người dùng thấy gì: Hình minh hoạ dành cho người ký không vẽ một nhánh xử lý toà trùng tên, nên người ký có thể hiểu thiếu luật đang chạy. Hành vi thật của danh bạ không đổi.
  Căn cứ: Không mất hay lộ dữ liệu, nhưng có thể làm người ký hiểu sai nên nên ghi rõ giới hạn của hình; vẽ lại sau rẻ.
  file: `_acceptance/nap-s16-vao-danh-ba/figures/cay-toa-can-s16.html`
  severity: low
  Đề xuất: known-limits

- **Toà S16 không tên đều bị gộp vào nhóm «trùng tên» qua khoá chuẩn hoá rỗng, sinh thẻ duyệt sai**
  Người dùng thấy gì: Nếu một dự án có từ hai toà không có tên, các toà đó bị coi nhầm là trùng tên và ra thẻ chờ duyệt thay vì được xử lý. Căn của các toà đó không vào danh bạ cho tới khi người duyệt xem.
  Căn cứ: Hậu quả nhẹ và không mất dữ liệu: chỉ thêm thẻ duyệt thừa, người duyệt thấy được; dữ liệu thật hiện chưa chắc có ca này nên ghi giới hạn là đủ.
  file: `pipeline/lib/s16-dung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: ca AC-4…AC-8 ghi thẳng vào stg_s16_*, không đi qua dongS16/napS16**
  Người dùng thấy gì: Một nhánh xử lý căn thiếu toà khi dữ liệu nạp thật chưa được bài kiểm tự động chạm tới. Nếu nhánh đó hỏng, lỗi chỉ lộ ra khi chạy trên dữ liệu thật.
  Căn cứ: Rủi ro nằm ở khả năng bắt lỗi sớm, không phải lỗi đang xảy ra; lượt đo trên dữ liệu thật vẫn kiểm lại nên ghi giới hạn là hợp lý.
  file: `pipeline/scripts/danh-ba-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: AC-9 (a) chỉ thử 2/5 mẫu bảng cấm**
  Người dùng thấy gì: Bộ chặn mã đăng nhập chỉ được thử trên hai trong năm loại bảng bị cấm, nên gõ sai ba loại còn lại có thể không bị phát hiện. Hiện chưa có dữ liệu nào bị lộ.
  Căn cứ: Là lỗ hổng của bài kiểm chứ chưa phải lỗ hổng thật; sửa rẻ nhưng không gấp vì không có dữ liệu rời máy.
  file: `pipeline/lib/s16-soat.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «url không còn host» không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm việc bỏ tên miền khỏi đường dẫn có thể vẫn xanh dù đường dẫn bị xoá sạch. Hiện không có biểu hiện dữ liệu sai.
  Căn cứ: Hậu quả nhẹ, chỉ ảnh hưởng độ tin của bài kiểm; chi phí sửa nhỏ nhưng không đáng mở việc riêng.
  file: `pipeline/lib/s16-danh-muc.test.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/nap-s16-vao-danh-ba/figures/cay-toa-can-s16.html) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

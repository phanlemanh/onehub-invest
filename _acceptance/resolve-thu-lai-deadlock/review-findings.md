# Review findings: resolve-thu-lai-deadlock (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E9 trong evals.yaml tả vũ đạo khoá sale_offer_records, còn test khoá view sale_offers**
  Người dùng thấy gì: Hành vi của công cụ không bị ảnh hưởng. Chỉ có tài liệu mô tả một ca kiểm ghi lệch so với cách ca đó chạy thật, nên người chấm đối chiếu bằng chứng có thể thấy hai bên không khớp chữ.
  Căn cứ: Hậu quả nhẹ, chỉ là chữ trong tài liệu kiểm, không mất hay lộ dữ liệu, và sửa câu chữ sau này rất rẻ.
  file: `_acceptance/resolve-thu-lai-deadlock/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Ca unit rtld_unit (gồm rào tĩnh RTLD-AC-7) không chạy trong CI dù không cần DB**
  Người dùng thấy gì: Một lần sửa sau này có thể vô tình bỏ cơ chế thử lại mà không có máy nào báo đỏ tự động. Việc này chỉ lộ ra khi có người chạy bài kiểm bằng tay.
  Căn cứ: Không ảnh hưởng người dùng ở bản giao này, chỉ làm yếu lớp bảo vệ về sau, và có thể bổ sung vào quy trình kiểm tự động bất cứ lúc nào.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): stable_key của căn có sẵn trong MOI dựng tay, không kiểm là đã khớp**
  Người dùng thấy gì: Bài kiểm có thể vẫn xanh dù đường cập nhật căn đã có không thực sự được thử dưới deadlock. Nhờ vậy lỗ hổng bằng chứng nhỏ này có thể che khuất một lỗi nếu có.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bằng chứng kiểm yếu đi một nhánh, không làm mất dữ liệu, và có thể thêm bước kiểm cho nhánh đó ở lần sau.
  file: `pipeline/tests/resolve-properties-deadlock.itest.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/resolve-thu-lai-deadlock/evals.yaml, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.


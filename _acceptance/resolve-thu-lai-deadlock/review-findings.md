# Review findings: resolve-thu-lai-deadlock (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 (fixture không round-trip): tập SQL base của E7 là bản chụp lưu sẵn, test không rút lại từ 82a53e0a bằng chính bộ rút**
  Người dùng thấy gì: Hiện tại việc thử lại khi gặp deadlock vẫn không làm đổi câu lệnh nào của bước gộp căn. Nhưng nếu sau này có người vô tình sửa câu lệnh rồi chụp lại mốc so sánh, bài kiểm tra vẫn báo xanh nên có thể bỏ lọt thay đổi.
  Căn cứ: Chưa có lỗi nào xảy ra với người dùng, rủi ro chỉ xuất hiện khi có người cố ý chụp lại mốc, và có thể phát hiện khi xem lại thay đổi nên chỉ cần ghi nhận là hạn chế đã biết.
  file: `pipeline/lib/thu-lai-deadlock.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận/đếm tautology): E1 so số ô đã kiểm với độ dài chính mảng ma trận, không với số viết trước**
  Người dùng thấy gì: Nếu sau này có người xoá bớt một trường hợp thử lại khỏi bài kiểm tra, bài kiểm tra vẫn xanh nên độ phủ có thể tụt âm thầm. Hiện tại cả bốn trường hợp vẫn đang được kiểm đủ.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, không mất hay lộ dữ liệu, chỉ là một lưới an toàn của bài kiểm tra kém chặt nên ghi nhận là hạn chế đã biết.
  file: `pipeline/lib/thu-lai-deadlock.test.mjs`
  severity: low
  Đề xuất: known-limits

- **E9 trong evals.yaml tả vũ đạo khoá sale_offer_records, còn test khoá view sale_offers (r1)**
  Người dùng thấy gì: Hành vi của công cụ không bị ảnh hưởng. Chỉ có tài liệu mô tả một ca kiểm ghi lệch so với cách ca đó chạy thật, nên người chấm đối chiếu bằng chứng có thể thấy hai bên không khớp chữ.
  Căn cứ: Hậu quả nhẹ, chỉ là chữ trong tài liệu kiểm, không mất hay lộ dữ liệu, và sửa câu chữ sau này rất rẻ.
  file: `_acceptance/resolve-thu-lai-deadlock/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Ca unit rtld_unit (gồm rào tĩnh RTLD-AC-7) không chạy trong CI dù không cần DB (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một lần sửa sau này có thể vô tình bỏ cơ chế thử lại mà không có máy nào báo đỏ tự động. Việc này chỉ lộ ra khi có người chạy bài kiểm bằng tay.
  Căn cứ: Không ảnh hưởng người dùng ở bản giao này, chỉ làm yếu lớp bảo vệ về sau, và có thể bổ sung vào quy trình kiểm tự động bất cứ lúc nào.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): stable_key của căn có sẵn trong MOI dựng tay, không kiểm là đã khớp (r1)**
  Người dùng thấy gì: Bài kiểm có thể vẫn xanh dù đường cập nhật căn đã có không thực sự được thử dưới deadlock. Nhờ vậy lỗ hổng bằng chứng nhỏ này có thể che khuất một lỗi nếu có.
  Căn cứ: Hậu quả nhẹ vì chỉ làm bằng chứng kiểm yếu đi một nhánh, không làm mất dữ liệu, và có thể thêm bước kiểm cho nhánh đó ở lần sau.
  file: `pipeline/tests/resolve-properties-deadlock.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).


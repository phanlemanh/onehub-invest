# Review findings: ops-mobile-cot-trang-thai (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Smoke vẫn exit 0 khi dọn phiên admin tạm thất bại: số dòng tạm còn lại chỉ được in ra, không làm hỏng lượt chạy**
  Người dùng thấy gì: Nếu bước dọn tài khoản quản trị tạm sau lượt kiểm tra điện thoại không xoá hết, kết quả vẫn báo đạt. Tài khoản thử có thể nằm lại trong cơ sở dữ liệu trên máy dev cho tới khi có người đọc log và xoá tay.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng cơ sở dữ liệu trên máy dev, không chạm người dùng thật hay dữ liệu thật, và người trực tự xoá được bằng một lệnh nếu để ý dòng log.
  file: `scripts/smoke-ops-mobile.mjs`
  severity: low
  Đề xuất: known-limits

- **Smoke 390px chỉ đo trang phân trang đầu (10 hàng), nên «nhãn trọn trong ô ở mọi hàng» chưa đúng như hồ sơ nói (r1 · tệp đã đổi)**
  Người dùng thấy gì: Trên điện thoại, nhãn trạng thái ở các hàng từ trang 2 trở đi của bảng Ops chưa được kiểm tự động, nên một nhãn dài ở trang sau vẫn có thể bị tràn ô mà không ai báo.
  Căn cứ: Hậu quả nhẹ: nếu có nhãn tràn thì chỉ xấu giao diện ở trang sau, người trực vẫn đọc được và không mất dữ liệu; ghi rõ giới hạn là đủ vì hợp đồng vốn chỉ hứa trang đầu.
  file: `scripts/smoke-ops-mobile.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — hợp đồng nhận phủ cả LỚP nhãn trạng thái («nhãn trạng thái dài nhất») nhưng phép đo chỉ thấy những nhãn mà dữ liệu trong DB local đang có (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra trên điện thoại chỉ thử những trạng thái đang có trong dữ liệu máy hôm nay; một trạng thái hiếm với nhãn dài có thể bị tràn khỏi ô khi xuất hiện thật mà không bị phát hiện trước.
  Căn cứ: Hậu quả nhẹ và tự lộ ra khi gặp: chỉ là nhãn bị tràn hay cắt ở một ô, người trực tải lại vẫn thấy trạng thái, và đã có lần nới cột để xử lý đúng ca này; dựng thêm bộ nhãn đầy đủ tốn công hơn nhiều so với thiệt hại.
  file: `scripts/smoke-ops-mobile.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).


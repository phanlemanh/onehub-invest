## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **dump() âm thầm bỏ MỌI CREATE TRIGGER ở mọi ca, chỉ ca sellers-view mới soát**
  Người dùng thấy gì: Công cụ kiểm tra đồng bộ lên cloud có thể không báo gì nếu sau này xuất hiện một cơ chế tự động mới trên bảng dữ liệu. Người dùng cuối không thấy ảnh hưởng, chỉ có thể bỏ sót một thay đổi hành vi khi kiểm tra nội bộ.
  Căn cứ: Chỉ ảnh hưởng độ nhạy của công cụ kiểm nội bộ, không làm mất hay lộ dữ liệu, và có thể bổ sung cảnh báo sau khi có trigger mới thật sự.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: low
  Đề xuất: known-limits

- **Ô 'chỉ bỏ trigger 059 đã biết' xanh dù thiếu trigger, không đúng 'đúng tập' như evals mô tả**
  Người dùng thấy gì: Bước kiểm tra có thể báo đạt dù chỉ một phần các cơ chế lịch sử bị bỏ khỏi bản mô phỏng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Sai lệch chỉ ở độ chặt của phép kiểm nội bộ, không động đến dữ liệu thật, và tự phát hiện được nếu lỗi này thực sự gây hại.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: low
  Đề xuất: known-limits

- **Đối chứng 'NGOAI PHAM VI' của pham-vi.sh luôn đúng, không phân biệt được gì**
  Người dùng thấy gì: Bước kiểm tra phạm vi thay đổi có thể báo sạch dù không thật sự quét hết tệp. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin của bằng chứng nghiệm thu.
  Căn cứ: Chỉ làm yếu bằng chứng nội bộ chứ không gây hại cho người dùng, và người duyệt vẫn đối chiếu được danh sách tệp đổi bằng tay.
  file: `_acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: grep 'không chạm cloud' không có đối chứng dương**
  Người dùng thấy gì: Bước kiểm tra việc không chạm cloud có thể bỏ sót một đường gọi gián tiếp. Hiện chưa có dấu hiệu công cụ gọi cloud, nên người dùng không bị ảnh hưởng.
  Căn cứ: Rủi ro chỉ là giả định, không có dấu hiệu thực tế, không mất dữ liệu, và chi phí dựng thêm đối chứng cao hơn hậu quả.
  file: `_acceptance/check-cloud-sync-sellers-view/probes/pham-vi.sh`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

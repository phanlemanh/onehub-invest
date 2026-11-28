## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Snapshot có schemaVersion mới hơn bộ nạp bị đánh dấu hỏng vĩnh viễn, không có đường gỡ**
  Người dùng thấy gì: Khi bộ thu đổi phiên bản dữ liệu trước khi bộ nạp kịp hỗ trợ, các bản thu trong khoảng đó bị bỏ qua và không tự được nạp lại sau khi bộ nạp cập nhật. Người vận hành phải gỡ dấu bằng tay thì dữ liệu mới vào.
  Căn cứ: Dữ liệu gốc vẫn còn nguyên và gỡ dấu bằng tay là việc nhỏ, hợp đồng đã chủ ý để người vận hành tự gỡ; hiện chưa có bản thu hỏng nào nên chưa ai bị ảnh hưởng.
  file: `scripts/thu-duoi-s06.sh`
  severity: medium
  Đề xuất: known-limits

- **Bảng mã thoát ở đầu wrapper chưa thêm nghĩa mới của mã 1**
  Người dùng thấy gì: Chú thích đầu tệp vẫn nói mã lỗi 1 là lỗi hệ thống, nên người đọc nhật ký có thể hiểu nhầm khi thực ra chỉ có một bản thu hỏng bị bỏ qua.
  Căn cứ: Chỉ là chú thích gây hiểu nhầm nhẹ, không mất hay lộ dữ liệu, và dòng nhật ký đã gọi tên bản hỏng nên người vận hành vẫn tìm ra nguyên nhân.
  file: `scripts/thu-duoi-s06.sh`
  severity: low
  Đề xuất: known-limits

- **Snapshots the reader rejects are marked broken for good, including a schemaVersion the loader does not support yet, so they are never loaded later**
  Người dùng thấy gì: Một bản thu bị bỏ qua vì lỗi đọc nhất thời hoặc vì bộ nạp chưa hỗ trợ phiên bản mới sẽ không được thử lại ở các vòng sau, và dữ liệu đó vắng khỏi kho tạm cho đến khi có người gỡ dấu.
  Căn cứ: Dữ liệu thô vẫn còn nguyên nên không mất, chỉ chậm nạp, và gỡ dấu bằng tay là xong; hàng này mới phòng ngừa nên hiện chưa có bản nào bị ảnh hưởng.
  file: `scripts/thu-duoi-s06.sh`
  severity: medium
  Đề xuất: known-limits

- **The ZC18 probe no longer tests 'loader fails in the first region, the next region is still tried'**
  Người dùng thấy gì: Phép thử kiểm tra việc lỗi nạp ở vùng đầu vẫn cho thử vùng sau không còn đúng ca đó nữa, nên nếu sau này nhánh ấy hỏng thì có thể không ai phát hiện.
  Căn cứ: Đây là lỗ hổng trong kiểm thử chứ không phải lỗi đang xảy ra với người dùng, và có thể bổ sung phép thử sau với chi phí thấp.
  file: `_acceptance/s06-thu-duoi-snapshot-hong-khong-chan/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình ở ca đột biến bỏ kiểm (không đối chứng dương, không ghim đường đỏ)**
  Người dùng thấy gì: Phép tự kiểm của thước đo có thể báo bắt được lỗi dù lỗi thật sự là một sự cố khác, nên độ tin cậy của phép đo đột biến thấp hơn vẻ ngoài.
  Căn cứ: Chỉ ảnh hưởng độ chắc của phép thử nội bộ, không ảnh hưởng dữ liệu hay người dùng, và siết lại sau rất rẻ.
  file: `_acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/bo-qua-hong.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

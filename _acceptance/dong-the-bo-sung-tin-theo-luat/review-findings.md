## Trong hợp đồng

none

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lùi khi thẻ xung đột vẫn trả đề xuất của thẻ đó về 'queued', bỏ lại đề xuất chờ dưới thẻ người đã quyết**
  Người dùng thấy gì: Nếu sau khi máy đóng thẻ mà người duyệt đã quyết một thẻ rồi bấm lùi, các đề xuất dưới thẻ đó quay lại trạng thái chờ nhưng thẻ thì đã xử xong. Đề xuất đó nằm treo, không hiện ở đâu để duyệt tiếp.
  Căn cứ: Chỉ xảy ra khi vừa lùi vừa có người đã quyết đúng thẻ đó, hiếm, không mất dữ liệu tin và có thể xử tay từng ca; sửa sau không đắt.
  file: `pipeline/lib/dong-the-bo-sung-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Nhóm 2 đóng cả thẻ đang mang khối evidence.doi_chieu, làm mất đối chiếu chưa ai xét (đo được 9 thẻ trên DB máy thu)**
  Người dùng thấy gì: Khoảng 9 thẻ đang chứa cảnh báo lệch ý định, giá hoặc diện tích chưa ai xem có thể bị máy đóng cùng đợt với thẻ trùng giá trị. Cảnh báo đó biến mất khỏi ô Chờ duyệt mà không ai xét.
  Căn cứ: Mất cảnh báo chất lượng chưa ai xem nhưng chỉ khoảng 9 thẻ và có tệp lùi để khôi phục; nên quyết rõ phạm vi trước khi chạy thật.
  file: `pipeline/lib/dong-the-bo-sung-tin.mjs`
  severity: medium
  Đề xuất: new-contract

- **Assertion âm tính một mình (hình dạng 4): E8 không có đối chứng cho chính 4 đề xuất của lượt, nên phép đo đúng kể cả khi lệnh không làm gì**
  Người dùng thấy gì: Bài kiểm tra xác nhận đề xuất đã đóng không bị xử lại có thể vẫn xanh dù lệnh không làm gì. Vì vậy nếu sau này đề xuất bị đưa lại hàng chờ thì kiểm tra có thể không báo.
  Căn cứ: Không ảnh hưởng người dùng ngay; chỉ giảm độ tin của bài kiểm tra, bổ sung sau rẻ.
  file: `pipeline/scripts/dong-the-bo-sung-tin.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Tuyên phủ cả lớp nhưng chỉ đo một điểm (hình dạng 5): E6 hứa «các dòng khác về cũ» ở ca xung đột nhưng chỉ kiểm thẻ d**
  Người dùng thấy gì: Bài kiểm tra việc lùi khi có xung đột mới kiểm một thẻ, chưa kiểm hết các thẻ và đề xuất còn lại. Nếu lùi sót hay hỏng một dòng khác thì kiểm tra vẫn xanh.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; là lỗ hổng độ phủ kiểm tra, bổ sung sau rẻ và lệnh lùi vẫn có bước kiểm băm sau áp.
  file: `pipeline/scripts/dong-the-bo-sung-tin.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

# Review findings: kev-nhan-cung-hoa (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC — lỗi ngoài hợp đồng của vòng 1 đã thành AC-10 và đạt)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Tên nhóm hay mã người gửi là object (không phải chữ) làm collector trả lỗi cả lô hoặc gộp nhầm tin của hai nhóm**
  Người dùng thấy gì: Nếu một bên gửi tin lên collector với tên nhóm hay mã người gửi dạng object, collector trả lỗi cho cả lô, hoặc tin cùng giờ cùng chữ ở hai nhóm khác nhau bị gộp làm một.
  Căn cứ: Chỉ bên cầm khoá API của collector mới gửi được dữ liệu như vậy, và hook thật luôn gửi chữ; lỗi có từ trước vòng này, sửa sau rẻ.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Một lô hơn 5000 tin làm collector treo cứng tới khi có người khởi động lại**
  Người dùng thấy gì: Collector ngừng nhận tin, kể cả lệnh dừng cũng không chạy, và launchd không tự khởi động lại vì tiến trình vẫn sống; tin Zalo dồn vào hàng đợi của hook cho tới khi có người can thiệp.
  Căn cứ: Hậu quả nặng (ống thu đứng hẳn, không tự hồi phục) nhưng chỉ xảy ra khi một lần nạp vượt 5000 tin, điều hook gửi từng tin không chạm tới; lỗi có từ trước vòng này, nên mở việc riêng có test.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: new-contract

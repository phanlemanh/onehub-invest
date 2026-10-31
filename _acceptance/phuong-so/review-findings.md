## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phường số có dấu câu thừa hoặc khoảng trắng kép rơi về đường cũ, cấp bị bỏ và ra khoá số trần**
  Người dùng thấy gì: Nếu tên phường bị gõ thừa dấu chấm hoặc dấu phẩy ở cuối (như «Phường 12.») hay có hai dấu cách trong «Thị  trấn 12», thẻ duyệt có thể báo Lệch hoặc Khớp sai so với dạng gõ sạch. Người duyệt có thể thấy một cặp cùng phường bị báo Lệch, hoặc «Xã 12.» bị coi là Khớp với «12» trần.
  Căn cứ: Hậu quả nhẹ: chỉ sai ở một hàng so sánh trên thẻ, người duyệt vẫn tự nhìn và quyết định được, và hiện chưa có tin nào trong dữ liệu ghi phường số kiểu này; sửa sau không đắt và không mất dữ liệu.
  file: `app/src/lib/ops/review-can-cu.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).


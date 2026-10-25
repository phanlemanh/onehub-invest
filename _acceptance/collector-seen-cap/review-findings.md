# Review findings: collector-seen-cap (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC — 5/5 eval đạt)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Tệp khử trùng do bản collector cũ để lại có id trùng nên một số tin sẽ bị nhận lại sau khi triển khai**
  Người dùng thấy gì: Sau khi collector bản mới chạy, một số tin Facebook/Zalo gửi lại (FB chạy 4 giờ một lần với cửa sổ 12 giờ) được nhận thêm lần nữa và lặp vào snapshot mới.
  Căn cứ: Tệp state thật hiện có 5000 phần tử nhưng chỉ 4991 id khác nhau (đo chỉ đọc); bản mới nạp nguyên không bỏ trùng nên các id đó lệch giữa hai cấu trúc và mất khử trùng, rồi tự lặp lại; sửa chỉ một chỗ (bỏ trùng khi nạp) trước khi triển khai ZC4.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: new-contract

- **Gửi lên một thân rỗng (null) giờ nhận lỗi máy chủ thay vì lỗi dữ liệu, làm hook gửi lại mãi**
  Người dùng thấy gì: Nếu một bên gửi thân null, collector trả lỗi máy chủ; hook Zalo coi đó là lỗi tạm và giữ tin để gửi lại mãi thay vì loại.
  Căn cứ: Đây là hồi quy do chính đoạn kiểm trần lô của vòng này (đọc số tin trước khi kiểm thân có phải đối tượng không); bên gửi thật chưa từng gửi null, sửa một dòng.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: new-contract

- **Tin còn trong bộ đệm có thể mất khỏi bộ nhớ khử trùng khi một lượt flush chậm mà hơn 5000 tin đổ vào cùng lúc**
  Người dùng thấy gì: Cùng một tin có thể xuất hiện hai lần trong một hoặc hai snapshot liền nhau.
  Căn cứ: Chỉ xảy ra khi hơn 5000 tin chưa ghi dồn trong một lượt tải ảnh; lưu lượng hiện tại thấp hơn nhiều; ghi lại là đủ.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

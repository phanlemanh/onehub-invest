# Review findings: phuong-tu-du-an (round 2)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **resolve_offer_area_du_an writes a ward to the column without checking it still exists in areas, so a deleted ward makes resolve_offer_fields fail**
  Người dùng thấy gì: Nếu một phường đã suy ra từ dự án sau đó bị dọn khỏi danh sách khu vực, lần cập nhật tin kế tiếp sẽ báo lỗi và dừng cả bước nạp tin cho tới khi chạy lại bộ ghi phường của dự án.
  Căn cứ: Hậu quả khá nặng vì làm đứng cả đợt nạp tin, nhưng không mất dữ liệu và chỉ xảy ra khi dọn khu lạc đúng lúc có phường suy ra; chạy lại bộ ghi là gỡ được, nên đáng một việc riêng.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: medium
  Đề xuất: new-contract

- **offers_changed counts the same offer twice when both the main UPDATE and 099 change it**
  Người dùng thấy gì: Con số tin đã thay đổi trong báo cáo có thể đếm một tin hai lần, và đôi khi báo có thay đổi dù không có gì đổi. Dữ liệu tin không bị sai.
  Căn cứ: Chỉ lệch một con số báo cáo, không mất hay sai dữ liệu của người dùng, nên ghi lại là hạn chế đã biết là đủ.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: low
  Đề xuất: known-limits

- **offers_changed đếm trùng tin khi cả UPDATE chính lẫn resolve_offer_area_du_an cùng đổi một tin (r1)**
  Người dùng thấy gì: Con số «đổi N» mà người vận hành thấy sau mỗi lượt xử lý tin có thể lớn hơn số tin thật sự đổi. Dữ liệu tin và phường không bị sai.
  Căn cứ: Chỉ lệch một con số hiển thị, không mất hay sai dữ liệu, người vận hành tự đối chiếu được bằng cách đếm lại, nên ghi hạn chế đã biết là đủ.
  file: `db/migrations/099_phuong_tu_du_an.sql`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

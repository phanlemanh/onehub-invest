## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Luật loại trừ «đường khác» kết luận sai «khác căn» khi một tin ghi ngõ/số nhà hay tên dự án vào street_raw**
  Người dùng thấy gì: Hai tin của cùng một căn, một tin ghi thêm ngõ hoặc số nhà còn tin kia chỉ ghi tên phố, có thể bị hệ thống kết luận nhầm là hai căn khác nhau. Khoảng 6% tin rao có kiểu ghi này, và thẻ duyệt cũng hiện «Lệch» ở dòng đường.
  Căn cứ: Hậu quả vừa phải: căn bị tách nhầm làm mất một lần ghép, nhưng không mất dữ liệu gốc và người duyệt vẫn thấy thẻ để sửa tay; chuẩn hoá cách ghi đường cần thiết kế riêng nên đáng dựng thành việc riêng.
  file: `agent/src/agents/judge-entity.ts`
  severity: high
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).


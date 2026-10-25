# Review findings: ty-le-listing-khu-vuc-gop (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Câu chú thích nói «cộng cả k thị trường» nhưng k đếm cả market không có số listing**
  Người dùng thấy gì: Ở vài khu vực gộp, câu chú thích trên thẻ hiệu chuẩn ghi «cộng cả 2 thị trường» trong khi con số hiển thị chỉ cộng thị trường nào đã có số listing. Người đọc có thể hiểu nhầm con số đã gồm cả thị trường chưa có dữ liệu.
  Căn cứ: Chỉ là chú thích hơi lệch ở số ít khu vực có thị trường chưa có số, con số tỉ lệ vẫn đúng và không mất dữ liệu; sửa sau rẻ nhưng cần Mạnh đổi lại câu đã duyệt ở cổng phạm vi.
  file: `app/src/components/ops/quality-tables.tsx`
  severity: low
  Đề xuất: known-limits

- **Định nghĩa «có số» của thẻ đã đổi nhưng CO_SO_SQL độc lập trong hieu-chuan-do.mjs chưa đổi theo**
  Người dùng thấy gì: Công cụ đo nội bộ đếm số khu vực đã hiệu chuẩn theo cách cũ, nên ở vài khu vực có dữ liệu listing lệch kỳ thì số đếm này có thể không khớp với những gì thẻ hiển thị. Người dùng trên trang chất lượng không thấy thay đổi, chỉ báo cáo đo nội bộ có thể lệch nhẹ.
  Căn cứ: Chỉ ảnh hưởng một con số đo nội bộ, không ảnh hưởng thẻ hay dữ liệu người dùng thấy, và có thể chỉnh lại bất cứ lúc nào mà không mất gì.
  file: `scripts/hieu-chuan-do.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

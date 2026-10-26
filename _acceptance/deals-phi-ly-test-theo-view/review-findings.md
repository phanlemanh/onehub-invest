# Review findings: deals-phi-ly-test-theo-view (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 — assertion âm tính đứng một mình, không ghim thông điệp: đối chứng DP-AC-5 xanh dù xoaCotPii không làm gì**
  Người dùng thấy gì: Không có hậu quả nào cho người dùng, vì đây chỉ là bài kiểm tra nội bộ. Nếu bước xoá cột nhạy cảm trong bài kiểm tra bị hỏng, bài kiểm tra vẫn báo xanh. Khi đó ta có thể tin nhầm rằng bản cloud không lộ thông tin người bán.
  Căn cứ: Rủi ro nhẹ: sản phẩm không đổi, và bản chất đối chứng này đã yếu như vậy từ trước vòng này. Việc xoá cột được các ca khác bảo vệ gián tiếp, và sửa sau vẫn rẻ.
  file: `app/tests/deals-phi-ly.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

